@echo off
cd /d "%~dp0"
title FloraLux Flower Shop Server

start http://localhost:8080
start http://localhost:8080/admin

node server.js
if %errorlevel% neq 0 (
    echo.
    echo Server stopped with error.
    pause
)
