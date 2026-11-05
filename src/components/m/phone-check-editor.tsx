"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ChevronLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FLOW_ICON, FlowCanvas } from "@/components/m/flow-canvas"
import { useZoom } from "@/components/m/phone-check"
import { Field, Icon, btn, inputCls } from "@/components/m/ui"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ADDABLE, insertAfter, mapSteps, numbersFor, removeStep, withZoom } from "@/lib/flow"
import { PHONE_CHECK, allSplits, flattenSteps, type FlowItem, type FlowKind } from "@/lib/moneiva/phone-check-data"
import type { Workflow } from "@/lib/minimal"

/** The full canvas for a big workflow: every step, every path, edit in place, then Publish. */
export function PhoneCheckEditor({ w }: { w: Workflow }) {
  const q = useSearchParams()
  const { zoom } = useZoom()
  const [items, setItems] = useState<FlowItem[]>(() => withZoom(PHONE_CHECK, zoom))
  const [selected, setSelected] = useState<string | null>(q.get("step"))
  const [adding, setAdding] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [count, setCount] = useState(0)

  const steps = useMemo(() => flattenSteps(items), [items])
  const numbers = useMemo(() => numbersFor(items), [items])
  const node = steps.find((s) => s.id === selected) ?? null

  function change(next: FlowItem[]) {
    setItems(next)
    setDirty(true)
  }
  function add(kind: FlowKind) {
    if (!adding) return
    const id = `new${count}`
    setCount((c) => c + 1)
    const sub = ADDABLE.find((a) => a.kind === kind)!.sub
    change(insertAfter(items, adding, { id, kind, title: `New ${kind.toLowerCase()} step`, sub, fields: [], end: kind === "Finish" }))
    setAdding(null)
    setSelected(id)
  }

  return (
    <div className="-mx-4 -mt-8 -mb-28 sm:-mx-6 sm:-mt-12 md:-mb-20">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <Link href={`/workflows/${w.id}`} className="inline-flex items-center gap-1 text-[15px] font-medium text-primary">
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[15px] font-semibold">{w.name}</div>
          <div className="text-[12px] text-muted-foreground">
            {steps.length} steps · {dirty ? "Draft, not published" : "Published"}
          </div>
        </div>
        <button
          className={cn(btn.primary, "h-9 px-4 text-[14px]")}
          disabled={!dirty}
          onClick={() => {
            setDirty(false)
            toast.success("Published. The next OS&D file uses this version.")
          }}
        >
          Publish
        </button>
      </div>

      <FlowCanvas
        className="h-[calc(100vh-7.5rem)] rounded-none shadow-none"
        items={items}
        numbers={numbers}
        selected={selected}
        onSelect={setSelected}
        onAdd={setAdding}
        collapsed={collapsed}
        onToggle={(id) =>
          setCollapsed((c) => {
            const n = new Set(c)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
          })
        }
        onCollapseAll={() => setCollapsed(new Set(allSplits(items).filter((id) => ["phones", "tries", "tries-driver", "tries-disp"].includes(id))))}
        onExpandAll={() => setCollapsed(new Set())}
      />

      {/* Add a step */}
      <Sheet open={!!adding} onOpenChange={(o) => !o && setAdding(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border p-6">
            <SheetTitle className="text-[22px] font-semibold tracking-tight">Add a step</SheetTitle>
            <SheetDescription className="text-[15px]">After step {adding ? numbers[adding] : ""}</SheetDescription>
          </SheetHeader>
          <div className="divide-y divide-border">
            {ADDABLE.map((a) => (
              <button key={a.kind} onClick={() => add(a.kind)} className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-muted/60">
                <Icon tone={a.kind === "Agent" ? "blue" : "gray"}>{FLOW_ICON[a.kind]}</Icon>
                <span>
                  <span className="block text-[15px] font-medium">{a.kind}</span>
                  <span className="block text-[13px] text-muted-foreground">{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit a step */}
      <Sheet open={!!node} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {node && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Step {numbers[node.id]} · {node.kind}
                </p>
                <SheetTitle className="text-[22px] font-semibold tracking-tight">{node.title}</SheetTitle>
                <SheetDescription className="sr-only">Change this step</SheetDescription>
              </SheetHeader>
              <div key={node.id} className="space-y-5 p-6">
                <Field label="Name">
                  <input
                    defaultValue={node.title}
                    className={inputCls}
                    onChange={(e) => change(mapSteps(items, (s) => (s.id === node.id ? { ...s, title: e.target.value } : s)))}
                  />
                </Field>
                <Field label="What it does">
                  <input
                    defaultValue={node.sub}
                    className={inputCls}
                    onChange={(e) => change(mapSteps(items, (s) => (s.id === node.id ? { ...s, sub: e.target.value } : s)))}
                  />
                </Field>
                {node.fields.map(([label, value], i) => (
                  <Field key={label} label={label}>
                    <input
                      defaultValue={value}
                      className={inputCls}
                      onChange={(e) =>
                        change(
                          mapSteps(items, (s) =>
                            s.id === node.id ? { ...s, fields: s.fields.map((f, j) => (j === i ? ([f[0], e.target.value] as [string, string]) : f)) } : s
                          )
                        )
                      }
                    />
                  </Field>
                ))}
              </div>
              <div className="mt-auto flex gap-3 border-t border-border p-4">
                {node.kind !== "Starts when" && (
                  <button
                    className={cn(btn.secondary, "text-destructive")}
                    onClick={() => {
                      const before = items
                      change(removeStep(items, node.id))
                      setSelected(null)
                      toast("Step deleted.", { action: { label: "Undo", onClick: () => setItems(before) } })
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                )}
                <button className={cn(btn.primary, "flex-1")} onClick={() => setSelected(null)}>
                  Done
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
