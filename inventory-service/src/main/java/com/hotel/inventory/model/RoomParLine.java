package com.hotel.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "room_par_lines",
        uniqueConstraints = @UniqueConstraint(name = "uq_room_par_line_item", columnNames = {"room_par_id", "item_id"}),
        indexes = @Index(name = "idx_room_par_line_par", columnList = "room_par_id"))
public class RoomParLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "room_par_id", nullable = false, foreignKey = @ForeignKey(name = "fk_room_par_line_par"))
    @JsonIgnore
    private RoomPar roomPar;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false, foreignKey = @ForeignKey(name = "fk_room_par_line_item"))
    private SupplyItem item;

    @Column(nullable = false)
    private Integer targetQuantity;

    @Column(nullable = false)
    private Boolean mandatory = true;

    @Column(length = 300)
    private String notes;

    public RoomParLine() {}

    public RoomParLine(SupplyItem item, Integer targetQuantity, Boolean mandatory, String notes) {
        this.item = item;
        this.targetQuantity = targetQuantity;
        this.mandatory = mandatory == null ? Boolean.TRUE : mandatory;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public Long getRoomParId() { return roomPar == null ? null : roomPar.getId(); }
    public Long getItemId() { return item == null ? null : item.getId(); }
    public String getItemCode() { return item == null ? null : item.getCode(); }
    public String getItemName() { return item == null ? null : item.getName(); }
    @JsonIgnore
    public SupplyItem getItemEntity() { return item; }
    public Integer getTargetQuantity() { return targetQuantity; }
    public Boolean getMandatory() { return mandatory; }
    public String getNotes() { return notes; }

    public void setId(Long id) { this.id = id; }
    public void setRoomPar(RoomPar roomPar) { this.roomPar = roomPar; }
    public void setItem(SupplyItem item) { this.item = item; }
    public void setTargetQuantity(Integer targetQuantity) { this.targetQuantity = targetQuantity; }
    public void setMandatory(Boolean mandatory) { this.mandatory = mandatory; }
    public void setNotes(String notes) { this.notes = notes; }
}
