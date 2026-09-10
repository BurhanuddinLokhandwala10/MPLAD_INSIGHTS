from contextlib import asynccontextmanager
import json,sqlite3
from fastapi import FastAPI,HTTPException,Query
from fastapi.middleware.cors import CORSMiddleware
from .database import connect
from .config import DB_PATH
from .services.analytics import build_pipeline

def clean(row):
 d=dict(row)
 for k in ('flagged_reasons','similar_projects'):
  try:d[k]=json.loads(d.get(k) or '[]')
  except:d[k]=[]
 return d
@asynccontextmanager
async def lifespan(app):
 if not DB_PATH.exists():build_pipeline(True)
 yield
app=FastAPI(title='MPLADS INSIGHT API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_origin_regex=r'https://([a-z0-9-]+\.)*vercel\.app',allow_methods=['*'],allow_headers=['*'])
@app.get('/api/health')
def health():return {'status':'healthy','service':'MPLADS INSIGHT','demo_mode':True}
@app.get('/api/projects')
def projects(page:int=1,page_size:int=Query(25,le=200),search:str='',state:str='',district:str='',work_type:str='',risk_level:str='',delayed:bool|None=None,cost_overrun:bool|None=None,anomaly_flag:bool|None=None,similar_work:bool|None=None,sort:str='risk_score',order:str='desc'):
 wh=[];args=[]
 for col,val in [('state',state),('district',district),('work_type',work_type),('risk_level',risk_level)]:
  if val:wh.append(f'{col}=?');args.append(val)
 if search:wh.append('(project_id LIKE ? OR work_description LIKE ? OR district LIKE ?)');args += [f'%{search}%']*3
 if delayed is not None:wh.append('delay_days>0' if delayed else 'delay_days=0')
 if cost_overrun is not None:wh.append('cost_overrun_percent>=20' if cost_overrun else 'cost_overrun_percent<20')
 if anomaly_flag is not None:wh.append('anomaly_flag=?');args.append(int(anomaly_flag))
 if similar_work is not None:wh.append('duplicate_similarity>=72' if similar_work else 'duplicate_similarity<72')
 clause=' WHERE '+' AND '.join(wh) if wh else ''; allowed={'risk_score','delay_days','cost_overrun_percent','project_id','expenditure','completion_percentage'}; sort=sort if sort in allowed else 'risk_score'; order='ASC' if order.lower()=='asc' else 'DESC'
 c=connect();total=c.execute('SELECT count(*) FROM projects'+clause,args).fetchone()[0];rows=c.execute(f'SELECT * FROM projects{clause} ORDER BY {sort} {order} LIMIT ? OFFSET ?',args+[page_size,(page-1)*page_size]).fetchall();c.close();return {'items':[clean(x) for x in rows],'total':total,'page':page,'page_size':page_size}
def getone(pid):
 c=connect();r=c.execute('SELECT * FROM projects WHERE project_id=?',(pid,)).fetchone();c.close()
 if not r:raise HTTPException(404,'Project not found')
 return clean(r)
@app.get('/api/projects/{project_id}')
def project(project_id:str):return getone(project_id)
@app.get('/api/projects/{project_id}/similar')
def similar(project_id:str):return getone(project_id)['similar_projects']
@app.get('/api/projects/{project_id}/explain')
def explain(project_id:str):
 p=getone(project_id);return {'project_id':project_id,'risk_score':p['risk_score'],'reasons':p['flagged_reasons'],'disclaimer':'An anomaly is not proof of fraud. Human review is required.'}
@app.get('/api/statistics')
def stats():
 c=connect();one=c.execute; out={'total_projects':one('select count(*) from projects').fetchone()[0],'flagged_projects':one('select count(*) from projects where anomaly_flag=1 or risk_score>=60').fetchone()[0],'high_critical':one("select count(*) from projects where risk_level in ('HIGH','CRITICAL')").fetchone()[0],'delayed_projects':one('select count(*) from projects where delay_days>0').fetchone()[0],'high_cost_overrun':one('select count(*) from projects where cost_overrun_percent>=30').fetchone()[0],'similar_works':one('select count(*) from projects where duplicate_similarity>=72').fetchone()[0]};out['risk_distribution']=[dict(x) for x in one('select risk_level name,count(*) value from projects group by risk_level').fetchall()];out['projects_by_state']=[dict(x) for x in one('select state name,count(*) value from projects group by state order by value desc').fetchall()];out['by_work_type']=[dict(x) for x in one('select work_type name,round(avg(cost_overrun_percent),1) avg_overrun,sum(case when anomaly_flag=1 then 1 else 0 end) anomalies from projects group by work_type').fetchall()];out['delays_by_district']=[dict(x) for x in one('select district name,round(avg(delay_days),0) value from projects group by district order by value desc limit 10').fetchall()];c.close();return out
@app.get('/api/risk-summary')
def risk_summary():return projects(page_size=100,sort='risk_score')['items']
@app.get('/api/alerts')
def alerts():
 ps=projects(page_size=20,sort='risk_score')['items'];return [{'id':f'A-{i+1:03}','project_id':p['project_id'],'level':p['risk_level'],'title':p['flagged_reasons'][0]['type'],'message':p['flagged_reasons'][0]['text'],'district':p['district']} for i,p in enumerate(ps)]
@app.get('/api/map-points')
def map_points(risk_level:str=''):
 c=connect();q='select project_id,latitude,longitude,state,district,work_type,risk_score,risk_level,completion_percentage,cost_overrun_percent from projects';a=[]
 if risk_level:q+=' where risk_level=?';a=[risk_level]
 rows=[dict(x) for x in c.execute(q,a).fetchall()];c.close();return rows
@app.post('/api/model/retrain')
def retrain():
 d=build_pipeline(False);return {'status':'retrained','projects':len(d)}
