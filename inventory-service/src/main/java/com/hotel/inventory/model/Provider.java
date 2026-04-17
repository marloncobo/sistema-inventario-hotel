package com.hotel.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "providers")
public class Provider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 40)
    private String documentNumber;
    @Column(nullable = false, unique = true)
    private String name;
    private String phone;
    private String email;
    @Column(nullable = false)
    private Boolean active = true;

    public Provider() {}

    public Provider(String documentNumber, String name, String phone, String email, Boolean active) {
        this.documentNumber = documentNumber;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getDocumentNumber() { return documentNumber; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public Boolean getActive() { return active; }

    public void setId(Long id) { this.id = id; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setActive(Boolean active) { this.active = active; }
}
