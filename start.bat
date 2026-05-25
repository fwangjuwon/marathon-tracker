@echo off
chcp 65001 > nul
echo.
echo  마라톤 트래커 시작 중...
echo.

:: 백엔드 (Python FastAPI)
start "백엔드 - FastAPI" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

:: 프론트엔드 (Vite + React)
start "프론트엔드 - Vite" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo  백엔드:      http://localhost:8000
echo  프론트엔드:  http://localhost:5173
echo  API 문서:    http://localhost:8000/docs
echo.
