# Kepler Express — free-access readiness review (26 October 2026)

## Decision
**NOT READY to enable public self-registration.** The public site serves HTTP 200, but this does not establish a complete authenticated workflow. This is a non-destructive source review, not a live production penetration test.

## Verified in source
- `src/lib/auth.tsx`: `signUp` deliberately throws “Open signup is disabled. Contact Kepler Express for authorized access.”; the login path uses Supabase Auth.
- `src/App.tsx`: workspace routes are protected by auth and a workspace/profile readiness gate.
- `supabase/schema.sql`: an auth-user bootstrap trigger creates an organization/profile, and RLS policies compare `organization_id` with `current_organization_id()` on core tables.
- `supabase/demo_seed.sql` and `demo_reset.sql`: controlled sample data/reset scripts exist; **not** evidence of a public sandbox.
- `package.json`: `npm run build` typechecks and builds the Vite app; no end-to-end user journey test command is defined.

## What remains unverified
1. Which Supabase project the live domain actually uses, whether the code's schema is installed there, and whether its RLS, triggers, table grants, functions, and signup policies match the repository.
2. Two-user cross-organization READ/INSERT/UPDATE/DELETE isolation for every business table (including any additional modules) and authorization of referenced entities across foreign keys.
3. Public signup, email confirmation, user bootstrap, first login, refresh/logout, password reset, and recovery from interrupted signup.
4. One complete fictional client → mission → expense → invoice → payment journey with persistence and financial totals; exports and mobile layout.
5. Abuse controls for public registrations and operational hosting costs.

## Minimal safe release sequence
1. Resolve the *actual* backend/project used by production and verify authorization to inspect it. Never paste secret credentials into tickets or the repo.
2. Inspect live RLS and function grants read-only. Test with **two isolated test identities** in a separate staging project, including unauthorized cross-tenant operations.
3. Verify authenticated product journey and bootstrap. Fix confirmed failures on a branch with tests.
4. Only after checks pass, implement a user-facing free sign-up flow, rate limits/CAPTCHA and account-deletion policy as needed; test against staging.
5. Stage and validate a release before production. Keep `signUp` blocked in production until all release gates pass.

## Scope discipline
No change to production access, Supabase SQL, secrets, user data, portfolio design, billing, donation features or repository visibility is authorized by this audit. No claim of a currently free sign-up flow should be published.
