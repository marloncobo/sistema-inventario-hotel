package com.hotel.inventory.config;

import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import com.hotel.inventory.repository.UnitOfMeasureRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadInventoryData(SupplyItemRepository repository, CategoryRepository categoryRepository,
                                        UnitOfMeasureRepository unitRepository, ProviderRepository providerRepository,
                                        AreaRepository areaRepository) {
        return args -> {
            if (categoryRepository.count() == 0) {
                categoryRepository.save(new Category("MINIBAR", "MINIBAR", true));
                categoryRepository.save(new Category("ASEO", "ASEO", true));
                categoryRepository.save(new Category("LENCERIA", "LENCERIA", true));
                categoryRepository.save(new Category("ALIMENTOS", "ALIMENTOS", true));
            }
            if (unitRepository.count() == 0) {
                unitRepository.save(new UnitOfMeasure("UND", "UNIDAD", "UND", true));
                unitRepository.save(new UnitOfMeasure("CAJA", "CAJA", "CJ", true));
                unitRepository.save(new UnitOfMeasure("LITRO", "LITRO", "LT", true));
            }
            if (providerRepository.count() == 0) {
                providerRepository.save(new Provider("PRO-0001", "900001001", "Aseo Premium SAS", null, null, true));
                providerRepository.save(new Provider("PRO-0002", "900001002", "Distribuciones Hoteleras SAS", null, null, true));
            }
            if (areaRepository.count() == 0) {
                areaRepository.save(new Area("LIMPIEZA", "LIMPIEZA", true));
                areaRepository.save(new Area("RESTAURANTE", "RESTAURANTE", true));
                areaRepository.save(new Area("MANTENIMIENTO", "MANTENIMIENTO", true));
            }
            if (repository.count() == 0) {
                Category minibar = categoryRepository.findByCodeIgnoreCase("MINIBAR").orElseThrow();
                Category aseo = categoryRepository.findByCodeIgnoreCase("ASEO").orElseThrow();
                Category lenceria = categoryRepository.findByCodeIgnoreCase("LENCERIA").orElseThrow();
                UnitOfMeasure unit = unitRepository.findByCodeIgnoreCase("UND").orElseThrow();
                Provider aseoProvider = providerRepository.findByNameIgnoreCase("Aseo Premium SAS").orElseThrow();
                Provider hotelProvider = providerRepository.findByNameIgnoreCase("Distribuciones Hoteleras SAS").orElseThrow();

                repository.save(new SupplyItem("MIN-001", "Agua embotellada 600ml", "Agua para minibar", minibar, unit, aseoProvider, 30, 10, 120, true));
                repository.save(new SupplyItem("ASE-001", "Shampoo individual", "Amenidad para huesped", aseo, unit, hotelProvider, 50, 15, 200, true));
                repository.save(new SupplyItem("LEN-001", "Toalla facial", "Lenceria de habitacion", lenceria, unit, hotelProvider, 40, 12, 100, true));
            }
        };
    }

    @Bean
    @Order(1)
    CommandLineRunner migrateLegacySupplyItemCatalogColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            if (!columnExists(jdbcTemplate, "providers", "code")) {
                jdbcTemplate.execute("alter table providers add column code varchar(40)");
            }

            jdbcTemplate.update("""
                    update providers
                    set code = 'PRO-' || lpad(cast(id as text), 4, '0')
                    where code is null or btrim(code) = ''
                    """);

            jdbcTemplate.execute("alter table providers alter column code set not null");

            if (!uniqueConstraintExists(jdbcTemplate, "providers", "providers_code_key")) {
                jdbcTemplate.execute("alter table providers add constraint providers_code_key unique (code)");
            }

            if (columnExists(jdbcTemplate, "inventory_movements", "item_name")) {
                jdbcTemplate.execute("alter table inventory_movements alter column item_name drop not null");
            }

            if (!columnExists(jdbcTemplate, "supply_items", "category_id")
                    || !columnExists(jdbcTemplate, "supply_items", "unit_id")) {
                return;
            }

            if (columnExists(jdbcTemplate, "supply_items", "category")) {
                jdbcTemplate.update("""
                        update supply_items si
                        set category_id = c.id
                        from categories c
                        where si.category_id is null
                          and lower(c.code) = lower(si.category)
                        """);
            }

            if (columnExists(jdbcTemplate, "supply_items", "unit")) {
                jdbcTemplate.update("""
                        update supply_items si
                        set unit_id = u.id
                        from units_of_measure u
                        where si.unit_id is null
                          and (lower(u.code) = lower(si.unit) or lower(u.abbreviation) = lower(si.unit))
                        """);
            }

            if (columnExists(jdbcTemplate, "supply_items", "provider_name")
                    && columnExists(jdbcTemplate, "supply_items", "provider_id")) {
                jdbcTemplate.update("""
                        update supply_items si
                        set provider_id = p.id
                        from providers p
                        where si.provider_id is null
                          and si.provider_name is not null
                          and lower(p.name) = lower(si.provider_name)
                        """);
            }
        };
    }

    private static boolean columnExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Boolean exists = jdbcTemplate.queryForObject("""
                select exists (
                    select 1
                    from information_schema.columns
                    where table_schema = current_schema()
                      and table_name = ?
                      and column_name = ?
                )
                """, Boolean.class, tableName, columnName);
        return Boolean.TRUE.equals(exists);
    }

    private static boolean uniqueConstraintExists(JdbcTemplate jdbcTemplate, String tableName, String constraintName) {
        Boolean exists = jdbcTemplate.queryForObject("""
                select exists (
                    select 1
                    from information_schema.table_constraints
                    where table_schema = current_schema()
                      and table_name = ?
                      and constraint_name = ?
                      and constraint_type = 'UNIQUE'
                )
                """, Boolean.class, tableName, constraintName);
        return Boolean.TRUE.equals(exists);
    }
}
