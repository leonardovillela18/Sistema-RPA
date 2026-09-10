<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/bootstrap.php';
if (realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__) fail('Recurso não encontrado.',404);

function user_profile(array $data): array {
    $name=field($data,'name',150);
    $login=field($data,'login',100);
    $email=field($data,'email',254);
    if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail válido.');
    return [$name,$login,$email];
}

function new_password(array $data): string {
    $password=$data['password']??null;
    $confirm=$data['confirmPassword']??null;
    if (!is_string($password) || !is_string($confirm)) fail('Informe e confirme a nova senha.');
    if (strlen($password)>72) fail('A senha deve ter no máximo 72 bytes.');
    if (str_contains($password,"\0") || preg_match_all('/./us',$password)<12) fail('A senha deve ter pelo menos 12 caracteres válidos.');
    if ($password!==$confirm) fail('As senhas não coincidem.');
    return password_hash($password,PASSWORD_DEFAULT);
}

function unique_profile(string $login,string $email,int $id=0): void {
    $q=db()->prepare('SELECT id FROM admins WHERE login=? AND id<>?'); $q->execute([$login,$id]);
    if ($q->fetch()) fail('Login já existente.',409);
    $q=db()->prepare('SELECT id FROM admins WHERE email=? AND id<>?'); $q->execute([$email,$id]);
    if ($q->fetch()) fail('E-mail já existente.',409);
}

function user_exists(int $id): void {
    $q=db()->prepare('SELECT id FROM admins WHERE id=?'); $q->execute([$id]);
    if (!$q->fetch()) fail('Administrador não encontrado.',404);
}

function save_user(string $sql,array $values): void {
    try { $q=db()->prepare($sql); $q->execute($values); }
    catch (PDOException $e) {
        // Os índices UNIQUE também protegem requisições simultâneas.
        if (($e->errorInfo[1]??null)===1062) fail('Login ou e-mail já existente. Atualize os dados e tente novamente.',409);
        throw $e;
    }
}
