<?php
require __DIR__.'/_common.php';
require_admin(); $data=input(); $id=record_id($data); user_exists($id);
[$name,$login,$email,$role]=user_profile($data); unique_profile($login,$email,$id);
$users=lock_users();
if (!isset($users[$id])) { db()->rollBack(); fail('Usuário não encontrado.',404); }
if ($users[$id]==='admin' && $role!=='admin') {
    if ($id===(int)$_SESSION['admin_id'] || count(array_filter($users,fn($value)=>$value==='admin'))<=1) {
        db()->rollBack(); fail('Não é permitido remover seu próprio acesso administrativo ou o último administrador.',409);
    }
}
save_user('UPDATE admins SET name=?,login=?,email=?,role=? WHERE id=?',[$name,$login,$email,$role,$id]);
db()->commit();
respond(['ok'=>true,'data'=>['id'=>$id]]);
