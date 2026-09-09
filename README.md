# MPLADS INSIGHT

**AI-Powered Project Anomaly & Risk Intelligence Platform** — a complete SIH26102-aligned decision-support prototype that prioritises unusual MPLADS-style projects for human review. It never equates an anomaly with fraud.

## Architecture
`React/Vite UI → FastAPI → SQLite repository → Pandas feature pipeline → RobustScaler + IsolationForest / TF-IDF cosine similarity → explainable weighted score`

The core demo uses 280 deterministic synthetic/curated records and requires no external data service. OpenStreetMap tiles are used when internet is available; all analytical features work without them.

## Tech stack
- React, Vite, TypeScript, Tailwind CSS, Lucide, Recharts, React Router, Leaflet/react-leaflet
- Python, FastAPI, Pydantic, Pandas, NumPy, scikit-learn, SQLite

## AI methodology
1. Safely derive cost overrun, progress gap, delay, expenditure ratio, and expenditure/progress mismatch.
2. Build peers using work type + state + cost scale; calculate medians and deviations.
3. Robust-scale seven numeric indicators and train a deterministic IsolationForest (`random_state=26102`). Percentile-transform model decisions into a judge-friendly anomaly score.
4. Use TF-IDF (unigrams/bigrams) and cosine similarity, blended with haversine proximity, to surface **Potentially Similar Work**.
5. Produce a documented 0–100 score: anomaly 30%, cost 20%, delay 15%, mismatch 20%, peer deviation 10%, similarity 5%.
6. Render concrete evidence and require human review.

The model artifact is persisted in `backend/ml/isolation_forest.joblib`. The SQLite table contains source and derived fields. `app/services/analytics.py` is the main pipeline; the repository boundary can later move to PostgreSQL/PostGIS.

## Install and run (Windows PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.services.analytics  # optional; API seeds automatically
python run.py
```
In a second PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. No credentials or authentication are required.

### macOS/Linux
```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python run.py
# second terminal
cd frontend && npm install && npm run dev
```

## Single startup workflow
After dependencies are installed, run `start.ps1` from the repository root on Windows. It opens both services. On macOS/Linux use `./start.sh`.

## Tests and production build
```powershell
cd backend; pytest -q
cd ..\frontend; npm run build
```

## API
- `GET /api/health`
- `GET /api/statistics`
- `GET /api/projects` — pagination, search, filters, sorting
- `GET /api/projects/{project_id}`
- `GET /api/projects/{project_id}/similar`
- `GET /api/projects/{project_id}/explain`
- `GET /api/risk-summary`
- `GET /api/alerts`
- `GET /api/map-points`
- `POST /api/model/retrain`
- Interactive docs: `http://localhost:8000/docs`

## 90-second demo
1. Open Command Center and point out total/priority counts.
2. Open Risk Explorer and choose rank #1.
3. Show the score, evidence, peer comparison, and similar works.
4. Open GIS Map and locate risk clusters.
5. End on Methodology: “The system does not replace an auditor. It helps an auditor decide where to look first.”

## Data structure
The project entity includes identifiers, geography, work/agency, sanction/estimate/revision/expenditure, progress/schedule/payments/status/beneficiaries, plus every requested derived metric, risk classification, reasons, and similar matches. Seed generation covers normal, delayed, overrun, expenditure/progress mismatch, unusual-payment, duplicate-like, and geographic-cluster examples.

## Live data adapter
`backend/app/services/data_source.py` defines the future ingestion boundary. Replace its seeded implementation with an authorised official/open MPLADS adapter; keep analytics independent of transport.

## Limitations
- Synthetic demo data is not an official MPLADS dataset.
- Risk weights and contamination are prototype settings, not government standards.
- Similarity indicates leads, not confirmed duplicate work.
- Map basemap tiles need network access; markers/filters and all analysis remain local.
- No authentication/RBAC/audit log in this 48-hour prototype.

## Next steps
Validate thresholds with domain officers; add signed source lineage, RBAC/audit logs, scheduled ingestion, PostgreSQL/PostGIS, model monitoring, district-specific calibration, document evidence, and field-verification workflow.
