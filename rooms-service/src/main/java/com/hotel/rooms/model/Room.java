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
    private Integer floor;

    public Room() {}

    public Room(String number, String type, String status, Integer floor) {
        this.number = number;
        this.type = type;
        this.status = status;
        this.floor = floor;
    }

    public Long getId() { return id; }
    public String getNumber() { return number; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public Integer getFloor() { return floor; }

    public void setId(Long id) { this.id = id; }
    public void setNumber(String number) { this.number = number; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setFloor(Integer floor) { this.floor = floor; }
}