# Supabase Configuration for Kepler Express Ops

This directory contains SQL schema and configuration for the Supabase backend.

## Files

### schema.sql
Complete PostgreSQL schema for Kepler Express Ops.

**How to deploy:**
1. Open Supabase project dashboard
2. Go to SQL Editor
3. Create a new query
4. Paste the entire contents of `schema.sql`
5. Run the query

**What it creates:**
- 9 production tables with constraints
- 4 reporting views
- Row-level security policies
- Automatic timestamp triggers
- Indexes for performance

### SCHEMA.md
Comprehensive documentation of the data model and design decisions.

## Setup Checklist

- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Configure authentication
- [ ] Create test organization
- [ ] Create test user account
- [ ] Export environment variables

## Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Quick Start

1. Deploy schema.sql to Supabase
2. Add credentials to `.env.local`
3. Test connection in React app
4. Create first organization
5. Invite team members

## RLS Policies

All tables have Row-Level Security enabled. Users can only access:
- Their own profile
- Data from their organization
- Based on their role (admin/manager/accountant/driver)

## Security Notes

- Never expose VITE_SUPABASE_URL — it's public
- Use JWT tokens in VITE_SUPABASE_ANON_KEY for public access
- Service role key (not included) has admin access
- All user data is scoped by organization_id
- RLS policies enforce access at database level

## Reporting

Use the views for dashboards:
- `mission_profitability` — Mission margins
- `invoice_status_detail` — Payment tracking
- `vehicle_health_status` — Fleet maintenance
- `driver_performance` — Team metrics

## Support

For schema changes or issues, see SCHEMA.md for details.
