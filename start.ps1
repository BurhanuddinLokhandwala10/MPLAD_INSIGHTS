Start-Process powershell -ArgumentList '-NoExit','-Command','cd backend; .\.venv\Scripts\Activate.ps1; python run.py'
Start-Process powershell -ArgumentList '-NoExit','-Command','cd frontend; npm run dev'
