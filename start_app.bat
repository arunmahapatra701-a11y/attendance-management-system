@echo off
echo Starting Attendance Management System...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers are starting up... This window will close automatically.
timeout /t 3 >nul
exit
