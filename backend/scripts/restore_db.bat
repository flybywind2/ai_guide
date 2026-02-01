@echo off
REM AI Guide Database Restore Script
REM Usage: restore_db.bat

echo ========================================
echo AI Guide Database Restore
echo ========================================
echo.

cd /d %~dp0..

REM Check if backups exist
if not exist "backups\" (
    echo [ERROR] Backups directory not found!
    echo Please create backups first using backup_db.bat
    pause
    exit /b 1
)

REM List available backups
echo Available backups:
echo.
dir /B /O-D backups\app_backup_*.db | findstr /N "^"
echo.

REM Ask user to select backup
set /p BACKUP_NUM="Enter backup number to restore (or 'q' to quit): "

if /i "%BACKUP_NUM%"=="q" (
    echo Restore cancelled.
    pause
    exit /b 0
)

REM Get the selected backup file
for /f "tokens=1* delims=:" %%A in ('dir /B /O-D backups\app_backup_*.db ^| findstr /N "^" ^| findstr "^%BACKUP_NUM%:"') do (
    set BACKUP_FILE=%%B
)

if "%BACKUP_FILE%"=="" (
    echo [ERROR] Invalid backup number!
    pause
    exit /b 1
)

set FULL_BACKUP_PATH=backups\%BACKUP_FILE%

echo.
echo Selected backup: %BACKUP_FILE%
echo.

REM Confirm restore
set /p CONFIRM="Are you sure you want to restore this backup? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

REM Create safety backup of current DB
echo.
echo [INFO] Creating safety backup of current database...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
copy data\app.db backups\app_before_restore_%TIMESTAMP%.db >nul

REM Restore backup
echo [INFO] Restoring database...
copy /Y %FULL_BACKUP_PATH% data\app.db >nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database restored successfully!
    echo.
    echo Restored from: %BACKUP_FILE%
    echo Safety backup: backups\app_before_restore_%TIMESTAMP%.db
) else (
    echo.
    echo [ERROR] Restore failed!
    echo Your current database is safe.
)

echo.
echo ========================================
pause
