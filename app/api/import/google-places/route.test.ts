import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Constants,
  type TablesInsert,
  type TablesUpdate
} from '../../../../lib/supabase/database.types'

const mockDb = vi.hoisted(() => {
  type Operation = {
    table: string
    op: 'insert' | 'update' | 'delete' | 'upsert' | 'select' | null
    payload?: unknown
    options?: unknown
    selectColumns?: unknown
    filters: Array<{ type: 'eq'; column: string; value: unknown }>
    orderBy?: { column: string; options?: unknown }
    limitValue?: number
    expectSingle?: boolean
  }

  const operations: Operation[] = []
  const queues = new Map<string, unknown[]>()

  const keyFor = (table: string, op: string) => `${table}:${op}`

  const normalizeResult = (
    result: unknown,
    operation: Operation
  ): Promise<unknown> => {
    if (typeof result === 'function') {
      return Promise.resolve((result as (op: Operation) => unknown)(operation))
    }

    if (result instanceof Error) {
      return Promise.reject(result)
    }

    return Promise.resolve(result ?? { data: null, error: null })
  }

  const takeResult = (operation: Operation) => {
    const queue = queues.get(keyFor(operation.table, operation.op || 'select'))
    const next = queue?.length ? queue.shift() : undefined
    return normalizeResult(next, operation)
  }

  const buildQuery = (table: string) => {
    const operation: Operation = {
      table,
      op: null,
      filters: []
    }

    operations.push(operation)

    let execution: Promise<unknown> | null = null
    const execute = () => {
      if (!execution) {
        execution = takeResult(operation)
      }
      return execution
    }

    const builder: any = {
      insert(payload: unknown, options?: unknown) {
        operation.op = 'insert'
        operation.payload = payload
        operation.options = options
        return builder
      },
      update(payload: unknown) {
        operation.op = 'update'
        operation.payload = payload
        return builder
      },
      delete() {
        operation.op = 'delete'
        return builder
      },
      upsert(payload: unknown, options?: unknown) {
        operation.op = 'upsert'
        operation.payload = payload
        operation.options = options
        return builder
      },
      select(columns?: unknown) {
        if (!operation.op) {
          operation.op = 'select'
        }
        operation.selectColumns = columns
        return builder
      },
      eq(column: string, value: unknown) {
        operation.filters.push({ type: 'eq', column, value })
        return builder
      },
      order(column: string, options?: unknown) {
        operation.orderBy = { column, options }
        return builder
      },
      limit(value: number) {
        operation.limitValue = value
        return builder
      },
      single() {
        operation.expectSingle = true
        return execute()
      },
      then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return execute().then(onFulfilled, onRejected)
      },
      catch(onRejected?: (reason: unknown) => unknown) {
        return execute().catch(onRejected)
      },
      finally(onFinally?: () => void) {
        return execute().finally(onFinally)
      }
    }

    return builder
  }

  return {
    client: {
      from: vi.fn((table: string) => buildQuery(table))
    },
    operations,
    reset() {
      operations.length = 0
      queues.clear()
      this.client.from.mockClear()
    },
    queue(table: string, op: string, ...results: unknown[]) {
      const key = keyFor(table, op)
      const existing = queues.get(key) || []
      existing.push(...results)
      queues.set(key, existing)
    }
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockDb.client)
}))

import { POST as bulkPOST } from './bulk/route'
import { POST as singlePOST } from './route'

process.env.NEXT_PUBLIC_APP_URL = 'http://app.local'
process.env.GOOGLE_PLACES_API_KEY = 'test-api-key'

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

const fullGooglePlacesData = {
  google_places: {
    place_id: 'place-123',
    display_name: 'Istanbul Medic Center',
    formatted_address: '123 Bagdat Ave, Istanbul, Turkey',
    rating: 4.8,
    user_ratings_total: 210,
    website: 'https://istanbulmedic.example',
    phone: '+90 212 111 1111',
    international_phone: '+90 212 222 2222',
    location: {
      lat: 41.0082,
      lng: 28.9784
    },
    address_components: [
      { long_name: 'Kadikoy', types: ['locality'] },
      { long_name: 'Istanbul', types: ['administrative_area_level_1'] },
      { long_name: 'Turkey', types: ['country'] },
      { long_name: '34710', types: ['postal_code'] }
    ],
    opening_hours: {
      weekday_text: ['Monday: 9:00 AM - 6:00 PM']
    },
    photos: [
      { photo_reference: 'photo-1' },
      { photo_reference: 'photo-2' },
      { photo_reference: 'photo-3' },
      { photo_reference: 'photo-4' },
      { photo_reference: 'photo-5' },
      { photo_reference: 'photo-6' }
    ],
    reviews: [
      {
        rating: 5,
        text: 'Excellent care',
        time: 1733270400,
        language: 'en'
      },
      {
        rating: 4,
        text: 'Helpful staff',
        time: 1733356800,
        language: 'tr'
      }
    ],
    types: ['hospital', 'health']
  },
  extracted_claims: {
    identity: {
      legal_name: 'Istanbul Medic Group'
    },
    contact: {
      website_candidates: ['https://fallback.example'],
      email_candidates: ['info@istanbulmedic.example'],
      phone_candidates: ['+90 212 333 3333'],
      whatsapp_candidates: ['+90 555 000 0000']
    },
    services: {
      claimed: ['Hair transplant', 'Rhinoplasty', 'Dental implants']
    },
    location: {
      city: 'Besiktas',
      country: 'Turkey',
      postal_code: '34353'
    }
  }
}

const minimalGooglePlacesData = {
  google_places: {
    place_id: 'place-456',
    display_name: 'Minimal Clinic',
    formatted_address: 'No Website Street, Istanbul',
    rating: 4.3,
    user_ratings_total: 12,
    location: {
      lat: 41.01,
      lng: 28.95
    },
    address_components: [
      { long_name: 'Umraniye', types: ['locality'] },
      { long_name: 'Istanbul', types: ['administrative_area_level_1'] },
      { long_name: 'Turkey', types: ['country'] }
    ],
    types: ['clinic']
  },
  extracted_claims: {}
}

function makeSingleRequest(body: object | string) {
  return new Request('http://localhost/api/import/google-places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  })
}

function makeBulkRequest(body: object | string) {
  return new Request('http://localhost/api/import/google-places/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  })
}

function getOperations(table: string, op: string) {
  return mockDb.operations.filter(
    (operation) => operation.table === table && operation.op === op
  )
}

const sourceInsertKeys = [
  'source_type',
  'source_name',
  'url',
  'captured_at',
  'content_hash'
] as const satisfies ReadonlyArray<keyof TablesInsert<'sources'>>

const clinicUpdateKeys = [
  'display_name',
  'legal_name',
  'status',
  'primary_city',
  'primary_country',
  'website_url',
  'whatsapp_contact',
  'email_contact',
  'phone_contact',
  'thumbnail_url',
  'updated_at'
] as const satisfies ReadonlyArray<keyof TablesUpdate<'clinics'>>

const clinicLocationInsertKeys = [
  'clinic_id',
  'location_name',
  'address_line',
  'city',
  'country',
  'postal_code',
  'latitude',
  'longitude',
  'is_primary'
] as const satisfies ReadonlyArray<keyof TablesInsert<'clinic_locations'>>

const clinicServiceInsertKeys = [
  'clinic_id',
  'service_category',
  'service_name',
  'is_primary_service'
] as const satisfies ReadonlyArray<keyof TablesInsert<'clinic_services'>>

const clinicFactUpsertKeys = [
  'clinic_id',
  'fact_key',
  'fact_value',
  'value_type',
  'confidence',
  'computed_by',
  'first_seen_at',
  'last_seen_at',
  'is_conflicting'
] as const satisfies ReadonlyArray<keyof TablesInsert<'clinic_facts'>>

const clinicReviewInsertKeys = [
  'clinic_id',
  'source_id',
  'rating',
  'review_text',
  'review_date',
  'language'
] as const satisfies ReadonlyArray<keyof TablesInsert<'clinic_reviews'>>

const clinicMediaInsertKeys = [
  'clinic_id',
  'media_type',
  'url',
  'is_primary',
  'source_id',
  'display_order'
] as const satisfies ReadonlyArray<keyof TablesInsert<'clinic_media'>>

const sourceDocumentInsertKeys = [
  'source_id',
  'doc_type',
  'title',
  'raw_text',
  'language',
  'published_at'
] as const satisfies ReadonlyArray<keyof TablesInsert<'source_documents'>>

const factEvidenceInsertKeys = [
  'clinic_fact_id',
  'source_document_id',
  'evidence_snippet'
] as const satisfies ReadonlyArray<keyof TablesInsert<'fact_evidence'>>

function expectExactKeys(
  payload: Record<string, unknown>,
  expectedKeys: readonly string[]
) {
  expect(Object.keys(payload).sort()).toEqual([...expectedKeys].sort())
}

function expectKeysOnEach(
  payloads: Array<Record<string, unknown>>,
  expectedKeys: readonly string[]
) {
  payloads.forEach((payload) => expectExactKeys(payload, expectedKeys))
}

function seedSuccessfulSingleImport(options?: {
  factCount?: number
  withEvidenceDocument?: boolean
}) {
  const factCount = options?.factCount ?? 4

  mockDb.queue('sources', 'insert', {
    data: { id: 'source-1' },
    error: null
  })
  mockDb.queue('clinics', 'update', {
    error: null
  })
  mockDb.queue('clinic_locations', 'delete', {
    error: null
  })
  mockDb.queue('clinic_locations', 'insert', {
    error: null
  })
  mockDb.queue('clinic_services', 'delete', {
    error: null
  })
  mockDb.queue('clinic_services', 'insert', {
    error: null
  })

  for (let index = 0; index < factCount; index += 1) {
    mockDb.queue('clinic_facts', 'upsert', {
      data: { id: `fact-${index + 1}` },
      error: null
    })
    mockDb.queue('source_documents', 'select', {
      data: options?.withEvidenceDocument ? { id: `doc-existing-${index + 1}` } : null,
      error: null
    })
  }

  if (options?.withEvidenceDocument) {
    for (let index = 0; index < factCount; index += 1) {
      mockDb.queue('fact_evidence', 'insert', {
        error: null
      })
    }
  }

  mockDb.queue('clinic_reviews', 'insert', {
    error: null
  })
  mockDb.queue('clinic_media', 'insert', {
    error: null
  })
  mockDb.queue('source_documents', 'insert', {
    error: null
  })
}

beforeEach(() => {
  mockDb.reset()
  consoleErrorSpy.mockClear()
  consoleLogSpy.mockClear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

afterAll(() => {
  consoleErrorSpy.mockRestore()
  consoleLogSpy.mockRestore()
})

describe('POST /api/import/google-places', () => {
  describe('request validation', () => {
    it('returns 400 when clinicId is missing', async () => {
      const response = await singlePOST(
        makeSingleRequest({ googlePlacesData: fullGooglePlacesData })
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: 'Missing required fields: clinicId and googlePlacesData'
      })
    })

    it('returns 400 when google_places payload is missing', async () => {
      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: { extracted_claims: {} }
        })
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: 'Missing required fields: clinicId and googlePlacesData'
      })
    })
  })

  describe('successful import', () => {
    it('imports a full payload and writes the expected database records', async () => {
      seedSuccessfulSingleImport()

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        success: true,
        clinic_id: 'clinic-123',
        source_id: 'source-1',
        place_id: 'place-123',
        display_name: 'Istanbul Medic Center'
      })

      const sourceInsert = getOperations('sources', 'insert')[0]
      expectExactKeys(sourceInsert.payload as Record<string, unknown>, sourceInsertKeys)
      expect(sourceInsert.payload).toMatchObject({
        source_type: 'registry',
        source_name: 'google_places',
        url: 'https://istanbulmedic.example'
      })
      expect(Constants.public.Enums.source_type_enum).toContain(
        (sourceInsert.payload as any).source_type
      )
      expect((sourceInsert.payload as any).content_hash).toMatch(/^[a-f0-9]{64}$/)
      expect((sourceInsert.payload as any).captured_at).toEqual(expect.any(String))

      const clinicUpdate = getOperations('clinics', 'update')[0]
      expect(clinicUpdate.filters).toEqual([
        { type: 'eq', column: 'id', value: 'clinic-123' }
      ])
      expectExactKeys(clinicUpdate.payload as Record<string, unknown>, clinicUpdateKeys)
      expect(clinicUpdate.payload).toMatchObject({
        display_name: 'Istanbul Medic Center',
        legal_name: 'Istanbul Medic Group',
        status: 'active',
        primary_city: 'Besiktas',
        primary_country: 'Turkey',
        website_url: 'https://istanbulmedic.example',
        whatsapp_contact: '+90 555 000 0000',
        email_contact: 'info@istanbulmedic.example',
        phone_contact: '+90 212 222 2222'
      })
      expect(Constants.public.Enums.clinic_status).toContain(
        (clinicUpdate.payload as any).status
      )
      expect((clinicUpdate.payload as any).thumbnail_url).toContain(
        'photo_reference=photo-1'
      )
      expect((clinicUpdate.payload as any).thumbnail_url).toContain(
        'key=test-api-key'
      )

      const locationInsert = getOperations('clinic_locations', 'insert')[0]
      expectExactKeys(
        locationInsert.payload as Record<string, unknown>,
        clinicLocationInsertKeys
      )
      expect(locationInsert.payload).toMatchObject({
        clinic_id: 'clinic-123',
        location_name: 'Primary Location',
        address_line: '123 Bagdat Ave, Istanbul, Turkey',
        city: 'Besiktas',
        country: 'Turkey',
        postal_code: '34353',
        latitude: 41.0082,
        longitude: 28.9784,
        is_primary: true
      })

      const serviceInsert = getOperations('clinic_services', 'insert')[0]
      expectKeysOnEach(
        serviceInsert.payload as Array<Record<string, unknown>>,
        clinicServiceInsertKeys
      )
      expect(serviceInsert.payload).toEqual([
        {
          clinic_id: 'clinic-123',
          service_category: 'Medical Tourism',
          service_name: 'Hair Transplant',
          is_primary_service: true
        },
        {
          clinic_id: 'clinic-123',
          service_category: 'Cosmetic',
          service_name: 'Rhinoplasty',
          is_primary_service: false
        },
        {
          clinic_id: 'clinic-123',
          service_category: 'Dental',
          service_name: 'Other',
          is_primary_service: false
        }
      ])
      ;(serviceInsert.payload as any[]).forEach((service) => {
        expect(Constants.public.Enums.clinic_service_category).toContain(
          service.service_category
        )
        expect(Constants.public.Enums.clinic_service_name).toContain(
          service.service_name
        )
      })

      const reviewInsert = getOperations('clinic_reviews', 'insert')[0]
      expectKeysOnEach(
        reviewInsert.payload as Array<Record<string, unknown>>,
        clinicReviewInsertKeys
      )
      expect(reviewInsert.payload).toEqual([
        {
          clinic_id: 'clinic-123',
          source_id: 'source-1',
          rating: '5',
          review_text: 'Excellent care',
          review_date: '2024-12-04',
          language: 'en'
        },
        {
          clinic_id: 'clinic-123',
          source_id: 'source-1',
          rating: '4',
          review_text: 'Helpful staff',
          review_date: '2024-12-05',
          language: 'tr'
        }
      ])

      const mediaInsert = getOperations('clinic_media', 'insert')[0]
      expectKeysOnEach(
        mediaInsert.payload as Array<Record<string, unknown>>,
        clinicMediaInsertKeys
      )
      expect((mediaInsert.payload as any[])).toHaveLength(5)
      expect((mediaInsert.payload as any[])[0]).toMatchObject({
        clinic_id: 'clinic-123',
        media_type: 'image',
        is_primary: true,
        source_id: 'source-1',
        display_order: 0
      })
      expect((mediaInsert.payload as any[])[4]).toMatchObject({
        is_primary: false,
        display_order: 4
      })

      const rawDocumentInsert = getOperations('source_documents', 'insert')[0]
      expectExactKeys(
        rawDocumentInsert.payload as Record<string, unknown>,
        sourceDocumentInsertKeys
      )
      expect(rawDocumentInsert.payload).toMatchObject({
        source_id: 'source-1',
        doc_type: 'html',
        title: 'Google Places Data - Istanbul Medic Center',
        language: 'en',
        raw_text: JSON.stringify(fullGooglePlacesData)
      })
      expect(Constants.public.Enums.doc_type_enum).toContain(
        (rawDocumentInsert.payload as any).doc_type
      )
    })

    it('falls back to address components and Google Maps URL when claims are absent', async () => {
      seedSuccessfulSingleImport({ factCount: 3 })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-456',
          googlePlacesData: minimalGooglePlacesData
        })
      )

      expect(response.status).toBe(200)

      const sourceInsert = getOperations('sources', 'insert')[0]
      expectExactKeys(sourceInsert.payload as Record<string, unknown>, sourceInsertKeys)
      expect(sourceInsert.payload).toMatchObject({
        url: 'https://www.google.com/maps/place/?q=place_id:place-456'
      })

      const clinicUpdate = getOperations('clinics', 'update')[0]
      expectExactKeys(clinicUpdate.payload as Record<string, unknown>, clinicUpdateKeys)
      expect(clinicUpdate.payload).toMatchObject({
        primary_city: 'Umraniye',
        primary_country: 'Turkey',
        website_url: null,
        whatsapp_contact: null,
        email_contact: null,
        phone_contact: null,
        thumbnail_url: null
      })

      const locationInsert = getOperations('clinic_locations', 'insert')[0]
      expectExactKeys(
        locationInsert.payload as Record<string, unknown>,
        clinicLocationInsertKeys
      )
      expect(locationInsert.payload).toMatchObject({
        city: 'Umraniye',
        country: 'Turkey',
        postal_code: '00000'
      })
    })

    it('upserts the expected fact keys and wraps primitive values in JSON objects', async () => {
      seedSuccessfulSingleImport()

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(200)

      const factUpserts = getOperations('clinic_facts', 'upsert')
      expect(factUpserts).toHaveLength(4)
      factUpserts.forEach((operation) => {
        expectExactKeys(
          operation.payload as Record<string, unknown>,
          clinicFactUpsertKeys
        )
        expect((operation.options as any)?.onConflict).toBe('clinic_id,fact_key')
        expect(Constants.public.Enums.computed_by_enum).toContain(
          (operation.payload as any).computed_by
        )
        expect(Constants.public.Enums.value_type_enum).toContain(
          (operation.payload as any).value_type
        )
      })
      expect((factUpserts[0].payload as any)).toMatchObject({
        clinic_id: 'clinic-123',
        fact_key: 'google_place_id',
        fact_value: { value: 'place-123' },
        value_type: 'string',
        computed_by: 'extractor'
      })
      expect((factUpserts[1].payload as any)).toMatchObject({
        fact_key: 'google_rating',
        fact_value: { value: 4.8 },
        value_type: 'number'
      })
      expect((factUpserts[2].payload as any)).toMatchObject({
        fact_key: 'google_review_count',
        fact_value: { value: 210 },
        value_type: 'number'
      })
      expect((factUpserts[3].payload as any)).toMatchObject({
        fact_key: 'opening_hours',
        fact_value: fullGooglePlacesData.google_places.opening_hours,
        value_type: 'json'
      })
    })

    it('creates fact evidence rows when an existing source document is found', async () => {
      seedSuccessfulSingleImport({ withEvidenceDocument: true })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(200)

      const evidenceInserts = getOperations('fact_evidence', 'insert')
      expect(evidenceInserts).toHaveLength(4)
      evidenceInserts.forEach((operation) => {
        expectExactKeys(
          operation.payload as Record<string, unknown>,
          factEvidenceInsertKeys
        )
      })
      expect(evidenceInserts[0].payload).toMatchObject({
        clinic_fact_id: 'fact-1',
        source_document_id: 'doc-existing-1',
        evidence_snippet: 'Extracted from Google Places: google_place_id'
      })
    })

    it('queries the latest source document for each fact using the expected schema fields', async () => {
      seedSuccessfulSingleImport({ withEvidenceDocument: true })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(200)

      const documentLookups = getOperations('source_documents', 'select')
      expect(documentLookups).toHaveLength(4)
      documentLookups.forEach((operation) => {
        expect(operation.selectColumns).toBe('id')
        expect(operation.filters).toEqual([
          { type: 'eq', column: 'source_id', value: 'source-1' }
        ])
        expect(operation.orderBy).toEqual({
          column: 'created_at',
          options: { ascending: false }
        })
        expect(operation.limitValue).toBe(1)
        expect(operation.expectSingle).toBe(true)
      })
    })

    it('deletes existing locations and services using clinic_id filters before reinserting', async () => {
      seedSuccessfulSingleImport()

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(200)

      expect(getOperations('clinic_locations', 'delete')).toEqual([
        expect.objectContaining({
          filters: [{ type: 'eq', column: 'clinic_id', value: 'clinic-123' }]
        })
      ])
      expect(getOperations('clinic_services', 'delete')).toEqual([
        expect.objectContaining({
          filters: [{ type: 'eq', column: 'clinic_id', value: 'clinic-123' }]
        })
      ])
    })

    it('skips optional service, review, media, and opening_hours writes when the payload does not include them', async () => {
      seedSuccessfulSingleImport({ factCount: 3 })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-456',
          googlePlacesData: minimalGooglePlacesData
        })
      )

      expect(response.status).toBe(200)
      expect(getOperations('clinic_services', 'insert')).toHaveLength(0)
      expect(getOperations('clinic_reviews', 'insert')).toHaveLength(0)
      expect(getOperations('clinic_media', 'insert')).toHaveLength(0)
      expect(getOperations('clinic_facts', 'upsert')).toHaveLength(3)
    })

    it('falls back to candidate contact fields and state-derived city when direct Google fields are absent', async () => {
      seedSuccessfulSingleImport()

      const fallbackData = {
        google_places: {
          ...fullGooglePlacesData.google_places,
          website: undefined,
          phone: undefined,
          international_phone: undefined,
          photos: undefined,
          address_components: [
            { long_name: 'Istanbul', types: ['administrative_area_level_1'] },
            { long_name: 'Turkey', types: ['country'] }
          ]
        },
        extracted_claims: {
          ...fullGooglePlacesData.extracted_claims,
          location: {
            city: '',
            state: 'Istanbul',
            country: '',
            postal_code: ''
          }
        }
      }

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fallbackData
        })
      )

      expect(response.status).toBe(200)

      const clinicUpdate = getOperations('clinics', 'update')[0]
      expect(clinicUpdate.payload).toMatchObject({
        primary_city: 'Istanbul',
        primary_country: 'Turkey',
        website_url: 'https://fallback.example',
        phone_contact: '+90 212 333 3333',
        thumbnail_url: null
      })

      const sourceInsert = getOperations('sources', 'insert')[0]
      expect(sourceInsert.payload).toMatchObject({
        url: 'https://www.google.com/maps/place/?q=place_id:place-123'
      })
    })

    it('defaults review language to en and review_date to null when the Google review omits them', async () => {
      seedSuccessfulSingleImport({ factCount: 3 })

      const dataWithSparseReview = {
        google_places: {
          ...minimalGooglePlacesData.google_places,
          reviews: [
            {
              rating: 3,
              text: 'No language or timestamp'
            }
          ]
        },
        extracted_claims: minimalGooglePlacesData.extracted_claims
      }

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-456',
          googlePlacesData: dataWithSparseReview
        })
      )

      expect(response.status).toBe(200)

      const reviewInsert = getOperations('clinic_reviews', 'insert')[0]
      expectKeysOnEach(
        reviewInsert.payload as Array<Record<string, unknown>>,
        clinicReviewInsertKeys
      )
      expect(reviewInsert.payload).toEqual([
        {
          clinic_id: 'clinic-456',
          source_id: 'source-1',
          rating: '3',
          review_text: 'No language or timestamp',
          review_date: null,
          language: 'en'
        }
      ])
    })

    it('accepts direct photo URLs and preserves them in thumbnail and media records', async () => {
      seedSuccessfulSingleImport({ factCount: 3 })

      const dataWithStringPhotos = {
        google_places: {
          ...minimalGooglePlacesData.google_places,
          photos: [
            'https://cdn.example/1.jpg',
            'https://cdn.example/2.jpg'
          ]
        },
        extracted_claims: minimalGooglePlacesData.extracted_claims
      }

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-456',
          googlePlacesData: dataWithStringPhotos
        })
      )

      expect(response.status).toBe(200)

      const clinicUpdate = getOperations('clinics', 'update')[0]
      expect((clinicUpdate.payload as any).thumbnail_url).toBe(
        'https://cdn.example/1.jpg'
      )

      const mediaInsert = getOperations('clinic_media', 'insert')[0]
      expect(mediaInsert.payload).toEqual([
        {
          clinic_id: 'clinic-456',
          media_type: 'image',
          url: 'https://cdn.example/1.jpg',
          is_primary: true,
          source_id: 'source-1',
          display_order: 0
        },
        {
          clinic_id: 'clinic-456',
          media_type: 'image',
          url: 'https://cdn.example/2.jpg',
          is_primary: false,
          source_id: 'source-1',
          display_order: 1
        }
      ])
    })

    it('stores an empty media URL when a photo object does not contain a photo_reference', async () => {
      seedSuccessfulSingleImport({ factCount: 3 })

      const dataWithBrokenPhoto = {
        google_places: {
          ...minimalGooglePlacesData.google_places,
          photos: [{}]
        },
        extracted_claims: minimalGooglePlacesData.extracted_claims
      }

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-456',
          googlePlacesData: dataWithBrokenPhoto
        })
      )

      expect(response.status).toBe(200)

      const clinicUpdate = getOperations('clinics', 'update')[0]
      expect((clinicUpdate.payload as any).thumbnail_url).toBe('')

      const mediaInsert = getOperations('clinic_media', 'insert')[0]
      expect((mediaInsert.payload as any[])[0]).toMatchObject({
        url: ''
      })
    })
  })

  describe('error handling', () => {
    it('returns 500 when source creation fails', async () => {
      mockDb.queue('sources', 'insert', {
        data: null,
        error: new Error('source insert failed')
      })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toMatchObject({
        error: 'source insert failed'
      })
    })

    it('returns 500 when clinic update fails', async () => {
      mockDb.queue('sources', 'insert', {
        data: { id: 'source-1' },
        error: null
      })
      mockDb.queue('clinics', 'update', {
        error: new Error('clinic update failed')
      })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toMatchObject({
        error: 'clinic update failed'
      })
    })

    it('returns 500 when location insert fails', async () => {
      mockDb.queue('sources', 'insert', {
        data: { id: 'source-1' },
        error: null
      })
      mockDb.queue('clinics', 'update', {
        error: null
      })
      mockDb.queue('clinic_locations', 'delete', {
        error: null
      })
      mockDb.queue('clinic_locations', 'insert', {
        error: new Error('location insert failed')
      })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toMatchObject({
        error: 'location insert failed'
      })
    })

    it('returns 500 when service insert fails', async () => {
      mockDb.queue('sources', 'insert', {
        data: { id: 'source-1' },
        error: null
      })
      mockDb.queue('clinics', 'update', {
        error: null
      })
      mockDb.queue('clinic_locations', 'delete', {
        error: null
      })
      mockDb.queue('clinic_locations', 'insert', {
        error: null
      })
      mockDb.queue('clinic_services', 'delete', {
        error: null
      })
      mockDb.queue('clinic_services', 'insert', {
        error: new Error('service insert failed')
      })

      const response = await singlePOST(
        makeSingleRequest({
          clinicId: 'clinic-123',
          googlePlacesData: fullGooglePlacesData
        })
      )

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toMatchObject({
        error: 'service insert failed'
      })
    })

    it('returns 500 when the request body contains invalid JSON', async () => {
      const response = await singlePOST(makeSingleRequest('{invalid json'))

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.any(String)
      })
    })
  })
})

describe('POST /api/import/google-places/bulk', () => {
  it('returns 400 when imports is not an array', async () => {
    const response = await bulkPOST(makeBulkRequest({ imports: null }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected array of imports'
    })
  })

  it('aggregates successful imports and calls the single-import endpoint for each payload', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        source_id: 'source-1'
      })
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        source_id: 'source-2'
      })
    })

    const imports = [
      { clinicId: 'clinic-123', googlePlacesData: fullGooglePlacesData },
      { clinicId: 'clinic-456', googlePlacesData: minimalGooglePlacesData }
    ]

    const responsePromise = bulkPOST(makeBulkRequest({ imports }))
    await vi.runAllTimersAsync()
    const response = await responsePromise

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      totalImports: 2,
      successfulImports: 2,
      failedImports: 0,
      results: [
        expect.objectContaining({
          clinicId: 'clinic-123',
          placeId: 'place-123',
          displayName: 'Istanbul Medic Center',
          source_id: 'source-1'
        }),
        expect.objectContaining({
          clinicId: 'clinic-456',
          placeId: 'place-456',
          displayName: 'Minimal Clinic',
          source_id: 'source-2'
        })
      ]
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://app.local/api/import/google-places',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imports[0])
      }
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://app.local/api/import/google-places',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imports[1])
      }
    )
  })

  it('returns a partial failure summary when a downstream import responds with an error', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, source_id: 'source-1' })
    })
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'duplicate place' })
    })

    const imports = [
      { clinicId: 'clinic-123', googlePlacesData: fullGooglePlacesData },
      { clinicId: 'clinic-456', googlePlacesData: minimalGooglePlacesData }
    ]

    const responsePromise = bulkPOST(makeBulkRequest({ imports }))
    await vi.runAllTimersAsync()
    const response = await responsePromise

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      totalImports: 2,
      successfulImports: 1,
      failedImports: 1,
      errors: [
        expect.objectContaining({
          clinicId: 'clinic-456',
          placeId: 'place-456',
          displayName: 'Minimal Clinic',
          error: 'duplicate place'
        })
      ]
    })
  })

  it('continues processing when fetch throws and records the exception', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    fetchMock.mockRejectedValueOnce(new Error('network down'))
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, source_id: 'source-2' })
    })

    const imports = [
      { clinicId: 'clinic-123', googlePlacesData: fullGooglePlacesData },
      { clinicId: 'clinic-456', googlePlacesData: minimalGooglePlacesData }
    ]

    const responsePromise = bulkPOST(makeBulkRequest({ imports }))
    await vi.runAllTimersAsync()
    const response = await responsePromise

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      totalImports: 2,
      successfulImports: 1,
      failedImports: 1,
      results: [
        expect.objectContaining({
          clinicId: 'clinic-456',
          placeId: 'place-456'
        })
      ],
      errors: [
        expect.objectContaining({
          clinicId: 'clinic-123',
          placeId: 'place-123',
          error: 'network down'
        })
      ]
    })
  })

  it('returns 500 when the request body contains invalid JSON', async () => {
    const response = await bulkPOST(makeBulkRequest('{invalid json'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String)
    })
  })
})
