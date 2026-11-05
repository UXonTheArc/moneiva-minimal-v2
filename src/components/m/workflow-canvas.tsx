"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bot, CheckCircle2, ChevronLeft, Clock, GitBranch, Minus, Plus, Save, Send, Zap } from "lucide-react"
import { toast } from "sonner"

import { btn } from "@/components/m/ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { BRANCH_LABELS, CANVAS, NODES, PALETTE, type CanvasLayout, type CanvasNode } from "@/lib/moneiva/automations-data"
import type { Workflow } from "@/lib/minimal"

/** One small icon per kind of step. Color stays out of the canvas; the shape of the flow carries it. */
const KIND_ICON: Record<string, React.ReactNode> = {
  "Starts when": <Zap />,
  Agent: <Bot />,
  Check: <GitBranch />,
  Approval: <CheckCircle2 />,
  Action: <Send />,
  Record: <Save />,
  Wait: <Clock />,
}

/** The damage report workflow has a full branching layout. The rest are a straight line built from their steps. */
function initial(w: Workflow): { layout: CanvasLayout; nodes: Record<string, CanvasNode> } {
  if (w.id === "osd") return { layout: CANVAS, nodes: NODES }
  const nodes: Record<string, CanvasNode> = {}
  const main = w.steps.map((s, i) => {
    const id = `s${i}`
    const kind = i === 0 ? "Starts when" : s.agent ? "Agent" : "Action"
    nodes[id] = { id, n: String(i + 1), kind, title: s.title, sub: s.sub, fields: s.agent ? [["Agent", s.agent]] : [] }
    return id
  })
  return { layout: { main, problem: [], fine: [], tail: [] }, nodes }
}

export function WorkflowCanvas({ w }: { w: Workflow }) {
  const [{ layout, nodes }, setFlow] = useState(() => initial(w))
  const [selected, setSelected] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [dirty, setDirty] = useState(false)
  const node = selected ? nodes[selected] : null
  const added = useRef(0)
  const surface = useRef<HTMLDivElement>(null)

  // On narrow screens, start with the main line in view.
  useEffect(() => {
    const el = surface.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  function add(seg: keyof CanvasLayout, index: number, choice: { label: string; kind: string }) {
    const id = `new${++added.current}`
    const n: CanvasNode = { id, n: "", kind: choice.kind, title: choice.label === "Agent" ? "Choose an agent" : choice.label, sub: "Click to set it up", fields: [] }
    setFlow((f) => ({ nodes: { ...f.nodes, [id]: n }, layout: { ...f.layout, [seg]: [...f.layout[seg].slice(0, index), id, ...f.layout[seg].slice(index)] } }))
    setSelected(id)
    setDirty(true)
  }

  function remove(id: string) {
    setFlow((f) => ({
      nodes: f.nodes,
      layout: { main: f.layout.main.filter((x) => x !== id), problem: f.layout.problem.filter((x) => x !== id), fine: f.layout.fine.filter((x) => x !== id), tail: f.layout.tail.filter((x) => x !== id) },
    }))
    setSelected(null)
    setDirty(true)
  }

  const column = (seg: keyof CanvasLayout, lead = true) =>
    layout[seg].map((id, i) => (
      <div key={id} className="flex flex-col items-center">
        {(i > 0 || lead) && <Link_ onAdd={(c) => add(seg, i, c)} />}
        <Step n={nodes[id]} on={selected === id} onClick={() => setSelected(id)} />
      </div>
    ))

  const branched = layout.problem.length + layout.fine.length > 0

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 sm:-mt-12">
      {/* Editor bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <Link href={`/workflows/${w.id}`} className="inline-flex items-center gap-1 text-[15px] font-medium text-primary">
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[15px] font-semibold">{w.name}</div>
          <div className="text-[12px] text-muted-foreground">{dirty ? "Draft, not published" : "Published"}</div>
        </div>
        <div className="hidden items-center rounded-full bg-secondary p-0.5 sm:flex">
          <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))} className="grid size-8 place-items-center rounded-full hover:bg-card">
            <Minus className="size-4" />
          </button>
          <span className="w-11 text-center text-[12px] tabular-nums">{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} className="grid size-8 place-items-center rounded-full hover:bg-card">
            <Plus className="size-4" />
          </button>
        </div>
        <button
          className={cn(btn.primary, "h-9 px-4 text-[14px]")}
          disabled={!dirty}
          onClick={() => {
            setDirty(false)
            toast.success("Published. New runs use this version.")
          }}
        >
          Publish
        </button>
      </div>

      {/* The canvas */}
      <div
        ref={surface}
        className="min-h-[calc(100vh-7.5rem)] overflow-auto px-4 py-12"
        style={{ backgroundImage: "radial-gradient(var(--input) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        onClick={(e) => e.target === e.currentTarget && setSelected(null)}
      >
        <div className="mx-auto flex w-max flex-col items-center" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
          {column("main", false)}
          {branched && (
            <>
              <span className="h-8 w-px bg-foreground/25" />
              <div className="relative flex gap-10">
                <span className="absolute top-0 right-36 left-36 h-px bg-foreground/25" />
                {(["problem", "fine"] as const).map((seg) => (
                  <div key={seg} className="flex flex-col items-center">
                    <span className="h-6 w-px bg-foreground/25" />
                    <span className="rounded-full bg-card px-3 py-1 text-[12px] font-medium shadow-sm">{BRANCH_LABELS[seg]}</span>
                    {column(seg)}
                    <span className="min-h-6 w-px flex-1 bg-foreground/25" />
                  </div>
                ))}
                <span className="absolute right-36 bottom-0 left-36 h-px bg-foreground/25" />
              </div>
              {layout.tail.length > 0 && <span className="h-8 w-px bg-foreground/25" />}
              {column("tail", false)}
            </>
          )}
          {!branched && <Link_ onAdd={(c) => add("main", layout.main.length, c)} />}
        </div>
      </div>

      <Sheet open={!!node} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {node && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{node.kind}</p>
                <SheetTitle className="text-[22px] font-semibold tracking-tight">{node.title}</SheetTitle>
                <SheetDescription className="text-[15px]">{node.sub}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-6">
                <label className="block">
                  <span className="text-[13px] font-semibold text-muted-foreground">Name</span>
                  <input
                    defaultValue={node.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setFlow((f) => ({ ...f, nodes: { ...f.nodes, [node.id]: { ...node, title } } }))
                      setDirty(true)
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </label>
                {node.fields.map(([k, v]) => (
                  <label key={k} className="block">
                    <span className="text-[13px] font-semibold text-muted-foreground">{k}</span>
                    <input
                      defaultValue={v}
                      onChange={() => setDirty(true)}
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:ring-4 focus:ring-primary/15"
                    />
                  </label>
                ))}
              </div>
              {node.kind !== "Starts when" && (
                <div className="mt-auto border-t border-border p-4">
                  <button className="h-10 w-full rounded-full text-[15px] font-medium text-destructive hover:bg-destructive/10" onClick={() => remove(node.id)}>
                    Delete step
                  </button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Step({ n, on, onClick }: { n: CanvasNode; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-72 items-start gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_1px_3px_rgb(0_0_0/0.08)] transition hover:shadow-md",
        on && "ring-2 ring-primary"
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-secondary text-foreground/70 [&_svg]:size-4">{KIND_ICON[n.kind] ?? <Send />}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{n.kind}</span>
        <span className="block text-[15px] leading-snug font-medium">{n.title}</span>
        {n.sub && <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{n.sub}</span>}
      </span>
    </button>
  )
}

/** The line between two steps, with a + to insert one. */
function Link_({ onAdd }: { onAdd: (c: { label: string; kind: string }) => void }) {
  return (
    <div className="group flex h-12 flex-col items-center">
      <span className="w-px flex-1 bg-foreground/25" />
      <Popover>
        <PopoverTrigger
          aria-label="Add a step"
          className="grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground opacity-60 shadow-sm transition group-hover:opacity-100 hover:text-primary data-[state=open]:opacity-100"
        >
          <Plus className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-56 rounded-2xl p-1.5">
          {PALETTE.map((c) => (
            <button key={c.label} onClick={() => onAdd(c)} className="flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[14px] hover:bg-muted">
              <span className="text-muted-foreground [&_svg]:size-4">{KIND_ICON[c.label === "Wait" ? "Wait" : c.kind]}</span>
              {c.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <span className="w-px flex-1 bg-foreground/25" />
    </div>
  )
}
