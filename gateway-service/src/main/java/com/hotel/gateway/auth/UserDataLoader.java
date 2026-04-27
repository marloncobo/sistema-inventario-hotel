package com.hotel.gateway.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class UserDataLoader {
    @Bean
    CommandLineRunner loadUsers(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                userRepository.save(new AppUser("admin", "admin@hotel.local", passwordEncoder.encode("Admin123"), List.of("ADMIN"), true));
                userRepository.save(new AppUser("almacen", "almacen@hotel.local", passwordEncoder.encode("Almacen123"), List.of("ALMACENISTA"), true));
                userRepository.save(new AppUser("recepcion", "recepcion@hotel.local", passwordEncoder.encode("Recepcion123"), List.of("RECEPCION"), true));
                userRepository.save(new AppUser("servicio", "servicio@hotel.local", passwordEncoder.encode("Servicio123"), List.of("SERVICIO"), true));
            }
        };
    }
}
