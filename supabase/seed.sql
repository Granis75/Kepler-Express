-- Full test seed for Kepler Express.
-- Replace app.seed_user_id only if you want to target another auth user.
-- This seed deletes only its own deterministic test rows.

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

  -- Attach auth user.
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

  -- Cleanup payments.
  DELETE FROM payments
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

  -- Cleanup maintenance.
  DELETE FROM maintenance_records
  WHERE maintenance_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb601'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb602'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb603'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb604'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb605'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb606'::uuid
  ]);

  -- Cleanup expenses.
  DELETE FROM expenses
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

  -- Cleanup invoices.
  DELETE FROM invoices
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
  DELETE FROM missions
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

  -- Cleanup drivers.
  DELETE FROM drivers
  WHERE driver_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd204'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd206'::uuid
  ]);

  -- Cleanup vehicles.
  DELETE FROM vehicles
  WHERE vehicle_id = ANY (ARRAY[
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be303'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be304'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305'::uuid,
    '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be306'::uuid
  ]);

  -- Cleanup clients.
  DELETE FROM clients
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

  -- Drivers.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', seed_org_id, 'Julien Morel', 'julien.morel@kepler.seed', '+33 6 12 34 56 01', 'FR-DL-724510', CURRENT_DATE + 420, 'active', '1987-06-12'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', seed_org_id, 'Sarah Benali', 'sarah.benali@kepler.seed', '+33 6 12 34 56 02', 'FR-DL-724511', CURRENT_DATE + 510, 'active', '1990-02-21'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', seed_org_id, 'Karim Lefevre', 'karim.lefevre@kepler.seed', '+33 6 12 34 56 03', 'FR-DL-724512', CURRENT_DATE + 390, 'active', '1985-11-03'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd204', seed_org_id, 'Nina Costa', 'nina.costa@kepler.seed', '+33 6 12 34 56 04', 'FR-DL-724513', CURRENT_DATE + 460, 'on_leave', '1992-07-08'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', seed_org_id, 'Theo Martin', 'theo.martin@kepler.seed', '+33 6 12 34 56 05', 'FR-DL-724514', CURRENT_DATE + 365, 'active', '1994-09-14'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd206', seed_org_id, 'Luc Garnier', 'luc.garnier@kepler.seed', '+33 6 12 34 56 06', 'FR-DL-724515', CURRENT_DATE + 540, 'inactive', '1982-01-27');

  -- Vehicles.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', seed_org_id, 'Renault Master FR-472-KE', 'FR-472-KE', 'RG-MASTER-01', 'van', 'active', 118400, 117000, 132000, 1350.00, 13.50, CURRENT_DATE - 45),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', seed_org_id, 'Mercedes Actros FR-813-QT', 'FR-813-QT', 'RG-ACTROS-02', 'truck', 'watch', 247900, 234200, 249200, 18000.00, 52.00, CURRENT_DATE - 78),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be303', seed_org_id, 'Iveco Daily FR-652-NW', 'FR-652-NW', 'RG-IVECO-03', 'van', 'service_due', 184500, 169900, 184900, 3200.00, 18.00, CURRENT_DATE - 32),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be304', seed_org_id, 'Peugeot Partner FR-291-LM', 'FR-291-LM', 'RG-PARTNER-04', 'car', 'out_of_service', 91250, 78000, 91500, 850.00, 3.80, CURRENT_DATE - 40),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', seed_org_id, 'Volvo FH FR-904-RX', 'FR-904-RX', 'RG-VOLVO-05', 'truck', 'active', 368000, 367500, 382500, 24000.00, 58.00, CURRENT_DATE - 8),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be306', seed_org_id, 'Fruehauf Trailer FR-118-YB', 'FR-118-YB', 'RG-TRAILER-06', 'trailer', 'retired', 145000, 142000, 155000, 26000.00, 70.00, CURRENT_DATE - 210);

  -- Maintenance.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb601', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', seed_org_id, 'scheduled', 'Full service before spring regional tours', 780.00, 'EUR', 117000, 132000, CURRENT_DATE - 45, CURRENT_DATE - INTERVAL '45 days' + TIME '17:30'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb602', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', seed_org_id, 'inspection', 'Brake and trailer line inspection', 420.00, 'EUR', 234200, 249200, CURRENT_DATE - 78, CURRENT_DATE - INTERVAL '78 days' + TIME '11:15'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb603', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be303', seed_org_id, 'repair', 'Cooling circuit repair and pressure test', 1190.00, 'EUR', 169900, 184900, CURRENT_DATE - 32, CURRENT_DATE - INTERVAL '32 days' + TIME '16:10'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb604', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be304', seed_org_id, 'unscheduled', 'Transmission fault diagnosis and repair', 1680.00, 'EUR', 78000, 91500, CURRENT_DATE - 40, CURRENT_DATE - INTERVAL '40 days' + TIME '18:20'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb605', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', seed_org_id, 'scheduled', 'Major service before long-haul dispatches', 980.00, 'EUR', 352500, 367500, CURRENT_DATE - 65, CURRENT_DATE - INTERVAL '65 days' + TIME '15:40'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bb606', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', seed_org_id, 'inspection', 'Tachograph and axle inspection', 260.00, 'EUR', 367500, 382500, CURRENT_DATE - 8, CURRENT_DATE - INTERVAL '8 days' + TIME '10:35');

  -- Missions.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'M-2026032001', 'delivered', 1480.00, 430.00, 445.00, 'EUR', 'Lyon', 'Paris', CURRENT_DATE - INTERVAL '14 days' + TIME '05:40', CURRENT_DATE - INTERVAL '14 days' + TIME '16:10', 'Livraison palettes textile avant ouverture magasin.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'M-2026032002', 'delivered', 980.00, 610.00, 650.00, 'EUR', 'Lille', 'Strasbourg', CURRENT_DATE - INTERVAL '10 days' + TIME '04:50', CURRENT_DATE - INTERVAL '10 days' + TIME '13:25', 'Tournee pharma livree sur fenetre stricte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'M-2026032003', 'delivered', 1260.00, 520.00, 540.00, 'EUR', 'Marseille', 'Nice', CURRENT_DATE - INTERVAL '8 days' + TIME '06:15', CURRENT_DATE - INTERVAL '8 days' + TIME '12:45', 'Appro frais boucle en demi-journee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', 'M-2026032004', 'delivered', 1640.00, 700.00, 760.00, 'EUR', 'Bordeaux', 'Nantes', CURRENT_DATE - INTERVAL '6 days' + TIME '05:20', CURRENT_DATE - INTERVAL '6 days' + TIME '17:10', 'Mobilier premium livre sur deux quais.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'M-2026032005', 'delivered', 870.00, 360.00, 345.00, 'EUR', 'Toulouse', 'Montpellier', CURRENT_DATE - INTERVAL '4 days' + TIME '07:00', CURRENT_DATE - INTERVAL '4 days' + TIME '12:35', 'Imprimes livres avant ouverture atelier.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', 'M-2026032006', 'delivered', 920.00, 310.00, 295.00, 'EUR', 'Rouen', 'Paris', CURRENT_DATE + TIME '05:40', CURRENT_DATE + TIME '12:20', 'Chantier livre tot ce matin.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'M-2026032007', 'delivered', 760.00, 250.00, 240.00, 'EUR', 'Valence', 'Lyon', CURRENT_DATE + TIME '07:10', CURRENT_DATE + TIME '10:45', 'Reappro cave livre sur premiere vague.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'M-2026032008', 'in_progress', 1100.00, 430.00, NULL, 'EUR', 'Avignon', 'Marseille', CURRENT_DATE - INTERVAL '1 day' + TIME '06:30', NULL, 'Appro froid en cours avec suivi horaire.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba209', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be303', 'M-2026032009', 'assigned', 690.00, 260.00, NULL, 'EUR', 'Nantes', 'Rennes', CURRENT_DATE + INTERVAL '1 day' + TIME '07:20', NULL, 'Mission courte deja affectee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', NULL, NULL, 'M-2026032010', 'planned', 840.00, 320.00, NULL, 'EUR', 'Paris', 'Reims', CURRENT_DATE + INTERVAL '2 days' + TIME '08:00', NULL, 'Depart usine programme en attente d''affectation.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be304', 'M-2026032011', 'issue', 940.00, 480.00, 670.00, 'EUR', 'Paris', 'Orleans', CURRENT_DATE - INTERVAL '1 day' + TIME '05:55', NULL, 'Blocage mecanique sur route, mission a reprendre.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', 'M-2026032012', 'assigned', 1320.00, 540.00, NULL, 'EUR', 'Marseille', 'Grenoble', CURRENT_DATE + INTERVAL '3 days' + TIME '06:40', NULL, 'Depart confirme pour la prochaine navette alpine.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20d', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', NULL, NULL, 'M-2026032013', 'planned', 520.00, 180.00, NULL, 'EUR', 'Lille', 'Amiens', CURRENT_DATE + INTERVAL '4 days' + TIME '09:00', NULL, 'Navette region nord pre-planifiee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20e', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', NULL, NULL, 'M-2026032014', 'cancelled', 710.00, 300.00, NULL, 'EUR', 'Bordeaux', 'Toulouse', CURRENT_DATE + INTERVAL '5 days' + TIME '07:10', NULL, 'Mission annulee par le client avant chargement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20f', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'M-2026032015', 'in_progress', 1180.00, 460.00, NULL, 'EUR', 'Valence', 'Clermont-Ferrand', NOW() - INTERVAL '2 hours', NULL, 'Mission retour en cours sur corridor centre.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba210', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'M-2026032016', 'assigned', 980.00, 370.00, NULL, 'EUR', 'Avignon', 'Lyon', CURRENT_DATE + INTERVAL '1 day' + TIME '14:00', NULL, 'Ramasse complementaire deja planifiee.');

  -- Expenses.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be501', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'fuel', 126.40, 'EUR', FALSE, 'paid', TRUE, 'Fuel top-up before A6 departure', CURRENT_DATE - 14),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be502', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'tolls', 48.70, 'EUR', FALSE, 'paid', TRUE, 'A4 toll charges', CURRENT_DATE - 10),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be503', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'meal', 27.50, 'EUR', TRUE, 'paid', TRUE, 'Driver meal during coastal run', CURRENT_DATE - 8),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be504', seed_org_id, NULL, NULL, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', 'maintenance', 980.00, 'EUR', FALSE, 'paid', TRUE, 'Major service invoice posted to fleet costs', CURRENT_DATE - 6),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be505', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'fuel', 286.90, 'EUR', TRUE, 'pending', FALSE, 'Emergency cold-chain refuel', CURRENT_DATE - 1),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be506', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'parking', 18.00, 'EUR', TRUE, 'approved', FALSE, 'Urban unloading parking', CURRENT_DATE),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be507', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be304', 'mission_expense', 310.00, 'EUR', FALSE, 'paid', TRUE, 'Tow truck and roadside handling', CURRENT_DATE - 1),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be508', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd203', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be305', 'fuel', 118.30, 'EUR', FALSE, 'paid', TRUE, 'Morning urban route fuel', CURRENT_DATE),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be509', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd202', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'tolls', 36.40, 'EUR', FALSE, 'paid', TRUE, 'Morning bypass toll', CURRENT_DATE),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20f', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be301', 'meal', 24.80, 'EUR', TRUE, 'pending', FALSE, 'Driver meal on return leg', CURRENT_DATE),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50b', seed_org_id, NULL, NULL, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be303', 'maintenance', 420.00, 'EUR', FALSE, 'paid', TRUE, 'Inspection work posted as fleet expense', CURRENT_DATE - 5),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be50c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bd201', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2be302', 'mission_expense', 74.00, 'EUR', TRUE, 'rejected', TRUE, 'Rejected hotel reimbursement request', CURRENT_DATE - 3);

  -- Invoices.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'INV-2026-2001', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba201'::uuid], 1480.00, 1480.00, 'EUR', CURRENT_DATE - 21, CURRENT_DATE - 7, CURRENT_DATE - INTERVAL '20 days' + TIME '09:15', CURRENT_DATE - INTERVAL '14 days' + TIME '14:30', 'Mission rentable reglee en un seul virement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf402', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc102', 'INV-2026-2002', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba202'::uuid], 980.00, 0.00, 'EUR', CURRENT_DATE - 18, CURRENT_DATE - 4, CURRENT_DATE - INTERVAL '17 days' + TIME '08:50', NULL, 'Relance client necessaire.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'INV-2026-2003', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba203'::uuid], 1260.00, 600.00, 'EUR', CURRENT_DATE - 12, CURRENT_DATE + 3, CURRENT_DATE - INTERVAL '11 days' + TIME '10:05', NULL, 'Acompte recu, solde attendu sous quelques jours.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf404', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'INV-2026-2004', 'draft', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba204'::uuid], 1640.00, 0.00, 'EUR', CURRENT_DATE, CURRENT_DATE + 14, NULL, NULL, 'Facture brouillon prete a etre envoyee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc105', 'INV-2026-2005', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba205'::uuid], 870.00, 870.00, 'EUR', CURRENT_DATE - 9, CURRENT_DATE - 2, CURRENT_DATE - INTERVAL '8 days' + TIME '09:20', CURRENT_DATE - INTERVAL '3 days' + TIME '15:20', 'Facture reglee en deux virements.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf406', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'INV-2026-2006', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba206'::uuid], 920.00, 920.00, 'EUR', CURRENT_DATE, CURRENT_DATE + 14, CURRENT_DATE + TIME '13:10', CURRENT_DATE + TIME '16:00', 'Reglement immediat apres confirmation de livraison.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf407', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc107', 'INV-2026-2007', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba207'::uuid], 760.00, 0.00, 'EUR', CURRENT_DATE - 1, CURRENT_DATE + 10, CURRENT_DATE - INTERVAL '1 day' + TIME '12:10', NULL, 'Facture du jour en attente de reglement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf408', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc108', 'INV-2026-2008', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba208'::uuid], 1100.00, 400.00, 'EUR', CURRENT_DATE - 15, CURRENT_DATE - 2, CURRENT_DATE - INTERVAL '14 days' + TIME '10:00', NULL, 'Solde en retard sur mission encore ouverte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf409', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc104', 'INV-2026-2009', 'cancelled', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20e'::uuid], 710.00, 0.00, 'EUR', CURRENT_DATE, CURRENT_DATE + 15, NULL, NULL, 'Annulee apres annulation mission.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40a', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc103', 'INV-2026-2010', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20c'::uuid], 1320.00, 0.00, 'EUR', CURRENT_DATE, CURRENT_DATE + 21, CURRENT_DATE + TIME '09:40', NULL, 'Pre-billing prepared for upcoming alpine route.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40b', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc106', 'INV-2026-2011', 'draft', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20a'::uuid], 840.00, 0.00, 'EUR', CURRENT_DATE, CURRENT_DATE + 18, NULL, NULL, 'Brouillon pour mission planifiee.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40c', seed_org_id, '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bc101', 'INV-2026-2012', 'sent', ARRAY['2b8f2d44-7f2c-4d1d-9e30-6d5a7a2ba20b'::uuid], 940.00, 300.00, 'EUR', CURRENT_DATE - 2, CURRENT_DATE + 5, CURRENT_DATE - INTERVAL '2 days' + TIME '11:20', NULL, 'Acompte recu avant reprise de mission.');

  -- Payments.
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
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf501', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf401', seed_org_id, 1480.00, 'EUR', 'bank_transfer', CURRENT_DATE - 14, 'VIR-DELORME-1480', 'Reglement integral a echeance.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf502', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, 250.00, 'EUR', 'bank_transfer', CURRENT_DATE - 6, 'VIR-AZUR-0250', 'Premier acompte.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf503', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf403', seed_org_id, 350.00, 'EUR', 'check', CURRENT_DATE - 2, 'CHQ-AZUR-0350', 'Complement recu cette semaine.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf504', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, 400.00, 'EUR', 'bank_transfer', CURRENT_DATE - 5, 'VIR-OPTI-0400', 'Premier virement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf505', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf405', seed_org_id, 470.00, 'EUR', 'bank_transfer', CURRENT_DATE - 3, 'VIR-OPTI-0470', 'Solde de facture.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf506', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf406', seed_org_id, 920.00, 'EUR', 'card', CURRENT_DATE, 'CB-NORDBAT-0920', 'Paiement immediat apres livraison.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf507', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf408', seed_org_id, 400.00, 'EUR', 'bank_transfer', CURRENT_DATE - 8, 'VIR-BIOMARCHE-0400', 'Acompte avant retard de reglement.'),
    ('2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf508', '2b8f2d44-7f2c-4d1d-9e30-6d5a7a2bf40c', seed_org_id, 300.00, 'EUR', 'cash', CURRENT_DATE - 1, 'CASH-MISSION-0300', 'Acompte terrain avant reprise.');
END $$;
