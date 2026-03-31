-- Test seed for front read checks.
-- Replace app.seed_user_id with a real auth.users UUID before running.
-- Use a dedicated test user if possible: this script upserts profiles.user_id
-- into the test organization below so RLS can read the seeded rows.

SELECT set_config('app.seed_user_id', '5cf146f8-41c8-4fbd-8901-167741b82b5e', false);
SELECT set_config('app.seed_org_id', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2b0000', false);

DO $$
DECLARE
  seed_user_id UUID := current_setting('app.seed_user_id')::uuid;
  seed_org_id UUID := current_setting('app.seed_org_id')::uuid;
BEGIN
  IF seed_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Replace app.seed_user_id with a real auth.users UUID before running seed.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = seed_user_id
  ) THEN
    RAISE EXCEPTION 'The provided seed_user_id (%) does not exist in auth.users', seed_user_id;
  END IF;

  -- Reset test rows.
  DELETE FROM payments WHERE organization_id = seed_org_id;
  DELETE FROM invoices WHERE organization_id = seed_org_id;
  DELETE FROM missions WHERE organization_id = seed_org_id;
  DELETE FROM clients WHERE organization_id = seed_org_id;

  -- Attach test user.
  INSERT INTO profiles (
    user_id,
    organization_id,
    role,
    status,
    name,
    email,
    phone
  )
  SELECT
    seed_user_id,
    seed_org_id,
    'manager',
    'active',
    COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), 'Kepler Test Manager'),
    email,
    '+33 6 10 20 30 40'
  FROM auth.users
  WHERE id = seed_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Test clients.
  INSERT INTO clients (
    client_id,
    organization_id,
    name,
    email,
    phone,
    address,
    city,
    postal_code,
    country,
    vat_number,
    status,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101',
      seed_org_id,
      'Maison Delorme Distribution',
      'logistique@maison-delorme.test',
      '+33 4 72 18 42 10',
      '18 rue de la Soie',
      'Lyon',
      '69003',
      'FR',
      'FR51482937012',
      'active',
      'Distribution textile pour reseau de magasins.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102',
      seed_org_id,
      'PharmaNord Repartition',
      'transport@pharmanord.test',
      '+33 3 20 11 74 55',
      '7 avenue de Rotterdam',
      'Lille',
      '59800',
      'FR',
      'FR83827451096',
      'active',
      'Livraisons sensibles avec contraintes horaires.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103',
      seed_org_id,
      'Azur Frais Reseau',
      'exploitation@azurfrais.test',
      '+33 4 91 63 29 40',
      '42 boulevard du Littoral',
      'Marseille',
      '13015',
      'FR',
      'FR62917432058',
      'active',
      'Approvisionnement quotidien de points de vente.'
    );

  -- Test missions.
  INSERT INTO missions (
    mission_id,
    organization_id,
    client_id,
    driver_id,
    vehicle_id,
    reference,
    status,
    revenue_amount,
    estimated_cost_amount,
    actual_cost_amount,
    currency,
    departure_location,
    arrival_location,
    departure_datetime,
    arrival_datetime,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101',
      NULL,
      NULL,
      'M-2026031001',
      'delivered',
      1480.00,
      430.00,
      430.00,
      'EUR',
      'Lyon',
      'Paris',
      CURRENT_DATE - INTERVAL '14 days' + TIME '05:40',
      CURRENT_DATE - INTERVAL '14 days' + TIME '16:10',
      'Livraison palettes textile avant ouverture magasin.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102',
      NULL,
      NULL,
      'M-2026031002',
      'delivered',
      980.00,
      910.00,
      910.00,
      'EUR',
      'Lille',
      'Strasbourg',
      CURRENT_DATE - INTERVAL '9 days' + TIME '04:50',
      CURRENT_DATE - INTERVAL '8 days' + TIME '13:25',
      'Tournee pharma livree avec marge volontairement serree.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103',
      NULL,
      NULL,
      'M-2026031003',
      'in_progress',
      1260.00,
      520.00,
      NULL,
      'EUR',
      'Marseille',
      'Nice',
      CURRENT_DATE - INTERVAL '1 day' + TIME '06:15',
      NULL,
      'Appro froid en cours avec suivi horaire.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101',
      NULL,
      NULL,
      'M-2026031004',
      'assigned',
      740.00,
      430.00,
      NULL,
      'EUR',
      'Paris',
      'Bordeaux',
      CURRENT_DATE + INTERVAL '2 days' + TIME '07:00',
      NULL,
      'Chargement mobilier programme pour debut de semaine.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103',
      NULL,
      NULL,
      'M-2026031005',
      'delivered',
      690.00,
      610.00,
      610.00,
      'EUR',
      'Aix-en-Provence',
      'Toulon',
      CURRENT_DATE - INTERVAL '6 days' + TIME '06:20',
      CURRENT_DATE - INTERVAL '6 days' + TIME '14:45',
      'Livraison regionale avec solde client encore ouvert.'
    );

  -- Test invoices.
  INSERT INTO invoices (
    invoice_id,
    organization_id,
    client_id,
    invoice_number,
    status,
    mission_ids,
    amount_total,
    amount_paid,
    currency,
    issued_date,
    due_date,
    sent_date,
    paid_date,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101',
      'INV-2026-1001',
      'paid',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid],
      1480.00,
      1480.00,
      'EUR',
      CURRENT_DATE - 21,
      CURRENT_DATE - 7,
      CURRENT_DATE - INTERVAL '20 days' + TIME '09:15',
      CURRENT_DATE - INTERVAL '14 days' + TIME '14:30',
      'Mission rentable reglee en un seul virement.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf402',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102',
      'INV-2026-1002',
      'overdue',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid],
      980.00,
      0.00,
      'EUR',
      CURRENT_DATE - 18,
      CURRENT_DATE - 4,
      CURRENT_DATE - INTERVAL '17 days' + TIME '08:50',
      NULL,
      'Relance client necessaire.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103',
      'INV-2026-1003',
      'partial',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid],
      690.00,
      320.00,
      'EUR',
      CURRENT_DATE - 12,
      CURRENT_DATE + 3,
      CURRENT_DATE - INTERVAL '11 days' + TIME '10:05',
      NULL,
      'Acompte recu, solde attendu sous quelques jours.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf404',
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101',
      'INV-2026-1004',
      'draft',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid],
      740.00,
      0.00,
      'EUR',
      CURRENT_DATE,
      CURRENT_DATE + 14,
      NULL,
      NULL,
      'Facture brouillon prete a etre envoyee.'
    );

  -- Test payments.
  INSERT INTO payments (
    payment_id,
    invoice_id,
    organization_id,
    amount,
    currency,
    payment_method,
    payment_date,
    reference,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf501',
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401',
      seed_org_id,
      1480.00,
      'EUR',
      'bank_transfer',
      CURRENT_DATE - 14,
      'VIR-DELORME-1480',
      'Reglement integral a echeance.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf502',
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403',
      seed_org_id,
      320.00,
      'EUR',
      'bank_transfer',
      CURRENT_DATE - 5,
      'VIR-AZUR-0320',
      'Acompte avant solde final.'
    );
END $$;
