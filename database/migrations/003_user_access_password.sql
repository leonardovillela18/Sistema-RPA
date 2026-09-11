-- PROPOSTA PARA REVISÃO: não executada automaticamente pelo sistema.
-- Aplicar UMA VEZ, manualmente, após backup e conferência do schema.
-- Preserva todas as contas e senhas; contas existentes continuam administradoras.
ALTER TABLE admins
    ADD COLUMN can_manage_users BOOLEAN NOT NULL DEFAULT 1,
    ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT 0;
