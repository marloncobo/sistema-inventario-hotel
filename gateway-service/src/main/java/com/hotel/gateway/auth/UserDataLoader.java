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
                userRepository.save(new AppUser("admin", passwordEncoder.encode("Admin123"), List.of("ADMIN"), true));
                userRepository.save(new AppUser("almacen", passwordEncoder.encode("Almacen123"), List.of("ALMACENISTA"), true));
                userRepository.save(new AppUser("recepcion", passwordEncoder.encode("Recepcion123"), List.of("RECEPCION"), true));
                userRepository.save(new AppUser("servicio", passwordEncoder.encode("Servicio123"), List.of("SERVICIO"), true));
            }
        };
    }
}
