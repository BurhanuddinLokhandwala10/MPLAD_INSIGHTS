# MPLADS INSIGHT implementation plan

## Architecture
- FastAPI + SQLite repository; deterministic seed CSV imported at startup.
- Analytics pipeline: feature engineering → peer grouping → IsolationForest → TF-IDF/geospatial similarity → transparent weighted score → explanations.
- React/Vite TypeScript SPA consuming versioned local API contracts; responsive shell with eight routes.

## Development order
1. Seed realistic data and implement calculations/repository.
2. Train/persist model and similarity artifacts; expose typed APIs.
3. Build shared frontend shell, risk primitives, charts, map, tables, and investigation console.
4. Run unit/API tests, frontend build, live smoke checks, and visual QA.

## Database/schema
A single `projects` table stores source and derived fields; JSON text stores reasons and similar matches. Repository boundary allows later PostgreSQL/PostGIS replacement.

## ML pipeline
RobustScaler + IsolationForest (fixed random state, configurable contamination); TF-IDF cosine similarity blended with haversine proximity; six-component configurable risk score.

## API contract
Health, statistics, searchable/paginated projects, project detail/similar/explain, risk summary, alerts, map points, model retraining.

## Dependencies
Python: FastAPI, Pydantic, Pandas, NumPy, scikit-learn, joblib, pytest/httpx. Frontend: React, Vite, TypeScript, Tailwind, Lucide, Recharts, React Router, Leaflet/react-leaflet.
