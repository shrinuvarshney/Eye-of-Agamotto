# Security Specification: Eye of Agamotto

## 1. Data Invariants
- Each user can ONLY access and modify their own data under `/users/{userId}` and its subcollections (`tasks`, `calendar_events`, `roadmaps`, `projects`, `job_applications`, `notes`, `note_folders`, `goals`).
- Cross-user reading or writing is strictly denied.
- Unauthenticated requests are rejected for all paths.
- Document IDs must conform to `isValidId` (`size() <= 128`, matching `^[a-zA-Z0-9_\\-]+$`).
- Incoming documents on create/update must enforce the owner UID matching `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Adversarial Test Payloads)
1. **Unauthenticated Read**: Attempt to read `/users/user123/tasks/task1` without auth token -> PERMISSION_DENIED.
2. **Cross-Tenant Task Snooping**: User A (`auth.uid == "userA"`) attempting to list or get `/users/userB/tasks/task1` -> PERMISSION_DENIED.
3. **Cross-Tenant Task Injection**: User A attempting to write `/users/userB/tasks/malicious1` with `userId: "userB"` -> PERMISSION_DENIED.
4. **UID Spoofing**: User A attempting to write to `/users/userA/tasks/task1` with payload `{ userId: "userB" }` -> PERMISSION_DENIED.
5. **Path Traversal / Junk ID Attack**: Attempting to create document with 2KB junk character ID -> PERMISSION_DENIED (`isValidId` check).
6. **Shadow Field Attack**: Adding ghost field `{ isAdmin: true, bypassLimit: true }` to task creation -> Rejected.
7. **Cross-Tenant Calendar Scraping**: User A trying to query `/users/userB/calendar_events` -> PERMISSION_DENIED.
8. **Cross-Tenant Note Tampering**: User A updating note in `/users/userB/notes/secret` -> PERMISSION_DENIED.
9. **Cross-Tenant Project Deletion**: User A deleting project at `/users/userB/projects/proj1` -> PERMISSION_DENIED.
10. **Unauthenticated Profile Write**: Anonymous write to `/users/user123` -> PERMISSION_DENIED.
11. **Cross-Tenant Goal Milestone Manipulation**: User A modifying `/users/userB/goals/goal1` -> PERMISSION_DENIED.
12. **Blanket Query Bypass**: Querying `users` root collection directly -> PERMISSION_DENIED (`match /{document=**} { allow read, write: if false; }`).

## 3. Security Assertions
- `allow read, write: if request.auth != null && request.auth.uid == userId;` scoped precisely under `/users/{userId}`.
- All documents inside subcollections validate that `request.auth.uid == userId`.
