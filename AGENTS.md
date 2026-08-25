# Slow Train professional development policy

This policy applies to the entire repository. Treat Slow Train as a professional
full-stack application prototype, not as a static design mock or a single HTML
demo.

## Required implementation standard

- Implement every requested feature as real application code. Do not satisfy a
  request with a visual-only button, hard-coded operational data, or an
  in-memory placeholder unless the user explicitly requests a visual mock.
- For durable features, implement the complete vertical slice as applicable:
  database schema and migration, server-side business rule, API route,
  authorization, web UI, mobile UI, audit trail, and automated test.
- Keep create, read/list, update, and delete operations independently callable.
  Each operation must target one resource or record, validate its own input,
  enforce its own authorization, and return an explicit result.
- Keep additions, edits, deletions, approvals, rejections, grants, revocations,
  opening, and closing as separate actions when they have different business
  meanings. Do not hide multiple unrelated mutations behind one generic action.
- Administrators must be able to manage each supported resource individually.
  Parent accounts may access and change only records they own unless a specific
  rule grants additional access.
- Persist operational data in D1 through the repository layer. Source-embedded
  data is permitted only as clearly identified development seed data.
- Record important mutations in `audit_logs`, including actor, action, target,
  timestamp, and relevant before/after context when appropriate.
- Enforce booking capacity, duplicate prevention, deadlines, wait-list
  promotion, ticket consumption, and other invariants on the server. Never rely
  on a disabled UI button as the final safeguard.
- Use atomic database conditions or transactions for concurrency-sensitive
  operations so simultaneous requests cannot exceed capacity or duplicate a
  reservation.
- Clearly distinguish implemented behavior from external integrations. SMS,
  push delivery, store signing, and similar provider work must not be reported
  as complete until the real provider is connected and tested.
- Never commit credentials, access tokens, private keys, production personal
  data, or generated local database state.

## Change workflow

1. Inspect the current implementation and affected data model before editing.
2. Implement additions, modifications, and removals in the smallest coherent
   feature modules rather than accumulating unrelated logic in one file.
3. Update `docs/FEATURE-MATRIX.md` and developer handoff documentation whenever
   feature status, API behavior, permissions, or an external dependency changes.
4. Add or update tests for the changed business rules and failure paths.
5. Run web type checking, mobile type checking, API integration tests, and the
   production build in proportion to the change.
6. Do not call a feature complete while required server, persistence,
   authorization, or failure handling is missing.

## Git and GitHub history

- Create a feature branch from the latest `main` for each user-requested task.
- Split commits by functional responsibility. Examples include database,
  authentication, booking, admin CRUD, web UI, mobile UI, tests, and docs.
- Do not squash functionally separate commits when preserving development
  history. Use a normal merge so the feature commits remain visible on `main`.
- Stage only the files that belong to the current functional commit.
- After validation, push the branch to
  `kimjm9312/slow-train-taekwondo-preview`, open a pull request, and merge the
  completed work into `main` under the user's standing instruction to save
  Slow Train changes to GitHub automatically.
- Verify the remote `main` commit and changed file list after merging. Do not
  report GitHub completion based only on a local commit.

## Completion report

Report what is fully implemented, what was tested, what was saved to GitHub,
and what still requires an external service or store-release step. Avoid
describing a prototype as a production-ready release when those steps remain.
