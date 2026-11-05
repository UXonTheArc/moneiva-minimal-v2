import { Suspense } from "react"
import { redirect } from "next/navigation"

// Old address from Minimal v1, where agents and workflows shared one place.
async function Go({ searchParams }: PageProps<"/automate">) {
  const { view } = await searchParams
  redirect(view === "workflows" ? "/workflows" : "/agents")
  return null
}

export default function Page(props: PageProps<"/automate">) {
  return (
    <Suspense>
      <Go {...props} />
    </Suspense>
  )
}
