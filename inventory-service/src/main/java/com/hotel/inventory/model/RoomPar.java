package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Plantilla PAR (cantidades objetivo) por tipo de habitación y ámbito operativo.
 */
@Entity
@Table(name = "room_pars",
        uniqueConstraints = @UniqueConstraint(name = "uq_room_par_type_scope", columnNames = {"roomType", "scope"}),
        indexes = @Index(name = "idx_room_par_type", columnList = "roomType"))
public class RoomPar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String roomType;

    /** MINIBAR, HABITACION, KIT_ASEO, SERVICIO_HABITACION */
    @Column(nullable = false, length = 30)
    private String scope;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "roomPar", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<RoomParLine> lines = new ArrayList<>();

    public RoomPar() {}

    public RoomPar(String roomType, String scope, String name, Boolean active) {
        this.roomType = roomType;
        this.scope = scope;
        this.name = name;
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

    public void addLine(RoomParLine line) {
        line.setRoomPar(this);
        this.lines.add(line);
    }

    public Long getId() { return id; }
    public String getRoomType() { return roomType; }
    public String getScope() { return scope; }
    public String getName() { return name; }
    public Boolean getActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<RoomParLine> getLines() { return lines; }

    @JsonIgnore
    public List<RoomParLine> getLinesEntity() { return lines; }

    public void setId(Long id) { this.id = id; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public void setScope(String scope) { this.scope = scope; }
    public void setName(String name) { this.name = name; }
    public void setActive(Boolean active) { this.active = active; }
    public void setLines(List<RoomParLine> lines) { this.lines = lines; }

    public static final class Scope {
        public static final String HABITACION = "HABITACION";
        public static final String MINIBAR = "MINIBAR";
        public static final String KIT_ASEO = "KIT_ASEO";
        public static final String SERVICIO_HABITACION = "SERVICIO_HABITACION";

        private Scope() {}

        public static boolean isValid(String value) {
            if (value == null) return false;
            return switch (value) {
                case HABITACION, MINIBAR, KIT_ASEO, SERVICIO_HABITACION -> true;
                default -> false;
            };
        }
    }
}
