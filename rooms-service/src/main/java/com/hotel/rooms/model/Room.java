package com.hotel.rooms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String number;
    @Column(nullable = false)
    private String type;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private Integer capacity;
    @Column(nullable = false)
    private Integer floor;
    private String observations;

    public Room() {}

    public Room(String number, String type, String status, Integer floor) {
        this(number, type, status, 2, floor, null);
    }

    public Room(String number, String type, String status, Integer capacity, Integer floor, String observations) {
        this.number = number;
        this.type = type;
        this.status = status;
        this.capacity = capacity;
        this.floor = floor;
        this.observations = observations;
    }

    public Long getId() { return id; }
    public String getNumber() { return number; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public Integer getCapacity() { return capacity; }
    public Integer getFloor() { return floor; }
    public String getObservations() { return observations; }

    public void setId(Long id) { this.id = id; }
    public void setNumber(String number) { this.number = number; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public void setFloor(Integer floor) { this.floor = floor; }
    public void setObservations(String observations) { this.observations = observations; }
}
