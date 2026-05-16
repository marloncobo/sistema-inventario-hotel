package com.hotel.inventory.util;

import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.model.SupplyItem;
import com.hotel.inventory.model.UnitOfMeasure;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Validación y normalización de cantidades (enteras o decimales según unidad).
 */
public final class QuantitySupport {

    public static final int SCALE = 3;

    private QuantitySupport() {}

    public static BigDecimal toQuantity(Number value) {
        if (value == null) {
            throw new BusinessException("La cantidad es obligatoria");
        }
        return normalize(new BigDecimal(value.toString()));
    }

    public static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            throw new BusinessException("La cantidad es obligatoria");
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static void validatePositive(SupplyItem item, BigDecimal quantity) {
        BigDecimal qty = normalize(quantity);
        if (qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("La cantidad debe ser mayor a cero");
        }
        validateUnitAllows(item, qty);
    }

    public static void validateNonZero(SupplyItem item, BigDecimal quantity) {
        BigDecimal qty = normalize(quantity);
        if (qty.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("La cantidad no puede ser cero");
        }
        validateUnitAllows(item, qty);
    }

    public static int toCachedTotal(BigDecimal total) {
        if (total == null) {
            return 0;
        }
        return total.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private static void validateUnitAllows(SupplyItem item, BigDecimal quantity) {
        UnitOfMeasure unit = item == null ? null : item.getUnitEntity();
        boolean allowsDecimal = unit != null && Boolean.TRUE.equals(unit.getAllowsDecimal());
        if (!allowsDecimal && hasFraction(quantity)) {
            String unitLabel = unit == null ? "unidad" : unit.getAbbreviation();
            throw new BusinessException("El insumo no admite cantidades decimales con unidad " + unitLabel);
        }
    }

    private static boolean hasFraction(BigDecimal quantity) {
        return quantity.stripTrailingZeros().scale() > 0;
    }
}
