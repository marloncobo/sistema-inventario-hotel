-- Fase 1: columna allows_decimal en unidades de medida (soporta cantidades decimales).
-- Se ejecuta antes que Hibernate ddl-auto para bases de datos ya pobladas.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'units_of_measure'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'units_of_measure'
              AND column_name = 'allows_decimal'
        ) THEN
            ALTER TABLE units_of_measure
                ADD COLUMN allows_decimal BOOLEAN NOT NULL DEFAULT FALSE;
        ELSE
            UPDATE units_of_measure
            SET allows_decimal = FALSE
            WHERE allows_decimal IS NULL;

            ALTER TABLE units_of_measure
                ALTER COLUMN allows_decimal SET DEFAULT FALSE;

            ALTER TABLE units_of_measure
                ALTER COLUMN allows_decimal SET NOT NULL;
        END IF;

        UPDATE units_of_measure
        SET allows_decimal = TRUE
        WHERE lower(code) IN ('litro', 'lt', 'kg', 'gramo', 'g', 'ml')
           OR lower(abbreviation) IN ('lt', 'kg', 'g', 'ml');
    END IF;
END $$;
