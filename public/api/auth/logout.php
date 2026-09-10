<?php
require dirname(__DIR__).'/bootstrap.php';
method('POST'); csrf(); $_SESSION=[];
$p=session_get_cookie_params(); setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','secure'=>$p['secure'],'httponly'=>true,'samesite'=>'Lax']);
session_destroy(); success();
