"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertCircle, ArrowRight, FlaskConical, History, IdCard, Route, Wrench, Workflow as WorkflowIcon } from "lucide-react"
import { toast } from "sonner"

import { BackLink } from "@/components/m/automate"
import { KindIcon } from "@/components/m/kind-icon"
import { StatusMenu, type RunStatus } from "@/components/m/status-menu"
import { Card, Field, Group, Icon, Journey, Row, SaveBar, Section, Select, Steps, areaCls, btn, inputCls } from "@/components/m/ui"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/moneiva/agents-data"
import { FLOWS, PROFILE_OPTIONS, RUNSET, TEST_EMAIL, USED } from "@/lib/moneiva/agents-extra-data"
import { REQUEST_TYPES, STAGES } from "@/lib/moneiva/data"
import { AGENT_STAGE, AGENT_STATUS, REVIEW_ITEMS, STAGE_INFO, WORKFLOWS } from "@/lib/minimal"
import { markDone, useDone } from "@/components/m/store"

type Panel = "who" | "tools" | "how" | "test" | null
const NUMBERS = ["(555) 010-0211", "(555) 010-0233", "(555) 010-0275"]

export function AgentDetail({ agent: a }: { agent: Agent }) {
  const isDoneFix = useDone()
  const [brokenLocal, setBrokenLocal] = useState(a.status === "error")
  // Fixing OS&D check calls also clears it on Today and in the workflows that call it.
  const broken = brokenLocal && !(a.id === "osd" && isDoneFix("osd-fixed"))
  const setBroken = (v: boolean) => {
    setBrokenLocal(v)
    if (!v && a.id === "osd") markDone("osd-fixed")
  }
  const [status, setStatus] = useState<RunStatus>(a.status === "off" ? "off" : a.status === "paused" ? "paused" : a.status === "test" ? "test" : "live")
  const [picking, setPicking] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [moved, setMoved] = useState(false)
  const stage = AGENT_STAGE[a.id]
  const isDone = useDone()
  const needs = REVIEW_ITEMS.filter((i) => !isDone(i.id) && (i.kind === "call" ? i.agent === a.name : a.id === "op")).length
  const isOp = a.id === "op"
  const ready = REQUEST_TYPES.find((t) => t.flag === "ready")

  return (
    <>
      <BackLink href="/agents" label="Agents" />

      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-card shadow-sm sm:size-16 sm:rounded-[18px] [&_svg]:size-6 sm:[&_svg]:size-7">
          <KindIcon kind={a.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{a.name}</h1>
          <p className="text-[15px] text-muted-foreground">{a.channel}</p>
        </div>
        </div>
        <div className="flex items-center gap-2">
        <StatusMenu
          value={status}
          options={AGENT_STATUS}
          onChange={(v) => {
            setStatus(v)
            toast(`${a.name} is ${AGENT_STATUS.find((o) => o.value === v)!.label.toLowerCase()}. ${AGENT_STATUS.find((o) => o.value === v)!.sub}`)
          }}
        />
        </div>
      </div>

      {broken && (
        <Card className="mb-6 p-5 ring-1 ring-destructive/30 sm:p-6">
          <div className="flex items-start gap-4">
            <Icon tone="red">
              <AlertCircle />
            </Icon>
            <div className="flex-1">
              <div className="text-[17px] font-semibold">It stopped at 7:10 AM</div>
              <p className="mt-1 text-[15px] text-muted-foreground">Its phone number can no longer place calls. Pick another number and it starts again.</p>
              {picking ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {NUMBERS.map((n) => (
                    <button
                      key={n}
                      className={btn.secondary}
                      onClick={() => {
                        setBroken(false)
                        toast.success(`Calling from ${n}. ${a.name} is running again.`)
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <button className={cn(btn.primary, "mt-4")} onClick={() => setPicking(true)}>
                  Pick a number
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <Card className="p-6">
          <div className="text-[48px] leading-none font-bold tracking-tight">{a.today}</div>
          <p className="mt-2 text-[15px] text-muted-foreground">{a.todayLabel}</p>
          {needs > 0 && (
            <Link href={a.kind === "inbound" ? "/review?item=c1" : "/review"} className={cn(btn.plain, "mt-4")}>
              {a.kind === "inbound" ? `${needs} call to return` : `${needs} to review`}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Card>
        <Card className="p-6">
          <div className="mb-4 text-[15px] font-semibold">{STAGE_INFO[stage].label}</div>
          <Journey stage={stage} />
          <p className="mt-4 text-[13px] text-muted-foreground">
            {isOp ? "Each kind of email moves on its own. Most are shadowing your team." : STAGE_INFO[stage].sub}
          </p>
          {isOp && (
            <Link href="/teach?panel=types" className={cn(btn.plain, "mt-3 text-[14px]")}>
              See every kind of email
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Card>
      </div>

      {isOp && ready && !moved && (
        <Card className="mb-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="text-[17px] font-semibold">{ready.name} is ready to move up</div>
            <p className="mt-1 text-[15px] text-muted-foreground">
              It matched your team {ready.matched} of {ready.of} times. Move it to Reviewing and it starts writing replies for you to approve.
            </p>
          </div>
          <button
            className={btn.primary}
            onClick={() => {
              setMoved(true)
              toast.success(`${ready.name} moved to Reviewing`)
            }}
          >
            Move up
          </button>
        </Card>
      )}

      <Section title="What it does">
        <Card className="p-6 text-[17px] leading-relaxed">{a.desc}</Card>
      </Section>

      <Section title="Under the hood">
        <Group>
          <Row onClick={() => setPanel("who")} icon={<Icon><IdCard /></Icon>} title="Who it is" sub="Persona, goal, and what it may and may not do" />
          <Row onClick={() => setPanel("tools")} icon={<Icon><Wrench /></Icon>} title="Tools" sub={`${a.tools.filter((t) => t[3]).length} on`} />
          <Row onClick={() => setPanel("how")} icon={<Icon><Route /></Icon>} title="How it runs" sub="Step by step, hours, and what happens when it can't finish" />
          <Row onClick={() => setPanel("test")} icon={<Icon><FlaskConical /></Icon>} title="Test it" sub={a.kind === "email" ? "Try it on an email. Nothing is sent." : a.kind === "files" ? "Try it on a file. Nothing changes." : "Have it call you. Nothing is saved."} />
          <Row href={`/activity?agent=${encodeURIComponent(a.name)}`} icon={<Icon><History /></Icon>} title="Activity" sub="Every email and call it handled" />
        </Group>
      </Section>

      {USED[a.id].length > 0 && (
        <Section title="Used in workflows">
          <Group>
            {USED[a.id].map((u) => {
              const w = WORKFLOWS.find((x) => x.name === u.name)
              return <Row key={u.name} href={w ? `/workflows/${w.id}` : "/workflows"} icon={<Icon><WorkflowIcon /></Icon>} title={u.name} sub={u.sub} />
            })}
          </Group>
        </Section>
      )}

      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {panel === "who" && (
            <>
              <Head title="Who it is" sub="How it introduces itself, what it's for, and its limits." />
              <div className="space-y-5 p-6">
                <Field label="Name">
                  <input defaultValue={a.name} className={inputCls} />
                </Field>
                <Field label="Who it is">
                  <textarea defaultValue={a.who} rows={2} className={areaCls} />
                </Field>
                <Field label="Goal">
                  <textarea defaultValue={a.goal} rows={2} className={areaCls} />
                </Field>
                <Field label="It may">
                  <textarea defaultValue={a.may} rows={2} className={areaCls} />
                </Field>
                <Field label="It may not">
                  <textarea defaultValue={a.mayNot} rows={2} className={areaCls} />
                </Field>
                {a.greeting && (
                  <Field label="Greeting">
                    <textarea defaultValue={a.greeting} rows={2} className={areaCls} />
                  </Field>
                )}
                {a.voice && (
                  <Field label="Voice">
                    <Select value={a.voice} options={PROFILE_OPTIONS.voice} />
                  </Field>
                )}
                <Field label={a.kind === "email" ? "Inbox" : a.kind === "files" ? "Folder" : "Phone number"}>
                  <Select value={a.address} options={a.kind === "email" ? PROFILE_OPTIONS.address.email : a.kind === "files" ? PROFILE_OPTIONS.address.files : PROFILE_OPTIONS.address.phone} />
                </Field>
                <Field label="Language">
                  <Select value={a.language} options={PROFILE_OPTIONS.language} />
                </Field>
                {a.language2 && (
                  <Field label="Second language">
                    <Select value={a.language2} options={PROFILE_OPTIONS.language2} />
                  </Field>
                )}
                <Field label="Time zone">
                  <Select value={a.tz} options={PROFILE_OPTIONS.tz} />
                </Field>
                <Field label="Team">
                  <Select value={a.team} options={PROFILE_OPTIONS.team} />
                </Field>
              </div>
              <SaveBar onSave={() => setPanel(null)} />
            </>
          )}
          {panel === "tools" && (
            <>
              <Head title="Tools" sub="What it can use. Turn off anything you don't want it to touch." />
              <ul className="divide-y divide-border">
                {a.tools.map(([name, desc, , enabled]) => (
                  <li key={name} className="flex items-start gap-4 px-6 py-4">
                    <div className="flex-1">
                      <div className="text-[15px] font-medium">{name}</div>
                      <div className="mt-0.5 text-[13px] text-muted-foreground">{desc}</div>
                    </div>
                    <Switch defaultChecked={enabled} aria-label={name} />
                  </li>
                ))}
                {!a.tools.length && <li className="px-6 py-4 text-[15px] text-muted-foreground">No tools yet.</li>}
              </ul>
            </>
          )}
          {panel === "how" && (
            <>
              <Head title="How it runs" sub="What happens, in order, every time." />
              <div className="p-6">
                <Steps steps={FLOWS[a.id].map((s) => ({ title: s.title, sub: s.sub, tag: s.kind === "Agent" ? undefined : s.kind }))} />
              </div>
              <div className="space-y-5 border-t border-border p-6">
                {RUNSET[a.id].map((r) => (
                  <Field key={r.label} label={r.label}>
                    <Select value={r.value} options={r.options} />
                  </Field>
                ))}
              </div>
              {isOp && (
                <div className="border-t border-border p-6">
                  <div className="mb-3 text-[13px] font-semibold text-muted-foreground">Kinds of email by step</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {STAGES.map((s) => (
                      <div key={s} className="rounded-xl bg-muted p-3">
                        <div className="text-[20px] font-semibold">{REQUEST_TYPES.filter((t) => t.stage === s).length}</div>
                        <div className="text-[11px] text-muted-foreground">{STAGE_INFO[s].label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <SaveBar onSave={() => setPanel(null)} />
            </>
          )}
          {panel === "test" && <TestPanel agent={a} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function TestPanel({ agent: a }: { agent: Agent }) {
  const [ran, setRan] = useState(false)
  if (a.kind !== "email") {
    return (
      <>
        <Head title="Test it" sub={a.kind === "files" ? "Drop in a file. It shows what it would change, and changes nothing." : "It calls you, so you can hear it. Nothing is saved to Activity."} />
        <div className="space-y-5 p-6">
          {a.kind === "files" ? (
            <Field label="File">
              <Select value="Acme rate and accessorial sheet.pdf" options={["Dock hours and addresses.xlsx"]} />
            </Field>
          ) : (
            <>
              <Field label="Pretend to be">
                <Select value={TEST_EMAIL.pretend[0]} options={TEST_EMAIL.pretend} />
              </Field>
              <Field label="Your number">
                <input defaultValue="(555) 010-0177" className={inputCls} />
              </Field>
            </>
          )}
        </div>
        <div className="mt-auto border-t border-border p-4">
          <button className={cn(btn.primary, "w-full")} onClick={() => toast(a.kind === "files" ? "Reading the file. Results show here in a moment." : "Calling you now.")}>
            {a.kind === "files" ? "Run test" : "Call me"}
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      <Head title="Test it" sub="Run it on an email. Nothing is sent." />
      <div className="space-y-5 p-6">
        <Field label="Start from">
          <Select value={TEST_EMAIL.startFrom[0]} options={TEST_EMAIL.startFrom} />
        </Field>
        <Field label="Email">
          <textarea defaultValue={TEST_EMAIL.email} rows={5} className={areaCls} />
        </Field>
        <button className={cn(btn.primary, "w-full")} onClick={() => setRan(true)}>
          {ran ? "Run again" : "Run test"}
        </button>
        {ran && (
          <div className="animate-in space-y-4 fade-in-0">
            <dl className="divide-y divide-border rounded-xl bg-card">
              {TEST_EMAIL.result.map(([k, v]) => (
                <div key={k} className="px-4 py-3">
                  <dt className="text-[12px] font-semibold text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 text-[14px]">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <div className="mb-1 text-[13px] font-semibold text-muted-foreground">The reply it would write</div>
              <div className="rounded-xl bg-muted p-4 text-[14px] leading-relaxed whitespace-pre-wrap">{TEST_EMAIL.reply}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <SheetHeader className="border-b border-border p-6">
      <SheetTitle className="text-[22px] font-semibold tracking-tight">{title}</SheetTitle>
      <SheetDescription className="text-[15px]">{sub}</SheetDescription>
    </SheetHeader>
  )
}
