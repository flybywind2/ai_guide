@echo off
REM AI Guide Database Backup Script
REM Usage: backup_db.bat

echo ========================================
echo AI Guide Database Backup
echo ========================================
echo.

cd /d %~dp0..

REM Create backups directory if not exists
if not exist "backups" mkdir backups

REM Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Backup filename
set BACKUP_FILE=backups\app_backup_%TIMESTAMP%.db

REM Check if source DB exists
if not exist "data\app.db" (
    echo [ERROR] Database file not found: data\app.db
    echo Please check if the database exists.
    pause
    exit /b 1
)

REM Create backup
echo [INFO] Creating backup...
echo Source: data\app.db
echo Target: %BACKUP_FILE%
echo.

copy data\app.db %BACKUP_FILE% >nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backup created successfully!
    echo.
    echo File: %BACKUP_FILE%

    REM Show file size
    for %%A in (%BACKUP_FILE%) do (
        set size=%%~zA
        set /a size_mb=!size! / 1048576
    )
    echo Size: %size% bytes
    echo.

    REM List recent backups
    echo Recent backups:
    dir /B /O-D backups\app_backup_*.db | findstr /N "^" | findstr "^[1-5]:"
    echo.

    REM Optional: Copy to USB if available
    if exist "E:\backups" (
        echo [INFO] USB drive detected. Copying to E:\backups...
        copy %BACKUP_FILE% E:\backups\ >nul
        if %ERRORLEVEL% EQU 0 (
            echo [SUCCESS] Backup copied to USB!
        ) else (
            echo [WARNING] Failed to copy to USB
        )
    )
) else (
    echo [ERROR] Backup failed!
    echo Error code: %ERRORLEVEL%
)

echo.
echo ========================================
pause
