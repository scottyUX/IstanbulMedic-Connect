import { createClient } from '@/lib/supabase/server'
import ImageManager from './ImageManager'

export const dynamic = 'force-dynamic'

export default async function AdminImagesPage() {
  const supabase = await createClient()

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, display_name, clinic_media(id, url, is_primary, display_order, media_type)')
    .eq('status', 'active')
    .order('display_name', { ascending: true })

  const clinicsWithImages = (clinics ?? [])
    .map((c) => ({
      id: c.id,
      name: c.display_name,
      media: (c.clinic_media as { id: string; url: string; is_primary: boolean | null; display_order: number | null; media_type: string }[])
        .filter((m) => m.media_type === 'image')
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return (a.display_order ?? 0) - (b.display_order ?? 0)
        }),
    }))
    .filter((c) => c.media.length > 0)

  return <ImageManager clinics={clinicsWithImages} />
}
