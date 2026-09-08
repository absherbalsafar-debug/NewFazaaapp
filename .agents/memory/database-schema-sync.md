---
name: Non-destructive schema sync
description: Development database behavior when Drizzle detects unrelated destructive changes.
---

When adding new tables to the development database, do not use a forceful Drizzle push if it asks to truncate existing data for an unrelated constraint. Apply verified additive schema changes without touching the existing rows, then keep the Drizzle schema aligned for future publish-time diffs.

**Why:** The existing email token table can contain rows that Drizzle wants to truncate merely to add an unrelated unique constraint; accepting that prompt would delete live development data.

**How to apply:** Prefer additive DDL for new tables and nullable columns when a schema push is blocked by an unrelated destructive prompt. Revisit the pre-existing constraint separately with an explicit data migration and user approval if it is actually required.