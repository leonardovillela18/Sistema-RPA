-- Execute UMA VEZ antes de publicar o código. Faça backup previamente.
-- Confira primeiro que existe exatamente uma conta leonardo.villela.
SELECT id,login FROM admins WHERE login='leonardo.villela';
ALTER TABLE admins ADD COLUMN role ENUM('admin','superadmin') NOT NULL DEFAULT 'admin', ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0, ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0;
UPDATE admins SET role='superadmin' WHERE login='leonardo.villela';
CREATE TABLE audit_log (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id INT UNSIGNED NOT NULL, actor_login VARCHAR(100) NOT NULL, action VARCHAR(50) NOT NULL, entity VARCHAR(50) NOT NULL, record_id INT UNSIGNED NULL, details LONGTEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Deve retornar ao menos uma conta. Não publique se a conta estiver ausente.
SELECT id,login FROM admins WHERE role='superadmin';
