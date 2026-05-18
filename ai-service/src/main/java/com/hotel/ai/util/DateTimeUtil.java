package com.hotel.ai.util;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Utilidad para manejar fechas y horas en la zona horaria de Colombia (Bogotá)
 *
 * Colombia usa la zona horaria America/Bogota (UTC-5) todo el año
 * sin cambios de horario de verano.
 */
public class DateTimeUtil {

    /**
     * Zona horaria de Colombia (Bogotá)
     */
    public static final String COLOMBIA_TIMEZONE = "America/Bogota";
    public static final ZoneId COLOMBIA_ZONE_ID = ZoneId.of(COLOMBIA_TIMEZONE);

    /**
     * Obtiene la fecha y hora actual en la zona horaria de Colombia
     *
     * @return LocalDateTime con la hora actual en Bogotá
     */
    public static LocalDateTime nowColombia() {
        return LocalDateTime.now(COLOMBIA_ZONE_ID);
    }

    /**
     * Convierte un LocalDateTime a la zona horaria de Colombia
     *
     * @param dateTime el LocalDateTime a convertir
     * @return LocalDateTime convertido a la zona horaria de Colombia
     */
    public static LocalDateTime toColombia(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime;
    }
}
