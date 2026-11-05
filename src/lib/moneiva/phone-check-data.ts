// OS&D phone check: a larger, branching workflow. All synthetic.

export type FlowKind = "Starts when" | "Question" | "Choose a path" | "Remember" | "Look up" | "Agent" | "Send a text" | "Checkpoint" | "Finish"

export const FLOW_KIND_COLOR: Record<FlowKind, string> = {
  "Starts when": "#52525b",
  Question: "#7c3aed",
  "Choose a path": "#7c3aed",
  Remember: "#0e7490",
  "Look up": "#0e7490",
  Agent: "#2f5fa7",
  "Send a text": "#16a34a",
  Checkpoint: "#71717a",
  Finish: "#16a34a",
}

export type FlowStep = {
  id: string
  kind: FlowKind
  title: string
  sub: string
  fields: [string, string][]
  /** Shown in orange on the card: the step can't run until this is done. */
  setup?: string
  /** The path stops here. */
  end?: boolean
}

export type FlowBranch = { label: string; tone: "yes" | "no" | "case"; path: FlowItem[] }
/** join: the paths come back together and the workflow carries on below. */
export type FlowSplit = { id: string; join?: boolean; branches: FlowBranch[] }
export type FlowItem = { step: FlowStep } | { split: FlowSplit }

const s = (step: FlowStep): FlowItem => ({ step })
const split = (id: string, branches: FlowBranch[], join?: boolean): FlowItem => ({ split: { id, branches, join } })

const remember = (id: string, title: string, variable: string, value: string): FlowItem =>
  s({ id, kind: "Remember", title, sub: `Saves ${variable} = ${value}`, fields: [["Saves", variable], ["Value", value], ["Used by", "Later steps in this run"]] })

const checkpoint = (id: string, title: string): FlowItem =>
  s({ id, kind: "Checkpoint", title, sub: "Marks how far this row got", fields: [["Shows in Runs as", title], ["Does", "Nothing else. It helps you see where a row went."]] })

const call = (id: string, who: string): FlowItem =>
  s({
    id,
    kind: "Agent",
    title: "Call with OS&D check calls",
    sub: `Calls the ${who} and posts what they said`,
    fields: [
      ["Agent", "OS&D check calls. Its voice, script and tools come from its agent page."],
      ["Calls", `The ${who}'s phone, from call_phone`],
      ["After the call", "Posts the summary and recording to the shipment"],
      ["Adds", "1 to the attempt count"],
    ],
  })

export const ZOOM_CONNECTIONS = ["Zoom: OS&D desk (svc_zoom@example.test)", "Zoom: Dispatch team (dispatch_zoom@example.test)"]

const text = (id: string, who: string): FlowItem =>
  s({
    id,
    kind: "Send a text",
    title: "Text with Zoom SMS",
    sub: `Texts the ${who} to call the OS&D desk back`,
    setup: "Can't send: its Zoom connection was removed",
    fields: [
      ["Zoom connection", "Missing. The connection it used no longer exists."],
      ["Send from", "(555) 010-0188, sender ID svc_zoom@example.test"],
      ["To", who === "driver" ? "The driver's phone, from the OS&D file" : "The driver's and dispatcher's phones, from the OS&D file"],
      ["Message", "Hi {driver name}, this is the OS&D desk about load {load number}. Please call us back at (555) 010-0100."],
      ["If this step fails", "Use the workflow default"],
    ],
  })

const finish = (id: string, sub = "Marks the shipment Completed"): FlowItem =>
  s({
    id,
    kind: "Finish",
    title: "Update the shipment",
    sub,
    end: true,
    fields: [["Updates", "The shipment record (business transaction)"], ["Sets status to", "Completed"], ["Adds a note", "What happened and when"]],
  })

const attempts = (id: string, who: string): FlowItem =>
  s({
    id,
    kind: "Look up",
    title: who ? `Check tries for the ${who}` : "Check tries so far",
    sub: "Reads the attempt count on this shipment",
    fields: [["Reads", who ? `attempts_${who}` : "attempts"], ["From", "The shipment record"]],
  })

const question = (id: string, title: string, rule: string): FlowItem =>
  s({ id, kind: "Question", title, sub: rule, fields: [["Checks", rule], ["Yes", "Goes left"], ["No", "Goes right"]] })

export const PHONE_CHECK: FlowItem[] = [
  s({
    id: "trigger",
    kind: "Starts when",
    title: "A new OS&D file arrives",
    sub: "One row for each shipment to check",
    fields: [
      ["Starts on", "A new OS&D CSV file in the shared folder"],
      ["Checks for files", "Every 15 minutes"],
      ["Each row has", "PRO, driver phone, dispatcher phone, attempt counts"],
    ],
  }),
  question("q-driver", "Is the driver's phone good?", "A real number that is not on the do not call list"),
  split(
    "phones",
    [
      {
        label: "Yes",
        tone: "yes",
        path: [
          question("q-disp-a", "Is the dispatcher's phone good?", "A real number that is not on the do not call list"),
          split(
            "phones-a",
            [
              { label: "Yes", tone: "yes", path: [remember("set-both", "Remember: both phones", "phone_switch", "both"), checkpoint("cp-both", "Both phones good")] },
              { label: "No", tone: "no", path: [remember("set-driver", "Remember: driver only", "phone_switch", "driver"), checkpoint("cp-driver", "Driver phone good")] },
            ],
            true
          ),
        ],
      },
      {
        label: "No",
        tone: "no",
        path: [
          question("q-disp-b", "Is the dispatcher's phone good?", "A real number that is not on the do not call list"),
          split(
            "phones-b",
            [
              { label: "Yes", tone: "yes", path: [remember("set-disp", "Remember: dispatcher only", "phone_switch", "dispatcher"), checkpoint("cp-disp", "Dispatcher phone good")] },
              { label: "No", tone: "no", path: [checkpoint("cp-none", "No good phones"), finish("end-none", "Marks it Completed: no good phones to call")] },
            ],
            true
          ),
        ],
      },
    ],
    true
  ),
  s({
    id: "switch",
    kind: "Choose a path",
    title: "Which phones do we have?",
    sub: "3 paths and a fallback, from phone_switch",
    fields: [["Looks at", "phone_switch"], ["Paths", "Both, Driver, Dispatcher"], ["Fallback", "Anything else"]],
  }),
  split("which", [
    {
      label: "Both",
      tone: "case",
      path: [
        attempts("att-both", ""),
        question("q-two", "Tried 2 times or fewer?", "attempts is 2 or less"),
        split("tries", [
          { label: "Yes", tone: "yes", path: [remember("cp-call-driver", "Call the driver", "call_phone", "driver"), call("call-both-driver", "driver")] },
          {
            label: "No",
            tone: "no",
            path: [
              question("q-third", "Is this the 3rd try?", "attempts is 3"),
              split("third", [
                { label: "Yes", tone: "yes", path: [remember("cp-call-disp", "Call the dispatcher", "call_phone", "dispatcher"), call("call-both-disp", "dispatcher")] },
                {
                  label: "No",
                  tone: "no",
                  path: [
                    question("q-fourth", "Is this the 4th try?", "attempts is 4"),
                    split("fourth", [
                      { label: "Yes", tone: "yes", path: [text("text-both", "driver and dispatcher")] },
                      { label: "No", tone: "no", path: [finish("end-both")] },
                    ]),
                  ],
                },
              ]),
            ],
          },
        ]),
      ],
    },
    {
      label: "Driver",
      tone: "case",
      path: [
        attempts("att-driver", "driver"),
        question("q-two-driver", "Tried 2 times or fewer?", "attempts_driver is 2 or less"),
        split("tries-driver", [
          { label: "Yes", tone: "yes", path: [remember("set-call-driver", "Call the driver", "call_phone", "driver"), call("call-driver", "driver")] },
          { label: "No", tone: "no", path: [text("text-driver", "driver"), finish("end-driver")] },
        ]),
      ],
    },
    {
      label: "Dispatcher",
      tone: "case",
      path: [
        attempts("att-disp", "dispatcher"),
        question("q-two-disp", "Tried 2 times or fewer?", "attempts_dispatcher is 2 or less"),
        split("tries-disp", [
          { label: "Yes", tone: "yes", path: [remember("set-call-disp", "Call the dispatcher", "call_phone", "dispatcher"), call("call-disp", "dispatcher")] },
          { label: "No", tone: "no", path: [finish("end-disp")] },
        ]),
      ],
    },
    { label: "Fallback", tone: "case", path: [finish("end-default")] },
  ]),
]

/** Every step, in reading order, numbered. */
export function flattenSteps(items: FlowItem[], out: FlowStep[] = []): FlowStep[] {
  for (const it of items) {
    if ("step" in it) out.push(it.step)
    else for (const b of it.split.branches) flattenSteps(b.path, out)
  }
  return out
}

export function allSplits(items: FlowItem[], out: string[] = []): string[] {
  for (const it of items) if ("split" in it) {
    out.push(it.split.id)
    for (const b of it.split.branches) allSplits(b.path, out)
  }
  return out
}

export const PHONE_CHECK_INFO = {
  name: "OS&D phone check",
  description: "For each shipment in the OS&D file, finds a good phone, then calls or texts the driver or dispatcher until someone answers.",
  published: "Published Nov 3 by Jordan Lee",
  lastRun: "Last run 9 min ago: 42 rows, took 1 min",
}
