-- Kepler Express Ops - Demo Seed
-- Purpose: create a coherent, resettable demo dataset for a small French
-- logistics company without hardcoding fake content in the UI.
--
-- Before running:
-- 1. Create or identify a dedicated demo user in Supabase Auth.
-- 2. Replace the placeholder in app.demo_user_id below with that auth user UUID.
-- 3. Run this script in the Supabase SQL Editor.

SELECT set_config('app.demo_user_id', '00000000-0000-0000-0000-000000000000', false);
SELECT set_config('app.demo_org_id', '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f000', false);

DO $$
DECLARE
  demo_user_id UUID := current_setting('app.demo_user_id')::uuid;
  demo_org_id UUID := current_setting('app.demo_org_id')::uuid;
BEGIN
  IF demo_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Replace app.demo_user_id with a real auth.users UUID before running demo_seed.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = demo_user_id
  ) THEN
    RAISE EXCEPTION 'The provided demo_user_id (%) does not exist in auth.users', demo_user_id;
  END IF;

  -- Reset the demo organization first so the script is safe to rerun.
  DELETE FROM payments WHERE organization_id = demo_org_id;
  DELETE FROM invoices WHERE organization_id = demo_org_id;
  DELETE FROM expenses WHERE organization_id = demo_org_id;
  DELETE FROM maintenance_records WHERE organization_id = demo_org_id;
  DELETE FROM missions WHERE organization_id = demo_org_id;
  DELETE FROM vehicles WHERE organization_id = demo_org_id;
  DELETE FROM drivers WHERE organization_id = demo_org_id;
  DELETE FROM clients WHERE organization_id = demo_org_id;

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
    demo_user_id,
    demo_org_id,
    'manager',
    'active',
    COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), 'Camille Fournier'),
    email,
    '+33 6 12 44 28 90'
  FROM auth.users
  WHERE id = demo_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c101',
      demo_org_id,
      'Maison Delorme Distribution',
      'logistique@maison-delorme.fr',
      '+33 4 72 18 42 10',
      '18 rue de la Soie',
      'Lyon',
      '69003',
      'FR',
      'FR51482937012',
      'active',
      'Distribution textile et maison pour les magasins du quart sud-est.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c102',
      demo_org_id,
      'PharmaNord Repartition',
      'transport@pharmanord.fr',
      '+33 3 20 11 74 55',
      '7 avenue de Rotterdam',
      'Lille',
      '59800',
      'FR',
      'FR83827451096',
      'active',
      'Livraisons sensibles avec contraintes horaires et temperature maitrisee.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c103',
      demo_org_id,
      'Azur Frais Reseau',
      'exploitation@azurfrais.fr',
      '+33 4 91 63 29 40',
      '42 boulevard du Littoral',
      'Marseille',
      '13015',
      'FR',
      'FR62917432058',
      'active',
      'Ravitaillement quotidien de points de vente alimentaires sur la cote.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c104',
      demo_org_id,
      'Atelier Cote Ouest',
      'appro@atelier-cote-ouest.fr',
      '+33 5 56 00 18 43',
      '95 quai de Bacalan',
      'Bordeaux',
      '33300',
      'FR',
      'FR70452168077',
      'active',
      'Mobilier sur mesure et approvisionnement chantiers retail.'
    );

  INSERT INTO drivers (
    driver_id,
    organization_id,
    name,
    email,
    phone,
    license_number,
    license_expiry,
    status,
    date_of_birth
  ) VALUES
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d101',
      demo_org_id,
      'Pierre Laurent',
      'pierre.laurent@kepler-express.demo',
      '+33 6 24 15 88 41',
      'LAUREN840315B',
      CURRENT_DATE + INTERVAL '4 years',
      'active',
      DATE '1984-03-15'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d102',
      demo_org_id,
      'Samira Benali',
      'samira.benali@kepler-express.demo',
      '+33 6 31 58 20 74',
      'BENALI900928C',
      CURRENT_DATE + INTERVAL '3 years',
      'active',
      DATE '1990-09-28'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d103',
      demo_org_id,
      'Julien Morel',
      'julien.morel@kepler-express.demo',
      '+33 6 42 11 67 05',
      'MOREL870612D',
      CURRENT_DATE + INTERVAL '5 years',
      'active',
      DATE '1987-06-12'
    );

  INSERT INTO vehicles (
    vehicle_id,
    organization_id,
    name,
    license_plate,
    registration_number,
    vehicle_type,
    status,
    mileage_current,
    mileage_last_service,
    next_service_mileage,
    capacity_kg,
    capacity_m3,
    last_service_date
  ) VALUES
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      demo_org_id,
      'Renault Master FR-201',
      'AB-412-KT',
      'VF1MA000066521041',
      'van',
      'watch',
      178650,
      165000,
      180000,
      1350,
      12.5,
      CURRENT_DATE - INTERVAL '120 days'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e102',
      demo_org_id,
      'Iveco Daily FR-118',
      'GV-287-ZN',
      'ZCFC235D405123456',
      'van',
      'active',
      94400,
      87000,
      102000,
      1600,
      15.2,
      CURRENT_DATE - INTERVAL '75 days'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      demo_org_id,
      'Mercedes Actros TR-09',
      'FW-904-RJ',
      'WDB9634031L987654',
      'truck',
      'active',
      248900,
      243500,
      258500,
      7800,
      41.0,
      CURRENT_DATE - INTERVAL '45 days'
    );

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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a201',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c101',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d101',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      'M-2026030001',
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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a202',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c102',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d102',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e102',
      'M-2026030002',
      'delivered',
      980.00,
      910.00,
      910.00,
      'EUR',
      'Lille',
      'Strasbourg',
      CURRENT_DATE - INTERVAL '9 days' + TIME '04:50',
      CURRENT_DATE - INTERVAL '8 days' + TIME '13:25',
      'Tournee pharma livree avec marge volontairement serree pour le demo.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a203',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c103',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d103',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      'M-2026030003',
      'in_progress',
      1260.00,
      520.00,
      NULL,
      'EUR',
      'Marseille',
      'Nice',
      CURRENT_DATE - INTERVAL '1 day' + TIME '06:15',
      NULL,
      'Appro froid en cours avec avance repas chauffeur a rembourser.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a204',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c104',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d101',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      'M-2026030004',
      'assigned',
      740.00,
      430.00,
      NULL,
      'EUR',
      'Paris',
      'Bordeaux',
      CURRENT_DATE + INTERVAL '2 days' + TIME '07:00',
      NULL,
      'Chargement mobilier retail programme pour debut de semaine.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a205',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c104',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d102',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      'M-2026030005',
      'delivered',
      690.00,
      610.00,
      610.00,
      'EUR',
      'Orleans',
      'Nantes',
      CURRENT_DATE - INTERVAL '6 days' + TIME '06:20',
      CURRENT_DATE - INTERVAL '6 days' + TIME '14:45',
      'Livraison partielle facturee avec encaissement incomplet.'
    );

  INSERT INTO expenses (
    expense_id,
    organization_id,
    mission_id,
    driver_id,
    vehicle_id,
    type,
    amount,
    currency,
    advanced_by_driver,
    reimbursement_status,
    receipt_attached,
    description,
    expense_date
  ) VALUES
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1b301',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a203',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d103',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      'fuel',
      146.20,
      'EUR',
      FALSE,
      'paid',
      TRUE,
      'Plein depart depot Marseille',
      CURRENT_DATE - 2
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1b302',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a203',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d103',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      'meal',
      28.50,
      'EUR',
      TRUE,
      'pending',
      TRUE,
      'Repas de tournee a Nice',
      CURRENT_DATE - 1
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1b303',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a203',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d103',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      'tolls',
      42.80,
      'EUR',
      FALSE,
      'paid',
      TRUE,
      'Peages A8 et A50',
      CURRENT_DATE - 1
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1b304',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a205',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1d102',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      'parking',
      18.00,
      'EUR',
      FALSE,
      'paid',
      TRUE,
      'Acces centre-ville Nantes',
      CURRENT_DATE - 6
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1b305',
      demo_org_id,
      NULL,
      NULL,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      'maintenance',
      312.00,
      'EUR',
      FALSE,
      'paid',
      TRUE,
      'Pneu avant gauche et equilibrage',
      CURRENT_DATE - 20
    );

  INSERT INTO maintenance_records (
    maintenance_id,
    vehicle_id,
    organization_id,
    type,
    description,
    cost_amount,
    currency,
    mileage_at_service,
    next_service_mileage,
    service_date,
    completed_at
  ) VALUES
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e601',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e101',
      demo_org_id,
      'scheduled',
      'Revision periodique et remplacement plaquettes avant',
      640.00,
      'EUR',
      165000,
      180000,
      CURRENT_DATE - 120,
      CURRENT_DATE - INTERVAL '120 days' + TIME '11:20'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e602',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e102',
      demo_org_id,
      'inspection',
      'Controle freins et vidange moteur',
      385.00,
      'EUR',
      87000,
      102000,
      CURRENT_DATE - 75,
      CURRENT_DATE - INTERVAL '75 days' + TIME '15:10'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e603',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1e103',
      demo_org_id,
      'repair',
      'Remplacement feu arriere et reprise faisceau',
      228.00,
      'EUR',
      243500,
      258500,
      CURRENT_DATE - 45,
      CURRENT_DATE - INTERVAL '45 days' + TIME '10:35'
    );

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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f401',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c101',
      'INV-2026-0001',
      'paid',
      ARRAY['9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a201'::uuid],
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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f402',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c102',
      'INV-2026-0002',
      'overdue',
      ARRAY['9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a202'::uuid],
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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f403',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c104',
      'INV-2026-0003',
      'partial',
      ARRAY['9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a205'::uuid],
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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f404',
      demo_org_id,
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1c104',
      'INV-2026-0004',
      'draft',
      ARRAY['9d5e5d2f-a0c8-4f19-9d20-8c32b0a1a204'::uuid],
      740.00,
      0.00,
      'EUR',
      CURRENT_DATE,
      CURRENT_DATE + 14,
      NULL,
      NULL,
      'Facture brouillon prete a etre envoyee apres confirmation chargement.'
    );

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
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f501',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f401',
      demo_org_id,
      1480.00,
      'EUR',
      'bank_transfer',
      CURRENT_DATE - 14,
      'VIR-DELORME-1480',
      'Reglement integral a echeance.'
    ),
    (
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f502',
      '9d5e5d2f-a0c8-4f19-9d20-8c32b0a1f403',
      demo_org_id,
      320.00,
      'EUR',
      'bank_transfer',
      CURRENT_DATE - 5,
      'VIR-ACO-0320',
      'Acompte avant solde final.'
    );
END $$;
