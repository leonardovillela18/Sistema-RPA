<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/bootstrap.php';
require_once dirname(__DIR__,2).'/password.php';
if (realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__) fail('Recurso não encontrado.',404);

function user_profile(array $data): array {
    $name=field($data,'name',150);
    $login=field($data,'login',100);
    $email=field($data,'email',254);
    if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail válido.');
    $function=field($data,'function',20);
    if (!in_array($function,['operator','admin'],true)) fail('Selecione Operador ou Admin.');
    return [$name,$login,$email,(int)($function==='admin')];
}

// Compartilhado por edição e exclusão para serializar alterações de contas.
function lock_users(): array {
    db()->beginTransaction();
    $q=db()->query('SELECT id,can_manage_users FROM admins ORDER BY id FOR UPDATE');
    $users=$q->fetchAll(PDO::FETCH_KEY_PAIR);
    require_user_manager();
    if (!isset($users[(int)$_SESSION['admin_id']])) {
        db()->rollBack(); fail('Sessão expirada. Entre novamente.',401);
    }
    return $users;
}

function unique_profile(string $login,string $email,int $id=0): void {
    $q=db()->prepare('SELECT id FROM admins WHERE login=? AND id<>?'); $q->execute([$login,$id]);
    if ($q->fetch()) fail('Login já existente.',409);
    $q=db()->prepare('SELECT id FROM admins WHERE email=? AND id<>?'); $q->execute([$email,$id]);
    if ($q->fetch()) fail('E-mail já existente.',409);
}

function user_exists(int $id): void {
    $q=db()->prepare('SELECT id FROM admins WHERE id=?'); $q->execute([$id]);
    if (!$q->fetch()) fail('Usuário não encontrado.',404);
}

function save_user(string $sql,array $values): void {
    try { $q=db()->prepare($sql); $q->execute($values); }
    catch (PDOException $e) {
        // Os índices UNIQUE também protegem requisições simultâneas.
        if (($e->errorInfo[1]??null)===1062) fail('Login ou e-mail já existente. Atualize os dados e tente novamente.',409);
        throw $e;
    }
}

function protect_manager(array $users,int $id): void {
    if (!empty($users[$id]) && ($id===(int)$_SESSION['admin_id'] || count(array_filter($users))<=1)) {
        db()->rollBack(); fail('Não é permitido remover seu próprio acesso de admin ou o último admin.',409);
    }
}
