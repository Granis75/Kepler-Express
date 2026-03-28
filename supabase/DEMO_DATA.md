# Demo Data Strategy

## Principles

- Use one dedicated demo organization with fixed UUIDs so reseeding is predictable.
- Keep all seeded content in Supabase SQL files, not in UI components.
- Use relative dates so overdue invoices, in-progress work, and maintenance alerts stay demoable over time.
- Cover a small, realistic French transport operation instead of random placeholder content.

## Included Demo Scenarios

- One overdue invoice with no payment recorded.
- One partial invoice with a real payment trail.
- One driver-advanced expense still pending reimbursement.
- One vehicle close to its service threshold.
- One clearly profitable delivered mission.
- One low-margin delivered mission.

## Seeded Business Context

The dataset represents a small French logistics operator with:

- 4 active clients in Lyon, Lille, Marseille, and Bordeaux
- 3 active drivers
- 3 vehicles with realistic mileage and maintenance history
- 5 missions across delivered, in-progress, and assigned states
- operational expenses tied to live missions plus a maintenance expense
- 4 invoices and 2 payments with coherent billing states

## How To Use

1. Run `schema.sql` in Supabase first.
2. Create a dedicated demo user in Supabase Auth.
3. Copy that auth user UUID into the `app.demo_user_id` line in:
   `demo_seed.sql`
   `demo_reset.sql`
4. Run `demo_seed.sql`.

`demo_seed.sql` already clears the previous demo organization before inserting fresh records, so rerunning it is safe.

## Reset

Run `demo_reset.sql` to remove the demo organization data and the linked demo profile.

## Notes

- The seed is designed for the Supabase-backed modules: clients, missions, expenses, vehicles, invoices, payments, and maintenance history.
- Amounts and statuses are intentionally aligned so invoicing and profitability examples remain believable in a live demo.
