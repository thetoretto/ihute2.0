# Allow inbound TCP on port 3000 for the API server. Run as Administrator:
# Right-click this file -> Run with PowerShell (or open PowerShell as Admin and run: .\allow-port-3000.ps1)
$rule = Get-NetFirewallRule -DisplayName "Node 3000" -ErrorAction SilentlyContinue
if ($rule) {
  Write-Host "Firewall rule 'Node 3000' already exists."
} else {
  New-NetFirewallRule -DisplayName "Node 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
  Write-Host "Firewall rule added: inbound TCP port 3000 allowed."
}
