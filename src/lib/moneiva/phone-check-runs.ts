// OS&D phone check: runs, where rows ended, and the values it keeps. All synthetic.

export type Ending = { label: string; sub: string; count: number; tone: "ok" | "warn" | "bad" | "off"; step?: string }

/** One OS&D file = one run. Each row in the file is one shipment. */
export type PhoneRun = {
  id: string
  started: string
  file: string
  rows: number
  took: string
  result: string
  tone: "ok" | "warn" | "bad"
  endings: Ending[]
  sample: { pro: string; who: string; path: string; ended: string; tone: "ok" | "warn" | "bad" | "off"; route: Record<string, number> }[]
}

const SAMPLE_WAITING: PhoneRun["sample"] = [
  { pro: "0300100412", who: "Both phones good", path: "Tried 1 time, so call the driver", ended: "Waiting to call. OS&D check calls is stopped.", tone: "warn", route: { phones: 0, "phones-a": 0, which: 0, tries: 0 } },
  { pro: "0300100419", who: "Driver phone good", path: "Tried 3 times, so text the driver", ended: "Waiting to text. No Zoom connection.", tone: "warn", route: { phones: 0, "phones-a": 1, which: 1, "tries-driver": 1 } },
  { pro: "0300100427", who: "No good phones", path: "Nothing to call", ended: "Completed: no good phones to call", tone: "off", route: { phones: 1, "phones-b": 1 } },
  { pro: "0300100433", who: "Dispatcher phone good", path: "Tried 2 times, so call the dispatcher", ended: "Waiting to call. OS&D check calls is stopped.", tone: "warn", route: { phones: 1, "phones-b": 0, which: 2, "tries-disp": 0 } },
  { pro: "0300100440", who: "Both phones good", path: "Tried 5 times", ended: "Completed after every try", tone: "ok", route: { phones: 0, "phones-a": 0, which: 0, tries: 1, third: 1, fourth: 1 } },
  { pro: "0300100448", who: "Both phones good", path: "4th try, so text both", ended: "Waiting to text. No Zoom connection.", tone: "warn", route: { phones: 0, "phones-a": 0, which: 0, tries: 1, third: 1, fourth: 0 } },
]

const SAMPLE_DONE: PhoneRun["sample"] = [
  { pro: "0300100301", who: "Both phones good", path: "Tried 1 time, so call the driver", ended: "Driver answered. Delivery confirmed.", tone: "ok", route: { phones: 0, "phones-a": 0, which: 0, tries: 0 } },
  { pro: "0300100307", who: "Driver phone good", path: "Tried 2 times, so call the driver", ended: "Left a voicemail. Tries again next file.", tone: "ok", route: { phones: 0, "phones-a": 1, which: 1, "tries-driver": 0 } },
  { pro: "0300100315", who: "Both phones good", path: "3rd try, so call the dispatcher", ended: "Dispatcher answered. 2 pieces short.", tone: "ok", route: { phones: 0, "phones-a": 0, which: 0, tries: 1, third: 0 } },
  { pro: "0300100322", who: "No good phones", path: "Nothing to call", ended: "Completed: no good phones to call", tone: "off", route: { phones: 1, "phones-b": 1 } },
]

export const PHONE_RUNS: PhoneRun[] = [
  {
    id: "r1",
    started: "Today, 2:51 PM",
    file: "osd_2026-10-13_1450.csv",
    rows: 42,
    took: "1 min",
    result: "29 rows waiting",
    tone: "warn",
    endings: [
      { label: "Waiting to call", sub: "OS&D check calls is stopped. These rows call as soon as it is fixed.", count: 24, tone: "warn", step: "call-both-driver" },
      { label: "Waiting to text", sub: "The Zoom connection was removed. Nothing was sent.", count: 5, tone: "warn", step: "text-both" },
      { label: "Completed after every try", sub: "Called and texted the most times allowed", count: 9, tone: "ok", step: "end-both" },
      { label: "No good phones", sub: "Neither number could be called", count: 4, tone: "off", step: "end-none" },
    ],
    sample: SAMPLE_WAITING,
  },
  {
    id: "r2",
    started: "Today, 11:50 AM",
    file: "osd_2026-10-13_1150.csv",
    rows: 38,
    took: "26 min",
    result: "Done",
    tone: "ok",
    endings: [
      { label: "Called the driver", sub: "OS&D check calls reached or left a voicemail", count: 19, tone: "ok", step: "call-both-driver" },
      { label: "Called the dispatcher", sub: "After 2 tries with the driver", count: 8, tone: "ok", step: "call-both-disp" },
      { label: "Texted", sub: "Asked them to call the OS&D desk back", count: 4, tone: "ok", step: "text-both" },
      { label: "Completed after every try", sub: "", count: 4, tone: "ok", step: "end-both" },
      { label: "No good phones", sub: "", count: 3, tone: "off", step: "end-none" },
    ],
    sample: SAMPLE_DONE,
  },
  {
    id: "r3",
    started: "Today, 8:50 AM",
    file: "osd_2026-10-13_0850.csv",
    rows: 40,
    took: "31 min",
    result: "Done",
    tone: "ok",
    endings: [
      { label: "Called the driver", sub: "", count: 22, tone: "ok", step: "call-both-driver" },
      { label: "Called the dispatcher", sub: "", count: 9, tone: "ok", step: "call-both-disp" },
      { label: "Texted", sub: "", count: 3, tone: "ok", step: "text-both" },
      { label: "Completed after every try", sub: "", count: 4, tone: "ok", step: "end-both" },
      { label: "No good phones", sub: "", count: 2, tone: "off", step: "end-none" },
    ],
    sample: SAMPLE_DONE,
  },
  {
    id: "r4",
    started: "Yesterday, 2:50 PM",
    file: "osd_2026-10-12_1450.csv",
    rows: 35,
    took: "24 min",
    result: "Done",
    tone: "ok",
    endings: [
      { label: "Called the driver", sub: "", count: 18, tone: "ok" },
      { label: "Called the dispatcher", sub: "", count: 7, tone: "ok" },
      { label: "Texted", sub: "", count: 5, tone: "ok" },
      { label: "Completed after every try", sub: "", count: 3, tone: "ok" },
      { label: "No good phones", sub: "", count: 2, tone: "off" },
    ],
    sample: SAMPLE_DONE,
  },
]

/** The values a row carries from step to step. Steps that set or read them are found from the steps themselves. */
export type Variable = { name: string; plain: string; from: "file" | "record" | "workflow"; example: string }
export const VARIABLES: Variable[] = [
  { name: "phone_switch", plain: "Which phones are good", from: "workflow", example: "both, driver or dispatcher" },
  { name: "call_phone", plain: "Who to call next", from: "workflow", example: "driver or dispatcher" },
  { name: "attempts", plain: "Tries so far, both phones", from: "record", example: "3" },
  { name: "attempts_driver", plain: "Tries so far, driver", from: "record", example: "1" },
  { name: "attempts_dispatcher", plain: "Tries so far, dispatcher", from: "record", example: "0" },
  { name: "driver_phone", plain: "Driver's phone", from: "file", example: "(555) 010-0412" },
  { name: "dispatcher_phone", plain: "Dispatcher's phone", from: "file", example: "(555) 010-0498" },
  { name: "load_number", plain: "Load number", from: "file", example: "L-58201" },
]

export const VARIABLE_FROM = {
  file: "From each row of the OS&D file",
  record: "From the shipment record",
  workflow: "Set by this workflow",
} as const
