@echo off
setlocal enabledelayedexpansion

REM Set the directory of the current batch file
set "BAT_DIR=%~dp0"
REM Set the project directory (up two levels)
for %%i in ("%~dp0..\..") do set "PROJECT_DIR=%%~fi"
REM Set the workspace directory (up three levels)
for %%i in ("%~dp0..\..\..") do set "WORK_SPACE_DIR=%%~fi"
REM Set the tools directory
set "TOOLS_DIR=%WORK_SPACE_DIR%\excelTools"
REM Set the Excel directory
set "EXCEL_DIR=%WORK_SPACE_DIR%\excel"
REM Set the config JSON output directory
set "OUTPUT_JSON_DIR=%PROJECT_DIR%\assets\resources\config"
REM Set the code output directory
set "OUTPUT_CODE_DIR=%PROJECT_DIR%\assets\scripts\config"
REM Set the Excel project config file path
set "CONFIG_FILE=%BAT_DIR%exceltools.config.json5"
REM Check if config file exists, if not, fallback to the default config
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
echo Output(json): %OUTPUT_JSON_DIR%
echo Output(code): %OUTPUT_CODE_DIR%
echo.

call npx tsx "%TOOLS_DIR%\bin\exceltools.ts" convert "%EXCEL_DIR%" --json-output "%OUTPUT_JSON_DIR%" --code-output "%OUTPUT_CODE_DIR%" -c "%CONFIG_FILE%"

if %errorlevel% equ 0 (
    echo Done!
) else (
    echo Conversion failed, error code: %errorlevel%
)
pause
