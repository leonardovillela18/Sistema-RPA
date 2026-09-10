<?php
require dirname(__DIR__,2).'/bootstrap.php';
require_admin(); $data=input(); $values=[];
foreach(['phoneLabel','phoneLink','emailLabel','emailLink','instagramLabel','instagramLink','address','mapsLink','mapsEmbed'] as $key) {
    $value=field($data,$key,str_ends_with($key,'Label')?254:2048);
    if(in_array($key,['phoneLink','emailLink','instagramLink','mapsLink','mapsEmbed'],true)) {
        $scheme=strtolower(parse_url($value,PHP_URL_SCHEME)??'');
        $allowed=$key==='emailLink'?['mailto']:($key==='phoneLink'?['https','tel']:['https']);
        if(!in_array($scheme,$allowed,true) || preg_match('/[\x00-\x20<>"\']/', $value)) fail('Link inválido: '.$key);
        if($scheme==='https' && !filter_var($value,FILTER_VALIDATE_URL)) fail('URL inválida.');
        if($key==='mapsEmbed' && !in_array(strtolower(parse_url($value,PHP_URL_HOST)??''),['www.google.com','maps.google.com','www.google.com.br'],true)) fail('Use um endereço de incorporação do Google Maps.');
    }
    if($key==='emailLabel' && !filter_var($value,FILTER_VALIDATE_EMAIL)) fail('Email inválido.');
    $values[]=$value;
}
$q=db()->prepare('UPDATE site_contacts SET phone_label=?,phone_link=?,email_label=?,email_link=?,instagram_label=?,instagram_link=?,address=?,maps_link=?,maps_embed=? WHERE id=1'); $q->execute($values); success();
