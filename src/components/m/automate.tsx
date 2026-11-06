"use client"

import Link from "next/link"
import { AlertCircle, ChevronRight, Plus, Workflow as WorkflowIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { KindIcon } from "@/components/m/kind-icon"
import { Card, Details, Dot, Group, Icon, Journey, PageTitle, Row, Section } from "@/components/m/ui"
import { AGENTS, KIND_LABEL } from "@/lib/moneiva/agents-data"
import { USED } from "@/lib/moneiva/agents-extra-data"
import { AGENT_STAGE, RUNS_TODAY, STAGE_INFO, WORKFLOWS, agentState, metaFor, type Workflow } from "@/lib/minimal"

function NewButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={() => toast("Creating is not part of this mockup yet.")}
      className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110"
    >
      <Plus className="size-5" />
    </button>
  )
}

/** One place, two views. Each view has its own address so links and Back go to the right one. */
function AutomateTitle({ view, lead }: { view: "agents" | "workflows"; lead: React.ReactNode }) {
  const tab = "h-8 rounded-full px-4 text-[13px] leading-8 font-medium text-muted-foreground transition"
  const on = "bg-card text-foreground shadow-sm"
  return (
    <PageTitle
      title="Automate"
      lead={lead}
      action={
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-secondary/80 p-1">
            <Link href="/agents" className={cn(tab, view === "agents" && on)}>
              Agents
            </Link>
            <Link href="/workflows" className={cn(tab, view === "workflows" && on)}>
              Workflows
            </Link>
          </div>
          <NewButton label={view === "agents" ? "New agent" : "New workflow"} />
        </div>
      }
    />
  )
}

/** Agents: who does the work. Each one learns in four steps, then works on its own. */
export function AgentsList() {
  const groups = [
    { title: "Email and files", ids: AGENTS.filter((a) => a.kind === "email" || a.kind === "files") },
    { title: "Phone", ids: AGENTS.filter((a) => a.kind === "inbound" || a.kind === "outbound") },
  ]
  return (
    <>
      <AutomateTitle
        view="agents"
        lead="Agents do the work, like answering email or making calls. Each one learns from your team before it works on its own."
      />
      {groups.map((g) => (
        <Section key={g.title} title={g.title}>
          <Group>
            {g.ids.map((a) => {
              const st = agentState(a)
              const stage = AGENT_STAGE[a.id]
              const used = USED[a.id].length
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
                    <span className="inline-flex flex-wrap items-center gap-x-1.5">
                      <Dot tone={st.tone} />
                      {st.tone === "bad" || st.tone === "off" ? st.label : `${a.today} ${a.todayLabel}`}
                      <span className="text-muted-foreground/60">·</span>
                      {KIND_LABEL[a.kind]}
                      {used > 0 && (
                        <>
                          <span className="text-muted-foreground/60">·</span>
                          {used === 1 ? "In 1 workflow" : `In ${used} workflows`}
                        </>
                      )}
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
      ))}
    </>
  )
}

/** Workflows: when and how work moves, from a two step alert to a 35 step phone check. */
export function WorkflowsList() {
  const live = WORKFLOWS.filter((w) => w.status !== "archived")
  const archived = WORKFLOWS.filter((w) => w.status === "archived")
  const attention = live.filter((w) => metaFor(w.id).attention)
  const running = live.filter((w) => !metaFor(w.id).attention && w.status === "live")
  const off = live.filter((w) => !metaFor(w.id).attention && w.status !== "live")
  const liveCount = live.filter((w) => w.status === "live").length

  return (
    <>
      <AutomateTitle
        view="workflows"
        lead={
          <>
            Workflows decide when work happens and in what order, with agents or without them.{" "}
            <b className="font-semibold text-foreground">{liveCount} live</b> workflows ran{" "}
            <b className="font-semibold text-foreground">{RUNS_TODAY} times</b> today.
          </>
        }
      />

      {attention.length > 0 && (
        <Section title="Needs you">
          <Group>
            {attention.map((w) => (
              <WorkflowRow key={w.id} w={w} />
            ))}
          </Group>
        </Section>
      )}

      <Section title="Running">
        <Group>
          {running.map((w) => (
            <WorkflowRow key={w.id} w={w} />
          ))}
        </Group>
      </Section>

      {off.length > 0 && (
        <Section title="Off">
          <Group>
            {off.map((w) => (
              <WorkflowRow key={w.id} w={w} />
            ))}
          </Group>
        </Section>
      )}

      <Details label={`Show ${archived.length} archived`} className="px-1">
        <Group>
          {archived.map((w) => (
            <Row key={w.id} title={w.name} sub={w.archivedOn} className="opacity-70" />
          ))}
        </Group>
      </Details>
    </>
  )
}

export function WorkflowRow({ w, compact }: { w: Workflow; compact?: boolean }) {
  const m = metaFor(w.id)
  const live = w.status === "live"
  const bad = !!m.attention
  return (
    <Row
      href={`/workflows/${w.id}`}
      icon={
        <Icon tone={bad ? (w.id === "osd" ? "red" : "amber") : "gray"}>
          {bad ? <AlertCircle /> : <WorkflowIcon />}
        </Icon>
      }
      title={w.name}
      sub={
        <>
          {bad ? (
            <span className="block truncate text-foreground/80">{m.attention}</span>
          ) : (
            !compact && <span className="block truncate">{w.sentence}</span>
          )}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
            <Dot tone={bad ? (w.id === "osd" ? "bad" : "warn") : live ? "ok" : "off"} />
            {live ? "Live" : "Off"}
            <span className="text-muted-foreground/60">·</span>
            {m.steps} steps
            <span className="text-muted-foreground/60">·</span>
            {w.agents === "No agent" ? "No agent" : w.agents}
          </span>
        </>
      }
      value={
        <span className="hidden sm:block">
          <span className="block text-[17px] font-semibold text-foreground tabular-nums">{m.runsToday}</span>
          {m.runsToday === 1 ? "run today" : "runs today"}
        </span>
      }
    />
  )
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-6 inline-flex items-center gap-1 text-[15px] font-medium text-primary">
      <ChevronRight className="size-4 rotate-180" />
      {label}
    </Link>
  )
}

export { Card, Section }
