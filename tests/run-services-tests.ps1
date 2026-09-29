param([string]$Php='C:/xampp/php/php.exe')
$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$token=[guid]::NewGuid().ToString('N').Substring(0,12)
$runtime=Join-Path $workspace ('.test-runtime/services-'+$token)
$oldConfig=$env:RPA_CONFIG
$oldDatabase=$env:RPA_SERVICE_TEST_DB
$oldRoot=$env:RPA_SERVICE_TEST_ROOT
$server=$null
$created=$false
try {
    New-Item -ItemType Directory -Path $runtime | Out-Null
    Copy-Item -LiteralPath (Join-Path $workspace 'public') -Destination $runtime -Recurse
    $env:RPA_CONFIG=Join-Path $runtime 'config.php'
    $env:RPA_SERVICE_TEST_DB='rpa_services_test_'+$token
    $env:RPA_SERVICE_TEST_ROOT=Join-Path $runtime 'public'
    & $Php (Join-Path $PSScriptRoot 'setup-services-test.php')
    if($LASTEXITCODE -ne 0) { throw 'Falha ao criar banco isolado de testes.' }
    $created=$true
    $server=Start-Process $Php -ArgumentList @('-d','display_errors=Off','-d',('upload_tmp_dir="'+$runtime+'"'),'-d',('session.save_path="'+$runtime+'"'),'-d','upload_max_filesize=15M','-d','post_max_size=16M','-d','max_file_uploads=12','-S','127.0.0.1:18081','-t',('"'+$runtime+'/public"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtime/php.out" -RedirectStandardError "$runtime/php.err"
    Start-Sleep -Milliseconds 600
    if($server.HasExited) { throw 'Servidor isolado não iniciou.' }
    & node (Join-Path $PSScriptRoot 'services-api.cjs')
    if($LASTEXITCODE -ne 0) { throw "Falha nos testes; logs em $runtime" }
} finally {
    if($server -and !$server.HasExited) { Stop-Process -Id $server.Id }
    if($created) { & $Php (Join-Path $PSScriptRoot 'setup-services-test.php') cleanup }
    $env:RPA_CONFIG=$oldConfig
    $env:RPA_SERVICE_TEST_DB=$oldDatabase
    $env:RPA_SERVICE_TEST_ROOT=$oldRoot
}
