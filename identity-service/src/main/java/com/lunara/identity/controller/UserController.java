package com.lunara.identity.controller;

import com.lunara.identity.dto.IdentityDtos;
import com.lunara.identity.model.AppUser;
import com.lunara.identity.service.IdentityService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final IdentityService identityService;

    public UserController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<AppUser> findAll() {
        return identityService.getUsers();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public AppUser create(@Valid @RequestBody IdentityDtos.UserRequest request) {
        return identityService.createUser(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public AppUser updateStatus(@PathVariable Long id, @Valid @RequestBody IdentityDtos.UserStatusRequest request) {
        return identityService.updateStatus(id, request);
    }
}
