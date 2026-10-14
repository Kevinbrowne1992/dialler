<#
.SYNOPSIS
    Configures Zoiper as the default Windows protocol handler for TEL and SIP (and CALLTO).

.DESCRIPTION
    This script locates the Zoiper executable on the computer and registers it
    in the Windows Registry as the default handler for:
      - tel:   (Standard telephony URI)
      - sip:   (VoIP SIP protocol)
      - callto:(Legacy VoIP URI)
      - zoiper:(Zoiper proprietary protocol)

    It configures:
      1. HKCU:\Software\Classes\<protocol>\shell\open\command
      2. HKCU:\Software\Classes\Zoiper.<protocol>\shell\open\command
      3. Windows Registered Applications & Capabilities
      4. HKLM (System-wide) if executed with Administrator privileges

.PARAMETER ZoiperPath
    Optional custom path to Zoiper5.exe or zoiper.exe. If omitted, the script automatically searches all standard installation paths.

.PARAMETER Silent
    Runs without interactive prompts or opening Windows Settings.

.EXAMPLE
    .\Set-ZoiperDefaults.ps1
    .\Set-ZoiperDefaults.ps1 -ZoiperPath "C:\Program Files\Zoiper5\Zoiper5.exe"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ZoiperPath = "",

    [Parameter(Mandatory = $false)]
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

function Write-Banner {
    Write-Host ""
    Write-Host " ========================================================" -ForegroundColor Cyan
    Write-Host "   Zoiper Protocol Handler Setup (TEL & SIP for Windows)  " -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host " ========================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Find-ZoiperExecutable {
    param([string]$ExplicitPath)

    if ($ExplicitPath -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Get-Item -LiteralPath $ExplicitPath).FullName
    }

    # 1. Check running processes
    $proc = Get-Process -Name "*zoiper*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) {
        try {
            $path = $proc.MainModule.FileName
            if ($path -and (Test-Path -LiteralPath $path)) {
                return $path
            }
        } catch {
            # Ignore process permission error
        }
    }

    # 2. Check standard installation directories
    $candidatePaths = @(
        "${env:ProgramFiles}\Zoiper5\Zoiper5.exe",
        "${env:ProgramFiles(x86)}\Zoiper5\Zoiper5.exe",
        "${env:ProgramW6432}\Zoiper5\Zoiper5.exe",
        "${env:LOCALAPPDATA}\Programs\Zoiper5\Zoiper5.exe",
        "${env:APPDATA}\Zoiper5\Zoiper5.exe",
        "${env:ProgramFiles}\Zoiper\zoiper.exe",
        "${env:ProgramFiles(x86)}\Zoiper\zoiper.exe",
        "${env:LOCALAPPDATA}\Programs\Zoiper\zoiper.exe"
    )

    foreach ($candidate in $candidatePaths) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return (Get-Item -LiteralPath $candidate).FullName
        }
    }

    # 3. Check Windows App Paths in Registry
    $regPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Zoiper5.exe",
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\zoiper.exe",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Zoiper5.exe",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\zoiper.exe"
    )
    foreach ($regKey in $regPaths) {
        if (Test-Path $regKey) {
            $val = (Get-ItemProperty -Path $regKey -Name "(Default)" -ErrorAction SilentlyContinue)."(Default)"
            if ($val -and (Test-Path -LiteralPath $val)) {
                return (Get-Item -LiteralPath $val).FullName
            }
        }
    }

    # 4. Check Windows Uninstall Registry Keys
    $uninstallRoots = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    $installed = Get-ItemProperty $uninstallRoots -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -match "Zoiper" -and $_.InstallLocation }
    foreach ($item in $installed) {
        $exe5 = Join-Path $item.InstallLocation "Zoiper5.exe"
        if (Test-Path -LiteralPath $exe5) { return $exe5 }
        $exe = Join-Path $item.InstallLocation "zoiper.exe"
        if (Test-Path -LiteralPath $exe) { return $exe }
    }

    return $null
}

function Prompt-UserForZoiperPath {
    Write-Host " [!] Zoiper was not found in default locations." -ForegroundColor Yellow
    Write-Host "     Please specify the path to Zoiper5.exe (or zoiper.exe)." -ForegroundColor White

    # Attempt to show a graphical file picker if not silent
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        $dialog.Title = "Select your Zoiper executable (Zoiper5.exe)"
        $dialog.Filter = "Executable files (*.exe)|*.exe|All files (*.*)|*.*"
        $dialog.InitialDirectory = [System.Environment]::GetFolderPath("ProgramFiles")
        $result = $dialog.ShowDialog()
        if ($result -eq [System.Windows.Forms.DialogResult]::OK -and (Test-Path -LiteralPath $dialog.FileName)) {
            return $dialog.FileName
        }
    } catch {
        # Fall back to console input
    }

    $userInput = Read-Host " Enter full path to Zoiper5.exe"
    if ($userInput) {
        $cleaned = $userInput.Trim().Trim('"').Trim("'")
        if (Test-Path -LiteralPath $cleaned) {
            return (Get-Item -LiteralPath $cleaned).FullName
        }
    }

    return $null
}

function Set-RegistryValueSafe {
    param(
        [string]$Path,
        [string]$Name = "(Default)",
        [object]$Value,
        [string]$Type = "String"
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -Path $Path -Force | Out-Null
    }

    if ($Name -eq "(Default)") {
        Set-Item -Path $Path -Value $Value | Out-Null
    } else {
        Set-ItemProperty -Path $Path -Name $Name -Value $Value -Type $Type -Force | Out-Null
    }
}

function Register-ProtocolHandlers {
    param([string]$ExePath)

    $protocols = @("tel", "sip", "callto", "zoiper")
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    Write-Host " [*] Configuring protocols for current user..." -ForegroundColor Cyan

    foreach ($proto in $protocols) {
        $protocolDesc = "URL:$($proto.ToUpper()) Protocol"
        $commandStr = "`"$ExePath`" `"%1`""

        # 1. Direct class registration: HKCU:\Software\Classes\<protocol>
        $classRoot = "HKCU:\Software\Classes\$proto"
        Set-RegistryValueSafe -Path $classRoot -Name "(Default)" -Value $protocolDesc
        Set-RegistryValueSafe -Path $classRoot -Name "URL Protocol" -Value ""
        Set-RegistryValueSafe -Path $classRoot -Name "FriendlyTypeName" -Value "Zoiper $proto Protocol"
        Set-RegistryValueSafe -Path "$classRoot\DefaultIcon" -Name "(Default)" -Value "`"$ExePath`",0"
        Set-RegistryValueSafe -Path "$classRoot\shell\open\command" -Name "(Default)" -Value $commandStr

        # 2. ProgID registration: HKCU:\Software\Classes\Zoiper5.$proto
        $progIdRoot = "HKCU:\Software\Classes\Zoiper5.$proto"
        Set-RegistryValueSafe -Path $progIdRoot -Name "(Default)" -Value "Zoiper $proto Handler"
        Set-RegistryValueSafe -Path $progIdRoot -Name "URL Protocol" -Value ""
        Set-RegistryValueSafe -Path "$progIdRoot\DefaultIcon" -Name "(Default)" -Value "`"$ExePath`",0"
        Set-RegistryValueSafe -Path "$progIdRoot\shell\open\command" -Name "(Default)" -Value $commandStr

        # Also create ProgID without version: HKCU:\Software\Classes\Zoiper.$proto
        $progIdRootGeneric = "HKCU:\Software\Classes\Zoiper.$proto"
        Set-RegistryValueSafe -Path $progIdRootGeneric -Name "(Default)" -Value "Zoiper $proto Handler"
        Set-RegistryValueSafe -Path $progIdRootGeneric -Name "URL Protocol" -Value ""
        Set-RegistryValueSafe -Path "$progIdRootGeneric\DefaultIcon" -Name "(Default)" -Value "`"$ExePath`",0"
        Set-RegistryValueSafe -Path "$progIdRootGeneric\shell\open\command" -Name "(Default)" -Value $commandStr

        Write-Host "   + Configured [$proto] protocol -> Zoiper" -ForegroundColor Green

        # 3. If Administrator, write to HKLM as well
        if ($isAdmin) {
            $hklmClass = "HKLM:\Software\Classes\$proto"
            Set-RegistryValueSafe -Path $hklmClass -Name "(Default)" -Value $protocolDesc
            Set-RegistryValueSafe -Path $hklmClass -Name "URL Protocol" -Value ""
            Set-RegistryValueSafe -Path "$hklmClass\shell\open\command" -Name "(Default)" -Value $commandStr
        }
    }

    # 4. Register Zoiper in Windows Capabilities & RegisteredApplications
    $capPath = "HKCU:\Software\Zoiper5\Capabilities"
    Set-RegistryValueSafe -Path $capPath -Name "ApplicationName" -Value "Zoiper5"
    Set-RegistryValueSafe -Path $capPath -Name "ApplicationDescription" -Value "Zoiper VoIP Softphone"

    $urlAssocPath = "$capPath\URLAssociations"
    foreach ($proto in $protocols) {
        Set-RegistryValueSafe -Path $urlAssocPath -Name $proto -Value "Zoiper5.$proto"
    }

    # Register in RegisteredApplications
    Set-RegistryValueSafe -Path "HKCU:\Software\RegisteredApplications" -Name "Zoiper5" -Value "Software\Zoiper5\Capabilities"

    Write-Host "   + Registered Zoiper application capabilities in Windows" -ForegroundColor Green

    # 5. Clear conflicting UserChoice if possible
    foreach ($proto in @("tel", "sip")) {
        $userChoicePath = "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\$proto\UserChoice"
        if (Test-Path $userChoicePath) {
            try {
                $currentProgId = (Get-ItemProperty -Path $userChoicePath -Name "ProgId" -ErrorAction SilentlyContinue).ProgId
                if ($currentProgId -and $currentProgId -notmatch "Zoiper") {
                    Write-Host "   [i] Existing Windows default for [$proto] is: $currentProgId" -ForegroundColor Yellow
                }
            } catch {}
        }
    }

    # 6. Notify the Windows shell that file and protocol associations changed
    try {
        # Trigger shell association refresh
        & "$env:SystemRoot\System32\rundll32.exe" shell32.dll,SHChangeNotify 134217728 0 0 0
    } catch {
        # Optional notification
    }
}

# --- Main Script Execution ---

Write-Banner

# Step 1: Detect Zoiper
Write-Host " [*] Searching for Zoiper installation..." -ForegroundColor Cyan
$detectedZoiper = Find-ZoiperExecutable -ExplicitPath $ZoiperPath

if (-not $detectedZoiper) {
    $detectedZoiper = Prompt-UserForZoiperPath
}

if (-not $detectedZoiper) {
    Write-Host ""
    Write-Host " [X] ERROR: Could not locate Zoiper executable." -ForegroundColor Red
    Write-Host "     Please install Zoiper 5 from https://www.zoiper.com/ and re-run this script." -ForegroundColor Yellow
    Write-Host ""
    if (-not $Silent) {
        Read-Host " Press Enter to exit"
    }
    exit 1
}

Write-Host " [OK] Located Zoiper:" -ForegroundColor Green
Write-Host "     $detectedZoiper" -ForegroundColor White
Write-Host ""

# Step 2: Register Protocols
Register-ProtocolHandlers -ExePath $detectedZoiper

Write-Host ""
Write-Host " ========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Zoiper is now registered for TEL & SIP calls!  " -ForegroundColor White -BackgroundColor DarkGreen
Write-Host " ========================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Recommended next steps:" -ForegroundColor White
Write-Host " 1. In Zoiper: Go to Settings -> Preferences -> Integrations / Automation" -ForegroundColor Gray
Write-Host "    and ensure 'Automatically dial on protocol link click' is CHECKED." -ForegroundColor Gray
Write-Host " 2. If Windows 10/11 asks you 'How do you want to open this link?'," -ForegroundColor Gray
Write-Host "    select Zoiper and check 'Always use this app'." -ForegroundColor Gray
Write-Host ""

# Step 3: Optional Windows Settings App launch for verification
if (-not $Silent) {
    $choice = Read-Host " Would you like to open Windows 'Default Apps' settings to verify? (Y/N) [default: Y]"
    if ($choice -eq "" -or $choice -match "^[yY]") {
        try {
            Start-Process "ms-settings:defaultapps"
        } catch {
            Write-Host " [!] Could not open ms-settings:defaultapps directly." -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Read-Host " Done! Press Enter to close this window"
}
