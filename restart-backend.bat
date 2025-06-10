@echo off
echo Restarting Åby Whisky Club Backend...
echo.

echo Stopping containers...
docker-compose down

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Backend restarted! 
echo Check at: http://localhost:3001/api/health
echo.
pause