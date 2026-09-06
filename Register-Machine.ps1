<#
.SYNOPSIS
  One-time activation: registers this machine with the DeviceCare backend
  and writes agent-config.json next to DeviceCare.ps1 so future runs report
  in automatically.

.EXAMPLE
  .\Register-Machine.ps1 -ApiUrl "https://api.yourdomain.com" -AdminKey "..." -CompanyId "7cd4602a-..." -ScriptFolder "F:\Company"
#>
param(
    [Parameter(Mandatory)] [string]$ApiUrl,
    [Parameter(Mandatory)] [string]$AdminKey,
    [Parameter(Mandatory)] [string]$CompanyId,
    [Parameter(Mandatory)] [string]$ScriptFolder,
    [string]$MachineName = $env:COMPUTERNAME
)

$Body = @{ name = $MachineName } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri "$ApiUrl/api/v1/admin/companies/$CompanyId/machines" -Method Post `
    -Body $Body -ContentType "application/json" -Headers @{ "X-Admin-Key" = $AdminKey }

$Config = @{ apiUrl = $ApiUrl; apiKey = $Response.apiKey } | ConvertTo-Json
$ConfigPath = Join-Path $ScriptFolder "agent-config.json"
Set-Content -Path $ConfigPath -Value $Config -Encoding UTF8 -Force

Write-Host "Registered '$MachineName' - config written to $ConfigPath"
