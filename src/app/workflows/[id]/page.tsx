import { Suspense } from "react"
import { notFound } from "next/navigation"

import { PhoneCheck } from "@/components/m/phone-check"
import { WorkflowDetail } from "@/components/m/workflow-detail"
import { WORKFLOWS, workflowById } from "@/lib/minimal"

export function generateStaticParams() {
  return WORKFLOWS.map((w) => ({ id: w.id }))
}

async function Content({ params }: PageProps<"/workflows/[id]">) {
  const { id } = await params
  const w = workflowById(id)
  if (!w) notFound()
  // Big branching workflows get the full view: overview, every step, runs and values.
  return w.id === "phonecheck" ? <PhoneCheck w={w} /> : <WorkflowDetail w={w} />
}

export default function WorkflowPage(props: PageProps<"/workflows/[id]">) {
  return (
    <Suspense>
      <Content {...props} />
    </Suspense>
  )
}
