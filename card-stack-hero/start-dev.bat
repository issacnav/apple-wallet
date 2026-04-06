@echo off
cd /d "C:\apple wallet\card-stack-hero"
if "%PORT%"=="" set PORT=5173
npm run dev -- --port %PORT%
