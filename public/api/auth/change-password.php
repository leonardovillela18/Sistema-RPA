<?php
require dirname(__DIR__).'/bootstrap.php';
require dirname(__DIR__).'/password.php';
method('POST'); csrf(); $user=admin(); if (!$user) fail('Entre novamente.',401);
$data=input(); $hash=new_password($data);
$pdo=db(); $pdo->beginTransaction();
$q=$pdo->prepare('SELECT password_hash,session_version FROM admins WHERE id=? FOR UPDATE'); $q->execute([$user['id']]); $current=$q->fetch();
if (!$current || (int)$current['session_version']!==(int)$_SESSION['session_version']) { $pdo->rollBack(); fail('Entre novamente.',401); }
$old=$data['currentPassword']??null;
if (!is_string($old) || !password_verify($old,$current['password_hash'])) { $pdo->rollBack(); fail('Senha atual incorreta.',422); }
if (password_verify($data['password'],$current['password_hash'])) { $pdo->rollBack(); fail('Escolha uma senha diferente da senha atual.',422); }
audit('password_changed','admins',(int)$user['id']);
$q=$pdo->prepare('UPDATE admins SET password_hash=?,must_change_password=0,session_version=session_version+1 WHERE id=?'); $q->execute([$hash,$user['id']]);
$pdo->commit(); session_regenerate_id(true); $_SESSION['session_version']=(int)$current['session_version']+1; $_SESSION['csrf']=bin2hex(random_bytes(32));
respond(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
