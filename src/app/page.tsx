"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight, Check, GraduationCap, MessageSquare } from "lucide-react"

import { WorkflowRow } from "@/components/m/automate"
import { KindIcon } from "@/components/m/kind-icon"
import { useDone } from "@/components/m/store"
import { Card, Dot, Group, Icon, Journey, PageTitle, Row, Section, btn } from "@/components/m/ui"
import { AGENTS } from "@/lib/moneiva/agents-data"
import { ME } from "@/lib/moneiva/data"
import { AGENT_STAGE, REVIEW_ITEMS, RUNS_TODAY, STAGE_INFO, TEACH_ITEMS, TODAY, TOTALS, WORKFLOWS, agentState } from "@/lib/minimal"
import { ZOOM_CONNECTIONS } from "@/lib/moneiva/phone-check-data"

export default function TodayPage() {
  const isDone = useDone()
  const left = REVIEW_ITEMS.filter((i) => !isDone(i.id)).length
  const teachLeft = TEACH_ITEMS.filter((t) => !isDone(t.kind === "new" ? t.item.id : t.thread.id)).length
  const stopped = AGENTS.filter((a) => a.status === "error" && !(a.id === "osd" && isDone("osd-fixed")))
  const zoomSet = ZOOM_CONNECTIONS.some((_, k) => isDone(`zoom:${k}`))
  const liveFlows = WORKFLOWS.filter((w) => w.status === "live")
  const first = ME.name.split(" ")[0]

  return (
    <>
      <PageTitle
        eyebrow={TODAY}
        title={`Good afternoon, ${first}.`}
        lead={
          <>
            Your agents handled <b className="font-semibold text-foreground">{TOTALS.emails} emails</b> and{" "}
            <b className="font-semibold text-foreground">{TOTALS.calls} calls</b> today, and your workflows ran{" "}
            <b className="font-semibold text-foreground">{RUNS_TODAY} times</b>.{" "}
            <b className="font-semibold text-foreground">{TOTALS.onTheirOwn}</b> needed no one.
          </>
        }
      />

      {/* The one thing to do. */}
      <Card className="mb-4 overflow-hidden">
        {left > 0 ? (
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex-1">
              <div className="text-[64px] leading-none font-bold tracking-tight">{left}</div>
              <p className="mt-2 text-[17px] text-muted-foreground">
                {left === 1 ? "reply or call needs" : "replies and calls need"} your OK. Most take a few seconds.
              </p>
            </div>
            <Link href="/review" className={btn.large}>
              Start review
              <ArrowRight className="size-5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-full bg-ok/12 text-ok">
              <Check className="size-6" />
            </span>
            <div>
              <div className="text-[20px] font-semibold">You&apos;re all caught up.</div>
              <p className="text-[15px] text-muted-foreground">Nothing needs your OK right now.</p>
            </div>
          </div>
        )}
      </Card>

      <Group className="mb-12">
        {stopped.map((a) => (
          <Row
            key={a.id}
            href={`/agents/${a.id}`}
            icon={
              <Icon tone="red">
                <AlertCircle />
              </Icon>
            }
            title={`${a.name} stopped`}
            sub="Its phone number can no longer place calls. 2 workflows that use it are waiting."
            value={<span className="font-medium text-primary">Fix</span>}
          />
        ))}
        {!zoomSet && (
          <Row
            href="/workflows/phonecheck"
            icon={
              <Icon tone="amber">
                <MessageSquare />
              </Icon>
            }
            title="OS&D phone check can't send texts"
            sub="Its Zoom connection was removed. 5 shipments are waiting at a text step."
            value={<span className="font-medium text-primary">Fix</span>}
          />
        )}
        <Row
          href="/teach/check"
          icon={
            <Icon tone="blue">
              <GraduationCap />
            </Icon>
          }
          title={teachLeft ? `${teachLeft} things to teach` : "Nothing to teach right now"}
          sub="When you have a minute. Each answer makes the agents need you less."
        />
      </Group>

      <Section title="Your agents" action={<Link href="/agents" className={btn.plain}>All agents</Link>}>
        <Group>
          {AGENTS.map((a) => {
            const st = agentState(a)
            const stage = AGENT_STAGE[a.id]
            return (
              <Row
                key={a.id}
                href={`/agents/${a.id}`}
                icon={
                  <Icon>
                    <KindIcon kind={a.kind} />
                  </Icon>
                }
                title={a.name}
                sub={
                  <span className="inline-flex items-center gap-1.5">
                    <Dot tone={st.tone} />
                    {st.tone === "ok" || st.tone === "warn" ? `${a.today} ${a.todayLabel}` : st.label}
                  </span>
                }
                value={
                  <div className="hidden w-40 sm:block">
                    <Journey stage={stage} compact />
                    <div className="mt-1.5 text-left text-[12px]">{STAGE_INFO[stage].label}</div>
                  </div>
                }
              />
            )
          })}
        </Group>
      </Section>

      <Section title="Your workflows" action={<Link href="/workflows" className={btn.plain}>All workflows</Link>}>
        <Group>
          {liveFlows.slice(0, 4).map((w) => (
            <WorkflowRow key={w.id} w={w} compact />
          ))}
        </Group>
      </Section>

      <Link href="/activity" className={btn.plain}>
        See everything that happened today
        <ArrowRight className="size-4" />
      </Link>
    </>
  )
}
