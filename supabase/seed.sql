SELECT set_config('app.seed_user_id', 'e2fb6809-8c46-489e-99e8-9e8e6c28bdcb', false);

DO $$
DECLARE
  seed_user_id UUID := current_setting('app.seed_user_id')::uuid;
  seed_org_id UUID;
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

  SELECT p.organization_id
  INTO seed_org_id
  FROM public.profiles p
  WHERE p.user_id = seed_user_id
  LIMIT 1;

  IF seed_org_id IS NULL THEN
    RAISE EXCEPTION 'No profile/organization found for seed_user_id (%)', seed_user_id;
  END IF;

  DELETE FROM public.payments
  WHERE organization_id = seed_org_id;

  DELETE FROM public.expenses
  WHERE organization_id = seed_org_id;

  DELETE FROM public.invoices
  WHERE organization_id = seed_org_id;

  DELETE FROM public.missions
  WHERE organization_id = seed_org_id;

  DELETE FROM public.clients
  WHERE organization_id = seed_org_id;

  INSERT INTO public.clients (
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
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
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
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102'::uuid,
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
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103'::uuid,
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

  INSERT INTO public.missions (
    mission_id,
    organization_id,
    client_id,
    reference,
    status,
    driver_name,
    vehicle_name,
    revenue_amount,
    estimated_cost_amount,
    actual_cost_amount,
    departure_location,
    arrival_location,
    departure_datetime,
    arrival_datetime,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
      'M-2026031001',
      'delivered',
      'Louis Martin',
      'Renault T480',
      1480.00,
      430.00,
      0,
      'Lyon',
      'Paris',
      CURRENT_DATE - INTERVAL '14 days' + TIME '05:40',
      CURRENT_DATE - INTERVAL '14 days' + TIME '16:10',
      'Livraison palettes textile avant ouverture magasin.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102'::uuid,
      'M-2026031002',
      'delivered',
      'Nadia Benali',
      'Mercedes Actros 1845',
      980.00,
      910.00,
      0,
      'Lille',
      'Strasbourg',
      CURRENT_DATE - INTERVAL '9 days' + TIME '04:50',
      CURRENT_DATE - INTERVAL '8 days' + TIME '13:25',
      'Tournee pharma livree avec marge volontairement serree.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103'::uuid,
      'M-2026031003',
      'in_progress',
      'Karim Ouali',
      'Iveco S-Way',
      1260.00,
      520.00,
      0,
      'Marseille',
      'Nice',
      CURRENT_DATE - INTERVAL '1 day' + TIME '06:15',
      NULL,
      'Appro froid en cours avec suivi horaire.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
      'M-2026031004',
      'assigned',
      'Camille Moreau',
      'DAF XF 480',
      740.00,
      430.00,
      0,
      'Paris',
      'Bordeaux',
      CURRENT_DATE + INTERVAL '2 days' + TIME '07:00',
      NULL,
      'Chargement mobilier programme pour debut de semaine.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103'::uuid,
      'M-2026031005',
      'delivered',
      'Sofia Laurent',
      'Volvo FH 460',
      690.00,
      610.00,
      0,
      'Aix-en-Provence',
      'Toulon',
      CURRENT_DATE - INTERVAL '6 days' + TIME '06:20',
      CURRENT_DATE - INTERVAL '6 days' + TIME '14:45',
      'Livraison regionale avec solde client encore ouvert.'
    );

  INSERT INTO public.expenses (
    expense_id,
    organization_id,
    mission_id,
    driver_name,
    vehicle_name,
    expense_type,
    amount,
    advanced_by_driver,
    approval_status,
    receipt_url,
    receipt_present,
    expense_date,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be501'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid,
      'Louis Martin',
      'Renault T480',
      'fuel',
      210.00,
      false,
      'paid',
      'https://example.com/receipts/mission-201-fuel.pdf',
      true,
      CURRENT_DATE - 14,
      'Carburant mission Lyon Paris.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be502'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid,
      'Louis Martin',
      'Renault T480',
      'tolls',
      220.00,
      false,
      'paid',
      'https://example.com/receipts/mission-201-tolls.pdf',
      true,
      CURRENT_DATE - 14,
      'Peages mission Lyon Paris.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be503'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid,
      'Nadia Benali',
      'Mercedes Actros 1845',
      'fuel',
      480.00,
      false,
      'approved',
      'https://example.com/receipts/mission-202-fuel.pdf',
      true,
      CURRENT_DATE - 9,
      'Carburant longue distance.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be504'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid,
      'Nadia Benali',
      'Mercedes Actros 1845',
      'tolls',
      430.00,
      false,
      'approved',
      'https://example.com/receipts/mission-202-tolls.pdf',
      true,
      CURRENT_DATE - 8,
      'Peages et acces zones reglementees.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be505'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203'::uuid,
      'Karim Ouali',
      'Iveco S-Way',
      'fuel',
      180.00,
      true,
      'pending',
      'https://example.com/receipts/mission-203-fuel.pdf',
      true,
      CURRENT_DATE - 1,
      'Premier plein sur mission en cours.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be506'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid,
      'Sofia Laurent',
      'Volvo FH 460',
      'fuel',
      260.00,
      false,
      'paid',
      'https://example.com/receipts/mission-205-fuel.pdf',
      true,
      CURRENT_DATE - 6,
      'Carburant livraison regionale.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be507'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid,
      'Sofia Laurent',
      'Volvo FH 460',
      'tolls',
      350.00,
      false,
      'paid',
      'https://example.com/receipts/mission-205-tolls.pdf',
      true,
      CURRENT_DATE - 6,
      'Peages et frais de route.'
    );

  INSERT INTO public.invoices (
    invoice_id,
    organization_id,
    client_id,
    invoice_number,
    mission_ids,
    amount_total,
    amount_paid,
    status,
    issue_date,
    due_date,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
      'INV-2026-1001',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid],
      1480.00,
      1480.00,
      'paid',
      CURRENT_DATE - 21,
      CURRENT_DATE - 7,
      'Mission rentable reglee en un seul virement.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf402'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102'::uuid,
      'INV-2026-1002',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid],
      980.00,
      0.00,
      'overdue',
      CURRENT_DATE - 18,
      CURRENT_DATE - 4,
      'Relance client necessaire.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103'::uuid,
      'INV-2026-1003',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid],
      690.00,
      320.00,
      'partial',
      CURRENT_DATE - 12,
      CURRENT_DATE + 3,
      'Acompte recu, solde attendu sous quelques jours.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf404'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
      'INV-2026-1004',
      ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid],
      740.00,
      0.00,
      'draft',
      CURRENT_DATE,
      CURRENT_DATE + 14,
      'Facture brouillon prete a etre envoyee.'
    );

  INSERT INTO public.payments (
    payment_id,
    organization_id,
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference,
    notes
  ) VALUES
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf501'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401'::uuid,
      1480.00,
      'bank_transfer',
      CURRENT_DATE - 14,
      'VIR-DELORME-1480',
      'Reglement integral a echeance.'
    ),
    (
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf502'::uuid,
      seed_org_id,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403'::uuid,
      320.00,
      'bank_transfer',
      CURRENT_DATE - 5,
      'VIR-AZUR-0320',
      'Acompte avant solde final.'
    );
END $$;
