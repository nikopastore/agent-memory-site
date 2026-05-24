---
title: Incident Response Handoff
type: procedure
status: active
visibility: public
sensitivity: none
tags: [procedure, incident, oncall, handoff]
date: 2026-04-01
---

# Incident Response Handoff

When the [[Customer Support Agent v2]] decides a ticket is beyond tier-1, it writes a handoff note into `handoffs/` and pages the on-call human.

## What the agent writes

```yaml
---
title: "Handoff — {{ ticket_id }} {{ short_description }}"
type: handoff
status: open
visibility: team
sensitivity: personal     # customer transcripts contain PII
tags: [handoff, customer]
related: [{{ related-note-slugs }}]
date: {{ today }}
---
```

Body fields, in order:

1. **One-sentence summary** — what the customer wants.
2. **What the agent tried** — search queries, retrieved chunk_ids, why each failed.
3. **What the agent thinks is needed** — best-guess root cause + which procedure (if any) applies.
4. **Customer transcript** — raw, redacted on emit (we ship `--mode redacted` for any artifact that leaves this vault).
5. **Suggested next step** — concrete, human-actionable.

## What the on-call human does

1. Read the summary.
2. Skim sections 2–3 to decide if the agent's diagnosis is right.
3. Take over the ticket. Update the handoff with the actual resolution.
4. If a new pattern is emerging, file a new note under `procedures/` or amend an existing one — the agent learns next rebuild.

## Related

- [[Frontend Agent Handoff — 2026-05]]
- [[Weekly Agent Memory Review]]
