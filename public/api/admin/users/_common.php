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
    $role=field($data,'role',20);
    if (!in_array($role,['admin','superadmin'],true)) fail('Selecione um perfil válido.');
    return [$name,$login,$email,$role];
}

// Compartilhado por edição e exclusão para serializar alterações de contas.
function lock_users(): array {
    db()->beginTransaction();
    $q=db()->query('SELECT id,role FROM admins ORDER BY id FOR UPDATE');
    $users=$q->fetchAll(PDO::FETCH_KEY_PAIR);
    if (($users[(int)$_SESSION['admin_id']]??null)!=='superadmin') {
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

function force_password(array $data): int {
    if (!isset($data['must_change_password']) || !is_bool($data['must_change_password'])) fail('Informe a opção de troca de senha.');
    return (int)$data['must_change_password'];
}
function protect_superadmin(array $users,int $id,?string $newRole=null): void {
    if (($users[$id]??null)==='superadmin' && $newRole!=='superadmin' &&
        ($id===(int)$_SESSION['admin_id'] || count(array_filter($users,fn($role)=>$role==='superadmin'))<=1)) {
        db()->rollBack(); fail('Não é permitido remover seu próprio acesso ou o último superadmin.',409);
    }
}
