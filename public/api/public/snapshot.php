<?php
require dirname(__DIR__).'/bootstrap.php';
method('GET');
$products=db()->query('SELECT id,name,price,short_description AS shortDescription,details,image_path AS imageUrl,image_alt AS imageAlt FROM products ORDER BY id DESC')->fetchAll();
foreach($products as &$product) $product['id']=(string)$product['id']; unset($product);
$contacts=db()->query('SELECT phone_label AS phoneLabel,phone_link AS phoneLink,email_label AS emailLabel,email_link AS emailLink,instagram_label AS instagramLabel,instagram_link AS instagramLink,address,maps_link AS mapsLink,maps_embed AS mapsEmbed FROM site_contacts WHERE id=1')->fetch();
$about=db()->query('SELECT intro_title AS introTitle,intro_text AS introText FROM about_content WHERE id=1')->fetch();
if(!$contacts || !$about) throw new RuntimeException('Importe o schema inicial.');
$about['blocks']=db()->query('SELECT badge,title,text,image_path AS imageUrl,image_alt AS imageAlt,inversed FROM about_blocks ORDER BY position')->fetchAll();
foreach($about['blocks'] as &$block) $block['inversed']=(bool)$block['inversed']; unset($block);
respond(['ok'=>true,'data'=>['products'=>$products,'contacts'=>$contacts,'about'=>$about]]);
