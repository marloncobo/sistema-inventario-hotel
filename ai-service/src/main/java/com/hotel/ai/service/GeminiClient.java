package com.hotel.ai.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hotel.ai.config.GeminiProperties;
import com.hotel.ai.exception.AiConfigurationException;
import com.hotel.ai.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
public class GeminiClient {
    private final RestClient geminiRestClient;
    private final GeminiProperties geminiProperties;

    public GeminiClient(@Qualifier("geminiRestClient") RestClient geminiRestClient, GeminiProperties geminiProperties) {
        this.geminiRestClient = geminiRestClient;
        this.geminiProperties = geminiProperties;
    }

    public String generateConversationTitle(String firstQuestion, String firstAnswer) {
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            return null;
        }
        try {
            String titleInstruction = "Eres un asistente que genera titulos cortos para conversaciones.\n"
                    + "Tu unica tarea es devolver UN titulo corto (3 a 7 palabras) que resuma de que trata la conversacion.\n"
                    + "REGLAS: Responde SOLAMENTE el titulo, sin comillas, sin puntuacion al final, sin explicaciones.\n"
                    + "El titulo debe estar en espanol, maximo 7 palabras, descriptivo y profesional.\n";

            String input = "Pregunta: " + firstQuestion.trim() + "\nRespuesta (resumen): "
                    + firstAnswer.trim().substring(0, Math.min(300, firstAnswer.length()));

            GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                    new GeminiInstruction(List.of(new GeminiPart(titleInstruction))),
                    List.of(new GeminiContent("user", List.of(new GeminiPart(input))))
            );
            GeminiGenerateContentResponse response = geminiRestClient.post()
                    .uri("/v1beta/models/{model}:generateContent", geminiProperties.getModel())
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);
            String title = extractAnswer(response);
            if (title == null || title.isBlank()) {
                return null;
            }
            title = title.trim().replaceAll("[\"']+", "").replaceAll("[.!?]+$", "").trim();
            return title.length() > 70 ? title.substring(0, 70) : title;
        } catch (Exception ex) {
            return null;
        }
    }

    public String generateInventoryAnswer(String instructions, String input) {
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            throw new AiConfigurationException("La variable de entorno GEMINI_API_KEY no esta configurada en ai-service");
        }

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                new GeminiInstruction(List.of(new GeminiPart(instructions))),
                List.of(new GeminiContent("user", List.of(new GeminiPart(input))))
        );

        try {
            GeminiGenerateContentResponse response = geminiRestClient.post()
                    .uri("/v1beta/models/{model}:generateContent", geminiProperties.getModel())
                    .body(request)
                    .retrieve()
                    .body(GeminiGenerateContentResponse.class);
            String answer = extractAnswer(response);
            if (answer == null || answer.isBlank()) {
                throw new ExternalServiceException("Gemini no devolvio contenido util para la consulta");
            }
            return answer.trim();
        } catch (RestClientResponseException ex) {
            String body = ex.getResponseBodyAsString();
            if (body != null && body.length() > 400) {
                body = body.substring(0, 400);
            }
            throw new ExternalServiceException("Gemini respondio con error: " + ex.getStatusCode().value() + " " + ex.getStatusText() + (body == null || body.isBlank() ? "" : " - " + body), ex);
        } catch (ResourceAccessException ex) {
            throw new ExternalServiceException("No fue posible conectar con Gemini", ex);
        }
    }

    private String extractAnswer(GeminiGenerateContentResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        for (GeminiCandidate candidate : response.candidates()) {
            if (candidate.content() == null || candidate.content().parts() == null) {
                continue;
            }
            for (GeminiPart part : candidate.content().parts()) {
                if (part.text() != null && !part.text().isBlank()) {
                    if (!builder.isEmpty()) {
                        builder.append(System.lineSeparator());
                    }
                    builder.append(part.text().trim());
                }
            }
        }
        return builder.toString();
    }

    private record GeminiGenerateContentRequest(
            GeminiInstruction system_instruction,
            List<GeminiContent> contents
    ) {}

    private record GeminiInstruction(List<GeminiPart> parts) {}

    private record GeminiContent(String role, List<GeminiPart> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiPart(String text) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiGenerateContentResponse(List<GeminiCandidate> candidates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiCandidate(GeminiContent content) {}
}
