<?php
declare(strict_types=1);
function new_password(array $data): string {
    $password=$data['password']??null;
    $confirm=$data['confirmPassword']??null;
    if (!is_string($password) || !is_string($confirm)) fail('Informe e confirme a nova senha.');
    if (strlen($password)>72) fail('A senha deve ter no máximo 72 bytes.');
    if (str_contains($password,"\0") || preg_match_all('/./us',$password)<12) fail('A senha deve ter pelo menos 12 caracteres válidos.');
    if ($password!==$confirm) fail('As senhas não coincidem.');
    return password_hash($password,PASSWORD_DEFAULT);
}

