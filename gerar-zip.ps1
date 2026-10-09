$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$zipPath = Join-Path (Split-Path -Parent $projectPath) "mural-recados-$timestamp.zip"
$include = @('public', '.gitignore', 'README.md', 'GITHUB.txt', 'firestore.rules', 'firebase.json', 'gerar-zip.ps1', 'evidencias')
$files = $include | ForEach-Object { Join-Path $projectPath $_ } | Where-Object { Test-Path -LiteralPath $_ }
Compress-Archive -LiteralPath $files -DestinationPath $zipPath
Write-Host "Pacote criado: $zipPath"
