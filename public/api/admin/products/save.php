<?php
require dirname(__DIR__,2).'/bootstrap.php';
require_admin(); $data=input();
$name=field($data,'name',200); $short=field($data,'shortDescription',5000); $details=field($data,'details',20000,false); $alt=field($data,'imageAlt',200,false);
$price=field($data,'price',30); $price=trim(str_replace(['R$',"\xc2\xa0",' '],'',$price));
if(str_contains($price,',')) $price=str_replace(',','.',str_replace('.','',$price));
if(!preg_match('/^\d{1,8}(\.\d{1,2})?$/D',$price)) fail('Informe um preço válido com até duas casas decimais.');
$pdo=db(); $pdo->beginTransaction(); $id=empty($data['id'])?null:record_id($data); $old=null;
if($id) { $q=$pdo->prepare('SELECT image_path FROM products WHERE id=? FOR UPDATE'); $q->execute([$id]); $old=$q->fetch(); if(!$old) { $pdo->rollBack(); fail('Produto não encontrado.',404); } }
$image=upload('image','products') ?? ($old['image_path']??null); if(!$image) fail('Selecione uma imagem.');
$values=[$name,$price,$short,$details,$image,$alt];
if($id) { $values[]=$id; $q=$pdo->prepare('UPDATE products SET name=?,price=?,short_description=?,details=?,image_path=?,image_alt=? WHERE id=?'); }
else $q=$pdo->prepare('INSERT INTO products (name,price,short_description,details,image_path,image_alt) VALUES (?,?,?,?,?,?)');
$q->execute($values); audit($id?'update':'create','products',$id??(int)$pdo->lastInsertId(),['name'=>$name,'price'=>$price,'short_description'=>$short,'details'=>$details,'image_path'=>$image,'image_alt'=>$alt]); $pdo->commit(); success();
