package com.hotel.gateway.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

    private final JwtEncoder jwtEncoder;
    private final PasswordEncoder passwordEncoder;
    private final long expirationMinutes;
    private final AppUserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public AuthService(
            JwtEncoder jwtEncoder,
            PasswordEncoder passwordEncoder,
            AppUserRepository userRepository,
            AuditService auditService,
            @Value("${security.jwt.expiration-minutes:120}") long expirationMinutes
    ) {
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.expirationMinutes = expirationMinutes;
    }

    AuthService(JwtEncoder jwtEncoder, PasswordEncoder passwordEncoder, long expirationMinutes) {
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = null;
        this.auditService = null;
        this.expirationMinutes = expirationMinutes;
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.username() == null || request.password() == null) {
            recordAudit("LOGIN_FAILED", "Authentication", null, "anonimo", "Solicitud incompleta");
            throw new InvalidCredentialsException();
        }

        AppUser user = findUser(request.username());
        if (user == null || !Boolean.TRUE.equals(user.getActive()) || !passwordEncoder.matches(request.password(), user.getPassword())) {
            recordAudit("LOGIN_FAILED", "Authentication", null, request.username(), "Credenciales invalidas");
            throw new InvalidCredentialsException();
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("hotel-inventory-gateway")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getUsername())
                .claim("roles", user.getRoles())
                .build();

        JwsHeader headers = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(headers, claims)).getTokenValue();
        recordAudit("LOGIN_SUCCESS", "Authentication", user.getId(), user.getUsername(), "Inicio de sesion");
        return new LoginResponse(token, "Bearer", expiresAt, user.getUsername(), user.getRoles());
    }

    private AppUser findUser(String username) {
        if (userRepository != null) {
            return userRepository.findByUsernameIgnoreCase(username).orElse(null);
        }
        if ("admin".equals(username)) {
            return new AppUser("admin", "admin@hotel.local", passwordEncoder.encode("Admin123"), List.of("ADMIN"), true);
        }
        return null;
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse createUser(UserRequest request, String actor) {
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Ya existe el usuario " + request.username());
        }
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Ya existe el email " + normalizedEmail);
        }
        validatePassword(request.password(), true);
        AppUser saved = userRepository.save(new AppUser(
                request.username().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                normalizeRoles(request.roles()),
                request.active() == null || request.active()
        ));
        auditService.record("CREATE", "AppUser", saved.getId(), actor, saved.getUsername());
        return UserResponse.from(saved);
    }

    public UserResponse updateUser(Long id, UserRequest request, String actor) {
        AppUser user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("No existe el usuario " + id));
        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(request.username(), id)) {
            throw new IllegalArgumentException("Ya existe el usuario " + request.username());
        }
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
            throw new IllegalArgumentException("Ya existe el email " + normalizedEmail);
        }
        user.setUsername(request.username().trim());
        user.setEmail(normalizedEmail);
        if (request.password() != null && !request.password().isBlank()) {
            validatePassword(request.password(), false);
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        user.setRoles(normalizeRoles(request.roles()));
        user.setActive(request.active() == null || request.active());
        AppUser saved = userRepository.save(user);
        auditService.record("UPDATE", "AppUser", saved.getId(), actor, saved.getUsername());
        return UserResponse.from(saved);
    }

    public List<AuditLog> auditLogs(String action, String username, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return auditService.list(action, username, startDate, endDate);
    }

    private List<String> normalizeRoles(List<String> roles) {
        List<String> allowed = List.of("ADMIN", "ALMACENISTA", "RECEPCION", "SERVICIO");
        List<String> normalized = roles.stream()
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        if (!allowed.containsAll(normalized)) {
            throw new IllegalArgumentException("Rol no permitido. Roles validos: " + allowed);
        }
        return normalized;
    }

    private void recordAudit(String action, String entityName, Long entityId, String username, String detail) {
        if (auditService != null) {
            auditService.record(action, entityName, entityId, username, detail);
        }
    }

    private void validatePassword(String password, boolean required) {
        if (password == null || password.isBlank()) {
            if (required) {
                throw new IllegalArgumentException("La contrasena es obligatoria");
            }
            return;
        }
        if (password.length() < 8
                || password.chars().noneMatch(Character::isUpperCase)
                || password.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException("La contrasena debe tener minimo 8 caracteres, una mayuscula y un numero");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email es obligatorio");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("El email no es valido");
        }
        return normalized;
    }
}
