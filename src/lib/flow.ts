// Small helpers for the branching workflow tree.
import { flattenSteps, type FlowItem, type FlowKind, type FlowStep } from "@/lib/moneiva/phone-check-data"

export function numbersFor(items: FlowItem[]): Record<string, number> {
  return Object.fromEntries(flattenSteps(items).map((s, i) => [s.id, i + 1]))
}

/** How many different places a row can finish. */
export function endings(path: FlowItem[], joins = false): number {
  let n = 0
  path.forEach((it, i) => {
    if ("split" in it) it.split.branches.forEach((b) => (n += endings(b.path, !!it.split.join)))
    else if (i === path.length - 1 && (!joins || it.step.end)) n++
  })
  return n
}

export function mapSteps(items: FlowItem[], fn: (s: FlowStep) => FlowStep): FlowItem[] {
  return items.map((it) =>
    "step" in it ? { step: fn(it.step) } : { split: { ...it.split, branches: it.split.branches.map((b) => ({ ...b, path: mapSteps(b.path, fn) })) } }
  )
}

/** Once a Zoom connection is picked, the text steps lose their warning and show the connection. */
export function withZoom(items: FlowItem[], zoom: string | null): FlowItem[] {
  if (!zoom) return items
  return mapSteps(items, (s) =>
    s.setup ? { ...s, setup: undefined, fields: s.fields.map(([k, v]) => [k, k === "Zoom connection" ? zoom : v] as [string, string]) } : s
  )
}

/**
 * The steps (and branch labels) one row passes through, given which branch it took at each split.
 * Splits that aren't listed take their first branch.
 */
export function routeIds(items: FlowItem[], route: Record<string, number>): Set<string> {
  const out = new Set<string>()
  // Returns false when the row stopped inside this path.
  const walk = (path: FlowItem[]): boolean => {
    for (const it of path) {
      if ("step" in it) {
        out.add(it.step.id)
        if (it.step.end) return false
        continue
      }
      const i = route[it.split.id] ?? 0
      out.add(`${it.split.id}:${i}`)
      const goesOn = walk(it.split.branches[i].path)
      if (!goesOn || !it.split.join) return false
    }
    return true
  }
  walk(items)
  return out
}

export function insertAfter(items: FlowItem[], afterId: string, step: FlowStep): FlowItem[] {
  const out: FlowItem[] = []
  for (const it of items) {
    if ("step" in it) {
      out.push(it)
      if (it.step.id === afterId) out.push({ step })
    } else {
      out.push({ split: { ...it.split, branches: it.split.branches.map((b) => ({ ...b, path: insertAfter(b.path, afterId, step) })) } })
    }
  }
  return out
}

export function removeStep(items: FlowItem[], id: string): FlowItem[] {
  return items
    .filter((it) => !("step" in it && it.step.id === id))
    .map((it) => ("step" in it ? it : { split: { ...it.split, branches: it.split.branches.map((b) => ({ ...b, path: removeStep(b.path, id) })) } }))
}

/** Steps whose settings mention a value by name. */
export function stepsUsing(items: FlowItem[], name: string) {
  const re = new RegExp(`\\b${name}\\b`)
  const steps = flattenSteps(items)
  const nums = numbersFor(items)
  const sets: number[] = []
  const reads: number[] = []
  for (const s of steps) {
    const saves = s.fields.some(([k, v]) => k === "Saves" && re.test(v))
    const mentions = re.test(s.sub) || s.fields.some(([k, v]) => k !== "Saves" && re.test(v))
    if (saves) sets.push(nums[s.id])
    else if (mentions) reads.push(nums[s.id])
  }
  return { sets, reads }
}

export const ADDABLE: { kind: FlowKind; sub: string }[] = [
  { kind: "Question", sub: "Yes or no, then two paths" },
  { kind: "Choose a path", sub: "Several paths, from a value" },
  { kind: "Agent", sub: "Hand the row to an agent, like a call" },
  { kind: "Send a text", sub: "Text with Zoom SMS" },
  { kind: "Remember", sub: "Save a value for later steps" },
  { kind: "Look up", sub: "Read a value from a record" },
  { kind: "Checkpoint", sub: "Mark how far a row got" },
  { kind: "Finish", sub: "Update the record and stop" },
]
