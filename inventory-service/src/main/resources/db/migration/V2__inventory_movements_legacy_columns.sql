-- Esquema legacy: columnas type/warehouse_* coexisten con movement_type/from_location_id.
-- Flyway corre antes que Hibernate ddl-auto, asi que esta migracion debe tolerar
-- tanto bases antiguas como bases recien creadas donde algunas columnas aun no existen.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'inventory_movements'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'type'
        ) AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'movement_type'
        ) THEN
            UPDATE inventory_movements
            SET type = LEFT(movement_type, 20)
            WHERE movement_type IS NOT NULL
              AND (type IS NULL OR btrim(type) = '');
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'responsible_user'
        ) AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'responsible'
        ) THEN
            UPDATE inventory_movements
            SET responsible_user = LEFT(responsible, 60)
            WHERE responsible IS NOT NULL
              AND (responsible_user IS NULL OR btrim(responsible_user) = '');
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'warehouse_id'
        ) THEN
            UPDATE inventory_movements
            SET warehouse_id = COALESCE(from_location_id, to_location_id, 1)
            WHERE warehouse_id IS NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'warehouse_name'
        ) AND EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'locations'
        ) THEN
            UPDATE inventory_movements im
            SET warehouse_name = LEFT(l.code, 80)
            FROM locations l
            WHERE im.warehouse_id = l.id
              AND (im.warehouse_name IS NULL OR btrim(im.warehouse_name) = '');
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'type'
        ) THEN
            ALTER TABLE inventory_movements ALTER COLUMN type DROP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'warehouse_id'
        ) THEN
            ALTER TABLE inventory_movements ALTER COLUMN warehouse_id DROP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'warehouse_name'
        ) THEN
            ALTER TABLE inventory_movements ALTER COLUMN warehouse_name DROP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_movements'
              AND column_name = 'responsible_user'
        ) THEN
            ALTER TABLE inventory_movements ALTER COLUMN responsible_user DROP NOT NULL;
        END IF;
    END IF;
END $$;
