"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import Container from "@/components/ui/container"
import Logo from "@/components/common/Logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { FEATURE_CONFIG } from "@/lib/filterConfig"

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Clinics", href: "/clinics" },
  // TODO: Re-enable when Design System should be public
  // { label: "Design System", href: "/design-system" },
] as const

const CONSULTATION_LINK = "https://cal.com/team/istanbul-medic/istanbul-medic-15-minutes-consultation"

export const TopNav = () => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const prefetchedRoutes = useRef<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

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
        <Logo variant="connect" onClick={() => setOpen(false)} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href

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

        {/* Desktop CTA - shrink-0 ensures both buttons stay visible */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <Button
            variant="teal-primary"
            href={CONSULTATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Book consultation"
            className="shrink-0"
          >
            Book Consultation
          </Button>
          <Button
            variant="leila-link"
            href="/leila"
            aria-label="Talk to Leila (AI Assistant)"
            className="shrink-0"
          >
            Talk to Leila
          </Button>
          {FEATURE_CONFIG.auth && (
            isAuthenticated ? (
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                aria-label="Log out"
                className="shrink-0"
              >
                Log out
              </Button>
            ) : (
              <Button
                variant="outline"
                href="/auth/login"
                aria-label="Login or sign up"
                className="shrink-0"
              >
                Login / Sign up
              </Button>
            )
          )}
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
                        const isActive = pathname === item.href

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "block rounded-2xl px-4 py-3 im-text-body-lg leading-6 transition-transform duration-200 transform origin-left",
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

                      <Button
                        variant="teal-primary"
                        href={CONSULTATION_LINK}
                        onClick={() => setOpen(false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full shadow-[0_12px_30px_rgba(62,187,183,0.35)]"
                      >
                        Book Consultation
                      </Button>
                      <Button
                        variant="leila-link"
                        href="/leila"
                        onClick={() => setOpen(false)}
                        className="w-full"
                      >
                        Talk to Leila
                      </Button>
                      {FEATURE_CONFIG.auth && (
                        isAuthenticated ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setOpen(false)
                              logout()
                            }}
                            className="w-full"
                          >
                            Log out
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            href="/auth/login"
                            onClick={() => setOpen(false)}
                            className="w-full"
                          >
                            Login / Sign up
                          </Button>
                        )
                      )}
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
