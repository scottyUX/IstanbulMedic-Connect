1. API — PATCH /api/consultations/[id]

Updates status to cancelled, auth-checked so users can only cancel their own pending consultations
Fires two emails on success: cancellation notice to the Istanbul Medic team + confirmation to the user
2. Emails — new templates in lib/email/sendConsultationRequest.ts

Cancellation notice to the team (clinic name, user info)
Cancellation confirmation to the user
3. Consultations page — ProfileConsultations.tsx

Cancel button on pending cards only
Confirmation modal before cancelling
Cancelled cards stay in the list with a grey/muted "Cancelled" badge
4. Clinic profile page

If user has a pending consultation with that clinic, the request button swaps to "Cancel Request"
Confirmation modal before cancelling
After cancellation, button reverts to "Request Consultation"
5. Bookmarks page — read-only update only

Pending indicator stays as-is (no cancel)
Add a small "Manage in Consultations →" hint/link next to the pending badge