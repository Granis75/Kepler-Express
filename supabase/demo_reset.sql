-- Kepler Express Ops - Demo Reset
-- Removes the demo dataset created by demo_seed.sql.
--
-- Before running:
-- 1. Replace the placeholder in app.demo_user_id below with the same auth user UUID
--    used for demo_seed.sql.
-- 2. Run this script in the Supabase SQL Editor.

SELECT set_config('app.demo_user_id', '00000000-0000-0000-0000-000000000000', false);
SELECT set_config('app.demo_org_id', '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f000', false);

DO $$
DECLARE
  demo_user_id UUID := current_setting('app.demo_user_id')::uuid;
  demo_org_id UUID := current_setting('app.demo_org_id')::uuid;
BEGIN
  IF demo_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Replace app.demo_user_id with the same auth.users UUID used for demo_seed.sql';
  END IF;

  DELETE FROM payments WHERE organization_id = demo_org_id;
  DELETE FROM invoices WHERE organization_id = demo_org_id;
  DELETE FROM expenses WHERE organization_id = demo_org_id;
  DELETE FROM maintenance_records WHERE organization_id = demo_org_id;
  DELETE FROM missions WHERE organization_id = demo_org_id;
  DELETE FROM vehicles WHERE organization_id = demo_org_id;
  DELETE FROM drivers WHERE organization_id = demo_org_id;
  DELETE FROM clients WHERE organization_id = demo_org_id;
  DELETE FROM profiles WHERE user_id = demo_user_id AND organization_id = demo_org_id;
END $$;
