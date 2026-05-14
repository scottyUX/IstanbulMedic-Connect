import { Resend } from 'resend'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConsultationPassport {
  // Profile
  ageTier?: string | null
  gender?: string | null
  country?: string | null
  budgetTier?: string | null
  timeline?: string | null
  whatsApp?: string | null
  // Hair loss
  norwoodScale?: number | null
  durationYears?: number | null
  donorAreaQuality?: string | null
  donorAreaAvailability?: string | null
  desiredDensity?: string | null
  hadPriorTransplant?: boolean | null
  priorTransplants?: { year: number; estimatedGrafts: number; clinicCountry: string }[]
  // Medical
  allergies?: string[]
  medications?: string[]
  otherConditions?: string[]
  priorSurgeries?: { type: string; year: number; notes?: string }[]
  // Photos
  photos?: { view: string; url: string }[]
}

export interface SendConsultationRequestParams {
  userName: string
  userEmail: string
  clinicNames: string[]
  passport?: ConsultationPassport
}

// ─── Format helpers ───────────────────────────────────────────────────────────

const AGE_TIER: Record<string, string> = {
  '18_24': '18–24', '25_34': '25–34', '35_44': '35–44',
  '45_54': '45–54', '55_64': '55–64', '65_plus': '65+',
}
const BUDGET_TIER: Record<string, string> = {
  'under_2000': 'Under $2,000', '2000_5000': '$2,000–$5,000',
  '5000_8000': '$5,000–$8,000', '8000_12000': '$8,000–$12,000',
  '12000_plus': '$12,000+',
}
const TIMELINE: Record<string, string> = {
  '1_3_months': '1–3 months', '3_6_months': '3–6 months',
  '6_12_months': '6–12 months', '12_plus_months': '12+ months',
}
const PHOTO_LABEL: Record<string, string> = {
  front: 'Front', left_side: 'Left Side', right_side: 'Right Side',
  top: 'Top', donor_area: 'Donor Area',
}

function fe(val: string | null | undefined, map: Record<string, string>): string {
  if (!val) return '<span style="color:#94a3b8">Not provided</span>'
  return map[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function fv(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '<span style="color:#94a3b8">Not provided</span>'
  return String(val)
}
function fl(items: string[] | undefined): string {
  if (!items || items.length === 0) return '<span style="color:#94a3b8">None</span>'
  return items.join(', ')
}
// Plain-text equivalents
function pe(val: string | null | undefined, map: Record<string, string>): string {
  if (!val) return 'Not provided'
  return map[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function pv(val: string | number | null | undefined): string {
  return (val === null || val === undefined || val === '') ? 'Not provided' : String(val)
}
function pl(items: string[] | undefined): string {
  return (!items || items.length === 0) ? 'None' : items.join(', ')
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:7px 16px 7px 0;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top;width:160px;">${label}</td>
      <td style="padding:7px 0;color:#0D1E32;font-size:13px;vertical-align:top;">${value}</td>
    </tr>`
}

function section(title: string, content: string): string {
  return `
    <tr>
      <td style="padding:24px 32px 0;">
        <div style="border-left:3px solid #3EBBB7;padding-left:12px;margin-bottom:12px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#3EBBB7;text-transform:uppercase;">${title}</span>
        </div>
        <table cellpadding="0" cellspacing="0" width="100%">${content}</table>
      </td>
    </tr>`
}

function buildHtml({ userName, userEmail, clinicNames, passport: p }: SendConsultationRequestParams): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const clinicList = clinicNames
    .map((n) => `<div style="padding:4px 0;color:#0D1E32;font-size:13px;">→ &nbsp;${n}</div>`)
    .join('')

  const priorTransplantValue = (() => {
    if (!p) return fv(null)
    if (p.hadPriorTransplant === false) return '<span style="color:#94a3b8">None</span>'
    if (!p.priorTransplants?.length) return p.hadPriorTransplant ? fv('Yes') : fv(null)
    return p.priorTransplants
      .map((t) => `${t.year} · ${t.estimatedGrafts.toLocaleString()} grafts · ${t.clinicCountry}`)
      .join('<br>')
  })()

  const priorSurgeryValue = (() => {
    if (!p?.priorSurgeries?.length) return '<span style="color:#94a3b8">None</span>'
    return p.priorSurgeries
      .map((s) => `${s.type} (${s.year})${s.notes ? ` — ${s.notes}` : ''}`)
      .join('<br>')
  })()

  const photoBlock = (() => {
    if (!p?.photos?.length) return `<tr><td style="padding:7px 0;color:#94a3b8;font-size:13px;">No photos uploaded</td></tr>`
    const links = p.photos
      .map((ph) => `
        <td style="padding:0 8px 8px 0;">
          <a href="${ph.url}" target="_blank" style="display:block;text-decoration:none;">
            <img src="${ph.url}" alt="${PHOTO_LABEL[ph.view] ?? ph.view}"
              width="90" height="90"
              style="display:block;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;" />
            <span style="display:block;text-align:center;font-size:11px;color:#64748b;margin-top:4px;">
              ${PHOTO_LABEL[ph.view] ?? ph.view}
            </span>
          </a>
        </td>`)
      .join('')
    return `<tr><td colspan="2"><table cellpadding="0" cellspacing="0"><tr>${links}</tr></table></td></tr>`
  })()

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#0D1E32;padding:22px 32px;">
          <span style="color:#3EBBB7;font-size:17px;font-weight:700;letter-spacing:0.06em;">ISTANBUL MEDIC CONNECT</span>
        </td>
      </tr>

      <!-- Title -->
      <tr>
        <td style="padding:28px 32px 8px;">
          <h1 style="margin:0 0 4px;font-size:21px;font-weight:700;color:#0D1E32;">New Consultation Request</h1>
          <p style="margin:0;color:#94a3b8;font-size:12px;">${date}</p>
        </td>
      </tr>

      <!-- Patient -->
      ${section('Patient', `
        ${row('Name', fv(userName))}
        ${row('Email', `<a href="mailto:${userEmail}" style="color:#3EBBB7;text-decoration:none;">${userEmail}</a>`)}
        ${row('WhatsApp', fv(p?.whatsApp))}
      `)}

      <!-- Clinics -->
      <tr>
        <td style="padding:24px 32px 0;">
          <div style="border-left:3px solid #3EBBB7;padding-left:12px;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#3EBBB7;text-transform:uppercase;">Clinics Requested</span>
          </div>
          ${clinicList}
        </td>
      </tr>

      ${p ? `
      <!-- Profile -->
      ${section('Profile', `
        ${row('Age Range', fe(p.ageTier, AGE_TIER))}
        ${row('Gender', fv(p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null))}
        ${row('Country', fv(p.country))}
        ${row('Budget', fe(p.budgetTier, BUDGET_TIER))}
        ${row('Timeline', fe(p.timeline, TIMELINE))}
      `)}

      <!-- Hair Loss -->
      ${section('Hair Loss', `
        ${row('Norwood Scale', fv(p.norwoodScale))}
        ${row('Duration', p.durationYears != null ? `${p.durationYears} year${p.durationYears !== 1 ? 's' : ''}` : fv(null))}
        ${row('Donor Quality', fv(p.donorAreaQuality ? p.donorAreaQuality.charAt(0).toUpperCase() + p.donorAreaQuality.slice(1) : null))}
        ${row('Donor Availability', fv(p.donorAreaAvailability ? p.donorAreaAvailability.charAt(0).toUpperCase() + p.donorAreaAvailability.slice(1) : null))}
        ${row('Desired Density', fv(p.desiredDensity ? p.desiredDensity.charAt(0).toUpperCase() + p.desiredDensity.slice(1) : null))}
        ${row('Prior Transplant', priorTransplantValue)}
      `)}

      <!-- Medical -->
      ${section('Medical History', `
        ${row('Medications', fl(p.medications))}
        ${row('Allergies', fl(p.allergies))}
        ${row('Other Conditions', fl(p.otherConditions))}
        ${row('Prior Surgeries', priorSurgeryValue)}
      `)}

      <!-- Photos -->
      ${section('Photos', photoBlock)}
      ` : ''}

      <!-- Footer -->
      <tr>
        <td style="padding:28px 32px;margin-top:24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            Please follow up with the user and the relevant clinic(s).<br>
            <strong style="color:#64748b;">Istanbul Medic Connect Concierge</strong>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Plain-text builder ───────────────────────────────────────────────────────

function buildText({ userName, userEmail, clinicNames, passport: p }: SendConsultationRequestParams): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const hr = '─'.repeat(48)

  const priorTransplants = (() => {
    if (!p) return 'Not provided'
    if (p.hadPriorTransplant === false) return 'None'
    if (!p.priorTransplants?.length) return p.hadPriorTransplant ? 'Yes' : 'Not provided'
    return p.priorTransplants.map((t) => `${t.year} · ${t.estimatedGrafts.toLocaleString()} grafts · ${t.clinicCountry}`).join('\n                   ')
  })()

  const priorSurgeries = !p?.priorSurgeries?.length
    ? 'None'
    : p.priorSurgeries.map((s) => `${s.type} (${s.year})${s.notes ? ` — ${s.notes}` : ''}`).join('; ')

  const photos = !p?.photos?.length
    ? 'None'
    : p.photos.map((ph) => `${PHOTO_LABEL[ph.view] ?? ph.view}: ${ph.url}`).join('\n                   ')

  return `
ISTANBUL MEDIC CONNECT — New Consultation Request
${date}
${hr}

PATIENT
  Name       ${pv(userName)}
  Email      ${userEmail}
  WhatsApp   ${pv(p?.whatsApp)}

CLINICS REQUESTED
${clinicNames.map((n) => `  → ${n}`).join('\n')}

${p ? `HAIR TRANSPLANT PASSPORT
${hr}
PROFILE
  Age Range  ${pe(p.ageTier, AGE_TIER)}
  Gender     ${pv(p.gender)}
  Country    ${pv(p.country)}
  Budget     ${pe(p.budgetTier, BUDGET_TIER)}
  Timeline   ${pe(p.timeline, TIMELINE)}

HAIR LOSS
  Norwood    ${pv(p.norwoodScale)}
  Duration   ${p.durationYears != null ? `${p.durationYears} year${p.durationYears !== 1 ? 's' : ''}` : 'Not provided'}
  Donor Quality        ${pv(p.donorAreaQuality)}
  Donor Availability   ${pv(p.donorAreaAvailability)}
  Desired Density      ${pv(p.desiredDensity)}
  Prior Transplant     ${priorTransplants}

MEDICAL HISTORY
  Medications          ${pl(p.medications)}
  Allergies            ${pl(p.allergies)}
  Other Conditions     ${pl(p.otherConditions)}
  Prior Surgeries      ${priorSurgeries}

PHOTOS
  ${photos}
` : '(Passport not yet completed)'}
${hr}
Please follow up with the user and the relevant clinic(s).
Istanbul Medic Connect Concierge
`.trim()
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sendConsultationRequest(params: SendConsultationRequestParams): Promise<void> {
  const toEmail = process.env.CONSULTATION_EMAIL
  if (!toEmail) {
    throw new Error('sendConsultationRequest: CONSULTATION_EMAIL not set')
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('sendConsultationRequest: RESEND_API_KEY not set')
  }

  const subject = `[Istanbul Medic Connect] New Consultation Request — ${params.userName}`
  const from = process.env.CONSULTATION_FROM_EMAIL ?? 'Istanbul Medic Connect <noreply@istanbulmedic.com>'

  const resend = new Resend(apiKey)

  await resend.emails.send({
    from,
    to: [toEmail],
    replyTo: params.userEmail,
    subject,
    html: buildHtml(params),
    text: buildText(params),
  })
}
