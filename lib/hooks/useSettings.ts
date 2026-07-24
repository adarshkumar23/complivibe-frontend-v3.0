"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyOrganizations,
  getMemberships,
  getCustomRoles,
  getSessions,
  getSsoConfig,
  getOidcConfig,
  getIpAllowlist,
  getAiConfiguration,
  revokeSession,
  createIpRange,
  deleteIpRange,
  disableIpAllowlist,
  putAiConfiguration,
  createSsoConfig,
  updateSsoConfig,
  activateSsoConfig,
  deactivateSsoConfig,
  deleteSsoConfig,
  testSsoConfig,
  createOidcConfig,
  updateOidcConfig,
  activateOidcConfig,
  deactivateOidcConfig,
  deleteOidcConfig,
  testOidcConfig,
  type AiConfigInput,
  type SsoConfigInput,
  type OidcConfigInput
} from "@/lib/api/settings";

export function useSettings() {
  const orgs = useQuery({ queryKey: ["my-orgs"], queryFn: getMyOrganizations });
  const memberships = useQuery({ queryKey: ["memberships"], queryFn: getMemberships });
  const roles = useQuery({ queryKey: ["custom-roles"], queryFn: getCustomRoles });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: getSessions });
  const sso = useQuery({ queryKey: ["sso-config"], queryFn: getSsoConfig });
  const oidc = useQuery({ queryKey: ["oidc-config"], queryFn: getOidcConfig });
  const ipAllowlist = useQuery({ queryKey: ["ip-allowlist"], queryFn: getIpAllowlist });
  const aiConfig = useQuery({ queryKey: ["ai-config"], queryFn: getAiConfiguration });

  return { orgs, memberships, roles, sessions, sso, oidc, ipAllowlist, aiConfig };
}

export type SettingsData = ReturnType<typeof useSettings>;

// ── Mutations ───────────────────────────────────────────────────────────────
export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => revokeSession(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }) });
}

export function useCreateIpRange() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: { cidr_range: string; label?: string | null }) => createIpRange(body), onSuccess: () => qc.invalidateQueries({ queryKey: ["ip-allowlist"] }) });
}
export function useDeleteIpRange() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteIpRange(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["ip-allowlist"] }) });
}
export function useDisableIpAllowlist() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => disableIpAllowlist(), onSuccess: () => qc.invalidateQueries({ queryKey: ["ip-allowlist"] }) });
}

export function usePutAiConfiguration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: AiConfigInput) => putAiConfiguration(body), onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-config"] }) });
}

function useSsoInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["sso-config"] });
}
export function useCreateSsoConfig() {
  const inv = useSsoInvalidate();
  return useMutation({ mutationFn: (body: SsoConfigInput) => createSsoConfig(body), onSuccess: inv });
}
export function useUpdateSsoConfig() {
  const inv = useSsoInvalidate();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<SsoConfigInput> }) => updateSsoConfig(id, body), onSuccess: inv });
}
export function useActivateSsoConfig() {
  const inv = useSsoInvalidate();
  return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? activateSsoConfig(id) : deactivateSsoConfig(id)), onSuccess: inv });
}
export function useDeleteSsoConfig() {
  const inv = useSsoInvalidate();
  return useMutation({ mutationFn: (id: string) => deleteSsoConfig(id), onSuccess: inv });
}
export function useTestSsoConfig() {
  return useMutation({ mutationFn: (id: string) => testSsoConfig(id) });
}

function useOidcInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["oidc-config"] });
}
export function useCreateOidcConfig() {
  const inv = useOidcInvalidate();
  return useMutation({ mutationFn: (body: OidcConfigInput) => createOidcConfig(body), onSuccess: inv });
}
export function useUpdateOidcConfig() {
  const inv = useOidcInvalidate();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<OidcConfigInput> }) => updateOidcConfig(id, body), onSuccess: inv });
}
export function useActivateOidcConfig() {
  const inv = useOidcInvalidate();
  return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? activateOidcConfig(id) : deactivateOidcConfig(id)), onSuccess: inv });
}
export function useDeleteOidcConfig() {
  const inv = useOidcInvalidate();
  return useMutation({ mutationFn: (id: string) => deleteOidcConfig(id), onSuccess: inv });
}
export function useTestOidcConfig() {
  return useMutation({ mutationFn: (id: string) => testOidcConfig(id) });
}
