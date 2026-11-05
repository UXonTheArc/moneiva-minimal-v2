"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertCircle, Settings2, Workflow as WorkflowIcon } from "lucide-react"
import { toast } from "sonner"

import { BackLink } from "@/components/m/automate"
import { StatusMenu, type RunStatus } from "@/components/m/status-menu"
import { Card, Dot, Field, Group, Icon, Row, SaveBar, Section, Select, Steps, btn, inputCls } from "@/components/m/ui"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Run } from "@/lib/moneiva/automations-data"
import { WORKFLOW_STATUS, runsFor, settingsFor, type Workflow } from "@/lib/minimal"

const TONE = { red: "bad", amber: "warn", green: "ok", gray: "off", blue: "blue" } as const

export function WorkflowDetail({ w }: { w: Workflow }) {
  const [status, setStatus] = useState<RunStatus>(w.status === "live" ? "live" : w.status === "paused" ? "paused" : w.status === "test" ? "test" : "off")
  const [run, setRun] = useState<Run | null>(null)
  const [runs, setRuns] = useState<Run[]>(() => runsFor(w))
  const [settings, setSettings] = useState(false)

  function runAgain(r: Run) {
    setRun(null)
    setRuns((list) => [
      {
        ...r,
        id: `again${list.length}`,
        started: "Just now",
        result: "Running",
        tone: "blue",
        took: "Running",
        note: undefined,
        noteTitle: undefined,
        steps: r.steps.map((s, i) => ({ ...s, detail: i === 0 ? s.detail : "Waiting", time: "", state: i === 0 ? "done" : i === 1 ? "now" : "todo" })),
      },
      ...list,
    ])
    toast.success("Started a new run. It shows at the top of Recent runs.")
  }
  const failed = w.last.startsWith("Couldn't")

  return (
    <>
      <BackLink href="/workflows" label="Workflows" />

      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-card shadow-sm sm:size-16 sm:rounded-[18px] [&_svg]:size-6 sm:[&_svg]:size-7">
          <WorkflowIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{w.name}</h1>
          <p className="text-[15px] text-muted-foreground">{w.agents === "No agent" ? "Runs with no agent" : `Uses ${w.agents}`}</p>
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
            toast(`${w.name} is ${WORKFLOW_STATUS.find((o) => o.value === v)!.label.toLowerCase()}. ${WORKFLOW_STATUS.find((o) => o.value === v)!.sub}`)
          }}
        />
        </div>
      </div>

      <p className="mb-10 max-w-2xl text-[22px] leading-snug font-medium tracking-tight">{w.sentence}</p>

      {failed && (
        <Card className="mb-10 flex items-start gap-4 p-5 ring-1 ring-destructive/30 sm:p-6">
          <Icon tone="red">
            <AlertCircle />
          </Icon>
          <div className="flex-1">
            <div className="text-[17px] font-semibold">The last run couldn&apos;t finish</div>
            <p className="mt-1 text-[15px] text-muted-foreground">OS&amp;D check calls can&apos;t place calls. Fix the agent and the report runs again.</p>
            <Link href="/agents/osd" className={cn(btn.primary, "mt-4")}>
              Fix the agent
            </Link>
          </div>
        </Card>
      )}

      <Section
        title="How it works"
        action={
          <Link href={`/workflows/${w.id}/edit`} className={btn.plain}>
            Edit on canvas
          </Link>
        }
      >
        <Card className="p-6 sm:p-8">
          <Steps steps={w.steps.map((s) => ({ title: s.title, sub: s.sub, tag: s.agent }))} />
        </Card>
      </Section>

      <Section title="Recent runs">
        <Group>
          {runs.map((r) => (
            <Row
              key={r.id}
              onClick={() => setRun(r)}
              title={r.report}
              sub={
                <span className="inline-flex items-center gap-1.5">
                  <Dot tone={TONE[r.tone]} />
                  {r.result} · {r.started}
                </span>
              }
            />
          ))}
          {!runs.length && <Row title="No runs yet" sub="Set it to Live to start." />}
        </Group>
      </Section>

      <Section title="Under the hood">
        <Group>
          <Row
            onClick={() => setSettings(true)}
            icon={
              <Icon>
                <Settings2 />
              </Icon>
            }
            title="Settings"
            sub="When it runs, who approves, and who hears when something goes wrong"
          />
          <Row
            href={`/workflows/${w.id}/edit`}
            icon={
              <Icon>
                <WorkflowIcon />
              </Icon>
            }
            title="Canvas"
            sub="Add, change or remove steps"
          />
        </Group>
      </Section>

      <Sheet open={settings} onOpenChange={setSettings}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border p-6">
            <SheetTitle className="text-[22px] font-semibold tracking-tight">Settings</SheetTitle>
            <SheetDescription className="text-[15px]">{w.name}</SheetDescription>
          </SheetHeader>
          {settingsFor(w).map((sec) => (
            <div key={sec.title} className="space-y-5 border-b border-border p-6">
              <div className="text-[15px] font-semibold">{sec.title}</div>
              {sec.fields.map((f) => (
                <Field key={f.label} label={f.label} hint={f.hint}>
                  {f.options ? <Select value={f.value} options={f.options} /> : <input defaultValue={f.value} className={inputCls} />}
                </Field>
              ))}
            </div>
          ))}
          <SaveBar onSave={() => setSettings(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!run} onOpenChange={(o) => !o && setRun(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {run && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="text-[22px] font-semibold tracking-tight">{run.report}</SheetTitle>
                <SheetDescription className="text-[15px]">
                  {run.result} · started {run.started} · {run.took}
                </SheetDescription>
              </SheetHeader>
              {run.note && (
                <div className="border-b border-border p-6">
                  <div className="text-[15px] font-semibold">{run.noteTitle}</div>
                  <p className="mt-1 text-[15px] text-muted-foreground">{run.note}</p>
                </div>
              )}
              <div className="p-6">
                <Steps steps={run.steps.map((s) => ({ title: s.title, sub: [s.detail, s.time].filter(Boolean).join(" · "), state: s.state }))} />
              </div>
              {run.result !== "Running" && (
                <div className="mt-auto flex gap-3 border-t border-border p-4">
                  <button className={cn(btn.primary, "flex-1")} onClick={() => runAgain(run)}>
                    Run it again
                  </button>
                  <Link href="/activity" className={cn(btn.secondary, "flex-1")}>
                    View in Activity
                  </Link>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
