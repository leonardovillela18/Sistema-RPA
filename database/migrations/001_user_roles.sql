-- Executar uma vez em instalações existentes, antes de publicar o código.
-- As contas existentes continuam como administradores.
ALTER TABLE admins ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'admin' AFTER password_hash;
