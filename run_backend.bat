@echo off
cd backend
echo Starting Backend...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Please ensure it is created in 'backend/venv'
    pause
    exit /b
)
python -m uvicorn main:app --reload
pause
