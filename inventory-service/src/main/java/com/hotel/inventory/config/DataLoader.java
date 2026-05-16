package com.hotel.inventory.config;

import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.model.RoomParLine;
import com.hotel.inventory.model.StockByLocation;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.RoomParRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import com.hotel.inventory.repository.UnitOfMeasureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataLoader {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);
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
                unitRepository.save(new UnitOfMeasure("LITRO", "LITRO", "LT", true, true));
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

    /**
     * Fase 1: siembra las ubicaciones por defecto y migra el stock global existente.
     *
     * Si el campo SupplyItem.stock tiene un valor pero todavía no hay StockByLocation
     * para ese insumo, se crea automáticamente una fila en BODEGA_PRINCIPAL con esa
     * cantidad. La operación es idempotente: si ya existe stock por ubicación, no se
     * hace nada.
     */
    @Bean
    @Order(2)
    CommandLineRunner loadLocationsAndMigrateStock(LocationRepository locationRepository,
                                                   StockByLocationRepository stockByLocationRepository,
                                                   SupplyItemRepository supplyItemRepository) {
        return args -> {
            seedDefaultLocations(locationRepository);
            migrateGlobalStockToBodega(locationRepository, stockByLocationRepository, supplyItemRepository);
        };
    }

    @Bean
    @Order(3)
    CommandLineRunner seedDefaultRoomPars(RoomParRepository roomParRepository,
                                          SupplyItemRepository supplyItemRepository) {
        return args -> {
            if (roomParRepository.count() > 0) {
                return;
            }
            SupplyItem shampoo = supplyItemRepository.findByCodeIgnoreCase("ASE-001").orElse(null);
            SupplyItem towel = supplyItemRepository.findByCodeIgnoreCase("LEN-001").orElse(null);
            SupplyItem water = supplyItemRepository.findByCodeIgnoreCase("MIN-001").orElse(null);
            if (shampoo == null || towel == null) {
                log.warn("No se siembran PAR: faltan insumos demo");
                return;
            }
            RoomPar habStandard = new RoomPar("ESTANDAR", RoomPar.Scope.HABITACION,
                    "PAR habitación estándar", true);
            habStandard.addLine(new RoomParLine(shampoo, 2, true, null));
            habStandard.addLine(new RoomParLine(towel, 2, true, null));
            roomParRepository.save(habStandard);

            if (water != null) {
                RoomPar minibar = new RoomPar("ESTANDAR", RoomPar.Scope.MINIBAR,
                        "PAR minibar estándar", true);
                minibar.addLine(new RoomParLine(water, 4, true, null));
                minibar.addLine(new RoomParLine(shampoo, 2, false, null));
                roomParRepository.save(minibar);
            }
            log.info("PAR demo sembrados para habitación estándar");
        };
    }

    private void seedDefaultLocations(LocationRepository repo) {
        upsertLocation(repo, "BODEGA_PRINCIPAL", "Bodega principal", Location.Type.BODEGA, null, null,
                "Bodega central del hotel");
        Location piso1 = upsertLocation(repo, "PISO_1", "Piso 1", Location.Type.PISO, null, null, null);
        Location piso2 = upsertLocation(repo, "PISO_2", "Piso 2", Location.Type.PISO, null, null, null);
        Location piso3 = upsertLocation(repo, "PISO_3", "Piso 3", Location.Type.PISO, null, null, null);
        upsertLocation(repo, "LAVANDERIA", "Lavandería", Location.Type.LAVANDERIA, null, null, null);
        upsertLocation(repo, "RESTAURANTE", "Restaurante", Location.Type.RESTAURANTE, null, null, null);
        upsertLocation(repo, "MANTENIMIENTO", "Mantenimiento", Location.Type.MANTENIMIENTO, null, null, null);
        upsertLocation(repo, "CARRO_HOUSEKEEPING_1", "Carro de housekeeping 1", Location.Type.CARRITO, null, null,
                "Carro asignado al turno de mañana");
        upsertLocation(repo, "CARRO_HOUSEKEEPING_2", "Carro de housekeeping 2", Location.Type.CARRITO, null, null,
                "Carro asignado al turno de tarde");

        // Sembrar una HABITACION + MINIBAR para los pisos 1, 2 y 3 (números 101-115, 201-215, 301-315)
        // como hace el DataLoader de rooms-service.
        seedRoomsForFloor(repo, piso1, 1);
        seedRoomsForFloor(repo, piso2, 2);
        seedRoomsForFloor(repo, piso3, 3);
    }

    private void seedRoomsForFloor(LocationRepository repo, Location parent, int floor) {
        for (int i = 1; i <= 15; i++) {
            String num = String.format("%d%02d", floor, i);
            String roomCode = "HAB_" + num;
            String minibarCode = "MINIBAR_" + num;
            Location room = upsertLocation(repo, roomCode, "Habitación " + num,
                    Location.Type.HABITACION, parent, num, null);
            upsertLocation(repo, minibarCode, "Minibar habitación " + num,
                    Location.Type.MINIBAR, room, num, null);
        }
    }

    private Location upsertLocation(LocationRepository repo, String code, String name, String type,
                                    Location parent, String roomNumber, String description) {
        return repo.findByCodeIgnoreCase(code).orElseGet(() ->
                repo.save(new Location(code, name, type, parent, roomNumber, description, true)));
    }

    private void migrateGlobalStockToBodega(LocationRepository locationRepository,
                                            StockByLocationRepository stockByLocationRepository,
                                            SupplyItemRepository supplyItemRepository) {
        Location bodega = locationRepository.findByCodeIgnoreCase("BODEGA_PRINCIPAL").orElse(null);
        if (bodega == null) {
            log.warn("No existe BODEGA_PRINCIPAL — se omite la migración de stock");
            return;
        }
        List<SupplyItem> items = supplyItemRepository.findAll();
        int migrated = 0;
        for (SupplyItem item : items) {
            BigDecimal current = stockByLocationRepository.sumQuantityByItem(item.getId());
            BigDecimal currentSum = current == null ? BigDecimal.ZERO : current;
            int globalStock = item.getStock() == null ? 0 : item.getStock();
            if (currentSum.compareTo(BigDecimal.ZERO) == 0 && globalStock > 0) {
                StockByLocation row = new StockByLocation(item, bodega, globalStock);
                stockByLocationRepository.save(row);
                migrated++;
            }
        }
        if (migrated > 0) {
            log.info("Migrados {} insumos a BODEGA_PRINCIPAL desde stock global", migrated);
        }
    }

    @Bean
    @Order(1)
    CommandLineRunner migrateLegacySupplyItemCatalogColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            backfillAllowsDecimal(jdbcTemplate);

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

    private static void backfillAllowsDecimal(JdbcTemplate jdbcTemplate) {
        if (!columnExists(jdbcTemplate, "units_of_measure", "allows_decimal")) {
            return;
        }
        jdbcTemplate.update("""
                update units_of_measure
                set allows_decimal = false
                where allows_decimal is null
                """);
        jdbcTemplate.update("""
                update units_of_measure
                set allows_decimal = true
                where lower(code) in ('litro', 'lt', 'kg', 'gramo', 'g', 'ml')
                   or lower(abbreviation) in ('lt', 'kg', 'g', 'ml')
                """);
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
