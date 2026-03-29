# Kepler Express Ops — Data Model V1

Comprehensive business data model for logistics operations system.

## Overview

The data model is designed to support logistics operations for small transport companies working with small parcels and pallets across France and Europe. It's structured around 10 core entities with clear relationships and business logic.

**Key Principles:**
- **snake_case** for database-oriented field names (Supabase integration)
- **TypeScript-first** with full type safety
- **Normalized relationships** with minimal duplication
- **Business rule validation** built into domain logic
- **Calculation-friendly** for profitability and performance metrics

---

## Core Entities

### 1. **Profile** (User)

Organization members who use the system.

```typescript
interface Profile {
  profile_id: string          // UUID
  user_id: string             // From Supabase Auth
  organization_id: string     // Parent organization
  role: UserRole              // admin | manager | accountant | driver
  name: string                // Full name
  email: string               // Unique email
  phone?: string              // Optional phone
  status: UserStatus          // active | inactive | invited
  avatar_url?: string         // Profile picture URL
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum UserRole {
  Admin = 'admin',            // Full system access
  Manager = 'manager',        // Operations management
  Accountant = 'accountant',  // Financial management
  Driver = 'driver',          // Driver operations
}

enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
}
```

**Relationships:**
- One Profile → One Organization
- One Profile → One Supabase Auth User

---

### 2. **Client**

Companies that request transport services.

```typescript
interface Client {
  client_id: string           // UUID
  organization_id: string     // Parent organization
  name: string                // Company name
  email: string               // Business email
  phone: string               // Main contact
  address: string             // Street address
  city: string                // City
  postal_code: string         // Postal code
  country: string             // Country (ISO)
  vat_number?: string         // Optional VAT ID
  status: ClientStatus        // active | inactive | archived
  notes?: string              // Internal notes
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum ClientStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}
```

**Relationships:**
- One Client → Many Missions
- One Client → Many Invoices
- One Client ← One Organization

**Constraints:**
- Email and phone are required
- Name must be 2-150 characters

---

### 3. **Driver**

Team members who operate vehicles.

```typescript
interface Driver {
  driver_id: string           // UUID
  organization_id: string     // Parent organization
  name: string                // Full name
  email?: string              // Optional email
  phone: string               // Required phone
  license_number: string      // License ID
  license_expiry: string      // ISO date (YYYY-MM-DD)
  status: DriverStatus        // active | inactive | on_leave | suspended
  date_of_birth?: string      // ISO date for age tracking
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum DriverStatus {
  Active = 'active',
  Inactive = 'inactive',
  OnLeave = 'on_leave',
  Suspended = 'suspended',
}
```

**Relationships:**
- One Driver → Many Missions
- One Driver → Many Expenses (driver advances)
- One Driver ← One Organization

**Validation:**
- License expiry must be in the future
- Can only be assigned to missions if status is Active

**Thresholds:**
- Warning if license expires within 90 days
- Critical warning if expires within 30 days

---

### 4. **Vehicle**

Fleet assets for transport operations.

```typescript
interface Vehicle {
  vehicle_id: string          // UUID
  organization_id: string     // Parent organization
  name: string                // Vehicle name/identifier
  license_plate: string       // License plate (e.g., FT-218-KP)
  registration_number: string // Registration ID
  vehicle_type: VehicleType   // van | truck | car | trailer
  status: VehicleStatus       // active | watch | service_due | out_of_service | retired
  mileage_current: number     // Current odometer reading
  mileage_last_service: number // Odometer when last serviced
  next_service_mileage: number // Scheduled service mileage
  capacity_kg?: number        // Max weight capacity
  capacity_m3?: number        // Max volume capacity
  last_service_date?: string  // ISO date of last service
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum VehicleType {
  Van = 'van',
  Truck = 'truck',
  Car = 'car',
  Trailer = 'trailer',
}

enum VehicleStatus {
  Active = 'active',          // Ready for missions
  Watch = 'watch',            // Maintenance needed soon
  ServiceDue = 'service_due', // Service overdue
  OutOfService = 'out_of_service', // Temporarily unavailable
  Retired = 'retired',        // End of life
}
```

**Relationships:**
- One Vehicle → Many Missions
- One Vehicle → Many Expenses (fuel, maintenance)
- One Vehicle → Many Maintenance Records
- One Vehicle ← One Organization

**Maintenance Logic:**
- `next_service_mileage` - target mileage for scheduled service
- Warning threshold: 2,000 km before service
- Critical threshold: 500 km before service
- Status auto-determined by mileage comparison

**Validation:**
- `next_service_mileage` must be > `mileage_current`
- Can only be assigned to missions if status is Active

---

### 5. **Mission**

Transport jobs connecting clients, drivers, and vehicles.

```typescript
interface Mission {
  mission_id: string          // UUID
  organization_id: string     // Parent organization
  client_id: string           // FK → Client (required)
  driver_id?: string          // FK → Driver (optional initially)
  vehicle_id?: string         // FK → Vehicle (optional initially)
  reference: string           // M-202603-0001 format (auto-generated)
  status: MissionStatus       // planned | assigned | in_progress | delivered | issue | cancelled
  revenue_amount: number      // Client billing amount (EUR)
  estimated_cost_amount: number // Expected expenses
  actual_cost_amount?: number // Calculated from expenses
  departure_location: string  // Origin address
  arrival_location: string    // Destination address
  departure_datetime: string  // ISO datetime
  arrival_datetime?: string   // ISO datetime when completed
  notes?: string              // Internal notes
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum MissionStatus {
  Planned = 'planned',        // Just created, unassigned
  Assigned = 'assigned',      // Driver & vehicle assigned
  InProgress = 'in_progress', // Mission started
  Delivered = 'delivered',    // Completed successfully
  Issue = 'issue',            // Problem occurred
  Cancelled = 'cancelled',    // Cancelled by customer or ops
}
```

**Relationships:**
- Many Missions ← One Client
- One Mission ← One Driver (optional)
- One Mission ← One Vehicle (optional)
- One Mission → Many Expenses
- One Mission → Many Mission Stops
- One Mission → Many Invoices (many-to-many via invoice.mission_ids)

**Business Rules:**
- Revenue must be 50-10,000 EUR
- Estimated cost cannot exceed revenue
- Departure location ≠ arrival location
- Departure datetime cannot be in past at creation
- Can only progress through status states (no backward transitions)
- Can only assign Active driver and Active vehicle

**Profitability Calculation:**
```
estimated_margin = revenue_amount - estimated_cost_amount
actual_margin = revenue_amount - actual_cost_amount
margin_percentage = (actual_margin / revenue_amount) × 100
is_profitable = revenue_amount > actual_cost_amount
```

**Warnings:**
- Low profitability if margin < 15%

---

### 6. **Mission Stop** (Optional)

Waypoints within a mission (pickup/delivery locations).

```typescript
interface MissionStop {
  stop_id: string             // UUID
  mission_id: string          // FK → Mission
  sequence_number: number     // Order in mission (1, 2, 3...)
  location: string            // Address
  stop_type: MissionStopType  // pickup | delivery | transfer
  completed_at?: string       // ISO datetime when completed
  created_at: string          // ISO timestamp
}

enum MissionStopType {
  Pickup = 'pickup',
  Delivery = 'delivery',
  Transfer = 'transfer',
}
```

**Relationships:**
- Many Stops ← One Mission

**Notes:**
- Optional in V1 — missions can be simple point-to-point
- Can be added if multi-stop support needed

---

### 7. **Expense**

Cost tracking for missions and fleet operations.

```typescript
interface Expense {
  expense_id: string          // UUID
  organization_id: string     // Parent organization
  mission_id?: string         // FK → Mission (optional)
  driver_id?: string          // FK → Driver (optional)
  vehicle_id?: string         // FK → Vehicle (optional)
  type: ExpenseType           // fuel | tolls | maintenance | mission_expense | parking | meal | other
  amount: number              // Cost in currency (EUR)
  currency: Currency          // EUR (default) | USD | GBP
  advanced_by_driver: boolean // True = driver paid upfront (reimbursement needed)
  reimbursement_status: ReimbursementStatus // pending | approved | paid | rejected
  receipt_attached: boolean   // Documentation status
  description?: string        // Note about expense
  expense_date: string        // ISO date when expense occurred
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum ExpenseType {
  Fuel = 'fuel',
  Tolls = 'tolls',
  Maintenance = 'maintenance',
  MissionExpense = 'mission_expense',
  Parking = 'parking',
  Meal = 'meal',
  Other = 'other',
}

enum ReimbursementStatus {
  Pending = 'pending',
  Approved = 'approved',
  Paid = 'paid',
  Rejected = 'rejected',
}

enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}
```

**Relationships:**
- Many Expenses ← One Mission
- Many Expenses ← One Driver
- Many Expenses ← One Vehicle
- One Expense ← One Organization

**Business Rules:**
- Amount cannot exceed 5,000 EUR
- Daily total cannot exceed 50,000 EUR
- Driver-advanced expenses create reimbursement liability
- Missing receipts should be flagged for follow-up
- expense_date cannot be in future

**Driver Advance Logic:**
- `advanced_by_driver = true` means driver paid cash upfront
- Creates liability for reimbursement
- Requires receipt_attached for audit trail
- Warning if driver total advances ≥ 500 EUR
- Critical warning if ≥ 2,000 EUR

**Mission Cost Calculation:**
```
actual_cost_amount = SUM(expenses WHERE mission_id = this_mission_id)
```

---

### 8. **Maintenance Record**

Vehicle service history and scheduling.

```typescript
interface MaintenanceRecord {
  maintenance_id: string      // UUID
  vehicle_id: string          // FK → Vehicle
  type: MaintenanceType       // scheduled | unscheduled | repair | inspection
  description: string         // Service description
  cost_amount: number         // Service cost (EUR)
  currency: Currency          // Currency (EUR default)
  mileage_at_service: number  // Odometer reading at service
  next_service_mileage: number // When to service next
  service_date: string        // ISO date of service
  completed_at?: string       // ISO datetime when actually done
  created_at: string          // ISO timestamp
}

enum MaintenanceType {
  Scheduled = 'scheduled',    // Planned maintenance
  Unscheduled = 'unscheduled', // Routine repairs
  Repair = 'repair',          // Breakdown repair
  Inspection = 'inspection',  // Technical inspection
}
```

**Relationships:**
- Many Records ← One Vehicle

**Integration:**
- Updates vehicle record's mileage_last_service and next_service_mileage
- Triggers vehicle status update (from ServiceDue → Active if on track)

---

### 9. **Invoice**

Client billing documents.

```typescript
interface Invoice {
  invoice_id: string          // UUID
  organization_id: string     // Parent organization
  client_id: string           // FK → Client
  invoice_number: string      // INV-2026-0001 format (auto-generated)
  status: InvoiceStatus       // draft | sent | partial | paid | overdue | cancelled
  mission_ids: string[]       // Array of linked mission IDs
  amount_total: number        // Total invoice amount (EUR)
  amount_paid: number         // Total payments received
  currency: Currency          // Currency (EUR)
  issued_date: string         // ISO date when created
  due_date: string            // ISO date when payment due
  sent_date?: string          // ISO date when sent to client
  paid_date?: string          // ISO date when fully paid
  notes?: string              // Invoice notes
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
}

enum InvoiceStatus {
  Draft = 'draft',            // Not yet sent
  Sent = 'sent',              // Sent to client
  Partial = 'partial',        // Partial payment received
  Paid = 'paid',              // Fully paid
  Overdue = 'overdue',        // Past due date and unpaid
  Cancelled = 'cancelled',    // Cancelled
}
```

**Relationships:**
- Many Invoices ← One Client
- Many Invoices ← Many Missions (via mission_ids array)
- One Invoice → Many Payments
- One Invoice ← One Organization

**Business Rules:**
- mission_ids must contain valid missions for this client
- amount_total must match sum of mission revenues (simplification for V1)
- due_date must be in future at creation
- Status is auto-determined:
  - If amount_paid = 0: Sent or Overdue (depending on due_date)
  - If amount_paid < amount_total: Partial
  - If amount_paid ≥ amount_total: Paid

**Overdue Logic:**
- Invoice becomes Overdue if due_date < today AND amount_paid < amount_total
- Warning if overdue for 30+ days
- Critical warning if overdue for 60+ days

**Remaining Balance:**
```
remaining = amount_total - amount_paid
payment_percentage = (amount_paid / amount_total) × 100
```

---

### 10. **Payment**

Payment records for invoices.

```typescript
interface Payment {
  payment_id: string          // UUID
  invoice_id: string          // FK → Invoice
  amount: number              // Payment amount (EUR)
  currency: Currency          // Currency
  payment_method: PaymentMethod // How payment was received
  payment_date: string        // ISO date of payment
  reference?: string          // Bank/check reference
  notes?: string              // Payment notes
  created_at: string          // ISO timestamp
}

enum PaymentMethod {
  BankTransfer = 'bank_transfer',
  Check = 'check',
  Cash = 'cash',
  Card = 'card',
  Other = 'other',
}
```

**Relationships:**
- Many Payments ← One Invoice

**Validation:**
- Payment amount cannot exceed invoice amount_total
- Sum of all payments for invoice ≤ amount_total

---

## Aggregated Types

These are calculated/composed types used in dashboards and reports.

### MissionProfitability

```typescript
interface MissionProfitability {
  mission_id: string
  revenue: number
  estimated_cost: number
  actual_cost?: number
  estimated_margin: number
  actual_margin?: number
  margin_percentage: number
  is_profitable: boolean
}
```

### DriverPerformance

```typescript
interface DriverPerformance {
  driver_id: string
  missions_completed: number
  missions_in_progress: number
  total_revenue_driven: number
  total_expenses_advanced: number
  pending_reimbursements: number
  average_mission_value: number
}
```

### VehicleHealthStatus

```typescript
interface VehicleHealthStatus {
  vehicle_id: string
  mileage_current: number
  mileage_until_service: number
  service_overdue: boolean
  last_service_date?: string
  missions_completed: number
  total_maintenance_cost: number
  days_in_service: number
}
```

### FinancialSnapshot

```typescript
interface FinancialSnapshot {
  period_start: string
  period_end: string
  total_revenue: number
  total_costs: number
  total_margin: number
  margin_percentage: number
  invoice_revenue: number
  outstanding_invoices: number
  unpaid_driver_advances: number
}
```

---

## Business Rules & Constraints

### Mission Rules

- Revenue must be between 50-10,000 EUR
- Estimated cost ≤ revenue
- Departure ≠ arrival
- Can only be assigned if driver and vehicle are Active
- Status progression: Planned → Assigned → InProgress → Delivered
- Only In Progress missions can be marked Delivered
- Profitable margin threshold: 15% minimum

### Invoice Rules

- Due date must be in future
- Can only be created with valid client
- Must have at least one linked mission
- Payment amount ≤ remaining balance
- Auto-status based on payment percentage

### Expense Rules

- Amount must be greater than 0 EUR and no more than 5,000 EUR per transaction
- Daily limit: 50,000 EUR
- Driver-advanced expenses can be pending, approved, paid, or rejected
- Missing receipts should remain visible for operational follow-up

### Vehicle Rules

- Can only be assigned Active vehicles
- Next service mileage > current mileage
- Warning at 2,000 km before service
- Critical at 500 km before service

### Driver Rules

- Can only be assigned Active drivers
- License must not be expired
- License expiry warning: 90 days
- License expiry critical: 30 days

---

## Validation & Thresholds

All defined in `src/lib/constants.ts`:

```typescript
MISSION_MIN_REVENUE = 50
MISSION_MAX_REVENUE = 10,000
MISSION_PROFITABLE_MIN_MARGIN = 15%

EXPENSE_MAX_AMOUNT = 5,000
EXPENSE_DAILY_LIMIT = 50,000

DRIVER_ADVANCE_WARNING_THRESHOLD = 500
DRIVER_ADVANCE_CRITICAL_THRESHOLD = 2,000

INVOICE_OVERDUE_THRESHOLD_DAYS = 30
INVOICE_CRITICAL_OVERDUE_DAYS = 60

SERVICE_WARNING_THRESHOLD_KM = 2,000
SERVICE_CRITICAL_THRESHOLD_KM = 500

LICENSE_EXPIRY_WARNING_DAYS = 90
LICENSE_EXPIRY_CRITICAL_DAYS = 30
```

---

## File Organization

```
src/
├── types/
│   ├── index.ts              # Central type exports
│   ├── enums.ts              # All status enums
│   ├── entities.ts           # Core entity interfaces
│   └── relationships.ts      # Computed/aggregate types
│
├── lib/
│   ├── utils.ts              # Formatting helpers
│   ├── constants.ts          # Business thresholds
│   ├── domain.ts             # Status configs & business logic
│   ├── calculations.ts       # Financial & performance calcs
│   └── validators.ts         # Business rule validation
│
└── pages/ & components/      # UI components (uses types above)
```

---

## Database Schema Notes (Supabase)

When implementing in Supabase, use:

- **snake_case** column names (already defined in types)
- **UUID** for all IDs (using `gen_random_uuid()`)
- **TIMESTAMPS** for created_at/updated_at (using `now()`)
- **ENUMS** for status fields if database supports
- **FOREIGN KEYS** for relationships
- **CHECK CONSTRAINTS** for business rules (e.g., `revenue > 0`)
- **INDEXES** on frequently queried fields (client_id, driver_id, status)

---

## Next Steps

1. ✅ Data model defined
2. ⏳ Supabase database schema creation
3. ⏳ Supabase Auth integration
4. ⏳ API layer (Supabase client setup)
5. ⏳ Form components with validation
6. ⏳ Dashboard with real data
7. ⏳ Data seeding for development
