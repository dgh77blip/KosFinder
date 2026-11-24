# KosFinder Security Specification

## 1. Data Invariants
1. **User Identity & Role Integrity**: A user document at `/users/{userId}` can only be created or read by the authenticated user matching `userId`, with `role` restricted strictly to `'pencari'` or `'pemilik'`. Private PII (`email`, `whatsapp`) is isolated in `/users/{userId}/private/info` and restricted to the owner only.
2. **Kos Ownership**: A kos property at `/kos/{kosId}` is publicly readable for catalog discovery, but creation requires `ownerUid == request.auth.uid`, `isDemo == false`, and updates/deletes require matching the existing `ownerUid` (`ownerUid` is immutable).
3. **Room-to-Kos Master Gate**: A room at `/kos/{kosId}/rooms/{roomId}` and history log at `/kos/{kosId}/history/{historyId}` can only be created, updated, or deleted by the authenticated owner of the parent `/kos/{kosId}` document (`get(...).data.ownerUid == request.auth.uid`).
4. **Survey & Favorite Isolation**: Survey requests at `/surveys/{surveyId}` are only readable/listable by the `seekerUid` or `ownerUid`. Favorites at `/favorites/{favoriteId}` are only readable/listable/writable by the matching `uid`.
5. **Temporal Integrity**: `createdAt`, `updatedAt`, and `lastStatusUpdatedAt` must equal `request.time` on creation/update as applicable, and `createdAt` is immutable.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. **Unauthenticated Kos Creation**: Anonymous client tries to create `/kos/fake1` -> `PERMISSION_DENIED`.
2. **Owner UID Spoofing**: Authenticated User A tries to create `/kos/spoof1` with `ownerUid: "userB"` -> `PERMISSION_DENIED`.
3. **Demo Flag Forgery**: Authenticated User A tries to create `/kos/demo1` with `isDemo: true` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Kos**: User A includes `"isVerified": true` in `/kos/test1` -> `PERMISSION_DENIED` (`hasOnly` rejects).
5. **Cross-Owner Kos Mutation**: User B tries to update price or status on User A's `/kos/test1` -> `PERMISSION_DENIED`.
6. **Cross-Owner Room Mutation**: User B tries to change room status on `/kos/kosA/rooms/A1` -> `PERMISSION_DENIED` (Master Gate).
7. **Privilege Escalation on Role**: User A tries to set `role: "admin"` on `/users/userA` -> `PERMISSION_DENIED`.
8. **Blanket User PII Read**: User B tries to `get` `/users/userA/private/info` -> `PERMISSION_DENIED`.
9. **Unauthorized Survey List Scrape**: User C tries to `list` `/surveys` without filtering to `seekerUid == userC` or `ownerUid == userC` -> `PERMISSION_DENIED`.
10. **Survey Terminal Status Bypass**: Seeker tries to set survey status to `'disetujui'` -> `PERMISSION_DENIED`.
11. **Oversized ID Poisoning**: Client uses a 200-char document ID on `/kos/{kosId}` -> `PERMISSION_DENIED` (`isValidId` rejects).
12. **Client Timestamp Tampering**: Client sends a past timestamp instead of `request.time` for `createdAt` -> `PERMISSION_DENIED`.
