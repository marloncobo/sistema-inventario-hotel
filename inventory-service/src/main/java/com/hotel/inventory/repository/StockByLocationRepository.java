package com.hotel.inventory.repository;

import com.hotel.inventory.model.StockByLocation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface StockByLocationRepository extends JpaRepository<StockByLocation, Long> {

    Optional<StockByLocation> findByItem_IdAndLocation_Id(Long itemId, Long locationId);

    /**
     * Variante con SELECT ... FOR UPDATE: bloquea la fila para evitar carreras
     * cuando dos transacciones mueven el mismo (item, location) a la vez.
     * Usar dentro de @Transactional.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from StockByLocation s where s.item.id = :itemId and s.location.id = :locationId")
    Optional<StockByLocation> findByItemAndLocationForUpdate(@Param("itemId") Long itemId,
                                                             @Param("locationId") Long locationId);

    List<StockByLocation> findByItem_Id(Long itemId);

    List<StockByLocation> findByLocation_Id(Long locationId);

    @Query("select coalesce(sum(s.quantity), 0) from StockByLocation s where s.item.id = :itemId")
    BigDecimal sumQuantityByItem(@Param("itemId") Long itemId);

    boolean existsByLocation_Id(Long locationId);
}
