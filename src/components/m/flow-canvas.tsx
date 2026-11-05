"use client"

import {
  Bot,
  Bookmark,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  Flag,
  GitBranch,
  Maximize2,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Split,
  TriangleAlert,
  Zap,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { FlowBranch, FlowItem, FlowKind, FlowSplit, FlowStep } from "@/lib/moneiva/phone-check-data"

/** One quiet icon per kind of step. Color stays for meaning: amber needs setup, green ends. */
export const FLOW_ICON: Record<FlowKind, React.ReactNode> = {
  "Starts when": <Zap />,
  Question: <GitBranch />,
  "Choose a path": <Split />,
  Remember: <Bookmark />,
  "Look up": <Search />,
  Agent: <Bot />,
  "Send a text": <MessageSquare />,
  Checkpoint: <Flag />,
  Finish: <CheckCircle2 />,
}

type Edge = { from: string; to: string; join?: boolean }

/** The ids a path hands on to whatever comes after it. Ended paths hand on nothing. */
function tails(path: FlowItem[], collapsed: Set<string>): string[] {
  const last = path[path.length - 1]
  if (!last) return []
  if ("step" in last) return last.step.end ? [] : [last.step.id]
  if (!last.split.join) return []
  if (collapsed.has(last.split.id)) return [`more:${last.split.id}`]
  return last.split.branches.flatMap((b) => tails(b.path, collapsed))
}

function edgesFor(path: FlowItem[], collapsed: Set<string>, into: string[] = [], out: Edge[] = []): Edge[] {
  let prev = into
  path.forEach((it) => {
    if ("step" in it) {
      prev.forEach((p) => out.push({ from: p, to: it.step.id, join: prev.length > 1 }))
      prev = it.step.end ? [] : [it.step.id]
      return
    }
    const sp = it.split
    if (collapsed.has(sp.id)) {
      prev.forEach((p) => out.push({ from: p, to: `more:${sp.id}` }))
      prev = sp.join ? [`more:${sp.id}`] : []
      return
    }
    sp.branches.forEach((b, i) => {
      const chip = `${sp.id}:${i}`
      prev.forEach((p) => out.push({ from: p, to: chip }))
      edgesFor(b.path, collapsed, [chip], out)
    })
    prev = sp.join ? sp.branches.flatMap((b) => tails(b.path, collapsed)) : []
  })
  return out
}

function countSteps(branches: FlowBranch[]): number {
  let n = 0
  const walk = (items: FlowItem[]) => items.forEach((it) => ("step" in it ? n++ : it.split.branches.forEach((b) => walk(b.path))))
  branches.forEach((b) => walk(b.path))
  return n
}

type Props = {
  items: FlowItem[]
  numbers: Record<string, number>
  selected: string | null
  onSelect: (id: string | null) => void
  collapsed: Set<string>
  onToggle: (id: string) => void
  onCollapseAll: () => void
  onExpandAll: () => void
  /** Edit mode: a + under each step adds one after it. */
  onAdd?: (afterId: string) => void
  /** Steps a run passed through, to light up one row's path. */
  highlight?: Set<string>
  className?: string
}

const tool =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground [&_svg]:size-4"

export function FlowCanvas({ items, numbers, selected, onSelect, collapsed, onToggle, onCollapseAll, onExpandAll, onAdd, highlight, className }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState({ x: 0, y: 24, s: 1 })
  const [fitted, setFitted] = useState(true)
  const [lines, setLines] = useState<{ d: string; on: boolean }[]>([])
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)

  // "start": readable size, centered on the first step. "all": the whole tree fits the width.
  const [mode, setMode] = useState<"start" | "all">("start")
  const fitView = useCallback(() => {
    const b = box.current
    const el = inner.current
    if (!b || !el) return null
    const all = Math.min(1, Math.max(0.3, (b.clientWidth - 48) / el.offsetWidth))
    const s = mode === "all" ? all : Math.max(all, Math.min(0.8, b.clientWidth / 900))
    return { x: (b.clientWidth - el.offsetWidth * s) / 2, y: 24 + 48, s }
  }, [mode])

  // Draw the lines from where the cards actually landed.
  const measure = useCallback(() => {
    const el = inner.current
    if (!el) return
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    const base = el.getBoundingClientRect()
    const k = base.width / el.offsetWidth || 1
    const pos = (id: string) => {
      const n = el.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)
      if (!n) return null
      const r = n.getBoundingClientRect()
      return { x: (r.left + r.width / 2 - base.left) / k, top: (r.top - base.top) / k, bottom: (r.bottom - base.top) / k }
    }
    const lit = (id: string) => !!highlight?.has(id)
    const next: { d: string; on: boolean }[] = []
    for (const e of edgesFor(items, collapsed)) {
      const a = pos(e.from)
      const b = pos(e.to)
      if (!a || !b) continue
      const mid = e.join ? b.top - 22 : a.bottom + Math.min(22, (b.top - a.bottom) / 2)
      const d =
        Math.abs(a.x - b.x) < 1
          ? `M${a.x},${a.bottom} V${b.top}`
          : `M${a.x},${a.bottom} V${mid - 8} Q${a.x},${mid} ${a.x + Math.sign(b.x - a.x) * 8},${mid} H${b.x - Math.sign(b.x - a.x) * 8} Q${b.x},${mid} ${b.x},${mid + 8} V${b.top}`
      next.push({ d, on: lit(e.from) && lit(e.to) })
    }
    setLines(next)
  }, [items, collapsed, highlight])

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      measure()
      if (fitted) {
        const v = fitView()
        if (v) setView(v)
      }
    })
    if (box.current) ro.observe(box.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [measure, fitted, fitView])

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setFitted(false)
    setView((v) => {
      const s = Math.min(1.6, Math.max(0.3, v.s * factor))
      return { s, x: cx - ((cx - v.x) * s) / v.s, y: cy - ((cy - v.y) * s) / v.s }
    })
  }, [])
  const zoom = (factor: number) => {
    const b = box.current
    if (b) zoomAt(factor, b.clientWidth / 2, b.clientHeight / 2)
  }

  useEffect(() => {
    const b = box.current
    if (!b) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = b.getBoundingClientRect()
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (e.shiftKey || (sideways && !e.ctrlKey && !e.metaKey)) {
        setFitted(false)
        setView((v) => (e.shiftKey ? { ...v, x: v.x - (e.deltaX || e.deltaY) } : { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
        return
      }
      if (!e.ctrlKey && !e.metaKey) {
        // A plain scroll moves up and down, like a page. Pinch or Ctrl + scroll zooms.
        setFitted(false)
        setView((v) => ({ ...v, y: v.y - e.deltaY }))
        return
      }
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      zoomAt(Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.01), e.clientX - r.left, e.clientY - r.top)
    }
    b.addEventListener("wheel", onWheel, { passive: false })
    return () => b.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
      setFitted(false)
      box.current?.setPointerCapture(e.pointerId)
    }
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }))
  }
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    if (box.current?.hasPointerCapture(e.pointerId)) box.current.releasePointerCapture(e.pointerId)
    setDragging(false)
    setTimeout(() => (drag.current = null), 0)
  }

  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      <div className="absolute top-3 right-3 z-20 flex items-center gap-0.5 rounded-full bg-background/90 p-1 shadow-sm ring-1 ring-border/60 backdrop-blur">
        <button className={tool} onClick={collapsed.size ? onExpandAll : onCollapseAll}>
          {collapsed.size ? <ChevronsUpDown /> : <ChevronsDownUp />}
          <span className="hidden sm:inline">{collapsed.size ? "Show all paths" : "Fold paths"}</span>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button className={cn(tool, "px-2")} aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
          <Minus />
        </button>
        <span className="w-10 text-center text-[12px] text-muted-foreground tabular-nums">{Math.round(view.s * 100)}%</span>
        <button className={cn(tool, "px-2")} aria-label="Zoom in" onClick={() => zoom(1.2)}>
          <Plus />
        </button>
        <button
          className={cn(tool, fitted && mode === "all" && "bg-secondary text-foreground")}
          onClick={() => {
            setMode(fitted && mode === "all" ? "start" : "all")
            setFitted(true)
          }}
        >
          <Maximize2 />
          <span className="hidden sm:inline">Fit</span>
        </button>
      </div>
      <div
        ref={box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
        className={cn(
          "relative h-full min-h-[480px] touch-none overflow-hidden bg-background/40 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] select-none",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ backgroundSize: `${18 * view.s}px ${18 * view.s}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div ref={inner} className="absolute top-0 left-0 w-max origin-top-left px-6 pb-10" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          <svg className="pointer-events-none absolute inset-0 overflow-visible" width={size.w} height={size.h} aria-hidden>
            {lines.map((l, i) => (
              <path key={i} d={l.d} fill="none" className={l.on ? "stroke-primary" : "stroke-border"} strokeWidth={l.on ? 2.5 : 1.5} />
            ))}
          </svg>
          <Path items={items} numbers={numbers} selected={selected} onSelect={onSelect} collapsed={collapsed} onToggle={onToggle} onAdd={onAdd} highlight={highlight} />
        </div>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[12px] text-muted-foreground backdrop-blur">
          Drag to move. Pinch to zoom.
        </span>
      </div>
    </div>
  )
}

type PathProps = Omit<Props, "onCollapseAll" | "onExpandAll" | "className">

function Path({ items, ...rest }: PathProps) {
  return (
    <div className="flex flex-col items-center gap-12">
      {items.map((it) =>
        "step" in it ? (
          <Node
            key={it.step.id}
            step={it.step}
            n={rest.numbers[it.step.id]}
            selected={rest.selected === it.step.id}
            dim={!!rest.highlight && !rest.highlight.has(it.step.id)}
            onSelect={rest.onSelect}
            onAdd={rest.onAdd}
          />
        ) : (
          <SplitView key={it.split.id} split={it.split} {...rest} />
        )
      )}
    </div>
  )
}

function SplitView({ split, ...rest }: { split: FlowSplit } & Omit<PathProps, "items">) {
  if (rest.collapsed.has(split.id)) {
    return (
      <button
        type="button"
        data-node={`more:${split.id}`}
        onClick={() => rest.onToggle(split.id)}
        className="rounded-full border border-dashed border-muted-foreground/40 bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        {split.branches.length} paths, {countSteps(split.branches)} steps folded. Show
      </button>
    )
  }
  return (
    <div className="relative flex items-start gap-8">
      <button
        type="button"
        onClick={() => rest.onToggle(split.id)}
        aria-label="Fold these paths"
        title="Fold these paths"
        className="absolute -top-[34px] left-1/2 z-10 ml-5 grid size-6 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border hover:text-foreground"
      >
        <ChevronsDownUp className="size-3.5" />
      </button>
      {split.branches.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-4">
          <span
            data-node={`${split.id}:${i}`}
            className={cn(
              "rounded-full bg-card px-3 py-1 text-[12px] font-medium shadow-sm ring-1 ring-border",
              rest.highlight && !b.path.some((p) => "step" in p && rest.highlight!.has(p.step.id)) && "opacity-40"
            )}
          >
            {b.label}
          </span>
          <Path items={b.path} {...rest} />
        </div>
      ))}
    </div>
  )
}

function Node({
  step,
  n,
  selected,
  dim,
  onSelect,
  onAdd,
}: {
  step: FlowStep
  n: number
  selected: boolean
  dim: boolean
  onSelect: (id: string | null) => void
  onAdd?: (afterId: string) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        data-node={step.id}
        onClick={() => onSelect(selected ? null : step.id)}
        aria-pressed={selected}
        className={cn(
          "flex w-[232px] gap-3 rounded-2xl bg-card p-3.5 text-left shadow-[0_1px_3px_rgb(0_0_0/0.08)] ring-1 ring-border/70 transition hover:ring-muted-foreground/40",
          step.setup && "ring-2 ring-warn/60",
          selected && "ring-2 ring-primary",
          dim && "opacity-35"
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[9px] bg-secondary text-foreground/70 [&_svg]:size-4",
            step.setup && "bg-warn/12 text-warn",
            step.end && "bg-ok/12 text-ok",
            step.kind === "Agent" && "bg-primary/12 text-primary"
          )}
        >
          {step.setup ? <TriangleAlert /> : FLOW_ICON[step.kind]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {step.kind}
            <span className="ml-auto font-medium tracking-normal tabular-nums normal-case">{n}</span>
          </span>
          <span className="mt-0.5 block text-[14px] leading-snug font-medium">{step.title}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">{step.sub}</span>
          {step.setup && <span className="mt-1 block text-[12px] leading-snug font-medium text-warn">{step.setup}</span>}
        </span>
      </button>
      {onAdd && !step.end && (
        <button
          type="button"
          aria-label="Add a step after this one"
          title="Add a step after this one"
          onClick={() => onAdd(step.id)}
          className="absolute -bottom-[37px] left-1/2 z-10 grid size-6 -translate-x-1/2 place-items-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border hover:bg-primary hover:text-primary-foreground hover:ring-primary"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}
