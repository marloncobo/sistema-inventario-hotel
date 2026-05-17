package com.hotel.inventory.config;

import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.InventoryMovement;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.LowStockAlert;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.model.RoomParLine;
import com.hotel.inventory.model.StockByLocation;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.LowStockAlertRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.RoomParRepository;
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
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataLoader {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);
    @Bean
    @Order(2)
    CommandLineRunner loadInventoryData(SupplyItemRepository repository, CategoryRepository categoryRepository,
                                        UnitOfMeasureRepository unitRepository, ProviderRepository providerRepository,
                                        AreaRepository areaRepository) {
        return args -> {
            ensureCategory(categoryRepository, "MINIBAR", "MINIBAR");
            ensureCategory(categoryRepository, "ASEO", "ASEO");
            ensureCategory(categoryRepository, "LENCERIA", "LENCERIA");
            ensureCategory(categoryRepository, "ALIMENTOS", "ALIMENTOS");
            ensureCategory(categoryRepository, "MANTENIMIENTO", "MANTENIMIENTO");

            ensureUnit(unitRepository, "UND", "UNIDAD", "UND", false);
            ensureUnit(unitRepository, "CAJA", "CAJA", "CJ", false);
            ensureUnit(unitRepository, "LITRO", "LITRO", "LT", true);

            ensureProvider(providerRepository, "PRO-0001", "900001001", "Aseo Premium SAS");
            ensureProvider(providerRepository, "PRO-0002", "900001002", "Distribuciones Hoteleras SAS");
            ensureProvider(providerRepository, "PRO-0003", "900001003", "Bebidas del Caribe SAS");
            ensureProvider(providerRepository, "PRO-0004", "900001004", "Textiles y Blancos Andinos");
            ensureProvider(providerRepository, "PRO-0005", "900001005", "Mantenimiento Express SAS");

            ensureArea(areaRepository, "LIMPIEZA", "LIMPIEZA");
            ensureArea(areaRepository, "RESTAURANTE", "RESTAURANTE");
            ensureArea(areaRepository, "MANTENIMIENTO", "MANTENIMIENTO");
            ensureArea(areaRepository, "MINIBAR", "MINIBAR");

            Category minibar = categoryRepository.findByCodeIgnoreCase("MINIBAR").orElseThrow();
            Category aseo = categoryRepository.findByCodeIgnoreCase("ASEO").orElseThrow();
            Category lenceria = categoryRepository.findByCodeIgnoreCase("LENCERIA").orElseThrow();
            Category alimentos = categoryRepository.findByCodeIgnoreCase("ALIMENTOS").orElseThrow();
            Category mantenimiento = categoryRepository.findByCodeIgnoreCase("MANTENIMIENTO").orElseThrow();
            UnitOfMeasure unit = unitRepository.findByCodeIgnoreCase("UND").orElseThrow();
            Provider aseoProvider = providerRepository.findByNameIgnoreCase("Aseo Premium SAS").orElseThrow();
            Provider hotelProvider = providerRepository.findByNameIgnoreCase("Distribuciones Hoteleras SAS").orElseThrow();
            Provider bebidasProvider = providerRepository.findByNameIgnoreCase("Bebidas del Caribe SAS").orElseThrow();
            Provider textilProvider = providerRepository.findByNameIgnoreCase("Textiles y Blancos Andinos").orElseThrow();
            Provider mantenimientoProvider = providerRepository.findByNameIgnoreCase("Mantenimiento Express SAS").orElseThrow();

            ensureItem(repository, "MIN-001", "Agua embotellada 600ml", "Agua para minibar", minibar, unit, bebidasProvider, 82, 18, 120);
            ensureItem(repository, "MIN-002", "Gaseosa cola 350ml", "Bebida fria para minibar", minibar, unit, bebidasProvider, 26, 20, 96);
            ensureItem(repository, "MIN-003", "Papas premium 45g", "Snack individual para minibar", minibar, unit, hotelProvider, 38, 12, 120);
            ensureItem(repository, "ASE-001", "Shampoo individual", "Amenidad para huesped", aseo, unit, hotelProvider, 64, 20, 200);
            ensureItem(repository, "ASE-002", "Jabon de manos", "Amenidad para banos de habitaciones", aseo, unit, aseoProvider, 18, 20, 120);
            ensureItem(repository, "LEN-001", "Toalla facial", "Lenceria de habitacion", lenceria, unit, textilProvider, 52, 18, 100);
            ensureItem(repository, "LEN-002", "Juego de sabanas queen", "Reposicion de lenceria para habitaciones", lenceria, unit, textilProvider, 12, 10, 40);
            ensureItem(repository, "ALI-001", "Cafe molido premium 500g", "Consumo del restaurante y room service", alimentos, unit, hotelProvider, 22, 8, 60);
            ensureItem(repository, "MAN-001", "Bombillo LED E27", "Repuesto para mantenimiento", mantenimiento, unit, mantenimientoProvider, 9, 6, 30);
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
    @Order(3)
    CommandLineRunner loadLocationsAndMigrateStock(LocationRepository locationRepository,
                                                   StockByLocationRepository stockByLocationRepository,
                                                   SupplyItemRepository supplyItemRepository) {
        return args -> {
            seedDefaultLocations(locationRepository);
            migrateGlobalStockToBodega(locationRepository, stockByLocationRepository, supplyItemRepository);
        };
    }

    @Bean
    @Order(4)
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

    @Bean
    @Order(5)
    CommandLineRunner seedDetailedDemoInventory(LocationRepository locationRepository,
                                                StockByLocationRepository stockByLocationRepository,
                                                SupplyItemRepository supplyItemRepository,
                                                InventoryMovementRepository movementRepository,
                                                LowStockAlertRepository lowStockAlertRepository,
                                                AreaRepository areaRepository,
                                                ProviderRepository providerRepository) {
        return args -> {
            Location bodega = locationRepository.findByCodeIgnoreCase("BODEGA_PRINCIPAL").orElseThrow();
            Location carro1 = locationRepository.findByCodeIgnoreCase("CARRO_HOUSEKEEPING_1").orElseThrow();
            Location carro2 = locationRepository.findByCodeIgnoreCase("CARRO_HOUSEKEEPING_2").orElseThrow();
            Location lavanderia = locationRepository.findByCodeIgnoreCase("LAVANDERIA").orElseThrow();
            Location restaurante = locationRepository.findByCodeIgnoreCase("RESTAURANTE").orElseThrow();
            Location mantenimiento = locationRepository.findByCodeIgnoreCase("MANTENIMIENTO").orElseThrow();
            Location minibar101 = locationRepository.findByCodeIgnoreCase("MINIBAR_101").orElseThrow();
            Location minibar102 = locationRepository.findByCodeIgnoreCase("MINIBAR_102").orElseThrow();
            Location minibar201 = locationRepository.findByCodeIgnoreCase("MINIBAR_201").orElseThrow();
            Location hab101 = locationRepository.findByCodeIgnoreCase("HAB_101").orElseThrow();
            Location hab102 = locationRepository.findByCodeIgnoreCase("HAB_102").orElseThrow();

            SupplyItem agua = supplyItemRepository.findByCodeIgnoreCase("MIN-001").orElseThrow();
            SupplyItem cola = supplyItemRepository.findByCodeIgnoreCase("MIN-002").orElseThrow();
            SupplyItem papas = supplyItemRepository.findByCodeIgnoreCase("MIN-003").orElseThrow();
            SupplyItem shampoo = supplyItemRepository.findByCodeIgnoreCase("ASE-001").orElseThrow();
            SupplyItem jabon = supplyItemRepository.findByCodeIgnoreCase("ASE-002").orElseThrow();
            SupplyItem toalla = supplyItemRepository.findByCodeIgnoreCase("LEN-001").orElseThrow();
            SupplyItem sabanas = supplyItemRepository.findByCodeIgnoreCase("LEN-002").orElseThrow();
            SupplyItem cafe = supplyItemRepository.findByCodeIgnoreCase("ALI-001").orElseThrow();
            SupplyItem bombillo = supplyItemRepository.findByCodeIgnoreCase("MAN-001").orElseThrow();

            upsertStock(stockByLocationRepository, agua, bodega, 70, 15);
            upsertStock(stockByLocationRepository, agua, minibar101, 6, 2);
            upsertStock(stockByLocationRepository, agua, minibar102, 4, 2);
            upsertStock(stockByLocationRepository, agua, minibar201, 2, 2);

            upsertStock(stockByLocationRepository, cola, bodega, 18, 10);
            upsertStock(stockByLocationRepository, cola, minibar101, 4, 2);
            upsertStock(stockByLocationRepository, cola, minibar102, 2, 2);
            upsertStock(stockByLocationRepository, cola, minibar201, 2, 2);

            upsertStock(stockByLocationRepository, papas, bodega, 28, 10);
            upsertStock(stockByLocationRepository, papas, minibar101, 4, 2);
            upsertStock(stockByLocationRepository, papas, minibar102, 3, 2);
            upsertStock(stockByLocationRepository, papas, minibar201, 3, 2);

            upsertStock(stockByLocationRepository, shampoo, bodega, 40, 15);
            upsertStock(stockByLocationRepository, shampoo, carro1, 12, 4);
            upsertStock(stockByLocationRepository, shampoo, carro2, 12, 4);

            upsertStock(stockByLocationRepository, jabon, bodega, 10, 12);
            upsertStock(stockByLocationRepository, jabon, carro1, 4, 3);
            upsertStock(stockByLocationRepository, jabon, carro2, 4, 3);

            upsertStock(stockByLocationRepository, toalla, bodega, 28, 10);
            upsertStock(stockByLocationRepository, toalla, lavanderia, 20, 6);
            upsertStock(stockByLocationRepository, toalla, hab101, 2, 2);
            upsertStock(stockByLocationRepository, toalla, hab102, 2, 2);

            upsertStock(stockByLocationRepository, sabanas, bodega, 6, 4);
            upsertStock(stockByLocationRepository, sabanas, lavanderia, 6, 4);

            upsertStock(stockByLocationRepository, cafe, bodega, 10, 4);
            upsertStock(stockByLocationRepository, cafe, restaurante, 12, 4);

            upsertStock(stockByLocationRepository, bombillo, bodega, 5, 3);
            upsertStock(stockByLocationRepository, bombillo, mantenimiento, 4, 2);

            syncGlobalStock(supplyItemRepository, stockByLocationRepository, agua, cola, papas, shampoo, jabon, toalla, sabanas, cafe, bombillo);

            if (movementRepository.count() == 0) {
                Area limpieza = areaRepository.findByNameIgnoreCase("LIMPIEZA").orElseThrow();
                Area minibar = areaRepository.findByNameIgnoreCase("MINIBAR").orElseThrow();
                Area mantenimientoArea = areaRepository.findByNameIgnoreCase("MANTENIMIENTO").orElseThrow();
                Area restauranteArea = areaRepository.findByNameIgnoreCase("RESTAURANTE").orElseThrow();
                Provider bebidasProvider = providerRepository.findByNameIgnoreCase("Bebidas del Caribe SAS").orElseThrow();
                Provider mantenimientoProvider = providerRepository.findByNameIgnoreCase("Mantenimiento Express SAS").orElseThrow();

                movementRepository.save(buildMovement(agua, InventoryMovement.Type.RECEPCION, "COMPRA", 24, 58, 82,
                        null, minibar, bebidasProvider, "almacen", "Recepcion semanal de bebidas", bodega, null, 3));
                movementRepository.save(buildMovement(cola, InventoryMovement.Type.SALIDA, "MINIBAR", 6, 32, 26,
                        "101", minibar, bebidasProvider, "servicio", "Reposicion minibar habitacion 101", bodega, minibar101, 2));
                movementRepository.save(buildMovement(papas, InventoryMovement.Type.SALIDA, "MINIBAR", 5, 43, 38,
                        "102", minibar, null, "servicio", "Reposicion minibar habitacion 102", bodega, minibar102, 2));
                movementRepository.save(buildMovement(shampoo, InventoryMovement.Type.TRANSFERENCIA, "HOUSEKEEPING", 8, 72, 64,
                        null, limpieza, null, "almacen", "Despacho a carro de housekeeping", bodega, carro1, 1));
                movementRepository.save(buildMovement(jabon, InventoryMovement.Type.SALIDA, "HOUSEKEEPING", 4, 22, 18,
                        "201", limpieza, null, "servicio", "Reposicion de amenidades en habitaciones", carro1, hab101, 1));
                movementRepository.save(buildMovement(cafe, InventoryMovement.Type.SALIDA, "RESTAURANTE", 5, 27, 22,
                        null, restauranteArea, null, "restaurante", "Consumo de cafeteria y desayunos", bodega, restaurante, 4));
                movementRepository.save(buildMovement(bombillo, InventoryMovement.Type.SALIDA, "MANTENIMIENTO", 2, 11, 9,
                        null, mantenimientoArea, mantenimientoProvider, "mantenimiento", "Cambio de bombillos en pasillo", bodega, mantenimiento, 5));
            }

            if (lowStockAlertRepository.count() == 0) {
                lowStockAlertRepository.save(new LowStockAlert(jabon, jabon.getStock(), jabon.getMinStock(), "ABIERTA",
                        LocalDateTime.now().minusHours(14)));
                lowStockAlertRepository.save(new LowStockAlert(sabanas, sabanas.getStock(), sabanas.getMinStock(), "ABIERTA",
                        LocalDateTime.now().minusDays(1)));

                LowStockAlert resolved = new LowStockAlert(cola, cola.getStock(), cola.getMinStock(), "RESUELTA",
                        LocalDateTime.now().minusDays(5));
                resolved.setResolvedAt(LocalDateTime.now().minusDays(3));
                lowStockAlertRepository.save(resolved);
            }
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

    private void ensureCategory(CategoryRepository repository, String code, String name) {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(new Category(code, name, true));
    }

    private void ensureUnit(UnitOfMeasureRepository repository, String code, String name, String abbreviation,
                            boolean allowsDecimal) {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(new UnitOfMeasure(code, name, abbreviation, true, allowsDecimal));
    }

    private void ensureProvider(ProviderRepository repository, String code, String documentNumber, String name) {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(new Provider(code, documentNumber, name, null, null, true));
    }

    private void ensureArea(AreaRepository repository, String code, String name) {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(new Area(code, name, true));
    }

    private void ensureItem(SupplyItemRepository repository, String code, String name, String description,
                            Category category, UnitOfMeasure unit, Provider provider,
                            int stock, int minStock, int maxStock) {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(new SupplyItem(code, name, description, category, unit, provider, stock, minStock, maxStock, true));
    }

    private void upsertStock(StockByLocationRepository repository, SupplyItem item, Location location,
                             int quantity, Integer minStock) {
        StockByLocation row = repository.findByItem_IdAndLocation_Id(item.getId(), location.getId())
                .orElseGet(() -> new StockByLocation(item, location, quantity));
        row.setQuantity(BigDecimal.valueOf(quantity));
        row.setMinStock(minStock);
        repository.save(row);
    }

    private void syncGlobalStock(SupplyItemRepository itemRepository, StockByLocationRepository stockRepository,
                                 SupplyItem... items) {
        for (SupplyItem item : items) {
            BigDecimal total = stockRepository.sumQuantityByItem(item.getId());
            int totalValue = total == null ? 0 : total.intValue();
            if (item.getStock() == null || item.getStock() != totalValue) {
                item.setStock(totalValue);
                itemRepository.save(item);
            }
        }
    }

    private InventoryMovement buildMovement(SupplyItem item, String movementType, String origin, int quantity,
                                            int stockBefore, int stockAfter, String roomNumber, Area area,
                                            Provider provider, String responsible, String referenceText,
                                            Location fromLocation, Location toLocation, int daysAgo) {
        InventoryMovement movement = new InventoryMovement(
                item,
                movementType,
                origin,
                quantity,
                stockBefore,
                stockAfter,
                roomNumber,
                area,
                provider,
                responsible,
                referenceText,
                "VALIDO",
                LocalDateTime.now().minusDays(daysAgo)
        );
        movement.setFromLocation(fromLocation);
        movement.setToLocation(toLocation);
        movement.setLegacy(false);
        return movement;
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
