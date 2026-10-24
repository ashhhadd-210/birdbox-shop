@echo off
title Hollow ^& Home - birdbox shop
cd /d "%~dp0"
echo Starting the Hollow ^& Home storefront...
echo.
echo   Storefront   http://localhost:4700
echo   Orders desk  http://localhost:4700/admin.html
echo.
echo Press Ctrl+C to stop the server.
echo.
start "" http://localhost:4700
node server.js
pause
