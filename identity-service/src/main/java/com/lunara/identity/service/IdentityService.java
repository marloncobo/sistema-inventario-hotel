package com.lunara.identity.service;

import com.lunara.identity.dto.IdentityDtos;
import com.lunara.identity.exception.BusinessException;
import com.lunara.identity.model.AppUser;
import com.lunara.identity.model.Role;
import com.lunara.identity.model.UserStatus;
import com.lunara.identity.repository.AppUserRepository;
import com.lunara.identity.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IdentityService {

    private final RoleRepository roleRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final JwtTokenService jwtTokenService;

    public IdentityService(RoleRepository roleRepository,
                           AppUserRepository appUserRepository,
                           PasswordService passwordService,
                           JwtTokenService jwtTokenService) {
        this.roleRepository = roleRepository;
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.jwtTokenService = jwtTokenService;
    }

    public IdentityDtos.LoginResponse login(IdentityDtos.LoginRequest request) {
        AppUser user = appUserRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new BusinessException("Credenciales inválidas"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("El usuario está inactivo");
        }
        if (!passwordService.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Credenciales inválidas");
        }
        String token = jwtTokenService.generate(user.getUsername(), user.getRole().getName(), user.getFullName());
        return new IdentityDtos.LoginResponse(token, user.getUsername(), user.getRole().getName(), user.getFullName());
    }

    public List<Role> getRoles() {
        return roleRepository.findAll();
    }

    @Transactional
    public Role createRole(IdentityDtos.RoleRequest request) {
        if (roleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Ya existe un rol con ese nombre");
        }
        Role role = new Role();
        role.setName(request.getName().trim().toUpperCase());
        role.setDescription(request.getDescription().trim());
        return roleRepository.save(role);
    }

    public List<AppUser> getUsers() {
        return appUserRepository.findAll();
    }

    @Transactional
    public AppUser createUser(IdentityDtos.UserRequest request) {
        if (appUserRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new BusinessException("El username ya existe");
        }
        if (appUserRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BusinessException("El email ya existe");
        }
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new BusinessException("Rol no encontrado"));

        AppUser user = new AppUser();
        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setUsername(request.getUsername().trim().toLowerCase());
        user.setPasswordHash(passwordService.hash(request.getPassword()));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        return appUserRepository.save(user);
    }

    @Transactional
    public AppUser updateStatus(Long userId, IdentityDtos.UserStatusRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        user.setStatus(request.getStatus());
        return appUserRepository.save(user);
    }
}
