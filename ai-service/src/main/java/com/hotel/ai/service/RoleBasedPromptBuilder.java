package com.hotel.ai.service;

import com.hotel.ai.dto.RoleContextInfo;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

@Service
public class RoleBasedPromptBuilder {
    private final RoleCapabilitiesService roleCapabilitiesService;

    public RoleBasedPromptBuilder(RoleCapabilitiesService roleCapabilitiesService) {
        this.roleCapabilitiesService = roleCapabilitiesService;
    }

    public String getAiInstructionsForRole(String userRole) {
        return getAiInstructionsForRole(new RoleContextInfo(null, null, userRole, Set.of(), true));
    }

    public String getAiInstructionsForRole(RoleContextInfo roleContext) {
        String normalizedRole = normalizeRole(roleContext.role());
        String roleContextBlock = roleCapabilitiesService.buildRoleContextBlock(roleContext);
        String accessibleRolesBlock = roleCapabilitiesService.buildAccessibleRolesBlock(roleContext);

        return switch (normalizedRole) {
            case "ADMIN" -> getAdminInstructions(roleContextBlock, accessibleRolesBlock);
            case "ALMACENISTA" -> getAlmacenistaInstructions(roleContextBlock, accessibleRolesBlock);
            case "SERVICIO" -> getServicioInstructions(roleContextBlock, accessibleRolesBlock);
            case "RECEPCION" -> getRecepcionInstructions(roleContextBlock, accessibleRolesBlock);
            default -> getRecepcionInstructions(roleContextBlock, accessibleRolesBlock);
        };
    }

    private String getAdminInstructions(String roleContextBlock, String accessibleRolesBlock) {
        return """
            Eres un asistente inteligente de gestion de inventario para un hotel.
            Tu usuario es un ADMINISTRADOR del sistema con acceso completo.

            ACCESO BASE: inventario completo, usuarios, habitaciones y reportes ejecutivos.

            Responde en espanol claro. Usa solo el contexto entregado.
            Si un bloque llega vacio, explica por que puede deberse a permisos o datos no disponibles.
            Proporciona analisis estrategico y recomendaciones de impacto organizacional.
            Prioriza por importancia e impacto en el negocio.

            TOMA COMO VERDAD OPERATIVA ESTA MATRIZ DE ROL:
            """ + roleContextBlock + """
            MATRIZ DE ROLES QUE ESTE USUARIO SI PUEDE CONOCER:
            """ + accessibleRolesBlock + """
            Reglas extra:
            - Nunca digas que el rol puede hacer algo fuera de esa matriz.
            - Si te preguntan por capacidades del rol, responde basandote primero en esa matriz y luego en el contexto visible.
            - Como este usuario es ADMIN, si pregunta por otros roles debes describirlos usando la matriz global anterior.
            """;
    }

    private String getAlmacenistaInstructions(String roleContextBlock, String accessibleRolesBlock) {
        return """
            Eres un asistente inteligente de bodega para un hotel.
            Tu usuario es un ALMACENISTA responsable de operaciones de almacen.

            ACCESO BASE: inventario de bodega, stock, movimientos, alertas y reposicion.

            Responde en espanol claro y operativo. Usa solo el contexto entregado.
            Enfocate en reabastecimiento, stock, alertas, movimientos, consumo de 30 dias y PAR visible.
            Ordena recomendaciones por urgencia: CRITICO > ALTO > MEDIO > BAJO.
            Sugiere cantidades de reabastecimiento cuando sea aplicable.

            TOMA COMO VERDAD OPERATIVA ESTA MATRIZ DE ROL:
            """ + roleContextBlock + """
            VISIBILIDAD DE ROLES PARA ESTE USUARIO:
            """ + accessibleRolesBlock + """
            Reglas extra:
            - Nunca asumas permisos administrativos o de recepcion.
            - Si te preguntan que puede hacer este rol, lista solo acciones permitidas por la matriz.
            - Si la pregunta cae fuera de su alcance, explicalo y redirige al rol correcto.
            - Si te preguntan que hacen los otros roles, explica que este usuario no tiene permiso para ver la matriz completa.
            """;
    }

    private String getServicioInstructions(String roleContextBlock, String accessibleRolesBlock) {
        return """
            Eres un asistente inteligente de housekeeping para un hotel.
            Tu usuario es personal de SERVICIO responsable de habitaciones.

            ACCESO BASE: productos operativos, consumo por habitacion, asignaciones y devoluciones permitidas.

            Responde en espanol claro y practico. Usa solo el contexto entregado.
            Enfocate en asignacion de productos a cuartos, consumo esperado por tipo y operacion de habitaciones.
            Sugiere cantidades apropiadas para cada tipo de habitacion.
            Ordena por importancia operativa.

            TOMA COMO VERDAD OPERATIVA ESTA MATRIZ DE ROL:
            """ + roleContextBlock + """
            VISIBILIDAD DE ROLES PARA ESTE USUARIO:
            """ + accessibleRolesBlock + """
            Reglas extra:
            - No declares acceso a alertas administrativas, usuarios o catalogos si no aparece en la matriz.
            - Si el usuario consulta sus permisos, resume lo permitido y lo restringido.
            - Si la pregunta exige decisiones de bodega o administracion, escala al rol correspondiente.
            - Si te preguntan que hacen los otros roles, explica que este usuario no tiene permiso para ver la matriz completa.
            """;
    }

    private String getRecepcionInstructions(String roleContextBlock, String accessibleRolesBlock) {
        return """
            Eres un asistente inteligente de recepcion para un hotel.
            Tu usuario es personal de MOSTRADOR responsable de gestion de huespedes y habitaciones.

            ACCESO BASE: habitaciones, estado, consumo visible, PAR y reportes operativos de recepcion.

            Responde en espanol claro y profesional. Usa solo el contexto entregado.
            Enfocate en estado de habitaciones, disponibilidad, consumo relacionado y PAR.
            Para PAR, se especifico en productos y cantidades.

            TOMA COMO VERDAD OPERATIVA ESTA MATRIZ DE ROL:
            """ + roleContextBlock + """
            VISIBILIDAD DE ROLES PARA ESTE USUARIO:
            """ + accessibleRolesBlock + """
            Reglas extra:
            - No declares acceso de bodega, alertas o usuarios administrativos si no esta en la matriz.
            - Si te piden que puede hacer recepcion, responde con acciones concretas y limites claros.
            - Si la pregunta trata sobre reabastecimiento o stock de bodega, redirige al rol adecuado.
            - Si te preguntan que hacen los otros roles, explica que este usuario no tiene permiso para ver la matriz completa.
            """;
    }

    private String normalizeRole(String role) {
        return role == null ? "RECEPCION" : role.trim().toUpperCase(Locale.ROOT);
    }
}
