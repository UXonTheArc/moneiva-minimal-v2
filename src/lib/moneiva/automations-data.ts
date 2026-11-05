// Workflows: work that moves on a trigger or a schedule, with or without agents. All synthetic.
import type { AgentStatus } from "./data"
export type Tone = "green" | "amber" | "red" | "gray" | "blue"

export type AutomationRow = {
  id: string
  name: string
  desc: string
  agents: string
  trigger: string
  status: AgentStatus
  draft?: boolean
  last: string
  href?: string
  archivedOn?: string
}

export const AUTOMATIONS: AutomationRow[] = [
  { id: "osd", name: "Damage report follow-up", desc: "Reads the report, calls the site, then tells claims or the customer", agents: "The Operator, OS&D check calls", trigger: "New email with an OS&D report", status: "live", last: "Couldn't finish, 7:10 AM", href: "/workflows/damage-report" },
  { id: "phonecheck", name: "OS&D phone check", desc: "Finds a good phone for each shipment in the OS&D file, then calls or texts until someone answers", agents: "OS&D check calls", trigger: "A new OS&D file arrives", status: "live", last: "9 min ago" },
  { id: "late", name: "Late load updates", desc: "Gets a new ETA from the carrier and emails the customer", agents: "Carrier check calls, The Operator", trigger: "Weekdays at 9 AM and 2 PM", status: "live", last: "2 hours ago" },
  { id: "missed", name: "Missed call follow-up", desc: "Emails callers who left a voicemail after hours", agents: "Inbound phone line, The Operator", trigger: "Voicemail left after hours", status: "live", draft: true, last: "7:05 AM today" },
  { id: "latepickup", name: "Late pickup alert", desc: "Emails the dispatcher when a pickup is 2 hours late in Acme", agents: "No agent", trigger: "Pickup 2 hours late in Acme", status: "live", last: "Yesterday, 3:40 PM" },
  { id: "kpi", name: "Weekly KPI email", desc: "Sends last week's numbers to the team leads", agents: "No agent", trigger: "Mondays at 7 AM", status: "off", last: "Never" },
  { id: "dedup", name: "Duplicate email test", desc: "Tried merging repeat emails before the Operator read them", agents: "The Operator", trigger: "New email to service@example.test", status: "archived", last: "Aug 28", archivedOn: "Archived Sep 2 by Taylor Morgan" },
  { id: "holiday", name: "Holiday auto-reply", desc: "Told senders the desk was closed", agents: "No agent", trigger: "Dec 24 to Jan 2", status: "archived", last: "Jan 2", archivedOn: "Archived Jan 3 by Taylor Morgan" },
]

export const AUTOMATION_FILTERS = [
  { value: "live", label: "Live" },
  { value: "all", label: "All" },
  { value: "archived", label: "Archived" },
] as const
export type AutomationFilter = (typeof AUTOMATION_FILTERS)[number]["value"]

// ---------------- Damage report follow-up ----------------

export const DAMAGE_REPORT = {
  name: "Damage report follow-up",
  description:
    "When a customer reports an overage, shortage or damage, the Operator reads it, OS&D check calls confirms with the delivery site, and the result goes to claims or back to the customer.",
  error: "The last run couldn't finish. OS&D check calls can't place calls from (555) 010-0199.",
  published: "Published Oct 2 by Jordan Lee",
}

export const AUTOMATION_STATUS_OPTIONS = [
  { value: "live", label: "Live", sub: "Runs on every new damage report." },
  { value: "test", label: "Test only", sub: "Runs but sends nothing and places no calls. Results show in Training." },
  { value: "paused", label: "Paused", sub: "New reports wait. They run when you set it back to Live." },
  { value: "off", label: "Off", sub: "Stops starting runs. New reports go to Inbox for a person." },
] as const

export type CanvasNode = { id: string; n: string; kind: string; title: string; sub: string; fields: [string, string][] }

export const NODES: Record<string, CanvasNode> = {
  trigger: { id: "trigger", n: "1", kind: "Starts when", title: "New email with an OS&D report", sub: "To service@example.test, or a report form",
    fields: [["Connection", "Gmail: service@example.test"], ["Starts on", "Emails the Operator tags as Overage, shortage or damage"], ["Skip", "Reports older than 30 days"]] },
  op: { id: "op", n: "2", kind: "Agent", title: "The Operator", sub: "Reads the report and finds the PRO, the delivery site and what was reported",
    fields: [["Agent", "The Operator. Its persona, Playbook and tools come from its agent page."], ["Hands on", "PRO number, site name, site phone, delivery date, what was reported"], ["If it can't find the PRO", "Ask the customer for it, then stop"]] },
  call: { id: "call", n: "3", kind: "Agent", title: "OS&D check calls", sub: "Calls the delivery site to confirm pieces, condition and photos",
    fields: [["Agent", "OS&D check calls. Its voice, name and call tools come from its agent page."], ["Calls", "The site phone the Operator found"], ["If no one answers", "Leave a voicemail and try again in 2 hours, up to 3 times"]] },
  cond: { id: "cond", n: "4", kind: "Check", title: "Did the site confirm a problem?", sub: "Uses what OS&D check calls saved from the call",
    fields: [["Checks", "Damage noted, and pieces received against pieces shipped"], ["Problem confirmed", "Open a claim"], ["No problem", "Tell the customer"]] },
  wait: { id: "wait", n: "5", kind: "Approval", title: "Claims approves the claim", sub: "Shows in Inbox for the claims team",
    fields: [["Shows in", "Inbox, under Replies"], ["Who can approve", "Claims team"], ["If no one answers", "Remind claims after 1 business day"]] },
  send: { id: "send", n: "6", kind: "Action", title: "Email claims and the customer", sub: "Claim number, call summary and photos",
    fields: [["Send to", "claims@example.test, with a copy to the customer"], ["Sign as", "Customer Service Team"]] },
  send2: { id: "send2", n: "5", kind: "Agent", title: "The Operator replies", sub: "Tells the customer the site confirmed everything arrived fine",
    fields: [["Agent", "The Operator"], ["Approval", "Follows the stage of Overage, shortage or damage in Playbook. Today that is Review."]] },
  log: { id: "log", n: "7", kind: "Record", title: "Log to Activity", sub: "The report, the call, and what was decided",
    fields: [["Saves", "The emails, the call recording, the steps and the final result"], ["Keeps for", "2 years"]] },
}

/** The canvas layout: a main line, then two branches, then a shared tail. */
export type CanvasLayout = { main: string[]; problem: string[]; fine: string[]; tail: string[] }
export const CANVAS: CanvasLayout = { main: ["trigger", "op", "call", "cond"], problem: ["wait", "send"], fine: ["send2"], tail: ["log"] }
export const BRANCH_LABELS = { problem: "Damage or shortage confirmed", fine: "Everything arrived fine" }

export const PALETTE: { label: string; kind: string; color: string }[] = [
  { label: "Agent", kind: "Agent", color: "#2f5fa7" },
  { label: "Check", kind: "Check", color: "#7c3aed" },
  { label: "Approval", kind: "Approval", color: "#d97706" },
  { label: "Send email", kind: "Action", color: "#16a34a" },
  { label: "Forward email", kind: "Action", color: "#16a34a" },
  { label: "Send a text", kind: "Action", color: "#16a34a" },
  { label: "Look up in Acme", kind: "Action", color: "#52525b" },
  { label: "Wait", kind: "Action", color: "#52525b" },
]

export type RunStep = { title: string; detail: string; time: string; state: "done" | "fail" | "now" | "todo" }
export type Run = {
  id: string
  started: string
  report: string
  result: string
  tone: Tone
  took: string
  noteTitle?: string
  note?: string
  steps: RunStep[]
  actions: { label: string; href: string; primary?: boolean }[]
}
const S = (title: string, detail: string, time: string, state: RunStep["state"] = "done"): RunStep => ({ title, detail, time, state })

export const RUNS: Run[] = [
  { id: "a", started: "Oct 13, 7:10 AM", report: "Damaged pallet on PRO 0300100456", result: "Couldn't finish", tone: "red", took: "1 sec",
    noteTitle: "Why it couldn't finish", note: "OS&D check calls could not place the call. Its number (555) 010-0199 can no longer place calls. Pick another number on the agent, then run it again.",
    steps: [S("New email with an OS&D report", "From morgan@example.test", "instant"), S("The Operator", "Found PRO 0300100456, delivered Oct 10 to Fabrikam Foods, Dock 4. Reported: 1 pallet crushed.", "14 sec"),
      S("OS&D check calls", "The number (555) 010-0199 can no longer place calls.", "failed", "fail"), S("Did the site confirm a problem?", "Skipped", "", "todo"),
      S("Claims approves the claim", "Skipped", "", "todo"), S("Email claims and the customer", "Skipped", "", "todo"), S("Log to Activity", "Saved with the error", "instant")],
    actions: [{ label: "Fix the agent", href: "/agents/osd", primary: true }, { label: "Run it again", href: "#rerun" }, { label: "View in Activity", href: "/activity" }] },
  { id: "b", started: "Oct 10, 2:20 PM", report: "Short 2 cartons, PRO 0300100388", result: "Waiting for approval", tone: "amber", took: "Waiting 3 days",
    noteTitle: "Waiting for claims", note: "The site confirmed 2 cartons short. The claim is ready in Inbox. Nothing has been sent yet.",
    steps: [S("New email with an OS&D report", "From riley@example.test", "instant"), S("The Operator", "Found PRO 0300100388, delivered Oct 9 to Contoso Retail. Reported: 2 cartons short.", "11 sec"),
      S("OS&D check calls", "Called receiving at (555) 010-0420. They counted 38 of 40 cartons.", "3 min"), S("Did the site confirm a problem?", "Yes. 2 cartons short.", "instant"),
      S("Claims approves the claim", "In Inbox since Oct 10, 2:24 PM. Reminder sent Oct 13.", "waiting 3 days", "now"), S("Email claims and the customer", "Not started", "", "todo"), S("Log to Activity", "Not started", "", "todo")],
    actions: [{ label: "Open in Inbox", href: "/inbox", primary: true }, { label: "View in Activity", href: "/activity" }] },
  { id: "c", started: "Oct 9, 10:40 AM", report: "Possible damage, PRO 0300100301", result: "Done", tone: "green", took: "52 min",
    steps: [S("New email with an OS&D report", "From sam@example.test", "instant"), S("The Operator", "Found PRO 0300100301, delivered Oct 8 to Fabrikam Foods. Reported: wet boxes.", "9 sec"),
      S("OS&D check calls", "Called receiving. Boxes were dry by unloading and nothing was damaged.", "4 min"), S("Did the site confirm a problem?", "No.", "instant"),
      S("The Operator replies", "Approved by Jordan Lee and sent to Sam Patel.", "waited 47 min"), S("Log to Activity", "Saved", "instant")],
    actions: [{ label: "View in Activity", href: "/activity" }] },
  { id: "d", started: "Oct 7, 3:05 PM", report: "Overage on PRO 0300100277", result: "Done", tone: "green", took: "3 hr 10 min",
    steps: [S("New email with an OS&D report", "From casey@example.test", "instant"), S("The Operator", "Found PRO 0300100277. Reported: 1 extra pallet.", "10 sec"),
      S("OS&D check calls", "No answer twice. Left voicemails. Reached receiving on the third try.", "2 hr 4 min"), S("Did the site confirm a problem?", "Yes. 1 extra pallet.", "instant"),
      S("Claims approves the claim", "Approved by Taylor Morgan", "waited 1 hr 5 min"), S("Email claims and the customer", "Sent Oct 7, 6:15 PM", "instant"), S("Log to Activity", "Saved", "instant")],
    actions: [{ label: "View in Activity", href: "/activity" }] },
]

export const RUN_RESULT_FILTERS = ["All results", "Done", "Waiting for approval", "Couldn't finish"]
export const RUN_PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days"]

/** Settings fields: label, value, choices when it is a select, hint. */
export type SettingField = { label: string; value: string; options?: string[]; hint?: string }
export type SettingSection = { title: string; sub: string; fields: SettingField[] }
export const SETTINGS: SettingSection[] = [
  { title: "About", sub: "How this workflow shows up across Moneiva.", fields: [
    { label: "Name", value: "Damage report follow-up" },
    { label: "Description", value: "Reads the report, calls the site, then tells claims or the customer." },
  ] },
  { title: "When it runs", sub: "What starts a run, and when.", fields: [
    { label: "Starts when", value: "New email with an OS&D report", options: ["New email with an OS&D report", "New report form"], hint: "The Operator tags these. Change what counts in Playbook." },
    { label: "Hours", value: "Weekdays, 7 AM to 5 PM, the site's time", options: ["Weekdays, 7 AM to 5 PM, the site's time", "Every day, all day"], hint: "Calls only go out while receiving is open." },
    { label: "Outside those hours", value: "Wait until the next morning", options: ["Wait until the next morning", "Put it in Inbox for claims"] },
  ] },
  { title: "Approval and alerts", sub: "Who approves, and who hears when something goes wrong.", fields: [
    { label: "Who can approve claims", value: "Claims team", options: ["Claims team", "Claims lead only", "Customer service team"] },
    { label: "If a run can't finish", value: "Put the report in Inbox and email Jordan Lee", options: ["Put the report in Inbox and email Jordan Lee", "Put the report in Inbox", "Put the report in Inbox and email Taylor Morgan"] },
  ] },
]
