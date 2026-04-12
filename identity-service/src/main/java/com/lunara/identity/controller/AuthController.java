package com.lunara.identity.controller;

import com.lunara.identity.dto.IdentityDtos;
import com.lunara.identity.service.IdentityService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final IdentityService identityService;

    public AuthController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @PostMapping("/login")
    public IdentityDtos.LoginResponse login(@Valid @RequestBody IdentityDtos.LoginRequest request) {
        return identityService.login(request);
    }
}
