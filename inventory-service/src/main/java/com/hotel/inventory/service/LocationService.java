package com.hotel.inventory.service;

import com.hotel.inventory.dto.CreateLocationRequest;
import com.hotel.inventory.dto.UpdateLocationRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * CRUD de ubicaciones físicas del inventario.
 */
@Service
public class LocationService {
    private static final String LOCATION_CODE_PREFIX = "LOC-";
    private static final Pattern LOCATION_CODE_PATTERN = Pattern.compile("^" + LOCATION_CODE_PREFIX + "(\\d+)$");

    private final LocationRepository locationRepository;
    private final StockByLocationRepository stockByLocationRepository;
    private final AuditService auditService;

    public LocationService(LocationRepository locationRepository,
                           StockByLocationRepository stockByLocationRepository,
                           AuditService auditService) {
        this.locationRepository = locationRepository;
        this.stockByLocationRepository = stockByLocationRepository;
        this.auditService = auditService;
    }

    public List<Location> list(String type, Boolean activeOnly) {
        boolean onlyActive = activeOnly == null || activeOnly;
        if (type != null && !type.isBlank()) {
            String normalized = type.trim().toUpperCase(Locale.ROOT);
            return onlyActive
                    ? locationRepository.findByTypeAndActiveTrue(normalized)
                    : locationRepository.findByType(normalized);
        }
        return onlyActive ? locationRepository.findByActiveTrue() : locationRepository.findAll();
    }

    public Location get(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la ubicación " + id));
    }

    public Location getByCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException("El código de ubicación es obligatorio");
        }
        return locationRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new NotFoundException("No existe la ubicación con código " + code));
    }

    /**
     * Resuelve la ubicación de habitación según el tipo de entrega (minibar vs habitación).
     */
    public Location resolveRoomLocation(String roomNumber, String assignmentOrLocationType) {
        if (roomNumber == null || roomNumber.isBlank()) {
            return null;
        }
        String room = roomNumber.trim();
        String locationType = mapToLocationType(assignmentOrLocationType);
        return locationRepository.findByRoomNumberAndType(room, locationType)
                .or(() -> locationRepository.findByCodeIgnoreCase(
                        ("MINIBAR".equals(locationType) ? "MINIBAR_" : "HAB_") + room))
                .orElse(null);
    }

    public Location requireDefaultWarehouse() {
        return locationRepository.findByCodeIgnoreCase("BODEGA_PRINCIPAL")
                .orElseThrow(() -> new BusinessException(
                        "No existe la ubicación BODEGA_PRINCIPAL. Ejecute el DataLoader de ubicaciones."));
    }

    private String mapToLocationType(String assignmentOrLocationType) {
        if (assignmentOrLocationType == null || assignmentOrLocationType.isBlank()) {
            return Location.Type.HABITACION;
        }
        String normalized = assignmentOrLocationType.trim().toUpperCase(Locale.ROOT);
        if ("MINIBAR".equals(normalized)) {
            return Location.Type.MINIBAR;
        }
        return Location.Type.HABITACION;
    }

    @Transactional
    public Location create(CreateLocationRequest request, String username) {
        String code = generateNextLocationCode();
        String type = normalize(request.type());
        if (!Location.Type.isValid(type)) {
            throw new BusinessException("Tipo de ubicación no válido: " + type);
        }
        if (locationRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException("Ya existe una ubicación con código " + code);
        }
        Location parent = resolveParent(request.parentLocationId());
        Location location = new Location(code, request.name().trim(), type, parent,
                normalizeRoom(request.roomNumber()), request.description(),
                request.active() == null ? Boolean.TRUE : request.active());
        Location saved = locationRepository.save(location);
        auditService.record("CREATE", "Location", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Location update(Long id, UpdateLocationRequest request, String username) {
        Location location = get(id);
        String newCode = normalize(request.code());
        String type = normalize(request.type());
        if (!Location.Type.isValid(type)) {
            throw new BusinessException("Tipo de ubicación no válido: " + type);
        }
        if (locationRepository.existsByCodeIgnoreCaseAndIdNot(newCode, id)) {
            throw new BusinessException("Ya existe una ubicación con código " + newCode);
        }
        location.setCode(newCode);
        location.setName(request.name().trim());
        location.setType(type);
        location.setParent(resolveParent(request.parentLocationId()));
        location.setRoomNumber(normalizeRoom(request.roomNumber()));
        location.setDescription(request.description());
        if (request.active() != null) {
            location.setActive(request.active());
        }
        Location saved = locationRepository.save(location);
        auditService.record("UPDATE", "Location", saved.getId(), username, saved.getCode());
        return saved;
    }

    @Transactional
    public Location deactivate(Long id, String username) {
        Location location = get(id);
        if (stockByLocationRepository.existsByLocation_Id(id)) {
            // Permitir desactivar aunque tenga stock, pero auditar
            auditService.record("DEACTIVATE_WITH_STOCK", "Location", id, username, location.getCode());
        }
        location.setActive(false);
        Location saved = locationRepository.save(location);
        auditService.record("DEACTIVATE", "Location", saved.getId(), username, saved.getCode());
        return saved;
    }

    private Location resolveParent(Long parentId) {
        if (parentId == null) return null;
        return locationRepository.findById(parentId)
                .orElseThrow(() -> new BusinessException("La ubicación padre " + parentId + " no existe"));
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRoom(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String generateNextLocationCode() {
        int nextSequence = locationRepository.findAllCodes().stream()
                .map(this::extractTrailingNumber)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
        return LOCATION_CODE_PREFIX + String.format("%04d", nextSequence);
    }

    private int extractTrailingNumber(String code) {
        if (code == null || code.isBlank()) {
            return 0;
        }
        Matcher matcher = LOCATION_CODE_PATTERN.matcher(normalize(code));
        if (!matcher.find()) {
            return 0;
        }
        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
