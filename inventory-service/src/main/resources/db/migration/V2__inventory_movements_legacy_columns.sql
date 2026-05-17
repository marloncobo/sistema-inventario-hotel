-- Esquema legacy: columnas type/warehouse_* coexisten con movement_type/from_location_id.
-- Hibernate solo escribe las columnas nuevas; relajamos NOT NULL y sincronizamos datos existentes.

UPDATE inventory_movements
SET type = LEFT(movement_type, 20)
WHERE movement_type IS NOT NULL
  AND (type IS NULL OR btrim(type) = '');

UPDATE inventory_movements
SET responsible_user = LEFT(responsible, 60)
WHERE responsible IS NOT NULL
  AND (responsible_user IS NULL OR btrim(responsible_user) = '');

UPDATE inventory_movements
SET warehouse_id = COALESCE(from_location_id, to_location_id, 1)
WHERE warehouse_id IS NULL;

UPDATE inventory_movements im
SET warehouse_name = LEFT(l.code, 80)
FROM locations l
WHERE im.warehouse_id = l.id
  AND (im.warehouse_name IS NULL OR btrim(im.warehouse_name) = '');

ALTER TABLE inventory_movements ALTER COLUMN type DROP NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN warehouse_id DROP NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN warehouse_name DROP NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN responsible_user DROP NOT NULL;
