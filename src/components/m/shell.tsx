"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, CheckCircle2, GraduationCap, History, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import { AccountMenu } from "@/components/m/account-menu"
import { REVIEW_ITEMS } from "@/lib/minimal"
import { useDone } from "@/components/m/store"
import { ACTIVITY } from "@/lib/moneiva/activity-data"

/**
 * Four places. Today, Review and Teach are the daily work of the agents learning.
 * Automate is where agents and workflows are built and watched, as two views.
 */
const NAV = [
  { href: "/", label: "Today", icon: Sun, side: "work" },
  { href: "/review", label: "Review", icon: CheckCircle2, count: 0, side: "work" },
  { href: "/teach", label: "Teach", icon: GraduationCap, side: "work" },
  { href: "/agents", label: "Automate", icon: Bot, side: "build" },
]

function isActive(path: string, href: string) {
  // Automate holds two views: Agents and Workflows.
  if (href === "/agents") return ["/agents", "/workflows", "/automate"].some((h) => path === h || path.startsWith(h + "/"))
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/")
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const isDone = useDone()
  const left = REVIEW_ITEMS.filter((i) => !isDone(i.id)).length
  // A red dot only for work that couldn't finish and hasn't been looked at. "Needs you" already has its count on Review.
  const fails = isDone("seen-fails") ? 0 : ACTIVITY.filter((r) => r.status === "fail").length
  const nav = NAV.map((n) => (n.href === "/review" ? { ...n, count: left } : n))

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Moneiva home" className="shrink-0">
            <Image src="/moneiva-logo.png" alt="Moneiva" width={112} height={20} priority className="h-[18px] w-auto" />
          </Link>

          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-secondary/70 p-1 md:flex">
            {nav.map((n, i) => {
              const on = isActive(path, n.href)
              return (
                <span key={n.href} className="contents">
                {i > 0 && nav[i - 1].side !== n.side && <span aria-hidden className="mx-1.5 h-4 w-px bg-border" />}
                <Link
                  href={n.href}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                    on && "bg-card text-foreground shadow-sm"
                  )}
                >
                  {n.label}
                  {n.count ? (
                    <span className="grid size-[18px] place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {n.count}
                    </span>
                  ) : null}
                </Link>
                </span>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href={fails ? "/activity?filter=fail" : "/activity"}
              aria-label={fails ? `Activity: ${fails} couldn't finish` : "Activity"}
              title={fails ? `${fails} couldn't finish` : "Activity: everything that happened"}
              className={cn(
                "relative grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
                isActive(path, "/activity") && "bg-secondary text-foreground"
              )}
            >
              <History className="size-[18px]" />
              {fails > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-destructive ring-2 ring-background" />}
            </Link>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-28 sm:px-6 sm:pt-12 md:pb-20">{children}</main>

      {/* Phone: a tab bar, like a native app. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {nav.map((n) => {
            const on = isActive(path, n.href)
            const Icon = n.icon
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn("relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground", on && "text-primary")}
              >
                <Icon className="size-[22px]" strokeWidth={on ? 2.2 : 1.8} />
                {n.label}
                {n.count ? (
                  <span className="absolute top-1 left-1/2 ml-2 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                    {n.count}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
