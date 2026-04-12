INSERT INTO roles (name, description)
VALUES ('ADMIN', 'Administrador general del sistema'),
       ('WAREHOUSE', 'Encargado de inventario'),
       ('REQUESTER', 'Solicitante de área')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (full_name, email, username, password_hash, role_id, status, created_at)
SELECT 'Administrador Lunara', 'admin@lunara.local', 'admin', '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', r.id, 'ACTIVE', CURRENT_TIMESTAMP
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (full_name, email, username, password_hash, role_id, status, created_at)
SELECT 'Jefe de Almacén', 'almacen@lunara.local', 'almacen', '5f2f45cffe4b5cc0698911b0df986c4e423abe51722cf5249847cae0962ce50a', r.id, 'ACTIVE', CURRENT_TIMESTAMP
FROM roles r
WHERE r.name = 'WAREHOUSE'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'almacen');

INSERT INTO users (full_name, email, username, password_hash, role_id, status, created_at)
SELECT 'Solicitante Housekeeping', 'solicitante@lunara.local', 'solicitante', 'a37e73c1817fba0aadb05392957c7aaaba5ef4b53d27527e66b368f1596e07ab', r.id, 'ACTIVE', CURRENT_TIMESTAMP
FROM roles r
WHERE r.name = 'REQUESTER'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'solicitante');
