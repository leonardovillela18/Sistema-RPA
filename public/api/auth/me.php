<?php
require dirname(__DIR__).'/bootstrap.php';
method('GET'); $user=admin(); respond(['ok'=>true,'user'=>$user,'csrf'=>$_SESSION['csrf']]);
