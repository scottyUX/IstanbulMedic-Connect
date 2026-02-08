"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import Container from "@/components/ui/container"
import Logo from "@/components/istanbulmedic-connect/Logo"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "How It Works", href: "/connect#how-it-works" },
  { label: "Treatments", href: "/connect#treatments" },
  { label: "Clinics", href: "/connect" },
] as const

const CONSULTATION_LINK = "https://cal.com/team/istanbul-medic/istanbul-medic-15-minutes-consultation"

export const ConnectTopNav = () => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const prefetchedRoutes = useRef<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const el = panelRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  const prefetchRoute = useCallback(
    (href: string) => {
      if (href.startsWith("http")) return
      if (typeof router.prefetch !== "function") return
      if (prefetchedRoutes.current.has(href)) return
      prefetchedRoutes.current.add(href)

      try {
        const maybePromise = router.prefetch(href) as unknown
        if (maybePromise instanceof Promise) {
          maybePromise.catch(() => { })
        }
      } catch {
        prefetchedRoutes.current.delete(href)
      }
    },
    [router]
  )

  const navItems = useMemo(() => NAV_ITEMS, [])

  useEffect(() => {
    if (!navItems.length || typeof window === "undefined") return

    const timeouts: number[] = []
    const schedulePrefetch = () => {
      navItems.forEach((item, index) => {
        const timeoutId = window.setTimeout(() => prefetchRoute(item.href), index * 80)
        timeouts.push(timeoutId)
      })
    }

    let idleId: number | null = null
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => schedulePrefetch(), { timeout: 1500 })
    } else {
      schedulePrefetch()
    }

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [navItems, prefetchRoute])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const setHeaderHeight = () => {
      const height = el.offsetHeight || 80
      document.documentElement.style.setProperty("--header-height", `${height}px`)
    }

    setHeaderHeight()

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(setHeaderHeight) : null
    resizeObserver?.observe(el)
    window.addEventListener("resize", setHeaderHeight)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener("resize", setHeaderHeight)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-[70] flex h-[80px] items-center bg-white"
    >
      <Container className="flex h-full items-center justify-between gap-6">
        {/* Logo */}
        <Logo onClick={() => setOpen(false)} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/connect" && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102544] transform origin-center",
                  isActive
                    ? "scale-105 font-extrabold text-[#0D1E32]"
                    : "font-semibold text-slate-600 hover:text-[#0D1E32]"
                )}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href={CONSULTATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Book consultation"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFD700] px-5 py-2 text-center text-sm font-semibold text-black transition hover:bg-[#D4B200] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4B200]"
          >
            Book Consultation
          </a>
          <Link
            href="/leila"
            className="inline-flex items-center gap-2 rounded-full border border-[#17375B] bg-transparent px-5 py-2 text-center text-sm font-semibold text-[#17375B] transition hover:bg-[#FFF9E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17375B]"
            aria-label="Talk to Leila (AI Assistant)"
          >
            Talk to Leila
          </Link>
        </div>

        {/* Mobile toggle + panel */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="relative">
            <button
              type="button"
              aria-label="Toggle menu"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
              className="relative z-[51] -mr-1 grid h-10 w-10 place-items-center rounded-md active:scale-95"
            >
              <Menu />
            </button>

            <AnimatePresence>
              {open && (
                <>
                  {/* backdrop */}
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-black/10 md:hidden"
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />

                  {/* panel */}
                  <motion.div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    className="absolute -right-3 z-50 mt-3 w-[calc(100vw-2rem)] max-w-xs rounded-[8px] border border-black/5 bg-white px-5 py-5 shadow-[0px_5px_5px_-3px_#00000033,0px_8px_10px_1px_#00000024,0px_3px_14px_2px_#0000001F]"
                    initial={{ opacity: 0, y: -12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <nav className="space-y-6">
                      {navItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (item.href !== "/connect" && pathname?.startsWith(item.href))

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "block rounded-2xl px-4 py-3 text-[18px] leading-6 tracking-tight transition-transform duration-200 transform origin-left",
                              isActive
                                ? "scale-[1.03] font-extrabold text-[#0D1E32]"
                                : "font-semibold text-[#0F2446] hover:text-[#0D1E32]"
                            )}
                            onClick={() => setOpen(false)}
                            onMouseEnter={() => prefetchRoute(item.href)}
                            onFocus={() => prefetchRoute(item.href)}
                          >
                            {item.label}
                          </Link>
                        )
                      })}

                      <a
                        href={CONSULTATION_LINK}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFD700] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(255,215,0,0.35)] transition hover:bg-[#D4B200]"
                        onClick={() => setOpen(false)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Book Consultation
                      </a>
                      <Link
                        href="/leila"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#17375B] bg-transparent px-5 py-3 text-sm font-semibold text-[#17375B] transition hover:bg-[#FFF9E5]"
                        onClick={() => setOpen(false)}
                      >
                        Talk to Leila
                      </Link>
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </header>
  )
}

