package com.hotel.inventory.service;

import com.hotel.inventory.dto.InitCountRequest;
import com.hotel.inventory.dto.RecordCountRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.model.InventoryDocument;
import com.hotel.inventory.model.InventoryDocumentLine;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.model.StockByLocation;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.InventoryDocumentLineRepository;
import com.hotel.inventory.repository.InventoryDocumentRepository;
import com.hotel.inventory.repository.InventoryMovementRepository;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceCountTest {

    @Mock
    private InventoryDocumentRepository documentRepo;
    @Mock
    private InventoryDocumentLineRepository lineRepo;
    @Mock
    private InventoryMovementRepository movementRepo;
    @Mock
    private SupplyItemRepository itemRepo;
    @Mock
    private LocationRepository locationRepo;
    @Mock
    private StockByLocationRepository stockByLocationRepository;
    @Mock
    private CatalogService catalogService;
    @Mock
    private StockLocationService stockLocationService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void initCountCreatesDocumentFromLocationStock() {
        Location bodega = location(1L, "BODEGA_PRINCIPAL");
        SupplyItem item = item(10L, "ASE-001");
        StockByLocation row = new StockByLocation(item, bodega, 5);

        when(locationRepo.findById(1L)).thenReturn(Optional.of(bodega));
        when(stockByLocationRepository.findByLocation_Id(1L)).thenReturn(List.of(row));
        when(documentRepo.findMaxCodeByType(InventoryDocument.Type.CONTEO)).thenReturn(Optional.empty());
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> {
            InventoryDocument doc = invocation.getArgument(0);
            doc.setId(100L);
            doc.getLines().forEach(line -> line.setId(200L));
            return doc;
        });

        InventoryDocument doc = documentService.initCount(new InitCountRequest(1L, "Conteo mensual"), "admin");

        assertThat(doc.getType()).isEqualTo(InventoryDocument.Type.CONTEO);
        assertThat(doc.getStatus()).isEqualTo(InventoryDocument.Status.BORRADOR);
        assertThat(doc.getLines()).hasSize(1);
        assertThat(doc.getLines().get(0).getQuantityExpected()).isEqualTo(5);
        verify(auditService).record("INIT_COUNT", "InventoryDocument", 100L, "admin", "BODEGA_PRINCIPAL");
    }

    @Test
    void initCountFailsWhenLocationHasNoStock() {
        Location bodega = location(1L, "BODEGA_PRINCIPAL");
        when(locationRepo.findById(1L)).thenReturn(Optional.of(bodega));
        when(stockByLocationRepository.findByLocation_Id(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> documentService.initCount(new InitCountRequest(1L, null), "admin"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No hay stock registrado");
    }

    @Test
    void completeCountWithoutVarianceExecutesImmediately() {
        InventoryDocument doc = countDocument(100L, InventoryDocument.Status.BORRADOR);
        InventoryDocumentLine line = doc.getLines().get(0);
        line.setQuantityActual(5);

        when(documentRepo.findByIdWithLines(100L)).thenReturn(Optional.of(doc));
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryDocument result = documentService.completeCount(100L, "admin");

        assertThat(result.getStatus()).isEqualTo(InventoryDocument.Status.EJECUTADO);
        verify(itemRepo, never()).findById(any());
        verify(stockLocationService, never()).incrementAt(any(), any(), any());
        verify(stockLocationService, never()).decrementAt(any(), any(), any());
    }

    @Test
    void completeCountWithVarianceRequiresApproval() {
        InventoryDocument doc = countDocument(100L, InventoryDocument.Status.BORRADOR);
        doc.getLines().get(0).setQuantityActual(3);

        when(documentRepo.findByIdWithLines(100L)).thenReturn(Optional.of(doc));
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryDocument result = documentService.completeCount(100L, "admin");

        assertThat(result.getStatus()).isEqualTo(InventoryDocument.Status.PENDIENTE_APROBACION);
        verify(stockLocationService, never()).incrementAt(any(), any(), any());
    }

    @Test
    void approveVarianceSetsApprovedStatus() {
        InventoryDocument doc = countDocument(100L, InventoryDocument.Status.PENDIENTE_APROBACION);
        when(documentRepo.findByIdWithLines(100L)).thenReturn(Optional.of(doc));
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryDocument result = documentService.approveVariance(100L, "admin");

        assertThat(result.getStatus()).isEqualTo(InventoryDocument.Status.APROBADO);
        assertThat(result.getApprover()).isEqualTo("admin");
    }

    @Test
    void applyVarianceAdjustsStockAndMarksExecuted() {
        InventoryDocument doc = countDocument(100L, InventoryDocument.Status.APROBADO);
        doc.getLines().get(0).setQuantityActual(7);

        SupplyItem item = item(10L, "ASE-001");
        item.setStock(20);

        when(documentRepo.findByIdWithLines(100L)).thenReturn(Optional.of(doc));
        when(itemRepo.findById(10L)).thenReturn(Optional.of(item));
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryDocument result = documentService.applyVariance(100L, "admin");

        assertThat(result.getStatus()).isEqualTo(InventoryDocument.Status.EJECUTADO);
        verify(stockLocationService).incrementAt(eq(10L), eq(1L), eq(new BigDecimal("2.000")));
        verify(movementRepo).save(any());
    }

    @Test
    void recordCountUpdatesLineQuantities() {
        InventoryDocument doc = countDocument(100L, InventoryDocument.Status.BORRADOR);
        InventoryDocumentLine line = doc.getLines().get(0);

        when(documentRepo.findByIdWithLines(100L)).thenReturn(Optional.of(doc));
        when(documentRepo.save(any(InventoryDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryDocument result = documentService.recordCount(
                100L,
                new RecordCountRequest(List.of(new RecordCountRequest.CountLine(line.getId(), 4)), "Revisado"),
                "admin"
        );

        assertThat(line.getQuantityActual()).isEqualTo(4);
        assertThat(result.getNotes()).contains("Revisado");
        verify(lineRepo).save(line);
    }

    private static InventoryDocument countDocument(Long id, String status) {
        Location location = location(1L, "BODEGA_PRINCIPAL");
        SupplyItem item = item(10L, "ASE-001");
        InventoryDocument doc = new InventoryDocument(
                "CNT-2026-0001",
                InventoryDocument.Type.CONTEO,
                status,
                null,
                null,
                location,
                "admin",
                null
        );
        doc.setId(id);
        InventoryDocumentLine line = new InventoryDocumentLine(item, 5, 5, null, null, 1);
        line.setId(200L);
        doc.addLine(line);
        return doc;
    }

    private static Location location(Long id, String code) {
        Location location = new Location(code, code, Location.Type.BODEGA, null, null, null, true);
        location.setId(id);
        return location;
    }

    private static SupplyItem item(Long id, String code) {
        SupplyItem item = new SupplyItem();
        item.setId(id);
        item.setCode(code);
        item.setName(code);
        item.setActive(true);
        item.setStock(10);
        return item;
    }
}
