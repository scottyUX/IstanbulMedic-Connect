import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegistrySection } from '@/components/istanbulmedic-connect/profile/RegistrySection'
import type { RegistryRecord, ComplianceEvent } from '@/components/istanbulmedic-connect/profile/RegistrySection'

const SAMPLE_RECORD: RegistryRecord = {
  id: 'rec-1',
  source: 'turkish_ministry_of_health',
  license_number: 'MOH-42',
  license_status: 'active',
  licensed_since: '2018-03-15',
  expires_at: null,
  authorized_specialties: ['Hair Transplant', 'General Medical Center'],
  registered_legal_name: 'Özel Cosmedica Tıp Merkezi',
  registered_address: 'Esentepe Mah. Kore Şehitleri Cad. No:2/1 Şişli/İstanbul, İSTANBUL',
  registry_url: null,
  last_verified_at: '2024-01-10T00:00:00Z',
}

const SAMPLE_COMPLIANCE: ComplianceEvent = {
  id: 'evt-1',
  source: 'turkish_ministry_of_health',
  event_type: 'inspection_warning',
  event_date: '2023-06-01T00:00:00Z',
  description: 'Minor hygiene deficiency noted during inspection.',
  resolved_at: '2023-07-15T00:00:00Z',
  severity: 'low',
}

describe('RegistrySection', () => {
  it('renders the section heading when there is data', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText('Official Registry')).toBeInTheDocument()
  })

  it('renders nothing when both arrays are empty', () => {
    const { container } = render(<RegistrySection registryRecords={[]} complianceHistory={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the "no registry records" empty state when only compliance history is present', () => {
    render(<RegistrySection registryRecords={[]} complianceHistory={[SAMPLE_COMPLIANCE]} />)
    expect(screen.getByText(/No registry records on file yet/)).toBeInTheDocument()
  })

  it('renders a registry record with legal name and license number', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText('Özel Cosmedica Tıp Merkezi')).toBeInTheDocument()
    expect(screen.getByText('MOH-42')).toBeInTheDocument()
  })

  it('shows "Active" badge for active license status', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows "Expired" badge for expired license status', () => {
    const expired: RegistryRecord = { ...SAMPLE_RECORD, license_status: 'expired' }
    render(<RegistrySection registryRecords={[expired]} complianceHistory={[]} />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders authorized specialties as tags', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText('Hair Transplant')).toBeInTheDocument()
    expect(screen.getByText('General Medical Center')).toBeInTheDocument()
  })

  it('renders source label as "Turkish Ministry of Health"', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText('Turkish Ministry of Health')).toBeInTheDocument()
  })

  it('shows clean compliance message when registry exists but no compliance history', () => {
    render(<RegistrySection registryRecords={[SAMPLE_RECORD]} complianceHistory={[]} />)
    expect(screen.getByText(/No compliance issues on record/)).toBeInTheDocument()
  })

  it('renders compliance events with event type and severity', () => {
    render(<RegistrySection registryRecords={[]} complianceHistory={[SAMPLE_COMPLIANCE]} />)
    expect(screen.getByText('Inspection Warning')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('shows Resolved badge when compliance event has resolved_at', () => {
    render(<RegistrySection registryRecords={[]} complianceHistory={[SAMPLE_COMPLIANCE]} />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('does not show Resolved badge for unresolved events', () => {
    const unresolved: ComplianceEvent = { ...SAMPLE_COMPLIANCE, resolved_at: null }
    render(<RegistrySection registryRecords={[]} complianceHistory={[unresolved]} />)
    expect(screen.queryByText('Resolved')).not.toBeInTheDocument()
  })

  it('renders compliance event description', () => {
    render(<RegistrySection registryRecords={[]} complianceHistory={[SAMPLE_COMPLIANCE]} />)
    expect(screen.getByText('Minor hygiene deficiency noted during inspection.')).toBeInTheDocument()
  })

  it('renders multiple records', () => {
    const second: RegistryRecord = { ...SAMPLE_RECORD, id: 'rec-2', license_number: 'MOH-99', registered_legal_name: 'Özel Dr. Cinik Tıp Merkezi' }
    render(<RegistrySection registryRecords={[SAMPLE_RECORD, second]} complianceHistory={[]} />)
    expect(screen.getByText('MOH-42')).toBeInTheDocument()
    expect(screen.getByText('MOH-99')).toBeInTheDocument()
  })
})
