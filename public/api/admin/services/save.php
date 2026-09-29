<?php
require dirname(__DIR__,2).'/services.php';
require_user_manager();
$raw=input();
if(isset($raw['service'])) {
    try { $data=json_decode($raw['service'],true,32,JSON_THROW_ON_ERROR); }
    catch(Throwable $e) { fail('Dados do serviço inválidos.'); }
} else $data=$raw;
if(!is_array($data)) fail('Dados do serviço inválidos.');
$title=field($data,'title',200); $id=field($data,'id',80,false);
$sections=service_sections($data);
$keep=$data['keepMedia']??[];
if(!is_array($keep) || !array_is_list($keep) || count($keep)>12) fail('Seleção de mídias inválida.');
foreach($keep as $key) if(!is_string($key)) fail('Mídia inválida.');
if(count(array_unique($keep))!==count($keep)) fail('Mídia duplicada.');
$catalog=services_lock($data);
$index=null;
foreach($catalog['services'] as $i=>$service) if($service['id']===$id) $index=$i;
if($id!=='' && $index===null) fail('Serviço não encontrado.',404);
if($index===null && count($catalog['services'])>=100) fail('Limite de 100 serviços atingido.');
$old=$index===null ? [] : $catalog['services'][$index]['media'];
$byId=array_column($old,null,'id'); $media=[];
foreach($keep as $key) { if(!isset($byId[$key])) fail('Selecione apenas mídias deste serviço.'); $media[]=$byId[$key]; }
$new=service_uploads();
$media=array_merge($media,$new);
if(count($media)>12) fail('Use até 12 mídias por serviço.');
if(isset($data['mediaOrder'])) {
    $order=$data['mediaOrder']; $available=$byId;
    foreach($new as $i=>$item) $available['new:'.$i]=$item;
    if(!is_array($order) || !array_is_list($order) || count($order)!==count($media)) fail('Ordem de mídias inválida.');
    $ordered=[]; $used=[];
    foreach($order as $key) {
        if(!is_string($key) || !isset($available[$key]) || isset($used[$key]) || (isset($byId[$key]) && !in_array($key,$keep,true))) fail('Ordem de mídias inválida.');
        $used[$key]=true; $ordered[]=$available[$key];
    }
    $media=$ordered;
}
$service=['id'=>$id?:bin2hex(random_bytes(12)),'title'=>$title,'sections'=>$sections,'media'=>$media];
if($index===null) $catalog['services'][]=$service; else $catalog['services'][$index]=$service;
$removed=array_values(array_filter($old,fn($item)=>!in_array($item['id'],$keep,true)));
services_commit($catalog,$removed);
