// lib/scoring/metrics/registry.ts
// Derives registry/verification signals from clinic_registry_records.

export interface RegistryRawData {
  license_status: string;   // registry_license_status_enum values
  expires_at: string | null;
}

export interface RegistryMetrics {
  registry_listed: boolean;
  license_verifiable: boolean;
}

const ACTIVE_STATUSES = ["active", "verified", "valid", "current"];

export function computeRegistryMetrics(records: RegistryRawData[]): RegistryMetrics {
  if (!records || records.length === 0) {
    return { registry_listed: false, license_verifiable: false };
  }

  const registry_listed = true; // Has at least one record

  // License is verifiable if at least one record has an active status
  // and is not expired.
  const now = new Date();
  const license_verifiable = records.some((r) => {
    const isActiveStatus = ACTIVE_STATUSES.includes(r.license_status?.toLowerCase());
    const isNotExpired = !r.expires_at || new Date(r.expires_at) > now;
    return isActiveStatus && isNotExpired;
  });

  return { registry_listed, license_verifiable };
}
