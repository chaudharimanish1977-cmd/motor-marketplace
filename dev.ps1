# Development startup script
# Loads .env.local and starts Next.js dev server.
#
# WHY THIS EXISTS:
# When running inside Claude Code, the shell may have ANTHROPIC_API_KEY pre-set
# to an empty string by the Claude Code wrapper. Next.js prioritises system env
# vars over .env files, so an empty system value would mask our real key.
# This script reads .env.local and force-sets the vars in the shell before npm.
#
# Outside Claude Code, plain `npm run dev` works fine.

$ErrorActionPreference = "Stop"

# Ensure Node is on PATH (helps if Claude Code session started before Node was installed)
if (Test-Path "C:\Program Files\nodejs\node.exe") {
    $env:Path = "C:\Program Files\nodejs;$env:Path"
}

# Allow PowerShell to run npm/npx scripts in this session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Load .env.local
if (Test-Path .env.local) {
    Get-Content .env.local | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $varName = $matches[1].Trim()
            $varValue = $matches[2].Trim()
            # Strip surrounding quotes if present
            if ($varValue -match '^"(.*)"$') { $varValue = $matches[1] }
            if ($varValue -match "^'(.*)'$") { $varValue = $matches[1] }
            Set-Item -Path "env:$varName" -Value $varValue
            Write-Host "  loaded $varName" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Warning ".env.local not found — copy .env.example and add your ANTHROPIC_API_KEY"
}

Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
npm run dev
