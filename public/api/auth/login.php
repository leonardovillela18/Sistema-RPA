<?php
require dirname(__DIR__).'/bootstrap.php';
method('POST'); csrf(); $data=input();
$login=field($data,'login',100);
$password=$data['password']??null;
// Preserve espaços da senha exatamente como foram cadastrados.
if (!is_string($password) || $password==='' || strlen($password)>1024) fail('Informe uma senha válida.');
$key=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');
$pdo=db(); $pdo->beginTransaction();
$q=$pdo->prepare('INSERT IGNORE INTO login_attempts (identity_hash,attempts,window_start) VALUES (?,0,?)'); $q->execute([$key,time()]);
$q=$pdo->prepare('SELECT attempts,window_start FROM login_attempts WHERE identity_hash=? FOR UPDATE'); $q->execute([$key]); $attempt=$q->fetch();
$count=time()-(int)$attempt['window_start']>=900 ? 0 : (int)$attempt['attempts'];
if($count>=10) { $pdo->rollBack(); fail('Muitas tentativas. Aguarde 15 minutos.',429); }
$q=$pdo->prepare('UPDATE login_attempts SET attempts=?,window_start=? WHERE identity_hash=?'); $q->execute([$count+1,$count===0?time():$attempt['window_start'],$key]); $pdo->commit();
$q=$pdo->prepare('SELECT id,password_hash,session_version FROM admins WHERE login=?'); $q->execute([$login]); $user=$q->fetch();
if(!$user || !password_verify($password,$user['password_hash'])) fail('Login ou senha inválidos.',401);
if(password_needs_rehash($user['password_hash'],PASSWORD_DEFAULT)) { $q=$pdo->prepare('UPDATE admins SET password_hash=? WHERE id=?'); $q->execute([password_hash($password,PASSWORD_DEFAULT),$user['id']]); }
$q=$pdo->prepare('DELETE FROM login_attempts WHERE identity_hash=? OR window_start<?'); $q->execute([$key,time()-86400]);
session_regenerate_id(true); $_SESSION['admin_id']=$user['id']; $_SESSION['session_version']=(int)$user['session_version']; $_SESSION['csrf']=bin2hex(random_bytes(32)); success();
