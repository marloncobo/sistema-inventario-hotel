package com.hotel.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String code;
    @Column(nullable = false, unique = true)
    private String name;
    @Column(nullable = false)
    private Boolean active = true;

    public Category() {}

    public Category(String code, String name, Boolean active) {
        this.code = code;
        this.name = name;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public Boolean getActive() { return active; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setActive(Boolean active) { this.active = active; }
}
