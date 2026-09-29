<?php
require dirname(__DIR__,2).'/services.php';
require_user_manager(); $data=input(); $id=field($data,'id',80);
$catalog=services_lock($data); $removed=null;
foreach($catalog['services'] as $index=>$service) if($service['id']===$id) {
    $removed=$service['media']; unset($catalog['services'][$index]); break;
}
if($removed===null) fail('Serviço não encontrado.',404);
services_commit($catalog,$removed);
