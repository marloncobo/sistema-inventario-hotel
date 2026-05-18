-- ================================================================
-- Script para Limpiar Timestamps Antiguos del Chatbot
-- ================================================================
--
-- IMPORTANTE: Ejecutar este script DESPUÉS de reconstruir el backend
-- con los nuevos cambios de zona horaria.
--
-- Este script eliminará los datos antiguos para que se generen nuevos
-- timestamps con la zona horaria correcta de Colombia (America/Bogota).
--
-- ================================================================

-- 1. Eliminar todos los mensajes de conversación (para generar nuevos)
DELETE FROM conversation_messages;

-- 2. Eliminar todas las conversaciones
DELETE FROM conversations;

-- 3. Verificar que las tablas están vacías
SELECT COUNT(*) as total_conversaciones FROM conversations;
SELECT COUNT(*) as total_mensajes FROM conversation_messages;

-- 4. Verificar la hora actual en Colombia
SELECT NOW() AT TIME ZONE 'America/Bogota' as "Hora Actual en Bogotá";

-- ================================================================
-- IMPORTANTE: Después de ejecutar este script:
-- 1. Reinicia el servidor (mvn spring-boot:run)
-- 2. Limpia el caché del navegador (Ctrl + Shift + Delete)
-- 3. Haz una nueva pregunta en el chatbot
-- 4. Verifica que la hora sea correcta
-- ================================================================
