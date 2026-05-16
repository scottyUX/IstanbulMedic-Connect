import { NextRequest, NextResponse } from 'next/server'
import { getClinics } from '@/lib/api/clinics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') ?? undefined
    const pageSize = Math.min(Number(searchParams.get('pageSize') ?? '6'), 20)

    const result = await getClinics({
      searchQuery: search,
      pageSize,
      page: 1,
    })

    return NextResponse.json({
      success: true,
      data: result.clinics.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        image: c.image,
      })),
      total: result.total,
    })
  } catch (error) {
    console.error('GET /api/clinics error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch clinics' }, { status: 500 })
  }
}
