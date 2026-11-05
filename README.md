# Moneiva Minimal V2

The Minimal redesign, reworked after review feedback: the app runs two kinds of work at once, so both get a first-class home. All data is synthetic.

## What changed from Minimal

- **Two sides, one bar.** Today, Review and Teach are the daily work of agents learning from your team (email and voice). Agents and Workflows are where you build and watch the automation. Agents and Workflows are separate places, as the team asked.
- **Workflows can be big.** OS&D phone check is the team's real shape: 35 steps, branches, values carried between steps, a Zoom SMS step and calls through another agent. It gets Overview, Steps (a full canvas you can pan, zoom and fold), Runs and Values.
- **Monitoring by outcome.** Each run shows where its rows ended (waiting to call, waiting to text, completed, no good phones). Tap a row to light up the exact path it took on the canvas.
- **Agents and workflows know about each other.** A stopped agent shows on every workflow that calls it, and fixing the agent clears it everywhere. Each agent lists the workflows that use it.
- **Today shows both.** What the agents handled, what needs your OK, and how the workflows are doing.
- **Small stays small.** Short workflows keep Minimal's one page view and simple canvas.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Today: replies and calls to approve, things to fix, your agents and workflows |
| `/review` | Replies and calls to approve, one at a time |
| `/teach` | What the agents know and where it came from |
| `/teach/check` | New kinds of email and threads to check, one at a time |
| `/agents` | Every agent, its learning stage and the workflows that use it |
| `/agents/[id]` | One agent: op, phone, check, osd, cat |
| `/workflows` | Every workflow, grouped by Needs you, Running and Off |
| `/workflows/phonecheck` | OS&D phone check: Overview, Steps, Runs, Values |
| `/workflows/phonecheck/edit` | The full canvas: edit, add or delete steps, then Publish |
| `/workflows/[id]` | Smaller workflows: osd, late, missed, latepickup, kpi |
| `/activity` | Everything that happened |
| `/settings` | Account, with links to the management pages |

Old addresses (/automate, /inbox, /playbook, /training) redirect to the new ones.

## Run it

```bash
npm install
npm run dev
```
