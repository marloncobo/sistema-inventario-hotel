package com.hotel.inventory.service;

import com.hotel.inventory.model.LowStockAlert;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.repository.LowStockAlertRepository;
import com.hotel.inventory.repository.SupplyItemRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LowStockAlertService {
    private static final String OPEN = "ABIERTA";
    private static final String RESOLVED = "RESUELTA";

    private final LowStockAlertRepository alertRepository;
    private final SupplyItemRepository supplyItemRepository;

    public LowStockAlertService(LowStockAlertRepository alertRepository, SupplyItemRepository supplyItemRepository) {
        this.alertRepository = alertRepository;
        this.supplyItemRepository = supplyItemRepository;
    }

    public List<LowStockAlert> list(Boolean openOnly) {
        if (Boolean.TRUE.equals(openOnly)) {
            return alertRepository.findByStatusOrderByCreatedAtDesc(OPEN);
        }
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void evaluate(SupplyItem item) {
        if (item.getStock() <= item.getMinStock()) {
            LowStockAlert alert = alertRepository.findByItemIdAndStatus(item.getId(), OPEN)
                    .orElseGet(() -> new LowStockAlert(item.getId(), item.getName(), item.getStock(), item.getMinStock(), OPEN, LocalDateTime.now()));
            alert.setItemName(item.getName());
            alert.setCurrentStock(item.getStock());
            alert.setMinStock(item.getMinStock());
            alertRepository.save(alert);
            return;
        }
        alertRepository.findByItemIdAndStatus(item.getId(), OPEN).ifPresent(alert -> {
            alert.setStatus(RESOLVED);
            alert.setResolvedAt(LocalDateTime.now());
            alert.setCurrentStock(item.getStock());
            alertRepository.save(alert);
        });
    }

    @Scheduled(fixedDelayString = "${inventory.alerts.low-stock-scan-ms:300000}")
    @Transactional
    public void scanLowStock() {
        supplyItemRepository.findAll().forEach(this::evaluate);
    }
}
