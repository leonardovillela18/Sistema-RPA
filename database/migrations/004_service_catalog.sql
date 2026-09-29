-- Opcional: a API também cria esta tabela no primeiro salvamento administrativo.
CREATE TABLE IF NOT EXISTS service_catalog (
    id INT PRIMARY KEY,
    revision INT NOT NULL DEFAULT 0,
    payload LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
