from pathlib import Path
BASE_DIR=Path(__file__).resolve().parents[1]
DB_PATH=BASE_DIR/'mplads.db'
DATA_PATH=BASE_DIR/'data'/'seed_projects.csv'
MODEL_PATH=BASE_DIR/'ml'/'isolation_forest.joblib'
DEMO_REFERENCE_DATE='2026-08-31'
CONTAMINATION=0.18
RISK_WEIGHTS={'anomaly':.30,'cost':.20,'delay':.15,'mismatch':.20,'peer':.10,'similarity':.05}
