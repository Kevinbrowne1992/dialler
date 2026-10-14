@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Zoiper Protocol Handler Setup (TEL ^& SIP)
color 0B

echo.
echo  ========================================================
echo    Zoiper Protocol Handler Setup (TEL ^& SIP for Windows)
echo  ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PS1_PATH=%SCRIPT_DIR%Set-ZoiperDefaults.ps1"

:: If the PowerShell script is alongside this batch file, invoke it with ExecutionPolicy Bypass
if exist "%PS1_PATH%" (
    echo  [*] Launching PowerShell configuration engine...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1_PATH%" %*
    goto :FINISHED
)

:: -------------------------------------------------------------------------
:: STANDALONE FALLBACK MODE:
:: (Used if the user downloaded ONLY this .bat file without the .ps1 script)
:: -------------------------------------------------------------------------
echo  [*] Running in standalone mode...
echo  [*] Searching for Zoiper installation...

set "ZOIPER_EXE="

:: 1. Check standard 64-bit and 32-bit Program Files
if exist "%ProgramFiles%\Zoiper5\Zoiper5.exe" set "ZOIPER_EXE=%ProgramFiles%\Zoiper5\Zoiper5.exe"
if not defined ZOIPER_EXE if exist "%ProgramFiles(x86)%\Zoiper5\Zoiper5.exe" set "ZOIPER_EXE=%ProgramFiles(x86)%\Zoiper5\Zoiper5.exe"
if not defined ZOIPER_EXE if exist "%ProgramW6432%\Zoiper5\Zoiper5.exe" set "ZOIPER_EXE=%ProgramW6432%\Zoiper5\Zoiper5.exe"
if not defined ZOIPER_EXE if exist "%LOCALAPPDATA%\Programs\Zoiper5\Zoiper5.exe" set "ZOIPER_EXE=%LOCALAPPDATA%\Programs\Zoiper5\Zoiper5.exe"
if not defined ZOIPER_EXE if exist "%APPDATA%\Zoiper5\Zoiper5.exe" set "ZOIPER_EXE=%APPDATA%\Zoiper5\Zoiper5.exe"
if not defined ZOIPER_EXE if exist "%ProgramFiles%\Zoiper\zoiper.exe" set "ZOIPER_EXE=%ProgramFiles%\Zoiper\zoiper.exe"
if not defined ZOIPER_EXE if exist "%ProgramFiles(x86)%\Zoiper\zoiper.exe" set "ZOIPER_EXE=%ProgramFiles(x86)%\Zoiper\zoiper.exe"
if not defined ZOIPER_EXE if exist "%LOCALAPPDATA%\Programs\Zoiper\zoiper.exe" set "ZOIPER_EXE=%LOCALAPPDATA%\Programs\Zoiper\zoiper.exe"

:: 2. Check Windows App Paths in Registry
if not defined ZOIPER_EXE (
    for /f "tokens=2* delims=	 " %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Zoiper5.exe" /ve 2^>nul') do (
        if exist "%%B" set "ZOIPER_EXE=%%B"
    )
)
if not defined ZOIPER_EXE (
    for /f "tokens=2* delims=	 " %%A in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Zoiper5.exe" /ve 2^>nul') do (
        if exist "%%B" set "ZOIPER_EXE=%%B"
    )
)

:: 3. Prompt user if still not found
if not defined ZOIPER_EXE (
    echo.
    echo  [!] Zoiper was not found in standard installation paths.
    echo      Please enter the full path to your Zoiper5.exe or zoiper.exe:
    echo      (e.g. C:\Program Files\Zoiper5\Zoiper5.exe)
    echo.
    set /p "USER_ZOIPER=Path: "
    set "USER_ZOIPER=!USER_ZOIPER:"=!"
    if exist "!USER_ZOIPER!" (
        set "ZOIPER_EXE=!USER_ZOIPER!"
    )
)

if not defined ZOIPER_EXE (
    color 0C
    echo.
    echo  [X] ERROR: Could not locate Zoiper executable.
    echo      Please install Zoiper 5 from https://www.zoiper.com/ and re-run.
    echo.
    pause
    exit /b 1
)

color 0A
echo  [OK] Located Zoiper: "!ZOIPER_EXE!"
echo.
echo  [*] Registering Windows protocol handlers (HKCU)...

:: Configure tel: protocol
reg add "HKCU\Software\Classes\tel" /ve /t REG_SZ /d "URL:TEL Protocol" /f >nul
reg add "HKCU\Software\Classes\tel" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\tel" /v "FriendlyTypeName" /t REG_SZ /d "Zoiper Telephony Protocol" /f >nul
reg add "HKCU\Software\Classes\tel\DefaultIcon" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\",0" /f >nul
reg add "HKCU\Software\Classes\tel\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
echo    + Configured [tel] protocol -^> Zoiper

:: Configure sip: protocol
reg add "HKCU\Software\Classes\sip" /ve /t REG_SZ /d "URL:SIP Protocol" /f >nul
reg add "HKCU\Software\Classes\sip" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\sip" /v "FriendlyTypeName" /t REG_SZ /d "Zoiper SIP Protocol" /f >nul
reg add "HKCU\Software\Classes\sip\DefaultIcon" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\",0" /f >nul
reg add "HKCU\Software\Classes\sip\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
echo    + Configured [sip] protocol -^> Zoiper

:: Configure callto: protocol
reg add "HKCU\Software\Classes\callto" /ve /t REG_SZ /d "URL:CALLTO Protocol" /f >nul
reg add "HKCU\Software\Classes\callto" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\callto\DefaultIcon" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\",0" /f >nul
reg add "HKCU\Software\Classes\callto\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
echo    + Configured [callto] protocol -^> Zoiper

:: Configure zoiper: protocol
reg add "HKCU\Software\Classes\zoiper" /ve /t REG_SZ /d "URL:ZOIPER Protocol" /f >nul
reg add "HKCU\Software\Classes\zoiper" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\zoiper\DefaultIcon" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\",0" /f >nul
reg add "HKCU\Software\Classes\zoiper\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
echo    + Configured [zoiper] protocol -^> Zoiper

:: Register Zoiper ProgIDs for Windows 10/11 Default Apps catalog
reg add "HKCU\Software\Classes\Zoiper5.tel\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
reg add "HKCU\Software\Classes\Zoiper5.sip\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
reg add "HKCU\Software\Classes\Zoiper5.callto\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
reg add "HKCU\Software\Classes\Zoiper.tel\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul
reg add "HKCU\Software\Classes\Zoiper.sip\shell\open\command" /ve /t REG_SZ /d "\"!ZOIPER_EXE!\" \"%%1\"" /f >nul

:: Register Application Capabilities
reg add "HKCU\Software\Zoiper5\Capabilities" /v "ApplicationName" /t REG_SZ /d "Zoiper5" /f >nul
reg add "HKCU\Software\Zoiper5\Capabilities" /v "ApplicationDescription" /t REG_SZ /d "Zoiper VoIP Softphone" /f >nul
reg add "HKCU\Software\Zoiper5\Capabilities\URLAssociations" /v "tel" /t REG_SZ /d "Zoiper5.tel" /f >nul
reg add "HKCU\Software\Zoiper5\Capabilities\URLAssociations" /v "sip" /t REG_SZ /d "Zoiper5.sip" /f >nul
reg add "HKCU\Software\Zoiper5\Capabilities\URLAssociations" /v "callto" /t REG_SZ /d "Zoiper5.callto" /f >nul
reg add "HKCU\Software\Zoiper5\Capabilities\URLAssociations" /v "zoiper" /t REG_SZ /d "Zoiper5.zoiper" /f >nul
reg add "HKCU\Software\RegisteredApplications" /v "Zoiper5" /t REG_SZ /d "Software\Zoiper5\Capabilities" /f >nul
echo    + Registered Zoiper application capabilities in Windows

:: Refresh Windows Shell Associations
rundll32.exe shell32.dll,SHChangeNotify 134217728 0 0 0 >nul 2>&1

echo.
echo  ========================================================
echo   SUCCESS! Zoiper is now registered for TEL ^& SIP calls!
echo  ========================================================
echo.
echo  Recommended next steps:
echo  1. In Zoiper: Settings -^> Preferences -^> Integrations / Automation
echo     and ensure "Automatically dial on protocol link click" is CHECKED.
echo  2. If Windows asks "How do you want to open this link?",
echo     select Zoiper and check "Always use this app".
echo.

set /p "OPEN_SETTINGS=Would you like to open Windows Default Apps settings to verify? (Y/N) [default: Y]: "
if /i not "!OPEN_SETTINGS!"=="n" (
    start ms-settings:defaultapps
)

:FINISHED
echo.
echo Done! Press any key to close this window.
pause >nul
exit /b 0
