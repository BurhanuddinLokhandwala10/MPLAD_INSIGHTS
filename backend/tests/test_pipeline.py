from app.services.analytics import calculate_cost_overrun,calculate_delay,score_risk,build_pipeline
from app.main import app
from fastapi.testclient import TestClient
import pytest
@pytest.fixture(scope='session',autouse=True)
def seed():build_pipeline(True)
def test_cost_overrun():assert calculate_cost_overrun(100,150,130)==50
def test_zero_cost():assert calculate_cost_overrun(0,10,20)==0
def test_delay():assert calculate_delay('2026-08-01','Delayed')==30
def test_risk_score():
 r=dict(anomaly_score=90,cost_overrun_percent=80,delay_days=180,expenditure_ratio=.9,completion_percentage=30,peer_cost_deviation=.8,duplicate_similarity=85)
 assert 70<=score_risk(r)<=100
def test_api_health():assert TestClient(app).get('/api/health').status_code==200
def test_project_retrieval():
 c=TestClient(app); pid=c.get('/api/projects?page_size=1').json()['items'][0]['project_id']; assert c.get('/api/projects/'+pid).json()['project_id']==pid
def test_statistics():assert TestClient(app).get('/api/statistics').json()['total_projects']>=250
def test_similarity():
 d=build_pipeline(False); assert d.duplicate_similarity.max()>80
