package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Ubicación física donde puede vivir el inventario.
 * Tipos soportados: BODEGA, PISO, CARRITO, HABITACION, MINIBAR, LAVANDERIA,
 * RESTAURANTE, MANTENIMIENTO, OTRO.
 *
 * Esto es el corazón del refactor de Fase 1: el stock deja de ser un escalar
 * global por insumo y pasa a estar particionado por (item, location).
 */
@Entity
@Table(name = "locations", indexes = {
        @Index(name = "idx_locations_type", columnList = "type"),
        @Index(name = "idx_locations_room_number", columnList = "roomNumber")
})
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 30)
    private String type;

    /** Ubicación padre, p. ej. PISO_2 → HABITACION_201, HABITACION_201 → MINIBAR_201. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_location_id", foreignKey = @ForeignKey(name = "fk_locations_parent"))
    private Location parent;

    /**
     * Número de habitación cuando la ubicación está vinculada a una habitación
     * (type = HABITACION o MINIBAR). Es un string suelto porque las habitaciones
     * viven en otra BD (rooms-service).
     */
    @Column(length = 10)
    private String roomNumber;

    @Column(length = 300)
    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Location() {}

    public Location(String code, String name, String type, Location parent, String roomNumber,
                    String description, Boolean active) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.parent = parent;
        this.roomNumber = roomNumber;
        this.description = description;
        this.active = active == null ? Boolean.TRUE : active;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (active == null) {
            active = Boolean.TRUE;
        }
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getType() { return type; }
    public Long getParentId() { return parent == null ? null : parent.getId(); }
    public String getParentCode() { return parent == null ? null : parent.getCode(); }
    @JsonIgnore
    public Location getParentEntity() { return parent; }
    public String getRoomNumber() { return roomNumber; }
    public String getDescription() { return description; }
    public Boolean getActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setType(String type) { this.type = type; }
    public void setParent(Location parent) { this.parent = parent; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public void setDescription(String description) { this.description = description; }
    public void setActive(Boolean active) { this.active = active; }

    /** Tipos válidos. Se mantienen como constantes para evitar literales sueltos. */
    public static final class Type {
        public static final String BODEGA = "BODEGA";
        public static final String PISO = "PISO";
        public static final String CARRITO = "CARRITO";
        public static final String HABITACION = "HABITACION";
        public static final String MINIBAR = "MINIBAR";
        public static final String LAVANDERIA = "LAVANDERIA";
        public static final String RESTAURANTE = "RESTAURANTE";
        public static final String MANTENIMIENTO = "MANTENIMIENTO";
        public static final String OTRO = "OTRO";

        private Type() {}

        public static boolean isValid(String value) {
            if (value == null) return false;
            return switch (value) {
                case BODEGA, PISO, CARRITO, HABITACION, MINIBAR,
                     LAVANDERIA, RESTAURANTE, MANTENIMIENTO, OTRO -> true;
                default -> false;
            };
        }
    }
}
