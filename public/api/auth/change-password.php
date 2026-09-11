<?php
require dirname(__DIR__).'/bootstrap.php';
require dirname(__DIR__).'/password.php';
method('POST'); csrf(); $user=admin(); if (!$user) fail('Entre novamente.',401);
require_account_features($user); $data=input(); $hash=new_password($data);
$pdo=db(); $pdo->beginTransaction();
$q=$pdo->prepare('SELECT password_hash FROM admins WHERE id=? FOR UPDATE'); $q->execute([$user['id']]); $current=$q->fetch();
if (!$current || !hash_equals(hash('sha256',$current['password_hash']),$_SESSION['auth_proof']??'')) { $pdo->rollBack(); fail('Entre novamente.',401); }
$old=$data['currentPassword']??null;
if (!is_string($old) || !password_verify($old,$current['password_hash'])) { $pdo->rollBack(); fail('Senha atual incorreta.'); }
if (password_verify($data['password'],$current['password_hash'])) { $pdo->rollBack(); fail('Escolha uma senha diferente da senha provisória.'); }
$q=$pdo->prepare('UPDATE admins SET password_hash=?,password_change_required=0 WHERE id=?'); $q->execute([$hash,$user['id']]);
$pdo->commit(); session_regenerate_id(true); $_SESSION['auth_proof']=hash('sha256',$hash); $_SESSION['csrf']=bin2hex(random_bytes(32));
respond(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
