package com.hotel.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "units_of_measure")
public class UnitOfMeasure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String code;
    @Column(nullable = false, unique = true)
    private String name;
    @Column(nullable = false, unique = true, length = 20)
    private String abbreviation;
    @Column(nullable = false)
    private Boolean active = true;

    /** true para litros, kg, etc.; false para unidades discretas (UND, cajas). */
    @Column(nullable = false, columnDefinition = "boolean not null default false")
    private Boolean allowsDecimal = false;

    public UnitOfMeasure() {}

    public UnitOfMeasure(String code, String name, String abbreviation, Boolean active) {
        this(code, name, abbreviation, active, false);
    }

    public UnitOfMeasure(String code, String name, String abbreviation, Boolean active, Boolean allowsDecimal) {
        this.code = code;
        this.name = name;
        this.abbreviation = abbreviation;
        this.active = active;
        this.allowsDecimal = allowsDecimal == null ? Boolean.FALSE : allowsDecimal;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getAbbreviation() { return abbreviation; }
    public Boolean getActive() { return active; }
    public Boolean getAllowsDecimal() { return allowsDecimal; }

    public void setId(Long id) { this.id = id; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setAbbreviation(String abbreviation) { this.abbreviation = abbreviation; }
    public void setActive(Boolean active) { this.active = active; }
    public void setAllowsDecimal(Boolean allowsDecimal) {
        this.allowsDecimal = allowsDecimal == null ? Boolean.FALSE : allowsDecimal;
    }
}
