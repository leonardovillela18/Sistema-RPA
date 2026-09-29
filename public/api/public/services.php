<?php
require dirname(__DIR__).'/services.php';
method('GET');
respond(['ok'=>true]+services_catalog());
