"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertCircle, ArrowRight, Bot, FileSpreadsheet, MessageSquare, Workflow as WorkflowIcon } from "lucide-react"
import { toast } from "sonner"

import { BackLink } from "@/components/m/automate"
import { FLOW_ICON, FlowCanvas } from "@/components/m/flow-canvas"
import { StatusMenu, type RunStatus } from "@/components/m/status-menu"
import { markDone, undoDone, useDone } from "@/components/m/store"
import { Card, Dot, Field, Group, Icon, Row, Section, Segmented, Select, btn } from "@/components/m/ui"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { endings, numbersFor, routeIds, stepsUsing, withZoom } from "@/lib/flow"
import { PHONE_CHECK, PHONE_CHECK_INFO, ZOOM_CONNECTIONS, allSplits, flattenSteps, type FlowItem } from "@/lib/moneiva/phone-check-data"
import { PHONE_RUNS, VARIABLES, VARIABLE_FROM, type PhoneRun } from "@/lib/moneiva/phone-check-runs"
import { WORKFLOW_STATUS, type Workflow } from "@/lib/minimal"

type Tab = "overview" | "steps" | "runs" | "values"
const TONE_BAR = { ok: "bg-ok", warn: "bg-warn", bad: "bg-destructive", off: "bg-muted-foreground/40" } as const

/** Which Zoom connection was picked in this visit, if any. Shared with the canvas editor. */
export function useZoom() {
  const isDone = useDone()
  const i = ZOOM_CONNECTIONS.findIndex((_, k) => isDone(`zoom:${k}`))
  return {
    zoom: i >= 0 ? ZOOM_CONNECTIONS[i] : null,
    setZoom: (k: number | null) => {
      ZOOM_CONNECTIONS.forEach((_, j) => undoDone(`zoom:${j}`))
      if (k !== null) markDone(`zoom:${k}`)
    },
  }
}

export function PhoneCheck({ w }: { w: Workflow }) {
  const [status, setStatus] = useState<RunStatus>("live")
  const [tab, setTab] = useState<Tab>("overview")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [run, setRun] = useState<PhoneRun | null>(null)
  const [highlight, setHighlight] = useState<{ ids: Set<string>; label: string } | null>(null)
  const { zoom, setZoom } = useZoom()
  const isDone = useDone()
  const agentFixed = isDone("osd-fixed")

  const items = useMemo(() => withZoom(PHONE_CHECK, zoom), [zoom])
  const steps = useMemo(() => flattenSteps(items), [items])
  const numbers = useMemo(() => numbersFor(items), [items])
  const node = steps.find((s) => s.id === selected) ?? null
  const textSteps = steps.filter((s) => s.kind === "Send a text")
  const needSetup = steps.filter((s) => s.setup)
  const ways = useMemo(() => endings(PHONE_CHECK), [])
  const last = PHONE_RUNS[0]

  function go(t: Tab) {
    setTab(t)
    if (t !== "steps") setHighlight(null)
  }
  function showStep(id: string) {
    setHighlight(null)
    setTab("steps")
    setSelected(id)
  }

  return (
    <>
      <BackLink href="/workflows" label="Workflows" />

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-card shadow-sm sm:size-16 sm:rounded-[18px] [&_svg]:size-6 sm:[&_svg]:size-7">
            <WorkflowIcon />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{w.name}</h1>
            <p className="text-[15px] text-muted-foreground">
              {steps.length} steps · {ways} ways it can end · {PHONE_CHECK_INFO.published}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/workflows/${w.id}/edit`} className={btn.secondary}>
            Edit
          </Link>
          <StatusMenu
            value={status}
            options={WORKFLOW_STATUS}
            onChange={(v) => {
              setStatus(v)
              toast(`${w.name} is ${WORKFLOW_STATUS.find((o) => o.value === v)!.label.toLowerCase()}.`)
            }}
          />
        </div>
      </div>

      <p className="mb-8 max-w-2xl text-[22px] leading-snug font-medium tracking-tight">{w.sentence}</p>

      <div className="mb-6">
        <Segmented
          value={tab}
          onChange={go}
          options={[
            { value: "overview", label: "Overview" },
            { value: "steps", label: `Steps` },
            { value: "runs", label: "Runs" },
            { value: "values", label: "Values" },
          ]}
        />
      </div>

      {tab === "overview" && (!agentFixed || needSetup.length > 0) && (
        <Section title="Needs you">
          <Group>
            {!agentFixed && (
              <Row
                href="/agents/osd"
                icon={
                  <Icon tone="red">
                    <AlertCircle />
                  </Icon>
                }
                title="OS&D check calls is stopped"
                sub="24 rows from the last file are waiting to call. They call as soon as the agent has a working number."
                value={<span className="font-medium text-primary">Fix the agent</span>}
              />
            )}
            {needSetup.length > 0 && (
              <Row
                onClick={() => showStep(needSetup[0].id)}
                icon={
                  <Icon tone="amber">
                    <MessageSquare />
                  </Icon>
                }
                title={`${needSetup.length} text steps can't send`}
                sub="Their Zoom connection was removed. 5 rows are waiting at a text step."
                value={<span className="font-medium text-primary">Show me</span>}
              />
            )}
          </Group>
        </Section>
      )}

      {tab === "overview" && (
        <>
          <Section title="Last run" action={<button className={btn.plain} onClick={() => setRun(last)}>Open</button>}>
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[48px] leading-none font-bold tracking-tight">{last.rows}</div>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    shipments in {last.file} · {last.started}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[15px] font-medium">
                  <Dot tone={last.tone} />
                  {last.result}
                </span>
              </div>
              <Endings run={last} onShow={showStep} />
            </Card>
          </Section>

          <Section title="How it works" action={<button className={btn.plain} onClick={() => go("steps")}>See all {steps.length} steps</button>}>
            <Group>
              <Row
                icon={<Icon>{FLOW_ICON["Starts when"]}</Icon>}
                title="Starts when a new OS&D file arrives"
                sub="Checks the shared folder every 15 minutes. Each row is one shipment."
                onClick={() => showStep("trigger")}
              />
              <Row icon={<Icon>{FLOW_ICON.Question}</Icon>} title="Finds a good phone" sub="Driver, dispatcher, both, or none. Saved as phone_switch." onClick={() => showStep("q-driver")} />
              <Row
                icon={
                  <Icon tone="blue">
                    <Bot />
                  </Icon>
                }
                title="Calls with OS&D check calls, up to 3 times"
                sub="Driver first, then the dispatcher on the 3rd try"
                onClick={() => showStep("call-both-driver")}
              />
              <Row icon={<Icon tone={zoom ? "gray" : "amber"}>{FLOW_ICON["Send a text"]}</Icon>} title="Texts with Zoom SMS on the 4th try" sub={zoom ?? "No Zoom connection"} onClick={() => showStep(textSteps[0].id)} />
              <Row icon={<Icon>{FLOW_ICON.Finish}</Icon>} title="Updates the shipment" sub="Marks it Completed with what happened" onClick={() => showStep("end-both")} />
            </Group>
          </Section>

          <Section title="Agents it uses">
            <Group>
              <Row
                href="/agents/osd"
                icon={
                  <Icon>
                    <Bot />
                  </Icon>
                }
                title="OS&D check calls"
                sub={
                  <span className="inline-flex items-center gap-1.5">
                    <Dot tone={agentFixed ? "ok" : "bad"} />
                    {agentFixed ? "Running" : "Stopped"} · used in {steps.filter((s) => s.kind === "Agent").length} steps
                  </span>
                }
              />
            </Group>
          </Section>
        </>
      )}

      {tab === "steps" && (
        <>
          {highlight && (
            <Card className="mb-3 flex items-center gap-3 px-4 py-3">
              <Dot tone="blue" />
              <span className="flex-1 text-[14px]">
                Showing the path for <b className="font-semibold">{highlight.label}</b>
              </span>
              <button className={btn.plain} onClick={() => setHighlight(null)}>
                Show every path
              </button>
            </Card>
          )}
          <FlowCanvas
            className="h-[72vh]"
            items={items}
            numbers={numbers}
            selected={selected}
            onSelect={setSelected}
            highlight={highlight?.ids}
            collapsed={collapsed}
            onToggle={(id) =>
              setCollapsed((c) => {
                const n = new Set(c)
                if (n.has(id)) n.delete(id)
                else n.add(id)
                return n
              })
            }
            onCollapseAll={() => setCollapsed(new Set(allSplits(PHONE_CHECK).filter((id) => ["phones", "tries", "tries-driver", "tries-disp"].includes(id))))}
            onExpandAll={() => setCollapsed(new Set())}
          />
          <p className="mt-3 px-1 text-[13px] text-muted-foreground">Tap a step to see what it does. To change steps, use Edit.</p>
        </>
      )}

      {tab === "runs" && (
        <Section title="Runs" action={<span className="text-[13px] text-muted-foreground">One run for each OS&amp;D file</span>}>
          <Group>
            {PHONE_RUNS.map((r) => (
              <Row
                key={r.id}
                onClick={() => setRun(r)}
                icon={
                  <Icon>
                    <FileSpreadsheet />
                  </Icon>
                }
                title={`${r.rows} shipments`}
                sub={
                  <span className="inline-flex items-center gap-1.5">
                    <Dot tone={r.tone} />
                    {r.result} · {r.started} · took {r.took}
                  </span>
                }
              />
            ))}
          </Group>
        </Section>
      )}

      {tab === "values" && (
        <Section title="Values it keeps for each row" action={<span className="text-[13px] text-muted-foreground">Also called variables</span>}>
          <Group>
            {VARIABLES.map((v) => {
              const use = stepsUsing(PHONE_CHECK, v.name)
              const where = [use.sets.length ? `Set in step ${use.sets.join(", ")}` : "", use.reads.length ? `Used in step ${use.reads.join(", ")}` : ""].filter(Boolean).join(" · ")
              const first = [...use.sets, ...use.reads][0]
              return (
                <Row
                  key={v.name}
                  onClick={first ? () => showStep(steps[first - 1].id) : undefined}
                  title={
                    <span>
                      {v.plain} <code className="ml-1 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">{v.name}</code>
                    </span>
                  }
                  sub={[VARIABLE_FROM[v.from], where || "Used in call and text messages"].join(" · ")}
                  value={<span className="hidden sm:inline">e.g. {v.example}</span>}
                />
              )
            })}
          </Group>
        </Section>
      )}

      {/* One step, in plain words. */}
      <Sheet open={!!node} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {node && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <p className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Step {numbers[node.id]} · {node.kind}
                </p>
                <SheetTitle className="text-[22px] font-semibold tracking-tight">{node.title}</SheetTitle>
                <SheetDescription className="text-[15px]">{node.sub}</SheetDescription>
              </SheetHeader>
              {node.setup && (
                <div className="space-y-3 border-b border-border bg-warn/8 p-6">
                  <div className="text-[15px] font-semibold">{node.setup}</div>
                  <p className="text-[14px] text-muted-foreground">Pick a Zoom connection and both text steps start sending again.</p>
                  <Field label="Zoom connection">
                    <Select
                      value="Choose a Zoom connection"
                      options={ZOOM_CONNECTIONS}
                      onChange={(v) => {
                        const k = ZOOM_CONNECTIONS.indexOf(v)
                        if (k < 0) return
                        setZoom(k)
                        toast.success("Zoom connection set. Both text steps can send again.", { action: { label: "Undo", onClick: () => setZoom(null) } })
                      }}
                    />
                  </Field>
                </div>
              )}
              <div className="space-y-5 p-6">
                {node.fields.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
                    <div className="mt-0.5 text-[15px]">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex gap-3 border-t border-border p-4">
                {node.kind === "Agent" ? (
                  <Link href="/agents/osd" className={cn(btn.secondary, "flex-1")}>
                    Open the agent
                  </Link>
                ) : null}
                <Link href={`/workflows/${w.id}/edit?step=${node.id}`} className={cn(btn.primary, "flex-1")}>
                  Edit this step
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* One run: where its rows ended, and a few rows to follow. */}
      <Sheet open={!!run} onOpenChange={(o) => !o && setRun(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {run && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="text-[22px] font-semibold tracking-tight">{run.rows} shipments</SheetTitle>
                <SheetDescription className="text-[15px]">
                  {run.file} · {run.started} · took {run.took}
                </SheetDescription>
              </SheetHeader>
              <div className="border-b border-border p-6">
                <div className="text-[15px] font-semibold">Where the rows ended</div>
                <Endings
                  run={run}
                  onShow={(id) => {
                    setRun(null)
                    showStep(id)
                  }}
                />
              </div>
              <div className="p-6">
                <div className="mb-3 text-[15px] font-semibold">Some of the rows</div>
                <Group className="ring-1 ring-border">
                  {run.sample.map((r) => (
                    <Row
                      key={r.pro}
                      onClick={() => {
                        setRun(null)
                        setSelected(null)
                        setTab("steps")
                        setHighlight({ ids: routeIds(items as FlowItem[], r.route), label: `PRO ${r.pro}` })
                      }}
                      title={`PRO ${r.pro}`}
                      sub={
                        <>
                          <span className="block">
                            {r.who}. {r.path}.
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Dot tone={r.tone} />
                            {r.ended}
                          </span>
                        </>
                      }
                      value={<span className="hidden text-primary sm:inline">Show path</span>}
                    />
                  ))}
                </Group>
              </div>
              <div className="mt-auto flex gap-3 border-t border-border p-4">
                <Link href={`/activity?agent=${encodeURIComponent("OS&D check calls")}`} className={cn(btn.secondary, "flex-1")}>
                  See the calls in Activity
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Endings({ run, onShow }: { run: PhoneRun; onShow: (stepId: string) => void }) {
  return (
    <>
      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-secondary">
        {run.endings.map((e) => (
          <span key={e.label} className={cn("h-full border-r-2 border-card last:border-r-0", TONE_BAR[e.tone])} style={{ width: `${(e.count / run.rows) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-5 divide-y divide-border">
        {run.endings.map((e) => (
          <li key={e.label}>
            <button
              disabled={!e.step}
              onClick={() => e.step && onShow(e.step)}
              className="flex w-full items-start gap-3 py-3 text-left enabled:hover:opacity-80"
            >
              <span className="mt-1.5">
                <Dot tone={e.tone} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{e.label}</span>
                {e.sub && <span className="block text-[13px] text-muted-foreground">{e.sub}</span>}
              </span>
              <span className="text-[17px] font-semibold tabular-nums">{e.count}</span>
              {e.step && <ArrowRight className="mt-1 size-4 text-muted-foreground/50" />}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
