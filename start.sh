#!/usr/bin/env bash
(cd backend && source .venv/bin/activate && python run.py) &
(cd frontend && npm run dev) &
wait
