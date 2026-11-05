// Extra data for the Agents section: how each agent runs, where it is used, and the choices on its forms.
// Everything here is synthetic.
import type { Agent, AgentKind } from "./agents-data"
import { REQUEST_TYPES, type RequestType } from "./data"

export type AgentId = Agent["id"]

/** Step kinds on a canvas, with their color. Shared with Workflows. */
export const STEP_COLOR: Record<string, string> = {
  "Starts when": "#52525b",
  Agent: "#2f5fa7",
  Check: "#7c3aed",
  Approval: "#d97706",
  Action: "#16a34a",
  Record: "#52525b",
}

/** One step on an agent's How it runs canvas. */
export type FlowStep = { kind: string; title: string; sub: string; link?: string; href?: string }

export const FLOWS: Record<AgentId, FlowStep[]> = {
  op: [
    { kind: "Starts when", title: "New email", sub: "To service@example.test" },
    { kind: "Agent", title: "The Operator reads it", sub: "Picks the request type, looks it up in Acme, and drafts a reply" },
    { kind: "Check", title: "Is the request type on Autopilot?", sub: "Yes: send right away. No: wait for approval.", link: "See stages in Playbook", href: "/playbook" },
    { kind: "Approval", title: "Wait for approval", sub: "Shows in Inbox until someone sends it", link: "Open Inbox", href: "/inbox" },
    { kind: "Action", title: "Send reply", sub: "From service@example.test, signed Customer Service Team" },
    { kind: "Record", title: "Log to Activity", sub: "What came in, what was done, and who approved it" },
  ],
  phone: [
    { kind: "Starts when", title: "Incoming call", sub: "To (555) 010-0345" },
    { kind: "Agent", title: "Riley answers", sub: "Finds the pickup or PRO and answers on the call" },
    { kind: "Check", title: "Could it help?", sub: "Yes: text a summary. No: transfer to the desk." },
    { kind: "Action", title: "Call back if promised", sub: "Puts the call in Inbox for a person", link: "Open Inbox", href: "/inbox?filter=call&item=c1" },
    { kind: "Record", title: "Log to Activity", sub: "Recording, transcript and summary" },
  ],
  check: [
    { kind: "Starts when", title: "Weekdays at 9 AM and 2 PM", sub: "Every load in Acme that is running late" },
    { kind: "Agent", title: "Jordan calls the carrier", sub: "Presses 802 for dispatch and asks for the ETA" },
    { kind: "Check", title: "Got an ETA?", sub: "Yes: update Acme. No: try again in 1 hour, then send to Inbox." },
    { kind: "Action", title: "Update the ETA in Acme", sub: "With the delay reason" },
    { kind: "Record", title: "Log to Activity", sub: "Recording, transcript and the new ETA" },
  ],
  osd: [
    { kind: "Starts when", title: "Started by a workflow", sub: "Damage report follow-up hands it the site, PRO and date", link: "Open the workflow", href: "/workflows/damage-report" },
    { kind: "Agent", title: "Jordan calls the delivery site", sub: "Asks about pieces, condition and photos" },
    { kind: "Check", title: "Did someone answer?", sub: "No: leave a voicemail and try again in 2 hours, up to 3 times." },
    { kind: "Action", title: "Hand back what it learned", sub: "Pieces received, damage noted, photos requested" },
    { kind: "Record", title: "Log to Activity", sub: "Recording and transcript" },
  ],
  cat: [
    { kind: "Starts when", title: "New file in the catalog folder", sub: "Rate and accessorial files" },
    { kind: "Agent", title: "Reads the file", sub: "Lists what changed in the catalog" },
    { kind: "Approval", title: "Pricing approves", sub: "Shows in Inbox until someone approves" },
    { kind: "Action", title: "Update the catalog", sub: "The other agents use it right away" },
    { kind: "Record", title: "Log to Activity", sub: "The file and every change" },
  ],
}

/** Kinds offered on a + between steps. */
export const ADD_STEP_KINDS = ["Agent", "Check", "Approval", "Action", "Record"]

/** When it runs: label, current value, other choices. */
export type RunSetting = { label: string; value: string; options: string[] }
const rs = (label: string, value: string, ...others: string[]): RunSetting => ({ label, value, options: [value, ...others] })

export const RUNSET: Record<AgentId, RunSetting[]> = {
  op: [
    rs("Hours", "Weekdays, 7 AM to 6 PM", "Every day, all day", "Weekdays, 8 AM to 5 PM"),
    rs("Outside those hours", "Hold the email until the next morning", "Work it anyway", "Put it in Inbox for a person"),
    rs("Who can approve", "Customer service team", "Team leads only", "Anyone in Acme Logistics"),
    rs("If it can't finish", "Put it in Inbox and email Jordan Lee", "Put it in Inbox", "Put it in Inbox and email Taylor Morgan"),
  ],
  phone: [
    rs("Hours", "Every day, all day", "Weekdays, 7 AM to 6 PM"),
    rs("After hours", "Take a voicemail and put it in Inbox", "Transfer to (555) 010-0100", "Play the closed message and hang up"),
    rs("If it can't finish", "Transfer to (555) 010-0100", "Take a voicemail and put it in Inbox"),
  ],
  check: [
    rs("Runs", "Weekdays at 9 AM and 2 PM", "Weekdays at 9 AM", "Every 2 hours on weekdays"),
    rs("Calls at most", "40 a run", "20 a run", "80 a run"),
    rs("If it can't finish", "Put it in Inbox for the carrier desk", "Email the carrier desk lead"),
  ],
  osd: [
    rs("Hours", "Weekdays, 7 AM to 5 PM, the site's time", "Weekdays, 8 AM to 4 PM, the site's time"),
    rs("Tries", "Up to 3 calls, 2 hours apart", "Up to 2 calls, 4 hours apart", "1 call only"),
    rs("If it can't finish", "Put it in Inbox for claims", "Email the claims lead"),
  ],
  cat: [
    rs("Hours", "Any time a file arrives", "Weekdays, 7 AM to 6 PM"),
    rs("Who can approve", "Pricing team", "Pricing lead only"),
    rs("If it can't finish", "Email the pricing lead", "Put it in Inbox for pricing"),
  ],
}

/** Workflows that use each agent: name, how, link. */
export type UsedIn = { name: string; sub: string; href: string }
export const USED: Record<AgentId, UsedIn[]> = {
  op: [
    { name: "Damage report follow-up", sub: "Reads the report first, then OS&D check calls takes over", href: "/workflows/damage-report" },
    { name: "Late load updates", sub: "Emails the customer the new ETA", href: "/workflows" },
    { name: "Missed call follow-up", sub: "Emails callers who left a voicemail", href: "/workflows" },
  ],
  phone: [{ name: "Missed call follow-up", sub: "Its voicemails start this workflow", href: "/workflows" }],
  check: [{ name: "Late load updates", sub: "Its new ETAs go to the Operator to email out", href: "/workflows" }],
  osd: [
    { name: "OS&D phone check", sub: "Calls the driver or dispatcher for each shipment in the OS&D file", href: "/workflows/phonecheck" },
    { name: "Damage report follow-up", sub: "Calls the site after the Operator reads the report", href: "/workflows/damage-report" },
  ],
  cat: [],
}

/** Agent kinds for the Create agent dialog. */
export const KINDS: { kind: AgentKind; label: string; sub: string }[] = [
  { kind: "email", label: "Email", sub: "Reads and answers an inbox" },
  { kind: "inbound", label: "Inbound calls", sub: "Answers a phone number" },
  { kind: "outbound", label: "Outbound calls", sub: "Places calls from a list or a trigger" },
  { kind: "files", label: "Files and data", sub: "Reads files and updates records" },
]

/** Status menu on an agent page. */
export const AGENT_STATUS_OPTIONS = [
  { value: "live", label: "Live", sub: "Works every email or call that comes in." },
  { value: "test", label: "Test only", sub: "Works them but sends nothing. Results show in Training." },
  { value: "off", label: "Off", sub: "Stops. Everything goes to Inbox for a person." },
] as const

/** Request types a voice or file agent handles. The Operator handles all of them. */
export const PHONE_TYPES = [
  "Confirmation on a pickup",
  "ETA or status request",
  "Pickup change request",
  "PRO tracking request",
  "Missed pickup recovery",
  "Delivery appointment",
]

export function requestTypesFor(agent: Agent): RequestType[] {
  return agent.kind === "email" ? REQUEST_TYPES : REQUEST_TYPES.filter((t) => PHONE_TYPES.includes(t.name))
}

export const STAGE_OVERRIDES = ["Use each request type's stage (recommended)", "Hold all at Review"]

/** Choices on the Profile form. The agent's own value is always added first. */
export const PROFILE_OPTIONS = {
  team: ["LTL customer service", "Carrier relations", "Claims", "Pricing"],
  language: ["English", "Spanish", "French"],
  language2: ["None, main language only", "Spanish", "French"],
  tz: ["Central time (Chicago)", "Eastern time (New York)", "Mountain time (Denver)", "Pacific time (Los Angeles)"],
  voice: ["Riley: female, warm, clear (default)", "Sarah: female, firm, clear (default)", "Marcus: male, calm, clear"],
  fallback: ["Transfer to the customer service desk", "None. It ends the call and puts it in Inbox", "Take a voicemail and put it in Inbox"],
  address: {
    email: ["service@example.test", "billing@example.test", "claims@example.test"],
    phone: ["(555) 010-0210", "(555) 010-0211"],
    files: ["Catalog folder", "Rates folder"],
  },
}

export function withValue(value: string | undefined, options: string[]): string[] {
  if (!value) return options
  return [value, ...options.filter((o) => o !== value)]
}

/** The made up email the Operator's test runs on. */
export const TEST_EMAIL = {
  startFrom: ['A past email: "Driver on time for pickup 9800123?"', "A made up email", 'A past email: "Pickup yesterday"'],
  email: "From: sam@example.test\nHi,\nWill the driver be on time for pickup 9800123 today? Our dock closes at 3 PM.\nSam Patel",
  result: [
    ["Request type", "ETA or status request"],
    ["Looked up", "Pickup 9800123 in Acme: driver on route, expected 1 to 2 PM"],
    ["Then", "Draft a reply and wait for approval in Inbox"],
  ],
  reply: "Hi Sam,\n\nThe driver for pickup 9800123 is on the way and expected between 1 and 2 PM today, before your dock closes at 3 PM.\n\nThank you,\nCustomer Service Team",
  pretend: ["A customer asking about a pickup", "A carrier with a late load", "A delivery site asking about a claim"],
}
