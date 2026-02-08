import { ShieldCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SummarySidebarProps {
  transparencyScore: number
  topSpecialties: string[]
  rating: number
  reviewCount: number
}

export const SummarySidebar = ({ transparencyScore, topSpecialties, rating, reviewCount }: SummarySidebarProps) => {
  return (
    <div className="sticky top-24">
      <Card className="p-6 border border-neutral-200 rounded-xl shadow-none">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-2xl font-bold">$1,200</span>
            <span className="text-muted-foreground text-sm ml-1">est. starting</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold underline">
            <Star className="h-3 w-3 fill-foreground" />
            {rating.toFixed(2)} · {reviewCount} reviews
          </div>
        </div>

        <div className="grid gap-3">
          <Button size="lg" className="w-full bg-[#E51D53] hover:bg-[#D41B4D] font-semibold text-lg py-6">
            Book Consultation
          </Button>
          <div className="text-center text-xs text-muted-foreground mt-2 mb-4">
            Free cancellation up to 48h before
          </div>

          <div className="flex justify-between items-center px-4 py-3 border rounded-lg hover:border-black cursor-pointer bg-neutral-50 hover:bg-white transition-colors">
            <span className="font-medium text-sm">Talk to Leila</span>
            <Badge variant="secondary" className="bg-black text-white hover:bg-neutral-800 text-[10px]">AI Assistant</Badge>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span className="underline">Consultation fee</span>
            <span>$0</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span className="underline">Service charge</span>
            <span>$0</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground mt-4 pt-4 border-t">
            <span>Total (estimate)</span>
            <span>$1,200</span>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>Verified by Istanbul Medic</span>
      </div>
    </div>
  )
}

