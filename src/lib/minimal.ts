// What the minimal version shows, derived from the shared synthetic data.
import { AGENTS, type Agent } from "@/lib/moneiva/agents-data"
import { AUTOMATIONS, RUNS, SETTINGS, type Run, type SettingSection } from "@/lib/moneiva/automations-data"
import { REQUEST_TYPES, STAGES, type Stage } from "@/lib/moneiva/data"
import { inboxItems, type CallItem, type NewTypeItem, type ReplyItem } from "@/lib/moneiva/inbox-data"
import { THREADS, type Thread } from "@/lib/moneiva/training-data"

export const TODAY = "Monday, October 13"

/** Review: only decisions about real work (replies to approve, calls to return). */
export const REVIEW_ITEMS = inboxItems.filter((i): i is ReplyItem | CallItem => i.kind === "reply" || i.kind === "call")
export const REVIEW_COUNT = REVIEW_ITEMS.length

/** Teach: everything that makes the agents smarter, in one queue. */
export type TeachItem = { kind: "thread"; thread: Thread } | { kind: "new"; item: NewTypeItem }
export const TEACH_ITEMS: TeachItem[] = [
  ...inboxItems.filter((i): i is NewTypeItem => i.kind === "new").map((item) => ({ kind: "new" as const, item })),
  ...THREADS.filter((t) => t.group === "check").map((thread) => ({ kind: "thread" as const, thread })),
]

export const STAGE_INFO: Record<Stage, { label: string; sub: string }> = {
  Learn: { label: "Learning", sub: "Reading past email. Nothing is sent." },
  Shadow: { label: "Shadowing", sub: "Watching live email and guessing what your team will do. Nothing is sent." },
  Review: { label: "Reviewing", sub: "Writes every reply. A person approves it before it goes out." },
  Autopilot: { label: "Autopilot", sub: "Handles it on its own. You can still see everything in Activity." },
}

export const stageCounts = () => STAGES.map((s) => ({ stage: s, count: REQUEST_TYPES.filter((t) => t.stage === s).length }))

/** One stage per agent, for the four step journey. The Operator is per request type. */
export const AGENT_STAGE: Record<Agent["id"], Stage> = { op: "Shadow", phone: "Review", check: "Autopilot", osd: "Review", cat: "Learn" }

export const TOTALS = {
  emails: 25,
  calls: AGENTS.filter((a) => a.kind === "inbound" || a.kind === "outbound").reduce((n, a) => n + Number(a.today), 0),
  onTheirOwn: "86%",
}

export function agentState(a: Agent): { tone: "ok" | "warn" | "bad" | "off"; label: string } {
  if (a.status === "error") return { tone: "bad", label: "Stopped" }
  if (a.status === "off" || a.status === "paused") return { tone: "off", label: "Off" }
  if (a.id === "op" || a.id === "phone") return { tone: "warn", label: "Needs you" }
  return { tone: "ok", label: "Running" }
}

/** Workflows in plain words: when this happens, do that. */
export type WorkflowStep = { title: string; sub: string; agent?: string }
export type Workflow = (typeof AUTOMATIONS)[number] & { sentence: string; steps: WorkflowStep[] }

const STEPS: Record<string, WorkflowStep[]> = {
  phonecheck: [
    { title: "A new OS&D file arrives", sub: "One row for each shipment to check" },
    { title: "Find a good phone", sub: "Driver, dispatcher, or both" },
    { title: "Call or text, up to 4 tries", sub: "Calls first, then texts with Zoom SMS", agent: "OS&D check calls" },
    { title: "Update the shipment", sub: "Marks it Completed with what happened" },
  ],
  osd: [
    { title: "A damage report arrives", sub: "New email with an overage, shortage or damage report" },
    { title: "Read the report", sub: "Finds the PRO, the delivery site and what was reported", agent: "The Operator" },
    { title: "Call the delivery site", sub: "Confirms pieces, condition and photos", agent: "OS&D check calls" },
    { title: "If a problem is confirmed, claims approves", sub: "Waits in Review for the claims team" },
    { title: "Email claims and the customer", sub: "Claim number, call summary and photos" },
  ],
  late: [
    { title: "Weekdays at 9 AM and 2 PM", sub: "Every load in Acme that is running late" },
    { title: "Call the carrier", sub: "Asks for a new ETA and the reason", agent: "Carrier check calls" },
    { title: "Email the customer", sub: "Shares the new ETA", agent: "The Operator" },
  ],
  missed: [
    { title: "A voicemail is left after hours", sub: "On (555) 010-0345" },
    { title: "Turn the voicemail into a summary", sub: "Who called and what they need", agent: "Inbound phone line" },
    { title: "Email the caller back", sub: "Says the desk will follow up in the morning", agent: "The Operator" },
  ],
  latepickup: [
    { title: "A pickup is 2 hours late", sub: "Checked in Acme every 15 minutes" },
    { title: "Email the dispatcher", sub: "dispatch@example.test, with the pickup and the customer" },
  ],
  kpi: [
    { title: "Mondays at 7 AM", sub: "Last week's numbers" },
    { title: "Email the team leads", sub: "Emails handled, calls answered, time saved" },
  ],
  dedup: [
    { title: "New email to service@example.test", sub: "" },
    { title: "Merge repeat emails", sub: "Before the Operator reads them", agent: "The Operator" },
  ],
  holiday: [
    { title: "Dec 24 to Jan 2", sub: "" },
    { title: "Reply that the desk is closed", sub: "Sends the reopening date" },
  ],
}

const SENTENCE: Record<string, string> = {
  phonecheck: "For each shipment in the OS&D file, find a good phone, then call or text the driver or dispatcher until someone answers.",
  osd: "When a damage report comes in, confirm it with the delivery site and tell claims or the customer.",
  late: "Twice a day, get a new ETA for late loads and email the customer.",
  missed: "When someone leaves a voicemail after hours, email them back.",
  latepickup: "When a pickup is 2 hours late, email the dispatcher.",
  kpi: "Every Monday, email last week's numbers to the team leads.",
  dedup: "Merge repeat emails before the Operator reads them.",
  holiday: "Over the holidays, tell senders the desk is closed.",
}

export const WORKFLOWS: Workflow[] = AUTOMATIONS.map((w) => ({
  ...w,
  steps: STEPS[w.id] ?? [],
  sentence: SENTENCE[w.id] ?? w.desc,
}))

/** What the Workflows list and Today need to show, without opening a workflow. */
export type WorkflowMeta = { steps: number; runsToday: number; attention?: string; fix?: string; big?: boolean }
export const WORKFLOW_META: Record<string, WorkflowMeta> = {
  phonecheck: { steps: 35, runsToday: 4, big: true, attention: "2 text steps can't send and 24 rows are waiting to call", fix: "Fix" },
  osd: { steps: 8, runsToday: 3, attention: "The last run couldn't finish. OS&D check calls can't place calls.", fix: "Fix" },
  late: { steps: 3, runsToday: 1 },
  missed: { steps: 3, runsToday: 2 },
  latepickup: { steps: 2, runsToday: 1 },
  kpi: { steps: 2, runsToday: 0 },
  dedup: { steps: 2, runsToday: 0 },
  holiday: { steps: 2, runsToday: 0 },
}
export const metaFor = (id: string): WorkflowMeta => WORKFLOW_META[id] ?? { steps: 0, runsToday: 0 }
export const RUNS_TODAY = Object.values(WORKFLOW_META).reduce((n, m) => n + m.runsToday, 0)

export const workflowById = (id: string) => WORKFLOWS.find((w) => w.id === id)

/** Status choices, worded the same for agents and workflows. */
export const AGENT_STATUS = [
  { value: "live", label: "Live", sub: "Works every email or call that comes in." },
  { value: "test", label: "Test only", sub: "Works them but sends nothing. Results show in Teach." },
  { value: "paused", label: "Paused", sub: "New work waits, and starts again when you set it back to Live." },
  { value: "off", label: "Off", sub: "Stops. Everything goes to Review for a person." },
] as const

export const WORKFLOW_STATUS = [
  { value: "live", label: "Live", sub: "Runs every time it is triggered." },
  { value: "test", label: "Test only", sub: "Runs but sends nothing and places no calls." },
  { value: "paused", label: "Paused", sub: "New runs wait, and start when you set it back to Live." },
  { value: "off", label: "Off", sub: "Stops starting runs. The work goes to Review for a person." },
] as const

/** Run history for every workflow. The damage report has its own detailed runs. */
type Sample = { report: string; started: string; took: string; details: string[] }
const SAMPLES: Record<string, Sample[]> = {
  late: [
    { report: "14 late loads", started: "Oct 13, 9:00 AM", took: "38 min", details: ["Found 14 loads running late", "Reached 12 carriers. 2 didn't answer and went to Review", "Emailed 12 customers their new ETA"] },
    { report: "9 late loads", started: "Oct 10, 2:00 PM", took: "22 min", details: ["Found 9 loads running late", "Reached all 9 carriers", "Emailed 9 customers their new ETA"] },
    { report: "11 late loads", started: "Oct 10, 9:00 AM", took: "31 min", details: ["Found 11 loads running late", "Reached 10 carriers. 1 went to Review", "Emailed 10 customers their new ETA"] },
  ],
  missed: [
    { report: "Voicemail from (555) 010-0142", started: "Oct 13, 7:05 AM", took: "2 min", details: ["Left at 9:48 PM", "Casey Nguyen wants to move pickup 9800777", "Emailed Casey that the desk will call this morning"] },
    { report: "Voicemail from (555) 010-0163", started: "Oct 11, 7:02 AM", took: "1 min", details: ["Left at 6:15 PM", "Asked for a proof of delivery on PRO 0300100388", "Emailed the caller the proof of delivery"] },
  ],
  latepickup: [
    { report: "Pickup 9800611 is 2 hours late", started: "Oct 12, 3:40 PM", took: "instant", details: ["Found in Acme at 3:40 PM", "Emailed dispatch@example.test"] },
    { report: "Pickup 9800540 is 2 hours late", started: "Oct 9, 11:15 AM", took: "instant", details: ["Found in Acme at 11:15 AM", "Emailed dispatch@example.test"] },
  ],
  dedup: [{ report: "3 repeat emails merged", started: "Aug 28, 10:02 AM", took: "4 sec", details: ["New email from riley@example.test", "Merged it with 2 earlier emails"] }],
  holiday: [{ report: "Auto-reply to 41 senders", started: "Jan 2, 5:00 PM", took: "9 days", details: ["Dec 24 to Jan 2", "Replied to 41 senders with the reopening date"] }],
}

export function runsFor(w: Workflow): Run[] {
  if (w.id === "osd") return RUNS
  return (SAMPLES[w.id] ?? []).map((r, i) => ({
    id: `${w.id}${i}`,
    started: r.started,
    report: r.report,
    result: "Done",
    tone: "green",
    took: r.took,
    steps: w.steps.map((s) => ({ title: s.title, detail: r.details[w.steps.indexOf(s)] ?? s.sub, time: "", state: "done" as const })),
    actions: [],
  }))
}

/** Settings for every workflow, in the same shape as the damage report's. */
export function settingsFor(w: Workflow): SettingSection[] {
  if (w.id === "osd") return SETTINGS
  return [
    { title: "About", sub: "", fields: [{ label: "Name", value: w.name }, { label: "Description", value: w.desc }] },
    { title: "When it runs", sub: "", fields: [{ label: "Starts when", value: w.trigger, options: [w.trigger] }, { label: "Hours", value: "Any time", options: ["Any time", "Weekdays, 7 AM to 6 PM"] }] },
    {
      title: "Alerts",
      sub: "",
      fields: [{ label: "If a run can't finish", value: "Put it in Review and email Jordan Lee", options: ["Put it in Review and email Jordan Lee", "Put it in Review", "Email Taylor Morgan"] }],
    },
  ]
}
