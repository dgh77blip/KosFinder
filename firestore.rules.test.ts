/**
 * Adversarial payload verification reference for KosFinder Firestore Security Rules.
 * Covers the 12 "Dirty Dozen" invariants documented in security_spec.md.
 */
export const DIRTY_DOZEN_PAYLOADS = [
  { name: 'unauthenticated_kos_create', path: '/kos/fake1', expected: 'PERMISSION_DENIED' },
  { name: 'owner_uid_spoofing', path: '/kos/spoof1', payload: { ownerUid: 'victim_uid' }, expected: 'PERMISSION_DENIED' },
  { name: 'demo_flag_forgery', path: '/kos/demo1', payload: { isDemo: true }, expected: 'PERMISSION_DENIED' },
  { name: 'shadow_field_injection', path: '/kos/test1', payload: { isVerified: true }, expected: 'PERMISSION_DENIED' },
  { name: 'cross_owner_kos_update', path: '/kos/kos_owner_a', expected: 'PERMISSION_DENIED' },
  { name: 'cross_owner_room_update', path: '/kos/kos_owner_a/rooms/A1', expected: 'PERMISSION_DENIED' },
  { name: 'role_privilege_escalation', path: '/users/user_a', payload: { role: 'admin' }, expected: 'PERMISSION_DENIED' },
  { name: 'blanket_pii_read', path: '/users/user_a/private/info', expected: 'PERMISSION_DENIED' },
  { name: 'unauthorized_survey_list', path: '/surveys', expected: 'PERMISSION_DENIED' },
  { name: 'seeker_status_bypass', path: '/surveys/s1', payload: { status: 'disetujui' }, expected: 'PERMISSION_DENIED' },
  { name: 'oversized_id_poisoning', path: `/kos/${'a'.repeat(200)}`, expected: 'PERMISSION_DENIED' },
  { name: 'client_timestamp_tampering', path: '/kos/test1', payload: { createdAt: '2020-01-01T00:00:00Z' }, expected: 'PERMISSION_DENIED' },
];
