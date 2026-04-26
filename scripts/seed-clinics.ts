import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CLINICS = [
  { name: "Dr Serkan Aygın Hair Transplant Clinic", place_id: "ChIJ46c0kwG3yhQRxYnQckUyqPg" },
  { name: "Vera Clinic", place_id: "ChIJEX82kp7GyhQRNnmeBwH1MMQ" },
  { name: "Cosmedica Hair Transplantation Clinic", place_id: "ChIJKdpnq1O7yhQRx2ShopMPSfA" },
  { name: "NIMCLINIC", place_id: "ChIJzwK4DbK3yhQRH3NsFk7tI0Y" },
  { name: "Smile Hair Clinic", place_id: "ChIJZYs6o7LIyhQR-sGxFoifWLw" },
  { name: "HLC Clinic", place_id: "ChIJf6HkXpFP0xQRwyW_ZhsKJ68" },
  { name: "ASMED Medical Center", place_id: "ChIJq6YwlDzGyhQR9Vsz_MQqCxU" },
  { name: "Özel PHR Polikliniği", place_id: "ChIJjRKPz-lP0xQRwzwlCbdlgSs" },
  { name: "Hermest Hair Clinic", place_id: "ChIJ12WcZ_e3yhQRnsEKjsPkqQI" },
  { name: "Dr. Cinik Clinic", place_id: "ChIJ7R706h63yhQRsmvIUI3HUaY" },
  { name: "AHD Clinic", place_id: "ChIJMe9xLEWbwxQRQW1rY53Bwb0" },
  { name: "Clinicana", place_id: "ChIJN5fbNG-3yhQRDH2pvYVRt90" },
  { name: "Dr. Resul Yaman Hair Clinic", place_id: "ChIJnVSODoGlyhQRKzH3wZ7mjVI" },
  { name: "Estetik International", place_id: "ChIJM1eSB0zGyhQRts3ii7oU6pY" },
  { name: "Sapphire Hair Transplant Clinic", place_id: "ChIJnaqISme3yhQRasjRHVX0UGQ" },
  { name: "Este Favor", place_id: "ChIJj8IQRde7yhQRvz2UIHwZ3a0" },
  { name: "SULE CLINIC", place_id: "ChIJuQbq64ewyhQRSEKVkD785Vk" },
  { name: "HEVA CLINIC", place_id: "ChIJHzttL5G3yhQRUBzIrlPs5X8" },
  { name: "Lenus Clinic", place_id: "ChIJFaFcZQ3HyhQR1jBlLct5yUA" },
  { name: "Dr. Servet Terziler", place_id: "ChIJXReAXDq7yhQRCeDIVE7ENAk" },
  { name: "AEK Hair Clinic", place_id: "ChIJacWZiA_GyhQRU7LUboOIkLo" },
  { name: "Memorial Şişli Hastanesi", place_id: "ChIJz6nRJSO3yhQRNrNDK8063a0" },
  { name: "Este Medical", place_id: "ChIJSwrv5JW3yhQRmzvMUTBhg-w" },
  { name: "EsteNove", place_id: "ChIJ82ROLbS3yhQRrsYUOPFXwfo" },
  { name: "Doku Clinic", place_id: "ChIJobQQ-wK3yhQRzULSi_kfisE" },
  { name: "Esthetic Hair Turkey", place_id: "ChIJwQFp5oewyhQRsDOAVsry82E" },
  { name: "Longevita", place_id: "ChIJY-PxTLQbdkgRo__pU5Sv54w" },
]

async function main() {
  console.log('Seeding clinics table...\n')

  for (const clinic of CLINICS) {
    // Check if clinic already exists by place_id
    const { data: existing } = await supabase
      .from('clinic_google_places')
      .select('clinic_id')
      .eq('place_id', clinic.place_id)
      .single()

    if (existing) {
      console.log(`⚠ Skipping ${clinic.name} (already exists)`)
      continue
    }

    // Insert clinic
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        display_name: clinic.name,
        status: 'active',
        primary_city: 'Istanbul',
        primary_country: 'Turkey',
      })
      .select('id')
      .single()

    if (error) {
      console.error(`✗ Failed to insert ${clinic.name}:`, error.message)
      continue
    }

    // Store place_id in clinic_google_places
    const { error: gpError } = await supabase
      .from('clinic_google_places')
      .insert({
        clinic_id: data.id,
        place_id: clinic.place_id,
      })

    if (gpError) {
      console.warn(`  ⚠ Inserted clinic but failed to store place_id:`, gpError.message)
    } else {
      console.log(`✓ ${clinic.name} (${data.id})`)
    }
  }

  console.log('\nDone! Check your clinics table in Supabase.')
}

main().catch(console.error)