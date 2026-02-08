import type { ReactNode } from "react"

import { Dancing_Script, Merriweather, Poppins } from "next/font/google"

import { ConnectTopNav } from "@/components/istanbulmedic-connect/ConnectTopNav"

const connectHeadingFont = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--im-font-heading",
  display: "swap",
})

const connectBodyFont = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--im-font-body",
  display: "swap",
})

const connectScriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--im-font-script",
  display: "swap",
})

export default function ConnectLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${connectHeadingFont.variable} ${connectBodyFont.variable} ${connectScriptFont.variable} imConnectTheme`}
    >
      <ConnectTopNav />
      <main style={{ marginTop: "var(--im-header-height, 80px)" }}>{children}</main>
    </div>
  )
}

