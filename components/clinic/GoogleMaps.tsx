"use client"

import { MapPin } from "lucide-react"

interface GoogleMapsProps {
    lat: number
    lng: number
    address: string
    clinicName?: string
}

export const GoogleMaps = ({ lat, lng, address, clinicName }: GoogleMapsProps) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    return (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📍</span>
                Location
            </h3>
            <div className="space-y-4">
                <p className="text-muted-foreground">{address}</p>

                {/* Istanbul Map */}
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden relative flex flex-col items-center justify-center p-4">
                    {apiKey ? (
                        <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`}
                            alt={`${clinicName || "Clinic"} Map`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = "none"
                                const parent = e.currentTarget.parentElement
                                if (parent) {
                                    parent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full p-4">
                      <div class="text-6xl mb-4">🏙️</div>
                      <p class="text-muted-foreground text-center mb-2 font-medium">Istanbul, Turkiye</p>
                      <p class="text-muted-foreground/70 text-center text-sm">${address}</p>
                      <div class="text-xs text-muted-foreground/50 text-center mt-2">Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                    </div>
                  `
                                }
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <div className="text-6xl mb-4">🏙️</div>
                            <p className="text-muted-foreground mb-2 font-medium">Istanbul, Turkiye</p>
                            <p className="text-muted-foreground/70 text-sm">{address}</p>
                            <div className="text-xs text-muted-foreground/50 mt-2">
                                Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                            </div>
                            <p className="text-xs text-muted-foreground/50 mt-2">
                                Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map image
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                        title="View on Google Maps"
                        aria-label="View on Google Maps"
                    >
                        <MapPin className="h-5 w-5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
