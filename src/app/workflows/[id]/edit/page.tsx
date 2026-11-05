import { Suspense } from "react"
import { notFound } from "next/navigation"

import { PhoneCheckEditor } from "@/components/m/phone-check-editor"
import { WorkflowCanvas } from "@/components/m/workflow-canvas"
import { WORKFLOWS, workflowById } from "@/lib/minimal"

export function generateStaticParams() {
  return WORKFLOWS.map((w) => ({ id: w.id }))
}

async function Content({ params }: PageProps<"/workflows/[id]/edit">) {
  const { id } = await params
  const w = workflowById(id)
  if (!w) notFound()
  return w.id === "phonecheck" ? <PhoneCheckEditor w={w} /> : <WorkflowCanvas w={w} />
}

export default function WorkflowEditPage(props: PageProps<"/workflows/[id]/edit">) {
  return (
    <Suspense>
      <Content {...props} />
    </Suspense>
  )
}
