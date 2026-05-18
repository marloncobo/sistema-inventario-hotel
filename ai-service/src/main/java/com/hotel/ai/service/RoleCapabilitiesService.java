package com.hotel.ai.service;

import com.hotel.ai.dto.RoleContextInfo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class RoleCapabilitiesService {

    public RoleCapabilities getRoleCapabilities(String role) {
        String normalizedRole = normalizeRole(role);
        return switch (normalizedRole) {
            case "ADMIN" -> new RoleCapabilities(
                    "ADMIN",
                    "Administrador",
                    "Gestion completa del sistema, inventario, habitaciones, usuarios y reportes.",
                    List.of(
                            "Consultar y administrar inventario, catalogos, ubicaciones, documentos y conteos",
                            "Ver alertas, movimientos, reposicion y reportes administrativos",
                            "Crear usuarios, consultar auditoria y ver roles del sistema",
                            "Crear habitaciones, consultar estados, suministros y auditoria de habitaciones",
                            "Usar todas las vistas del asistente y responder preguntas transversales"
                    ),
                    List.of(
                            "No debe inventar permisos extra que no existan en el sistema",
                            "Si faltan datos, debe explicarlo como ausencia de contexto o disponibilidad"
                    ),
                    List.of(
                            "Productos, stock, minimos, movimientos, alertas, proveedores, categorias y areas",
                            "Habitaciones, consumo por habitacion, distribucion y reportes",
                            "Usuarios, roles, auditoria y resumenes ejecutivos"
                    ),
                    List.of(
                            "dashboard", "asistente-ia", "usuarios", "auditoria", "catalogos",
                            "inventario", "movimientos", "ubicaciones", "documentos", "par-habitaciones",
                            "reposicion", "conteos", "diferencias", "alertas", "habitaciones",
                            "habitaciones/consulta", "asignaciones", "reportes"
                    ),
                    "Puede responder analisis estrategicos y operativos completos."
            );
            case "ALMACENISTA" -> new RoleCapabilities(
                    "ALMACENISTA",
                    "Almacenista",
                    "Operacion de bodega, control de stock, reposicion y consulta de PAR.",
                    List.of(
                            "Consultar inventario, stock, ubicaciones, movimientos y sugerencias de reposicion",
                            "Ver alertas de bajo stock y consumo de los ultimos 30 dias",
                            "Consultar catalogos y proveedores visibles de inventario",
                            "Consultar PAR y comparativos de habitaciones",
                            "Procesar devoluciones y disminuciones internas de inventario"
                    ),
                    List.of(
                            "No administra usuarios ni auditoria del gateway",
                            "No crea habitaciones ni cambia su estado",
                            "No debe afirmar disponibilidad detallada de usuarios o reportes ejecutivos de habitaciones"
                    ),
                    List.of(
                            "Productos, stock, minimos, movimientos, alertas, proveedores, categorias y areas",
                            "PAR de habitaciones y consultas de habitacion por numero",
                            "No deberia asumir acceso a usuarios o reportes administrativos"
                    ),
                    List.of(
                            "dashboard", "asistente-ia", "catalogos", "inventario", "movimientos",
                            "ubicaciones", "documentos", "par-habitaciones", "reposicion",
                            "conteos", "alertas", "habitaciones/consulta"
                    ),
                    "Si la pregunta es sobre usuarios, auditoria o gestion de habitaciones, debe redirigir a ADMIN o RECEPCION segun corresponda."
            );
            case "SERVICIO" -> new RoleCapabilities(
                    "SERVICIO",
                    "Servicio",
                    "Operacion de habitaciones, entregas, devoluciones y consulta operativa.",
                    List.of(
                            "Consultar inventario visible, ubicaciones, PAR y sugerencias de reposicion",
                            "Registrar o apoyar entregas de suministros a habitaciones",
                            "Registrar devoluciones de items permitidos",
                            "Consultar habitaciones, suministros asignados y numero de habitacion",
                            "Responder preguntas sobre consumo por habitacion y preparacion operativa"
                    ),
                    List.of(
                            "No ve alertas administrativas de stock bajo",
                            "No administra usuarios, auditoria ni catalogos",
                            "No debe prometer stock global de bodega si no aparece en su contexto"
                    ),
                    List.of(
                            "Inventario visible para operacion, ubicaciones y PAR",
                            "Habitaciones, suministros asignados y consultas por numero",
                            "Consumo y distribucion relacionados con operacion de habitaciones"
                    ),
                    List.of(
                            "dashboard", "asistente-ia", "inventario", "ubicaciones", "par-habitaciones",
                            "reposicion", "habitaciones/consulta", "asignaciones"
                    ),
                    "Si la pregunta exige decisiones de bodega o administracion, debe escalar a ALMACENISTA o ADMIN."
            );
            case "RECEPCION" -> new RoleCapabilities(
                    "RECEPCION",
                    "Recepcion",
                    "Gestion de habitaciones, consulta de estado, PAR y reportes operativos de recepcion.",
                    List.of(
                            "Consultar habitaciones, habitaciones por numero y suministros visibles",
                            "Cambiar el estado de habitaciones segun el flujo del sistema",
                            "Consultar reportes de habitaciones disponibles para recepcion",
                            "Consultar comparativos PAR y consumo asociado a habitaciones",
                            "Usar el asistente para resolver preguntas de disponibilidad y operacion de mostrador"
                    ),
                    List.of(
                            "No administra inventario de bodega, catalogos ni alertas de stock",
                            "No administra usuarios ni auditoria",
                            "No debe afirmar movimientos o stock global si ese bloque no llega en el contexto"
                    ),
                    List.of(
                            "Habitaciones, estados, consumo, distribucion y reportes de habitaciones",
                            "Consultas PAR visibles para recepcion",
                            "No deberia asumir acceso a usuarios completos ni a bodega"
                    ),
                    List.of(
                            "dashboard", "asistente-ia", "habitaciones", "habitaciones/consulta", "reportes"
                    ),
                    "Si la pregunta trata sobre reabastecimiento, stock de bodega o usuarios, debe redirigir al rol adecuado."
            );
            default -> getRoleCapabilities("RECEPCION");
        };
    }

    public String buildRoleContextBlock(RoleContextInfo roleContext) {
        RoleCapabilities capabilities = getRoleCapabilities(roleContext.role());
        StringBuilder builder = new StringBuilder();
        builder.append("Contexto del usuario autenticado:\n")
                .append("- Usuario: ").append(safe(roleContext.username())).append('\n')
                .append("- Rol activo: ").append(capabilities.role()).append(" (").append(capabilities.label()).append(")\n")
                .append("- Descripcion del rol: ").append(capabilities.summary()).append('\n')
                .append("- Authorities/JWT detectadas: ").append(joinAuthorities(roleContext.permissions())).append('\n')
                .append("- Capacidades permitidas:\n");

        for (String allowed : capabilities.allowedActions()) {
            builder.append("  * ").append(allowed).append('\n');
        }

        builder.append("- Limitaciones y restricciones:\n");
        for (String restricted : capabilities.restrictedActions()) {
            builder.append("  * ").append(restricted).append('\n');
        }

        builder.append("- Modulos o vistas asociados al rol:\n");
        for (String route : capabilities.routes()) {
            builder.append("  * ").append(route).append('\n');
        }

        builder.append("- Tipos de datos que normalmente puede consultar:\n");
        for (String visibleData : capabilities.visibleData()) {
            builder.append("  * ").append(visibleData).append('\n');
        }

        builder.append("- Regla de escalamiento: ").append(capabilities.escalationGuidance()).append('\n');
        return builder.toString();
    }

    public String buildAccessibleRolesBlock(RoleContextInfo roleContext) {
        String normalizedRole = normalizeRole(roleContext.role());
        if ("ADMIN".equals(normalizedRole)) {
            StringBuilder builder = new StringBuilder();
            builder.append("Matriz global de roles visible para este usuario:\n")
                    .append("- Este usuario SI puede conocer que hace cada rol del sistema porque es ADMIN.\n");

            for (String role : List.of("ADMIN", "ALMACENISTA", "SERVICIO", "RECEPCION")) {
                appendRoleDefinition(builder, getRoleCapabilities(role));
            }
            return builder.toString();
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Visibilidad de roles para este usuario:\n")
                .append("- Este usuario NO puede conocer la matriz completa de otros roles.\n")
                .append("- Solo debe describirse con precision el rol activo del usuario.\n");
        appendRoleDefinition(builder, getRoleCapabilities(normalizedRole));
        return builder.toString();
    }

    private void appendRoleDefinition(StringBuilder builder, RoleCapabilities capabilities) {
        builder.append("\nROL ")
                .append(capabilities.role())
                .append(" (")
                .append(capabilities.label())
                .append(")\n")
                .append("- Resumen: ")
                .append(capabilities.summary())
                .append('\n')
                .append("- Puede:\n");

        for (String allowed : capabilities.allowedActions()) {
            builder.append("  * ").append(allowed).append('\n');
        }

        builder.append("- Restricciones:\n");
        for (String restricted : capabilities.restrictedActions()) {
            builder.append("  * ").append(restricted).append('\n');
        }

        builder.append("- Modulos:\n");
        for (String route : capabilities.routes()) {
            builder.append("  * ").append(route).append('\n');
        }

        builder.append("- Datos visibles:\n");
        for (String visibleData : capabilities.visibleData()) {
            builder.append("  * ").append(visibleData).append('\n');
        }
    }

    private String normalizeRole(String role) {
        return role == null ? "RECEPCION" : role.trim().toUpperCase(Locale.ROOT);
    }

    private String joinAuthorities(Set<String> authorities) {
        if (authorities == null || authorities.isEmpty()) {
            return "SIN_AUTHORITIES";
        }
        return authorities.stream()
                .filter(authority -> authority != null && !authority.isBlank())
                .sorted()
                .toList()
                .toString();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "SIN_DATO" : value.trim();
    }

    public record RoleCapabilities(
            String role,
            String label,
            String summary,
            List<String> allowedActions,
            List<String> restrictedActions,
            List<String> visibleData,
            List<String> routes,
            String escalationGuidance
    ) {
    }
}
