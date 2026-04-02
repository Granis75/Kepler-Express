-- Kepler Express seed aligned to the actual production schema.
-- Replace app.seed_user_id only if you want to bind the seed to another auth user.

SELECT set_config('app.seed_user_id', '5cf146f8-41c8-4fbd-8901-167741b82b5e', false);
SELECT set_config('app.seed_org_id', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2b0000', false);

DO $$
DECLARE
  seed_user_id UUID := current_setting('app.seed_user_id')::uuid;
  seed_org_id UUID := current_setting('app.seed_org_id')::uuid;
  has_expenses BOOLEAN := to_regclass('public.expenses') IS NOT NULL;
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

  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION 'Required table public.organizations is missing';
  END IF;

  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Required table public.profiles is missing';
  END IF;

  IF to_regclass('public.clients') IS NULL THEN
    RAISE EXCEPTION 'Required table public.clients is missing';
  END IF;

  IF to_regclass('public.missions') IS NULL THEN
    RAISE EXCEPTION 'Required table public.missions is missing';
  END IF;

  IF to_regclass('public.invoices') IS NULL THEN
    RAISE EXCEPTION 'Required table public.invoices is missing';
  END IF;

  IF to_regclass('public.payments') IS NULL THEN
    RAISE EXCEPTION 'Required table public.payments is missing';
  END IF;

  -- Organization.
  INSERT INTO public.organizations (
    organization_id,
    name,
    slug
  ) VALUES (
    seed_org_id,
    'Kepler Express Seed Org',
    'kepler-seed-org'
  )
  ON CONFLICT (organization_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    updated_at = timezone('utc', now());

  -- Profile bound to the auth user.
  INSERT INTO public.profiles (
    user_id,
    organization_id,
    role,
    name,
    email,
    phone,
    status
  )
  SELECT
    seed_user_id,
    seed_org_id,
    'manager',
    COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), 'Kepler Test Manager'),
    email,
    '+33 6 10 20 30 40',
    'active'
  FROM auth.users
  WHERE id = seed_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    updated_at = timezone('utc', now());

  -- Cleanup payments.
  DELETE FROM public.payments
  WHERE payment_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf501'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf502'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf503'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf504'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf505'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf506'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf507'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf508'::uuid
  ]);

  -- Cleanup expenses.
  IF has_expenses THEN
    DELETE FROM public.expenses
    WHERE expense_id = ANY (ARRAY[
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be501'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be502'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be503'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be504'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be505'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be506'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be507'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be508'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be509'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50a'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50b'::uuid,
      '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50c'::uuid
    ]);
  ELSE
    RAISE NOTICE 'Skipping expenses cleanup: table not found';
  END IF;

  -- Cleanup invoices.
  DELETE FROM public.invoices
  WHERE invoice_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf402'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf404'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf406'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf407'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf408'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf409'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40a'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40b'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40c'::uuid
  ]);

  -- Cleanup missions.
  DELETE FROM public.missions
  WHERE mission_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba209'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20a'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20c'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20d'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20e'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20f'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba210'::uuid
  ]);

  -- Cleanup clients.
  DELETE FROM public.clients
  WHERE client_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc109'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc10a'::uuid
  ]);

  -- Clients.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', seed_org_id, 'Maison Delorme Distribution', 'logistique@maison-delorme.seed', '+33 4 72 18 42 10', '18 rue de la Soie', 'Lyon', '69003', 'FR', 'FR51482937012', 'active', 'Distribution textile pour reseau de magasins.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', seed_org_id, 'PharmaNord Repartition', 'transport@pharmanord.seed', '+33 3 20 11 74 55', '7 avenue de Rotterdam', 'Lille', '59800', 'FR', 'FR83827451096', 'active', 'Livraisons sensibles avec contraintes horaires.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', seed_org_id, 'Azur Frais Reseau', 'exploitation@azurfrais.seed', '+33 4 91 63 29 40', '42 boulevard du Littoral', 'Marseille', '13015', 'FR', 'FR62917432058', 'active', 'Approvisionnement quotidien de points de vente.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', seed_org_id, 'Atelier Rivage Mobilier', 'ops@atelier-rivage.seed', '+33 5 56 22 91 10', '91 quai des Chartrons', 'Bordeaux', '33000', 'FR', 'FR17482019560', 'active', 'Livraisons de mobilier sur planning serre.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105', seed_org_id, 'OptiPrint Services', 'dispatch@optiprint.seed', '+33 5 61 73 52 00', '12 rue des Arts Graphiques', 'Toulouse', '31000', 'FR', 'FR25491837022', 'active', 'Volumes reguliers sur le sud-ouest.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', seed_org_id, 'NordBat Materiaux', 'planif@nordbat.seed', '+33 2 35 70 18 20', '58 chemin des Docks', 'Rouen', '76000', 'FR', 'FR44481220731', 'active', 'Materiaux de chantier et livraisons matinales.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', seed_org_id, 'Centrale Vins du Rhone', 'transport@cvdr.seed', '+33 4 75 44 20 11', '26 avenue Victor Hugo', 'Valence', '26000', 'FR', 'FR11472819037', 'active', 'Palettes cave et circuit CHR.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', seed_org_id, 'BioMarche Provence', 'supply@biomarche.seed', '+33 4 90 16 82 35', '3 allee des Primeurs', 'Avignon', '84000', 'FR', 'FR29481722018', 'active', 'Produits frais et cadence quotidienne.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc109', seed_org_id, 'ElectroHub Retail', 'ops@electrohub.seed', '+33 2 40 72 91 88', '14 boulevard du Commerce', 'Nantes', '44000', 'FR', 'FR78481739005', 'inactive', 'Compte mis en pause apres pic saisonnier.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc10a', seed_org_id, 'Medilog Ile-de-France', 'coordination@medilog-idf.seed', '+33 1 84 66 20 51', '88 rue de Bercy', 'Paris', '75012', 'FR', 'FR93481027364', 'archived', 'Ancien compte conserve pour test de statuts.');

  -- Missions.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'M-202604-2001', 'delivered', 'Julien Morel', 'Renault Master FR-472-KE', 1480.00, 430.00, 0.00, 'Lyon', 'Paris', CURRENT_DATE - INTERVAL '14 days' + TIME '05:40', CURRENT_DATE - INTERVAL '14 days' + TIME '16:10', 'Livraison palettes textile avant ouverture magasin.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', 'M-202604-2002', 'delivered', 'Sarah Benali', 'Mercedes Actros FR-813-QT', 980.00, 610.00, 0.00, 'Lille', 'Strasbourg', CURRENT_DATE - INTERVAL '10 days' + TIME '04:50', CURRENT_DATE - INTERVAL '10 days' + TIME '13:25', 'Tournee pharma livree sur fenetre stricte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'M-202604-2003', 'delivered', 'Karim Lefevre', 'Renault Master FR-472-KE', 1260.00, 520.00, 0.00, 'Marseille', 'Nice', CURRENT_DATE - INTERVAL '8 days' + TIME '06:15', CURRENT_DATE - INTERVAL '8 days' + TIME '12:45', 'Appro frais boucle en demi-journee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'M-202604-2004', 'delivered', 'Theo Martin', 'Volvo FH FR-904-RX', 1640.00, 700.00, 0.00, 'Bordeaux', 'Nantes', CURRENT_DATE - INTERVAL '6 days' + TIME '05:20', CURRENT_DATE - INTERVAL '6 days' + TIME '17:10', 'Mobilier premium livre sur deux quais.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105', 'M-202604-2005', 'delivered', 'Julien Morel', 'Mercedes Actros FR-813-QT', 870.00, 360.00, 0.00, 'Toulouse', 'Montpellier', CURRENT_DATE - INTERVAL '4 days' + TIME '07:00', CURRENT_DATE - INTERVAL '4 days' + TIME '12:35', 'Imprimes livres avant ouverture atelier.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'M-202604-2006', 'delivered', 'Karim Lefevre', 'Volvo FH FR-904-RX', 920.00, 310.00, 0.00, 'Rouen', 'Paris', CURRENT_DATE + TIME '05:40', CURRENT_DATE + TIME '12:20', 'Chantier livre tot ce matin.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', 'M-202604-2007', 'delivered', 'Sarah Benali', 'Renault Master FR-472-KE', 760.00, 250.00, 0.00, 'Valence', 'Lyon', CURRENT_DATE + TIME '07:10', CURRENT_DATE + TIME '10:45', 'Reappro cave livre sur premiere vague.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', 'M-202604-2008', 'in_progress', 'Theo Martin', 'Mercedes Actros FR-813-QT', 1100.00, 430.00, 0.00, 'Avignon', 'Marseille', CURRENT_DATE - INTERVAL '1 day' + TIME '06:30', NULL, 'Appro froid en cours avec suivi horaire.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba209', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', 'M-202604-2009', 'assigned', 'Julien Morel', 'Iveco Daily FR-652-NW', 690.00, 260.00, 0.00, 'Nantes', 'Rennes', CURRENT_DATE + INTERVAL '1 day' + TIME '07:20', NULL, 'Mission courte deja affectee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'M-202604-2010', 'planned', NULL, NULL, 840.00, 320.00, 0.00, 'Paris', 'Reims', CURRENT_DATE + INTERVAL '2 days' + TIME '08:00', NULL, 'Depart usine programme en attente d''affectation.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'M-202604-2011', 'issue', 'Sarah Benali', 'Peugeot Partner FR-291-LM', 940.00, 480.00, 0.00, 'Paris', 'Orleans', CURRENT_DATE - INTERVAL '1 day' + TIME '05:55', NULL, 'Blocage mecanique sur route, mission a reprendre.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'M-202604-2012', 'assigned', 'Karim Lefevre', 'Volvo FH FR-904-RX', 1320.00, 540.00, 0.00, 'Marseille', 'Grenoble', CURRENT_DATE + INTERVAL '3 days' + TIME '06:40', NULL, 'Depart confirme pour la prochaine navette alpine.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20d', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', 'M-202604-2013', 'planned', NULL, NULL, 520.00, 180.00, 0.00, 'Lille', 'Amiens', CURRENT_DATE + INTERVAL '4 days' + TIME '09:00', NULL, 'Navette region nord pre-planifiee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20e', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'M-202604-2014', 'cancelled', NULL, NULL, 710.00, 300.00, 0.00, 'Bordeaux', 'Toulouse', CURRENT_DATE + INTERVAL '5 days' + TIME '07:10', NULL, 'Mission annulee par le client avant chargement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20f', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', 'M-202604-2015', 'in_progress', 'Theo Martin', 'Renault Master FR-472-KE', 1180.00, 460.00, 0.00, 'Valence', 'Clermont-Ferrand', now() - INTERVAL '2 hours', NULL, 'Mission retour en cours sur corridor centre.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba210', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', 'M-202604-2016', 'assigned', 'Julien Morel', 'Mercedes Actros FR-813-QT', 980.00, 370.00, 0.00, 'Avignon', 'Lyon', CURRENT_DATE + INTERVAL '1 day' + TIME '14:00', NULL, 'Ramasse complementaire deja planifiee.');

  -- Expenses.
  IF has_expenses THEN
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
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be501', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201', 'Julien Morel', 'Renault Master FR-472-KE', 'fuel', 126.40, FALSE, 'paid', 'https://example.test/receipts/fuel-201.pdf', TRUE, CURRENT_DATE - 14, 'Fuel top-up before A6 departure'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be502', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202', 'Sarah Benali', 'Mercedes Actros FR-813-QT', 'tolls', 48.70, FALSE, 'paid', 'https://example.test/receipts/tolls-202.pdf', TRUE, CURRENT_DATE - 10, 'A4 toll charges'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be503', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203', 'Karim Lefevre', 'Renault Master FR-472-KE', 'mission', 27.50, TRUE, 'paid', 'https://example.test/receipts/meal-203.pdf', TRUE, CURRENT_DATE - 8, 'Driver meal during coastal run'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be504', seed_org_id, NULL, NULL, 'Volvo FH FR-904-RX', 'maintenance', 980.00, FALSE, 'paid', 'https://example.test/receipts/maintenance-504.pdf', TRUE, CURRENT_DATE - 6, 'Major service invoice posted to fleet costs'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be505', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', 'Theo Martin', 'Mercedes Actros FR-813-QT', 'fuel', 286.90, TRUE, 'pending', NULL, FALSE, CURRENT_DATE - 1, 'Emergency cold-chain refuel'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be506', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', 'Theo Martin', 'Mercedes Actros FR-813-QT', 'other', 18.00, TRUE, 'approved', NULL, FALSE, CURRENT_DATE, 'Urban unloading parking'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be507', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b', 'Sarah Benali', 'Peugeot Partner FR-291-LM', 'mission', 310.00, FALSE, 'paid', 'https://example.test/receipts/tow-507.pdf', TRUE, CURRENT_DATE - 1, 'Tow truck and roadside handling'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be508', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206', 'Karim Lefevre', 'Volvo FH FR-904-RX', 'fuel', 118.30, FALSE, 'paid', 'https://example.test/receipts/fuel-508.pdf', TRUE, CURRENT_DATE, 'Morning urban route fuel'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be509', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207', 'Sarah Benali', 'Renault Master FR-472-KE', 'tolls', 36.40, FALSE, 'paid', 'https://example.test/receipts/tolls-509.pdf', TRUE, CURRENT_DATE, 'Morning bypass toll'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20f', 'Theo Martin', 'Renault Master FR-472-KE', 'mission', 24.80, TRUE, 'pending', NULL, FALSE, CURRENT_DATE, 'Driver meal on return leg'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50b', seed_org_id, NULL, NULL, 'Iveco Daily FR-652-NW', 'maintenance', 420.00, FALSE, 'paid', 'https://example.test/receipts/inspection-50b.pdf', TRUE, CURRENT_DATE - 5, 'Inspection work posted as fleet expense'),
      ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205', 'Julien Morel', 'Mercedes Actros FR-813-QT', 'mission', 74.00, TRUE, 'rejected', 'https://example.test/receipts/hotel-50c.pdf', TRUE, CURRENT_DATE - 3, 'Rejected hotel reimbursement request');
  ELSE
    RAISE NOTICE 'Skipping expenses seed: table not found';
  END IF;

  -- Invoices.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'INV-2026-2001', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid], 1480.00, 0.00, 'sent', CURRENT_DATE - 21, CURRENT_DATE - 7, 'Mission rentable reglee en un seul virement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf402', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', 'INV-2026-2002', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid], 980.00, 0.00, 'overdue', CURRENT_DATE - 18, CURRENT_DATE - 4, 'Relance client necessaire.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'INV-2026-2003', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203'::uuid], 1260.00, 0.00, 'sent', CURRENT_DATE - 12, CURRENT_DATE + 3, 'Acompte recu, solde attendu sous quelques jours.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf404', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'INV-2026-2004', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid], 1640.00, 0.00, 'draft', CURRENT_DATE, CURRENT_DATE + 14, 'Facture brouillon prete a etre envoyee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105', 'INV-2026-2005', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid], 870.00, 0.00, 'sent', CURRENT_DATE - 9, CURRENT_DATE - 2, 'Facture reglee en deux virements.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf406', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'INV-2026-2006', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206'::uuid], 920.00, 0.00, 'sent', CURRENT_DATE, CURRENT_DATE + 14, 'Reglement immediat apres confirmation de livraison.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf407', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', 'INV-2026-2007', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207'::uuid], 760.00, 0.00, 'sent', CURRENT_DATE - 1, CURRENT_DATE + 10, 'Facture du jour en attente de reglement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf408', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', 'INV-2026-2008', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208'::uuid], 1100.00, 0.00, 'overdue', CURRENT_DATE - 15, CURRENT_DATE - 2, 'Solde en retard sur mission encore ouverte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf409', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'INV-2026-2009', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20e'::uuid], 710.00, 0.00, 'draft', CURRENT_DATE, CURRENT_DATE + 15, 'Dossier reste en brouillon apres changement du plan de transport.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'INV-2026-2010', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20c'::uuid], 1320.00, 0.00, 'sent', CURRENT_DATE, CURRENT_DATE + 21, 'Pre-billing prepared for upcoming alpine route.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40b', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'INV-2026-2011', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20a'::uuid], 840.00, 0.00, 'draft', CURRENT_DATE, CURRENT_DATE + 18, 'Brouillon pour mission planifiee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'INV-2026-2012', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b'::uuid], 940.00, 0.00, 'sent', CURRENT_DATE - 2, CURRENT_DATE + 5, 'Acompte recu avant reprise de mission.');

  -- Payments.
  INSERT INTO public.payments (
    payment_id,
    invoice_id,
    organization_id,
    amount,
    payment_method,
    payment_date,
    reference,
    notes
  ) VALUES
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf501', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401', seed_org_id, 1480.00, 'bank_transfer', CURRENT_DATE - 14, 'VIR-DELORME-1480', 'Reglement integral a echeance.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf502', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, 250.00, 'bank_transfer', CURRENT_DATE - 6, 'VIR-AZUR-0250', 'Premier acompte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf503', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, 350.00, 'check', CURRENT_DATE - 2, 'CHQ-AZUR-0350', 'Complement recu cette semaine.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf504', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, 400.00, 'bank_transfer', CURRENT_DATE - 5, 'VIR-OPTI-0400', 'Premier virement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf505', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, 470.00, 'bank_transfer', CURRENT_DATE - 3, 'VIR-OPTI-0470', 'Solde de facture.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf506', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf406', seed_org_id, 920.00, 'card', CURRENT_DATE, 'CB-NORDBAT-0920', 'Paiement immediat apres livraison.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf507', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf408', seed_org_id, 400.00, 'bank_transfer', CURRENT_DATE - 8, 'VIR-BIOMARCHE-0400', 'Acompte avant retard de reglement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf508', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40c', seed_org_id, 300.00, 'cash', CURRENT_DATE - 1, 'CASH-MISSION-0300', 'Acompte terrain avant reprise.');
END $$;
