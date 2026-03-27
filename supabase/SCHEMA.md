# Kepler Express Ops — Supabase SQL Schema

Production-ready PostgreSQL schema for the Kepler Express Ops logistics operations system.

## Overview

This schema implements the complete data model for managing:
- Organization members and access control
- Client relationships
- Driver and vehicle fleet management  
- Mission dispatch and tracking
- Expense tracking with driver advances
- Vehicle maintenance history
- Invoice generation and payment tracking

**Schema Features:**
- ✅ UUID primary keys for uniqueness
- ✅ Multi-tenancy via organization_id
- ✅ Full Row-Level Security (RLS)
- ✅ Automatic timestamp management
- ✅ Business rule constraints
- ✅ Comprehensive indexes
- ✅ Useful reporting views

## Tables

### 1. Profiles
User accounts linked to Supabase Auth.

**Columns:**
- `profile_id` — UUID primary key
- `user_id` — Reference to auth.users
- `organization_id` — Tenant isolation
- `role` — admin | manager | accountant | driver
- `status` — active | inactive | invited
- `name`, `email`, `phone`, `avatar_url`
- `created_at`, `updated_at`

**Security:** Users can only view/edit their own profile.

---

### 2. Clients
Customer companies.

**Columns:**
- `client_id` — UUID primary key
- `organization_id` — Tenant isolation
- `name`, `email`, `phone`
- `address`, `city`, `postal_code`, `country`
- `vat_number` — Optional VAT ID
- `status` — active | inactive | archived
- `notes`
- `created_at`, `updated_at`

**Constraints:**
- Email unique per organization
- Required fields: name, email, phone, address

**Security:** Users see only clients from their organization. Managers can create/edit.

---

### 3. Drivers
Team members.

**Columns:**
- `driver_id` — UUID primary key
- `organization_id` — Tenant isolation
- `name`, `email`, `phone`
- `license_number`, `license_expiry`
- `status` — active | inactive | on_leave | suspended
- `date_of_birth`
- `created_at`, `updated_at`

**Constraints:**
- License expiry must be in the future
- Only active drivers can be assigned to missions

**Security:** Users see drivers from their org. Managers can manage.

---

### 4. Vehicles
Fleet assets.

**Columns:**
- `vehicle_id` — UUID primary key
- `organization_id` — Tenant isolation
- `name` — Vehicle identifier
- `license_plate`, `registration_number`
- `vehicle_type` — van | truck | car | trailer
- `status` — active | watch | service_due | out_of_service | retired
- `mileage_current` — Current odometer reading
- `mileage_last_service` — When last serviced
- `next_service_mileage` — Scheduled service mileage
- `capacity_kg`, `capacity_m3`
- `last_service_date`
- `created_at`, `updated_at`

**Constraints:**
- `next_service_mileage > mileage_current`
- Status derived from mileage vs next_service_mileage
- License plate unique per organization

**Security:** Users see vehicles from their org. Managers can manage.

---

### 5. Missions
Transport jobs.

**Columns:**
- `mission_id` — UUID primary key
- `organization_id` — Tenant isolation
- `client_id` — Required foreign key
- `driver_id` — Optional, references drivers
- `vehicle_id` — Optional, references vehicles
- `reference` — Auto-generated (M-YYYYMM-NNNN)
- `status` — planned | assigned | in_progress | delivered | issue | cancelled
- `revenue_amount` — 50-10,000 EUR
- `estimated_cost_amount` — ≤ revenue
- `actual_cost_amount` — Calculated from expenses
- `currency` — EUR | USD | GBP
- `departure_location`, `arrival_location` — Must differ
- `departure_datetime`, `arrival_datetime`
- `notes`
- `created_at`, `updated_at`

**Constraints:**
- Revenue: 50-10,000 EUR
- Estimated cost ≤ revenue
- Only active drivers/vehicles assignable

**Security:** Users see missions from org. Members can create/update.

---

### 6. Expenses
Cost tracking.

**Columns:**
- `expense_id` — UUID primary key
- `organization_id` — Tenant isolation
- `mission_id` — Optional foreign key
- `driver_id` — Optional foreign key
- `vehicle_id` — Optional foreign key
- `type` — fuel | tolls | maintenance | mission_expense | parking | other
- `amount` — 1-5,000 EUR
- `currency` — EUR | USD | GBP
- `advanced_by_driver` — Driver paid upfront?
- `receipt_attached` — Documentation
- `description`
- `expense_date` — Must be past or today
- `created_at`, `updated_at`

**Constraints:**
- Amount: 1-5,000 EUR per transaction
- Driver advances require receipt
- expense_date cannot be future

**Business Logic:**
- Driver advances create reimbursement liability
- Receipt required for audit trail

**Security:** Users see expenses from org. Members can create/update.

---

### 7. Maintenance Records
Vehicle service history.

**Columns:**
- `maintenance_id` — UUID primary key
- `vehicle_id` — Foreign key (cascade delete)
- `organization_id` — Tenant isolation
- `type` — scheduled | unscheduled | repair | inspection
- `description` — Service details
- `cost_amount` — Service cost
- `currency` — EUR | USD | GBP
- `mileage_at_service` — Odometer when serviced
- `next_service_mileage` — When to service next
- `service_date` — When service occurred
- `completed_at` — When actually completed
- `created_at`

**Relationships:**
- One maintenance record per vehicle event
- Vehicle foreign key cascades on delete

**Security:** Users see records from org. Managers can manage.

---

### 8. Invoices
Client billing.

**Columns:**
- `invoice_id` — UUID primary key
- `organization_id` — Tenant isolation
- `client_id` — Foreign key (restrict delete)
- `invoice_number` — Auto-generated (INV-YYYY-NNNN)
- `status` — draft | sent | partial | paid | overdue | cancelled
- `mission_ids` — Array of linked mission IDs
- `amount_total` — Invoice total
- `amount_paid` — Total payments received
- `currency` — EUR | USD | GBP
- `issued_date`, `due_date`, `sent_date`, `paid_date`
- `notes`
- `created_at`, `updated_at`

**Constraints:**
- due_date ≥ issued_date
- amount_paid ≤ amount_total
- invoice_number unique per organization

**Status Logic:**
- Auto-calculated based on amount_paid vs amount_total
- Overdue if past due_date with unpaid balance

**Security:** Users see invoices from org. Accountants/managers can manage.

---

### 9. Payments
Payment records.

**Columns:**
- `payment_id` — UUID primary key
- `invoice_id` — Foreign key (cascade delete)
- `organization_id` — Tenant isolation
- `amount` — Payment amount
- `currency` — EUR | USD | GBP
- `payment_method` — bank_transfer | check | cash | card | other
- `payment_date` — When payment received
- `reference` — Bank/check reference
- `notes`
- `created_at`

**Relationships:**
- Many payments per invoice
- Cascade delete if invoice deleted
- Payments update invoice's amount_paid

**Security:** Users see payments from org. Accountants/managers can manage.

---

## Indexes

Performance indexes for common queries:

```
Profiles:
  - user_id (authentication lookup)
  - organization_id (multi-tenancy)
  - status (filtering)

Clients:
  - organization_id, status
  - name (search)

Drivers:
  - organization_id, status
  - license_expiry (compliance)

Vehicles:
  - organization_id, status
  - next_service_mileage (maintenance tracking)
  - license_plate (search)

Missions:
  - organization_id, client_id, driver_id, vehicle_id
  - status, departure_datetime
  - created_at (reporting)

Expenses:
  - mission_id (cost aggregation)
  - driver_id (advances tracking)
  - vehicle_id (fleet costs)
  - type, advanced_by_driver
  - expense_date (reporting)

Maintenance Records:
  - vehicle_id (history)
  - service_date (reporting)

Invoices:
  - client_id, status
  - due_date (overdue detection)
  - created_at (reporting)

Payments:
  - invoice_id (lookup)
  - payment_date (reconciliation)
```

---

## Views for Reporting

### 1. mission_profitability
Calculates mission margins and profitability.

```sql
SELECT 
  - mission_id, organization_id
  - revenue_amount, estimated_cost, actual_cost
  - estimated_margin, actual_margin, margin_percentage
FROM mission_profitability
```

---

### 2. invoice_status_detail
Tracks invoice payment status.

```sql
SELECT
  - invoice_id, organization_id, status
  - amount_total, total_paid, remaining_balance
  - payment_percentage, calculated_status
  - due_date, days_overdue
FROM invoice_status_detail
```

---

### 3. vehicle_health_status
Fleet maintenance oversight.

```sql
SELECT
  - vehicle_id, organization_id, name
  - mileage_current, mileage_until_service
  - health_status (service_due, watch, active)
  - missions_completed, total_maintenance_cost
FROM vehicle_health_status
```

---

### 4. driver_performance
Team performance metrics.

```sql
SELECT
  - driver_id, organization_id, name
  - missions_completed, missions_in_progress
  - total_revenue_driven, avg_mission_value
  - total_advances, total_missions_assigned
FROM driver_performance
```

---

## Row-Level Security (RLS)

All tables have RLS enabled following this pattern:

**Profile:**
- Users can view/edit only their own profile

**Clients, Drivers, Vehicles, Missions, Expenses, Invoices, Payments:**
- All users can view data from their organization only
- Admins/managers can create/update
- Accountants can manage invoice/payment data

**Maintenance Records:**
- All users can view from their organization
- Admins/managers can create/update

**Rationale:**
- Multi-tenant isolation via organization_id
- Role-based access control (admin > manager > accountant > driver)
- Users cannot access data from other organizations

---

## Business Rules in SQL

### Missions
```sql
-- Revenue range
CHECK (revenue_amount > 0 AND revenue_amount <= 10000)

-- Cost cannot exceed revenue
CHECK (estimated_cost_amount >= 0 AND estimated_cost_amount <= revenue_amount)

-- Must have different departure/arrival
CHECK (departure_location != arrival_location)
```

### Expenses
```sql
-- Amount range
CHECK (amount > 0 AND amount <= 5000)

-- Driver advances require receipt
CHECK (NOT advanced_by_driver OR receipt_attached)
```

### Vehicles
```sql
-- Mileage constraints
CHECK (mileage_current >= 0)
CHECK (next_service_mileage > mileage_current)

-- License plate unique per organization
CONSTRAINT unique_license_plate UNIQUE (organization_id, license_plate)
```

### Invoices
```sql
-- Payment cannot exceed total
CHECK (amount_paid >= 0 AND amount_paid <= amount_total)

-- Due date logic
CHECK (due_date >= issued_date)
```

---

## Triggers

### update_updated_at_column()
Automatically maintains `updated_at` on all records.

Applied to tables:
- profiles
- clients
- drivers
- vehicles
- missions
- expenses
- invoices

---

## Multi-Tenancy

All data operations are scoped to `organization_id`:

1. **No cross-organization access** — RLS ensures users only see their org's data
2. **Unique constraints per org** — Email, invoice numbers, license plates unique within org
3. **Foreign keys within org** — Clients, missions, expenses all belong to one org
4. **Reporting isolated** — Views filter by organization_id

---

## Deployment Steps

1. Create a new Supabase project
2. Copy this entire schema to Supabase SQL Editor
3. Execute the full schema
4. Create an organization record (manually or via API)
5. Configure Supabase Auth
6. Deploy application

---

## Performance Notes

- Indexes on foreign keys and common filters
- UUID primary keys for distributed systems
- Denormalized `amount_paid` on invoices (vs. summing payments) for query speed
- Views use left joins for optional relationships
- Created at/updated_at timestamps for sorting and auditing

---

## Future Enhancements

- [ ] Audit log table (all create/update/delete)
- [ ] Activity feed
- [ ] File attachments (receipts, contracts)
- [ ] Mission stops table (multi-leg missions)
- [ ] Driver shift management
- [ ] Vehicle GPS tracking integration
- [ ] SMS/email notifications
- [ ] API rate limiting tables

---

## Notes

- All timestamps in UTC (TIMESTAMP WITH TIME ZONE)
- French locale defaults (currency EUR, country FR)
- Business logic encoded in constraints (not app logic)
- Views support dashboard queries without aggregation in app
- Consider archiving old records instead of deleting
