@echo off
title Push Sigma Education to GitHub
echo ========================================================
echo Pushing Sigma Education changes to GitHub...
echo Target: https://github.com/mansurihaarish1-star/sigma-dashboard.git
echo Branch: main
echo ========================================================
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main --force

echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Changes pushed successfully to GitHub!
) else (
    echo [FAILED] Push failed. If prompted, please authorize GitHub in your browser.
)
echo ========================================================
pause
