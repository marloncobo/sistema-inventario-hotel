-- =========================================================
-- PROYECTO: Sistema de Inventario para Hotel
-- MOTOR: MySQL 8+
-- =========================================================

DROP DATABASE IF EXISTS hotel_inventory;
CREATE DATABASE hotel_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_inventory;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. TABLAS MAESTRAS
-- =========================================================

CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE areas_hotel (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    responsable VARCHAR(120)
);

CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    nit VARCHAR(30) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(120),
    direccion VARCHAR(180),
    ciudad VARCHAR(80),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE categorias_producto (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE unidades_medida (
    id_unidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE bodegas (
    id_bodega INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    ubicacion VARCHAR(150),
    descripcion VARCHAR(255),
    estado ENUM('ACTIVA','INACTIVA') NOT NULL DEFAULT 'ACTIVA'
);

-- =========================================================
-- 2. PRODUCTOS
-- =========================================================

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    id_categoria INT NOT NULL,
    id_unidad INT NOT NULL,
    id_proveedor_principal INT NULL,
    stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_maximo DECIMAL(12,2) DEFAULT NULL,
    costo_promedio DECIMAL(12,2) NOT NULL DEFAULT 0,
    perecedero BOOLEAN NOT NULL DEFAULT FALSE,
    maneja_lote BOOLEAN NOT NULL DEFAULT FALSE,
    maneja_vencimiento BOOLEAN NOT NULL DEFAULT FALSE,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias_producto(id_categoria),
    FOREIGN KEY (id_unidad) REFERENCES unidades_medida(id_unidad),
    FOREIGN KEY (id_proveedor_principal) REFERENCES proveedores(id_proveedor)
);

-- =========================================================
-- 3. STOCK POR BODEGA
-- =========================================================

CREATE TABLE stock (
    id_stock INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_bodega INT NOT NULL,
    cantidad_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
    ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (id_producto, id_bodega),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id_bodega)
);

-- =========================================================
-- 4. ÓRDENES DE COMPRA
-- =========================================================

CREATE TABLE ordenes_compra (
    id_orden_compra INT AUTO_INCREMENT PRIMARY KEY,
    numero_orden VARCHAR(30) NOT NULL UNIQUE,
    id_proveedor INT NOT NULL,
    id_usuario_crea INT NOT NULL,
    fecha_orden DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_esperada DATE NULL,
    estado ENUM('BORRADOR','APROBADA','RECIBIDA_PARCIAL','RECIBIDA_COMPLETA','CANCELADA')
        NOT NULL DEFAULT 'BORRADOR',
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_usuario_crea) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalle_orden_compra (
    id_detalle_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_orden_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compra(id_orden_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- =========================================================
-- 5. SOLICITUDES INTERNAS DE ÁREAS
-- =========================================================

CREATE TABLE solicitudes_internas (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    numero_solicitud VARCHAR(30) NOT NULL UNIQUE,
    id_area INT NOT NULL,
    id_usuario_solicita INT NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE','APROBADA','RECHAZADA','ATENDIDA','CANCELADA')
        NOT NULL DEFAULT 'PENDIENTE',
    observaciones TEXT,
    FOREIGN KEY (id_area) REFERENCES areas_hotel(id_area),
    FOREIGN KEY (id_usuario_solicita) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalle_solicitud_interna (
    id_detalle_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_solicitada DECIMAL(12,2) NOT NULL,
    cantidad_aprobada DECIMAL(12,2) DEFAULT NULL,
    observaciones VARCHAR(255),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_internas(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- =========================================================
-- 6. MOVIMIENTOS DE INVENTARIO
-- =========================================================

CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo_movimiento ENUM('ENTRADA','SALIDA','AJUSTE_ENTRADA','AJUSTE_SALIDA') NOT NULL,
    origen ENUM('COMPRA','SOLICITUD_INTERNA','AJUSTE_MANUAL','DEVOLUCION','INICIAL') NOT NULL,
    id_bodega INT NOT NULL,
    id_usuario_responsable INT NOT NULL,
    id_orden_compra INT NULL,
    id_solicitud INT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id_bodega),
    FOREIGN KEY (id_usuario_responsable) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_orden_compra) REFERENCES ordenes_compra(id_orden_compra),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_internas(id_solicitud)
);

CREATE TABLE detalle_movimiento (
    id_detalle_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) DEFAULT 0,
    lote VARCHAR(50) NULL,
    fecha_vencimiento DATE NULL,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos_inventario(id_movimiento) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- =========================================================
-- 7. AUDITORÍA BÁSICA
-- =========================================================

CREATE TABLE auditoria_movimientos (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento INT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos_inventario(id_movimiento)
);

-- =========================================================
-- 8. ÍNDICES
-- =========================================================

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_stock_producto ON stock(id_producto);
CREATE INDEX idx_stock_bodega ON stock(id_bodega);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_solicitudes_estado ON solicitudes_internas(estado);
CREATE INDEX idx_ordenes_estado ON ordenes_compra(estado);

-- =========================================================
-- 9. DATOS INICIALES
-- =========================================================

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador general del sistema'),
('JEFE_ALMACEN', 'Encargado del inventario'),
('SOLICITANTE', 'Usuario de un área del hotel');

INSERT INTO areas_hotel (nombre, descripcion, responsable) VALUES
('Recepción', 'Área de recepción del hotel', 'Jefe Recepción'),
('Housekeeping', 'Limpieza y dotación de habitaciones', 'Jefe Housekeeping'),
('Restaurante', 'Área de alimentos y bebidas', 'Jefe Restaurante'),
('Lavandería', 'Lavado de lencería y uniformes', 'Jefe Lavandería'),
('Mantenimiento', 'Reparaciones y soporte técnico', 'Jefe Mantenimiento');

INSERT INTO unidades_medida (nombre, abreviatura) VALUES
('Unidad', 'und'),
('Caja', 'caj'),
('Litro', 'lt'),
('Kilogramo', 'kg'),
('Paquete', 'paq');

INSERT INTO categorias_producto (nombre, descripcion) VALUES
('Amenities', 'Productos para habitaciones'),
('Limpieza', 'Productos de aseo y desinfección'),
('Alimentos', 'Productos alimenticios'),
('Bebidas', 'Bebidas del hotel'),
('Lavandería', 'Productos de lavandería'),
('Mantenimiento', 'Repuestos y materiales técnicos'),
('Papelería', 'Útiles de oficina y recepción');

INSERT INTO bodegas (nombre, ubicacion, descripcion) VALUES
('Bodega Principal', 'Primer piso', 'Bodega central del hotel'),
('Bodega Cocina', 'Zona restaurante', 'Almacenamiento de alimentos y bebidas'),
('Bodega Housekeeping', 'Zona de servicio', 'Inventario de limpieza y amenities');

INSERT INTO proveedores (nombre, nit, telefono, email, direccion, ciudad, estado) VALUES
('Distribuidora Hotelera SAS', '900111222-1', '3001112233', 'ventas@disthotelera.com', 'Calle 10 #20-30', 'Cali', 'ACTIVO'),
('Aseo Total SAS', '900333444-5', '3005556677', 'contacto@aseototal.com', 'Carrera 15 #40-20', 'Cali', 'ACTIVO'),
('Alimentos Premium SAS', '901777888-2', '3101234567', 'pedidos@alpremium.com', 'Avenida 5 #12-55', 'Cali', 'ACTIVO');

INSERT INTO usuarios (nombre_completo, email, username, password_hash, id_rol, estado) VALUES
('Administrador General', 'admin@hotel.com', 'admin', 'hash_admin', 1, 'ACTIVO'),
('Jefe de Almacén', 'almacen@hotel.com', 'almacen', 'hash_almacen', 2, 'ACTIVO'),
('Solicitante Housekeeping', 'housekeeping@hotel.com', 'housekeeping', 'hash_housekeeping', 3, 'ACTIVO');

INSERT INTO productos (
    codigo, nombre, descripcion, id_categoria, id_unidad, id_proveedor_principal,
    stock_minimo, stock_maximo, costo_promedio, perecedero, maneja_lote, maneja_vencimiento, estado
) VALUES
('AMN-001', 'Shampoo 30 ml', 'Amenity para habitación', 1, 1, 1, 50, 500, 1200, FALSE, FALSE, FALSE, 'ACTIVO'),
('LMP-001', 'Desinfectante multiusos', 'Producto de limpieza general', 2, 3, 2, 20, 200, 8500, FALSE, FALSE, FALSE, 'ACTIVO'),
('ALI-001', 'Arroz premium', 'Arroz para restaurante', 3, 4, 3, 30, 300, 4200, TRUE, TRUE, TRUE, 'ACTIVO'),
('BEB-001', 'Agua embotellada', 'Agua para minibar y eventos', 4, 1, 3, 100, 1000, 1800, FALSE, TRUE, TRUE, 'ACTIVO');

INSERT INTO stock (id_producto, id_bodega, cantidad_actual) VALUES
(1, 3, 100),
(2, 1, 50),
(3, 2, 80),
(4, 2, 200);

-- =========================================================
-- 10. TRIGGER: VALIDAR QUE SALIDA/AJUSTE_SALIDA NO DEJE STOCK NEGATIVO
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_validar_stock_antes_insert_detalle
BEFORE INSERT ON detalle_movimiento
FOR EACH ROW
BEGIN
    DECLARE v_tipo_movimiento VARCHAR(20);
    DECLARE v_bodega INT;
    DECLARE v_stock_actual DECIMAL(12,2);

    SELECT tipo_movimiento, id_bodega
    INTO v_tipo_movimiento, v_bodega
    FROM movimientos_inventario
    WHERE id_movimiento = NEW.id_movimiento;

    SELECT cantidad_actual
    INTO v_stock_actual
    FROM stock
    WHERE id_producto = NEW.id_producto
      AND id_bodega = v_bodega
    LIMIT 1;

    IF v_stock_actual IS NULL THEN
        SET v_stock_actual = 0;
    END IF;

    IF v_tipo_movimiento IN ('SALIDA', 'AJUSTE_SALIDA') AND NEW.cantidad > v_stock_actual THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock insuficiente para realizar la salida.';
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 11. TRIGGER: ACTUALIZAR STOCK DESPUÉS DE INSERTAR DETALLE DE MOVIMIENTO
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_actualizar_stock_despues_insert_detalle
AFTER INSERT ON detalle_movimiento
FOR EACH ROW
BEGIN
    DECLARE v_tipo_movimiento VARCHAR(20);
    DECLARE v_bodega INT;

    SELECT tipo_movimiento, id_bodega
    INTO v_tipo_movimiento, v_bodega
    FROM movimientos_inventario
    WHERE id_movimiento = NEW.id_movimiento;

    INSERT INTO stock (id_producto, id_bodega, cantidad_actual)
    VALUES (NEW.id_producto, v_bodega, 0)
    ON DUPLICATE KEY UPDATE cantidad_actual = cantidad_actual;

    IF v_tipo_movimiento IN ('ENTRADA', 'AJUSTE_ENTRADA') THEN
        UPDATE stock
        SET cantidad_actual = cantidad_actual + NEW.cantidad
        WHERE id_producto = NEW.id_producto
          AND id_bodega = v_bodega;
    ELSEIF v_tipo_movimiento IN ('SALIDA', 'AJUSTE_SALIDA') THEN
        UPDATE stock
        SET cantidad_actual = cantidad_actual - NEW.cantidad
        WHERE id_producto = NEW.id_producto
          AND id_bodega = v_bodega;
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 12. TRIGGER: AUDITORÍA DE MOVIMIENTOS
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_auditoria_movimiento
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_movimientos (id_movimiento, accion, descripcion)
    VALUES (
        NEW.id_movimiento,
        'CREACION_MOVIMIENTO',
        CONCAT('Se creó movimiento tipo ', NEW.tipo_movimiento, ' con origen ', NEW.origen)
    );
END$$

DELIMITER ;

-- =========================================================
-- 13. VISTA DE STOCK ACTUAL
-- =========================================================

CREATE VIEW vw_stock_actual AS
SELECT
    s.id_stock,
    p.codigo,
    p.nombre AS producto,
    c.nombre AS categoria,
    b.nombre AS bodega,
    s.cantidad_actual,
    p.stock_minimo,
    CASE
        WHEN s.cantidad_actual <= p.stock_minimo THEN 'STOCK_BAJO'
        ELSE 'OK'
    END AS estado_stock
FROM stock s
INNER JOIN productos p ON s.id_producto = p.id_producto
INNER JOIN categorias_producto c ON p.id_categoria = c.id_categoria
INNER JOIN bodegas b ON s.id_bodega = b.id_bodega;

-- =========================================================
-- 14. VISTA DE MOVIMIENTOS
-- =========================================================

CREATE VIEW vw_movimientos_detallados AS
SELECT
    m.id_movimiento,
    m.fecha_movimiento,
    m.tipo_movimiento,
    m.origen,
    b.nombre AS bodega,
    u.nombre_completo AS responsable,
    p.codigo AS codigo_producto,
    p.nombre AS producto,
    dm.cantidad,
    dm.costo_unitario
FROM movimientos_inventario m
INNER JOIN bodegas b ON m.id_bodega = b.id_bodega
INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
INNER JOIN detalle_movimiento dm ON m.id_movimiento = dm.id_movimiento
INNER JOIN productos p ON dm.id_producto = p.id_producto;

SET FOREIGN_KEY_CHECKS = 1;