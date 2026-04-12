package com.lunara.identity.controller;

import com.lunara.identity.dto.IdentityDtos;
import com.lunara.identity.model.Role;
import com.lunara.identity.service.IdentityService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final IdentityService identityService;

    public RoleController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<Role> findAll() {
        return identityService.getRoles();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Role create(@Valid @RequestBody IdentityDtos.RoleRequest request) {
        return identityService.createRole(request);
    }
}
