import { HomeTemplate } from "@/components/templates/HomeTemplate"
import HeroBanner from "@/components/landing/HeroBanner"
import SafeAffordableSection from "@/components/landing/SafeAffordableSection"
import HowItWorksSection from "@/components/landing/HowItWorksSection"

export default function Home() {
  return (
    <HomeTemplate
      hero={<HeroBanner />}
      safeAffordable={<SafeAffordableSection />}
      howItWorks={<HowItWorksSection />}
      className="min-h-screen bg-white"
    />
  )
}
