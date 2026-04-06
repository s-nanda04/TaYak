#!/bin/bash
export PYTHONPATH="/Users/shreyan/Desktop/Tamid/TaYak/TaYak/backend/venv/lib/python3.9/site-packages"
exec /usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
