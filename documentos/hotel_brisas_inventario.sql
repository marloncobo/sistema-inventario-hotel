-- =========================================================
-- PROYECTO: Sistema de Inventario - Hotel Brisas del Valle
-- MOTOR: MySQL 8+
-- =========================================================

DROP DATABASE IF EXISTS hotel_brisas_inventario;
CREATE DATABASE hotel_brisas_inventario
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hotel_brisas_inventario;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1. ROLES Y USUARIOS
-- =========================================================

CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- =========================================================
-- 2. CATÁLOGOS BÁSICOS
-- =========================================================

CREATE TABLE categorias_insumo (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE unidades_medida (
    id_unidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    nit VARCHAR(30) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(120),
    direccion VARCHAR(150),
    ciudad VARCHAR(80),
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE areas_hotel (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA'
);

-- =========================================================
-- 3. HABITACIONES
-- =========================================================

CREATE TABLE habitaciones (
    id_habitacion INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo ENUM('ESTANDAR', 'EJECUTIVA', 'FAMILIAR') NOT NULL,
    estado ENUM('ACTIVA', 'INACTIVA', 'MANTENIMIENTO') NOT NULL DEFAULT 'ACTIVA',
    capacidad INT NOT NULL,
    piso INT,
    observaciones VARCHAR(255)
);

-- =========================================================
-- 4. INSUMOS
-- =========================================================

CREATE TABLE insumos (
    id_insumo INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    id_categoria INT NOT NULL,
    id_unidad INT NOT NULL,
    id_proveedor_principal INT NULL,
    cantidad_disponible DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    requiere_vencimiento BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias_insumo(id_categoria),
    FOREIGN KEY (id_unidad) REFERENCES unidades_medida(id_unidad),
    FOREIGN KEY (id_proveedor_principal) REFERENCES proveedores(id_proveedor),
    CONSTRAINT chk_stock_minimo CHECK (stock_minimo >= 0),
    CONSTRAINT chk_cantidad_disponible CHECK (cantidad_disponible >= 0)
);

-- =========================================================
-- 5. TIPOS Y ORÍGENES DE MOVIMIENTO
-- =========================================================

CREATE TABLE tipos_movimiento (
    id_tipo_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE origenes_salida (
    id_origen_salida INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(100) NOT NULL
);

-- =========================================================
-- 6. MOVIMIENTOS DE INVENTARIO (CABECERA)
-- =========================================================

CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo_movimiento INT NOT NULL,
    id_origen_salida INT NULL,
    id_habitacion INT NULL,
    id_area INT NULL,
    id_proveedor INT NULL,
    id_usuario_responsable INT NOT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('VALIDO', 'ANULADO') NOT NULL DEFAULT 'VALIDO',
    motivo VARCHAR(255),
    observaciones TEXT,
    referencia_externa VARCHAR(80),

    FOREIGN KEY (id_tipo_movimiento) REFERENCES tipos_movimiento(id_tipo_movimiento),
    FOREIGN KEY (id_origen_salida) REFERENCES origenes_salida(id_origen_salida),
    FOREIGN KEY (id_habitacion) REFERENCES habitaciones(id_habitacion),
    FOREIGN KEY (id_area) REFERENCES areas_hotel(id_area),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_usuario_responsable) REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- 7. DETALLE DE MOVIMIENTOS
-- =========================================================

CREATE TABLE detalle_movimiento (
    id_detalle_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    stock_antes DECIMAL(12,2) NOT NULL,
    stock_despues DECIMAL(12,2) NOT NULL,
    observacion_detalle VARCHAR(255),

    FOREIGN KEY (id_movimiento) REFERENCES movimientos_inventario(id_movimiento) ON DELETE CASCADE,
    FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT chk_cantidad_detalle CHECK (cantidad > 0),
    CONSTRAINT chk_stock_antes CHECK (stock_antes >= 0),
    CONSTRAINT chk_stock_despues CHECK (stock_despues >= 0)
);

-- =========================================================
-- 8. AUDITORÍA DE CAMBIOS / ANULACIONES
-- =========================================================

CREATE TABLE auditoria_movimientos (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento INT NOT NULL,
    accion ENUM('CREACION', 'ANULACION', 'CORRECCION') NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,

    FOREIGN KEY (id_movimiento) REFERENCES movimientos_inventario(id_movimiento),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- 9. RELACIÓN OPCIONAL MOVIMIENTO ORIGINAL -> MOVIMIENTO CORRECTIVO
-- =========================================================

CREATE TABLE correcciones_movimiento (
    id_correccion INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento_original INT NOT NULL,
    id_movimiento_correctivo INT NOT NULL,
    motivo_correccion VARCHAR(255) NOT NULL,
    fecha_correccion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,

    FOREIGN KEY (id_movimiento_original) REFERENCES movimientos_inventario(id_movimiento),
    FOREIGN KEY (id_movimiento_correctivo) REFERENCES movimientos_inventario(id_movimiento),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- 10. ÍNDICES
-- =========================================================

CREATE INDEX idx_insumos_nombre ON insumos(nombre);
CREATE INDEX idx_insumos_categoria ON insumos(id_categoria);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(id_tipo_movimiento);
CREATE INDEX idx_movimientos_habitacion ON movimientos_inventario(id_habitacion);
CREATE INDEX idx_movimientos_area ON movimientos_inventario(id_area);
CREATE INDEX idx_detalle_insumo ON detalle_movimiento(id_insumo);

-- =========================================================
-- 11. DATOS INICIALES
-- =========================================================

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema'),
('ALMACENISTA', 'Encargado del inventario'),
('SERVICIO', 'Personal operativo del hotel');

INSERT INTO usuarios (nombre_completo, username, email, password_hash, id_rol, estado) VALUES
('Administrador General', 'admin', 'admin@brisas.com', 'hash_admin', 1, 'ACTIVO'),
('Encargado de Almacén', 'almacen', 'almacen@brisas.com', 'hash_almacen', 2, 'ACTIVO'),
('Personal de Servicio', 'servicio1', 'servicio1@brisas.com', 'hash_servicio', 3, 'ACTIVO');

INSERT INTO categorias_insumo (nombre, descripcion) VALUES
('ASEO', 'Productos de aseo'),
('ALIMENTOS', 'Productos alimenticios'),
('MINIBAR', 'Productos del minibar'),
('LENCERIA', 'Toallas, sábanas y similares'),
('MANTENIMIENTO', 'Repuestos y materiales de mantenimiento');

INSERT INTO unidades_medida (nombre, abreviatura) VALUES
('Unidad', 'und'),
('Caja', 'caj'),
('Litro', 'lt'),
('Paquete', 'paq');

INSERT INTO proveedores (nombre, nit, telefono, email, direccion, ciudad, estado) VALUES
('Distribuciones Hoteleras SAS', '900111222-1', '3001112233', 'ventas@hoteleras.com', 'Calle 10 #20-30', 'Cali', 'ACTIVO'),
('Aseo Premium SAS', '900333444-5', '3005556677', 'contacto@aseopremium.com', 'Carrera 15 #40-20', 'Cali', 'ACTIVO');

INSERT INTO areas_hotel (nombre, descripcion, estado) VALUES
('RECEPCION', 'Área de recepción', 'ACTIVA'),
('LAVANDERIA', 'Área de lavandería', 'ACTIVA'),
('RESTAURANTE', 'Área de alimentos y bebidas', 'ACTIVA'),
('MANTENIMIENTO', 'Área de soporte técnico', 'ACTIVA');

INSERT INTO habitaciones (numero, tipo, estado, capacidad, piso, observaciones) VALUES
('101', 'ESTANDAR', 'ACTIVA', 2, 1, NULL),
('102', 'ESTANDAR', 'ACTIVA', 2, 1, NULL),
('201', 'EJECUTIVA', 'ACTIVA', 2, 2, NULL),
('301', 'FAMILIAR', 'ACTIVA', 4, 3, NULL);

INSERT INTO insumos (
    codigo, nombre, descripcion, id_categoria, id_unidad,
    id_proveedor_principal, cantidad_disponible, stock_minimo, estado, requiere_vencimiento
) VALUES
('ASE-001', 'Shampoo 30ml', 'Shampoo individual para huésped', 1, 1, 1, 150, 20, 'ACTIVO', FALSE),
('ASE-002', 'Jabón pequeño', 'Jabón individual para huésped', 1, 1, 1, 200, 30, 'ACTIVO', FALSE),
('MIN-001', 'Agua embotellada', 'Agua para minibar', 3, 1, 2, 120, 25, 'ACTIVO', TRUE),
('LEN-001', 'Toalla blanca', 'Toalla para habitación', 4, 1, 1, 80, 15, 'ACTIVO', FALSE);

INSERT INTO tipos_movimiento (codigo, descripcion) VALUES
('ENTRADA', 'Entrada de inventario'),
('SALIDA', 'Salida de inventario'),
('AJUSTE_ENTRADA', 'Ajuste positivo'),
('AJUSTE_SALIDA', 'Ajuste negativo');

INSERT INTO origenes_salida (codigo, descripcion) VALUES
('HABITACION', 'Entrega a habitación'),
('VENTA', 'Venta de insumo'),
('CONSUMO_INTERNO', 'Uso en otras áreas del hotel'),
('MERMA', 'Pérdida o daño'),
('NO_APLICA', 'No aplica para movimientos de entrada');

-- =========================================================
-- 12. TRIGGER: VALIDAR MOVIMIENTO ANTES DE INSERTAR
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_validar_movimiento_before_insert
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_tipo_codigo VARCHAR(30);

    SELECT codigo
    INTO v_tipo_codigo
    FROM tipos_movimiento
    WHERE id_tipo_movimiento = NEW.id_tipo_movimiento;

    -- Responsable obligatorio
    IF NEW.id_usuario_responsable IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Todo movimiento debe tener un usuario responsable.';
    END IF;

    -- Si es salida, debe tener origen
    IF v_tipo_codigo = 'SALIDA' AND NEW.id_origen_salida IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Toda salida debe tener un origen definido.';
    END IF;

    -- Si origen es HABITACION, debe existir habitación
    IF NEW.id_origen_salida IS NOT NULL THEN
        IF (SELECT codigo FROM origenes_salida WHERE id_origen_salida = NEW.id_origen_salida) = 'HABITACION'
           AND NEW.id_habitacion IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Las salidas a habitación deben indicar una habitación.';
        END IF;
    END IF;

    -- Si origen es CONSUMO_INTERNO, debe existir área
    IF NEW.id_origen_salida IS NOT NULL THEN
        IF (SELECT codigo FROM origenes_salida WHERE id_origen_salida = NEW.id_origen_salida) = 'CONSUMO_INTERNO'
           AND NEW.id_area IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Las salidas por consumo interno deben indicar un área.';
        END IF;
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 13. TRIGGER: VALIDAR DETALLE Y ACTUALIZAR STOCK
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_validar_detalle_before_insert
BEFORE INSERT ON detalle_movimiento
FOR EACH ROW
BEGIN
    DECLARE v_tipo_codigo VARCHAR(30);
    DECLARE v_estado_insumo VARCHAR(20);
    DECLARE v_stock_actual DECIMAL(12,2);

    SELECT tm.codigo
    INTO v_tipo_codigo
    FROM movimientos_inventario m
    INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE m.id_movimiento = NEW.id_movimiento;

    SELECT estado, cantidad_disponible
    INTO v_estado_insumo, v_stock_actual
    FROM insumos
    WHERE id_insumo = NEW.id_insumo;

    IF v_estado_insumo <> 'ACTIVO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se permiten movimientos con insumos inactivos.';
    END IF;

    IF NEW.cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cantidad del movimiento debe ser mayor que cero.';
    END IF;

    IF v_tipo_codigo IN ('SALIDA', 'AJUSTE_SALIDA') AND NEW.cantidad > v_stock_actual THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock insuficiente para realizar la salida.';
    END IF;

    SET NEW.stock_antes = v_stock_actual;

    IF v_tipo_codigo IN ('ENTRADA', 'AJUSTE_ENTRADA') THEN
        SET NEW.stock_despues = v_stock_actual + NEW.cantidad;
    ELSEIF v_tipo_codigo IN ('SALIDA', 'AJUSTE_SALIDA') THEN
        SET NEW.stock_despues = v_stock_actual - NEW.cantidad;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_actualizar_stock_after_insert
AFTER INSERT ON detalle_movimiento
FOR EACH ROW
BEGIN
    UPDATE insumos
    SET cantidad_disponible = NEW.stock_despues
    WHERE id_insumo = NEW.id_insumo;
END$$

DELIMITER ;

-- =========================================================
-- 14. TRIGGER: AUDITORÍA AUTOMÁTICA
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_auditoria_creacion_movimiento
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_movimientos (
        id_movimiento, accion, descripcion, fecha_evento, id_usuario
    )
    VALUES (
        NEW.id_movimiento,
        'CREACION',
        CONCAT('Se creó movimiento en estado ', NEW.estado),
        NOW(),
        NEW.id_usuario_responsable
    );
END$$

DELIMITER ;

-- =========================================================
-- 15. VISTAS
-- =========================================================

CREATE VIEW vw_stock_actual AS
SELECT
    i.id_insumo,
    i.codigo,
    i.nombre,
    c.nombre AS categoria,
    u.abreviatura AS unidad,
    i.cantidad_disponible,
    i.stock_minimo,
    i.estado,
    CASE
        WHEN i.cantidad_disponible <= i.stock_minimo THEN 'STOCK_BAJO'
        ELSE 'OK'
    END AS estado_stock
FROM insumos i
INNER JOIN categorias_insumo c ON i.id_categoria = c.id_categoria
INNER JOIN unidades_medida u ON i.id_unidad = u.id_unidad;

CREATE VIEW vw_movimientos_detallados AS
SELECT
    m.id_movimiento,
    tm.codigo AS tipo_movimiento,
    os.codigo AS origen_salida,
    h.numero AS habitacion,
    a.nombre AS area_hotel,
    p.nombre AS proveedor,
    us.nombre_completo AS responsable,
    m.fecha_movimiento,
    m.estado AS estado_movimiento,
    i.codigo AS codigo_insumo,
    i.nombre AS insumo,
    d.cantidad,
    d.stock_antes,
    d.stock_despues,
    m.motivo,
    m.observaciones
FROM movimientos_inventario m
INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
LEFT JOIN origenes_salida os ON m.id_origen_salida = os.id_origen_salida
LEFT JOIN habitaciones h ON m.id_habitacion = h.id_habitacion
LEFT JOIN areas_hotel a ON m.id_area = a.id_area
LEFT JOIN proveedores p ON m.id_proveedor = p.id_proveedor
INNER JOIN usuarios us ON m.id_usuario_responsable = us.id_usuario
INNER JOIN detalle_movimiento d ON m.id_movimiento = d.id_movimiento
INNER JOIN insumos i ON d.id_insumo = i.id_insumo;

-- =========================================================
-- 16. EJEMPLOS DE OPERACIÓN
-- =========================================================

-- ENTRADA DE SHAMPOO AL INVENTARIO
INSERT INTO movimientos_inventario (
    id_tipo_movimiento, id_origen_salida, id_proveedor, id_usuario_responsable, motivo, observaciones
)
VALUES (
    1, 5, 1, 2, 'Ingreso de compra', 'Recepción de insumos del proveedor'
);

INSERT INTO detalle_movimiento (
    id_movimiento, id_insumo, cantidad, stock_antes, stock_despues, observacion_detalle
)
VALUES (
    1, 1, 20, 0, 0, 'Ingreso por compra'
);

-- SALIDA A HABITACIÓN 101
INSERT INTO movimientos_inventario (
    id_tipo_movimiento, id_origen_salida, id_habitacion, id_usuario_responsable, motivo, observaciones
)
VALUES (
    2, 1, 1, 3, 'Reposición de kit de aseo', 'Entrega a huésped'
);

INSERT INTO detalle_movimiento (
    id_movimiento, id_insumo, cantidad, stock_antes, stock_despues, observacion_detalle
)
VALUES (
    2, 1, 2, 0, 0, 'Entrega de dos unidades a la habitación 101'
);

SET FOREIGN_KEY_CHECKS = 1;