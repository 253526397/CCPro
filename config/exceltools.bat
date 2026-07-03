@echo off
setlocal enabledelayedexpansion

set "TOOLS_DIR=D:\huangjin\workspace\excelTools"
set "PROJECT_DIR=%~dp0"
set "EXCEL_DIR=%PROJECT_DIR%excel"
set "CONFIG_FILE=%PROJECT_DIR%exceltools.config.json5"
if not exist "%CONFIG_FILE%" set "CONFIG_FILE=%TOOLS_DIR%\exceltools.config.json5"

if not exist "%EXCEL_DIR%\" (
    echo [ERROR] excel folder not found: %EXCEL_DIR%
    pause
    exit /b 1
)

cd /d "%TOOLS_DIR%"

echo ========================================
echo   exceltools
echo ========================================
echo Project: %PROJECT_DIR%
echo Config:  %CONFIG_FILE%
echo Input:   %EXCEL_DIR%
echo.

call npx tsx "%TOOLS_DIR%\bin\exceltools.ts" convert "%EXCEL_DIR%" -c "%CONFIG_FILE%"

if %errorlevel% equ 0 (
    echo Done!
) else (
    echo Conversion failed, error code: %errorlevel%
)
pause
