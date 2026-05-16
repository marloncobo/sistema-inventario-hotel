package com.hotel.inventory.service;

import com.hotel.inventory.client.RoomClient;
import com.hotel.inventory.dto.RoomParDtos.CreateRoomParRequest;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonLine;
import com.hotel.inventory.dto.RoomParDtos.RoomParComparisonView;
import com.hotel.inventory.dto.RoomParDtos.RoomParLineRequest;
import com.hotel.inventory.dto.RoomParDtos.UpdateRoomParRequest;
import com.hotel.inventory.dto.RoomValidationResponse;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.exception.NotFoundException;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.RoomPar;
import com.hotel.inventory.model.RoomParLine;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.RoomParRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class RoomParService {

    private final RoomParRepository roomParRepository;
    private final SupplyItemRepository itemRepository;
    private final LocationService locationService;
    private final StockLocationService stockLocationService;
    private final RoomClient roomClient;
    private final AuditService auditService;

    public RoomParService(RoomParRepository roomParRepository,
                          SupplyItemRepository itemRepository,
                          LocationService locationService,
                          StockLocationService stockLocationService,
                          RoomClient roomClient,
                          AuditService auditService) {
        this.roomParRepository = roomParRepository;
        this.itemRepository = itemRepository;
        this.locationService = locationService;
        this.stockLocationService = stockLocationService;
        this.roomClient = roomClient;
        this.auditService = auditService;
    }

    public List<RoomPar> list(Boolean activeOnly) {
        if (activeOnly == null || activeOnly) {
            return roomParRepository.findActiveWithLines();
        }
        return roomParRepository.findAllWithLines();
    }

    public RoomPar get(Long id) {
        return roomParRepository.findByIdWithLines(id)
                .orElseThrow(() -> new NotFoundException("No existe el PAR " + id));
    }

    @Transactional
    public RoomPar create(CreateRoomParRequest request, String username) {
        String roomType = normalize(request.roomType());
        String scope = normalize(request.scope());
        validateScope(scope);
        if (roomParRepository.existsByRoomTypeAndScopeIgnoreCase(roomType, scope)) {
            throw new BusinessException("Ya existe un PAR para " + roomType + " / " + scope);
        }
        RoomPar par = new RoomPar(roomType, scope, request.name().trim(), request.active());
        for (RoomParLineRequest lineReq : request.lines()) {
            par.addLine(buildLine(lineReq));
        }
        RoomPar saved = roomParRepository.save(par);
        auditService.record("CREATE", "RoomPar", saved.getId(), username, saved.getName());
        return saved;
    }

    @Transactional
    public RoomPar update(Long id, UpdateRoomParRequest request, String username) {
        RoomPar par = get(id);
        par.setName(request.name().trim());
        if (request.active() != null) {
            par.setActive(request.active());
        }
        par.getLines().clear();
        for (RoomParLineRequest lineReq : request.lines()) {
            par.addLine(buildLine(lineReq));
        }
        RoomPar saved = roomParRepository.save(par);
        auditService.record("UPDATE", "RoomPar", saved.getId(), username, saved.getName());
        return saved;
    }

    public RoomParComparisonView compareRoom(String roomNumber, String scope) {
        String normalizedScope = normalize(scope);
        validateScope(normalizedScope);
        RoomValidationResponse room = validateRoom(roomNumber);
        String roomType = normalize(room.type());
        RoomPar par = roomParRepository.findByRoomTypeAndScopeAndActiveTrue(roomType, normalizedScope)
                .orElseThrow(() -> new BusinessException(
                        "No hay PAR activo para tipo " + roomType + " y ámbito " + normalizedScope));
        Location location = locationService.resolveRoomLocation(roomNumber.trim(), normalizedScope);
        if (location == null) {
            throw new BusinessException("No existe ubicación de inventario para la habitación " + roomNumber);
        }
        return buildComparison(roomNumber.trim(), roomType, normalizedScope, location, par);
    }

    public RoomParComparisonView compareByType(String roomType, String scope) {
        String normalizedType = normalize(roomType);
        String normalizedScope = normalize(scope);
        validateScope(normalizedScope);
        RoomPar par = roomParRepository.findByRoomTypeAndScopeAndActiveTrue(normalizedType, normalizedScope)
                .orElseThrow(() -> new NotFoundException(
                        "No hay PAR para tipo " + normalizedType + " / " + normalizedScope));
        return buildComparison(null, normalizedType, normalizedScope, null, par);
    }

    private RoomParComparisonView buildComparison(String roomNumber, String roomType, String scope,
                                                  Location location, RoomPar par) {
        List<RoomParComparisonLine> lines = new ArrayList<>();
        String overall = "OK";
        for (RoomParLine parLine : par.getLines()) {
            int target = parLine.getTargetQuantity() == null ? 0 : parLine.getTargetQuantity();
            int actual = 0;
            if (location != null) {
                BigDecimal qty = stockLocationService.quantityAt(parLine.getItemId(), location.getId());
                actual = qty == null ? 0 : qty.intValue();
            }
            int gap = target - actual;
            String lineStatus = gap > 0 ? "FALTA" : gap < 0 ? "SOBRA" : "OK";
            if (!"OK".equals(lineStatus) && !"SOBRA".equals(overall)) {
                overall = lineStatus;
            } else if ("SOBRA".equals(lineStatus) && "OK".equals(overall)) {
                overall = "SOBRA";
            }
            lines.add(new RoomParComparisonLine(
                    parLine.getItemId(),
                    parLine.getItemCode(),
                    parLine.getItemName(),
                    target,
                    actual,
                    gap,
                    lineStatus,
                    Boolean.TRUE.equals(parLine.getMandatory())
            ));
        }
        return new RoomParComparisonView(
                roomNumber,
                roomType,
                scope,
                location == null ? null : location.getId(),
                location == null ? null : location.getCode(),
                location == null ? null : location.getName(),
                overall,
                lines
        );
    }

    private RoomParLine buildLine(RoomParLineRequest lineReq) {
        SupplyItem item = itemRepository.findById(lineReq.itemId())
                .orElseThrow(() -> new BusinessException("No existe el insumo " + lineReq.itemId()));
        if (!Boolean.TRUE.equals(item.getActive())) {
            throw new BusinessException("El insumo " + item.getName() + " está inactivo");
        }
        return new RoomParLine(item, lineReq.targetQuantity(), lineReq.mandatory(), lineReq.notes());
    }

    private RoomValidationResponse validateRoom(String roomNumber) {
        try {
            RoomValidationResponse room = roomClient.getRoomByNumber(roomNumber.trim());
            if (room == null || !Boolean.TRUE.equals(room.active())) {
                throw new BusinessException("La habitación " + roomNumber + " no está activa");
            }
            return room;
        } catch (BusinessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new BusinessException("No fue posible validar la habitación: " + ex.getMessage());
        }
    }

    private void validateScope(String scope) {
        if (!RoomPar.Scope.isValid(scope)) {
            throw new BusinessException("Ámbito PAR no válido: " + scope);
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
