<?php
require __DIR__.'/_common.php';
require_superadmin(); $data=input(); $id=record_id($data);
[$name,$login,$email,$role]=user_profile($data); $force=force_password($data); unique_profile($login,$email,$id);
$hash=null;
if (($data['password']??'')!=='') $hash=new_password($data);
$users=lock_users();
if (!isset($users[$id])) { db()->rollBack(); fail('Usuário não encontrado.',404); }
protect_superadmin($users,$id,$role);
// Registra antes da atualização para preservar o login do autor e validar sua sessão.
audit('update','admins',$id,['name'=>$name,'login'=>$login,'email'=>$email,'role'=>$role,'must_change_password'=>$force,'password_reset'=>$hash!==null]);
$sql='UPDATE admins SET name=?,login=?,email=?,role=?,must_change_password=?'; $values=[$name,$login,$email,$role,$force];
if ($hash!==null) { $sql.=',password_hash=?,session_version=session_version+1'; $values[]=$hash; }
$sql.=' WHERE id=?'; $values[]=$id; save_user($sql,$values);
db()->commit(); respond(['ok'=>true,'data'=>['id'=>$id]]);
