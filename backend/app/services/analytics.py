from __future__ import annotations
import json, math, sqlite3
from pathlib import Path
import numpy as np, pandas as pd
try:
 from sklearn.ensemble import IsolationForest
 from sklearn.feature_extraction.text import TfidfVectorizer
 from sklearn.metrics.pairwise import cosine_similarity
 from sklearn.preprocessing import RobustScaler
 import joblib
 SKLEARN_AVAILABLE=True
except ImportError:
 SKLEARN_AVAILABLE=False
 import pickle
from ..config import DATA_PATH,DB_PATH,MODEL_PATH,DEMO_REFERENCE_DATE,CONTAMINATION,RISK_WEIGHTS
FEATURES=['cost_overrun_percent','expenditure_ratio','progress_gap','delay_days','expenditure_per_progress_percent','peer_cost_deviation','number_of_payments']

def safe_div(a,b): return float(a)/float(b) if b and not pd.isna(b) else 0.0
def calculate_cost_overrun(estimated,revised,expenditure):
 base=float(estimated or 0); actual=max(float(revised or 0),float(expenditure or 0),base)
 return round(safe_div(actual-base,base)*100,2)
def calculate_delay(expected,status,actual=None,reference=DEMO_REFERENCE_DATE):
 if not expected or str(status).lower()=='completed': return 0
 try: return max(0,(pd.Timestamp(reference)-pd.Timestamp(expected)).days)
 except Exception:return 0
def haversine(a,b,c,d):
 r=6371; p1,p2=math.radians(a),math.radians(c); dp=math.radians(c-a); dl=math.radians(d-b)
 x=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
 return 2*r*math.asin(math.sqrt(x))
def level(s): return 'CRITICAL' if s>=80 else 'HIGH' if s>=60 else 'MEDIUM' if s>=30 else 'LOW'
def component_scores(r):
 return {'anomaly':r['anomaly_score'],'cost':min(100,max(0,r['cost_overrun_percent'])*1.25),'delay':min(100,r['delay_days']/3.65),'mismatch':min(100,max(0,r['expenditure_ratio']*100-r['completion_percentage'])*1.7),'peer':min(100,abs(r['peer_cost_deviation'])*65),'similarity':r['duplicate_similarity']}
def score_risk(r):
 c=component_scores(r); return round(sum(c[k]*RISK_WEIGHTS[k] for k in c),1)
def explanations(r):
 x=[]
 if r['cost_overrun_percent']>=20:x.append({'type':'Cost anomaly','severity':'warning','text':f"Projected/actual cost is {r['cost_overrun_percent']:.0f}% above the original estimate."})
 mismatch=r['expenditure_ratio']*100-r['completion_percentage']
 if mismatch>=20:x.append({'type':'Progress/expenditure mismatch','severity':'critical','text':f"{r['expenditure_ratio']*100:.0f}% of sanctioned funds utilized while physical progress is {r['completion_percentage']:.0f}%."})
 if r['delay_days']>30:x.append({'type':'Schedule delay','severity':'warning','text':f"Project is {r['delay_days']} days behind the expected schedule."})
 if r['peer_cost_deviation']>.35:x.append({'type':'Peer deviation','severity':'warning','text':f"Project cost is {1+r['peer_cost_deviation']:.1f}× the peer-group median."})
 if r['duplicate_similarity']>=72:x.append({'type':'Potentially Similar Work','severity':'info','text':f"Description/location similarity reaches {r['duplicate_similarity']:.0f}% with another project."})
 if not x:x.append({'type':'No major rule breach','severity':'ok','text':'Observed indicators remain near peer and schedule expectations.'})
 return x

def generate_seed(n=280):
 rng=np.random.default_rng(26102)
 locs=[('Maharashtra','Pune',18.52,73.86),('Maharashtra','Nagpur',21.15,79.09),('Uttar Pradesh','Lucknow',26.85,80.95),('Uttar Pradesh','Varanasi',25.32,82.97),('Rajasthan','Jaipur',26.91,75.79),('Rajasthan','Udaipur',24.59,73.71),('Tamil Nadu','Chennai',13.08,80.27),('Tamil Nadu','Madurai',9.93,78.12),('Karnataka','Bengaluru Urban',12.97,77.59),('Karnataka','Mysuru',12.30,76.64),('West Bengal','Kolkata',22.57,88.36),('Assam','Kamrup',26.14,91.74),('Gujarat','Ahmedabad',23.02,72.57),('Odisha','Khordha',20.19,85.82)]
 works=[('Road','Construction of cement concrete link road'),('Education','Additional classrooms and sanitation block at government school'),('Water Supply','Piped drinking water system with overhead tank'),('Health','Upgrade of primary health centre and equipment'),('Community Hall','Construction of multipurpose community hall'),('Solar Lighting','Installation of solar street lighting'),('Drainage','Storm water drain and culvert improvement'),('Sports','Development of public sports ground')]
 rows=[]
 for i in range(n):
  state,district,lat,lon=locs[i%len(locs)]; wt,desc=works[i%len(works)]
  est=float(rng.integers(12,180))*100000; progress=float(np.clip(rng.normal(72,20),8,100)); expected=float(np.clip(progress+rng.normal(5,12),20,100)); over=float(np.clip(rng.normal(6,9),-5,30)); ratio=float(np.clip(progress/100+rng.normal(.03,.09),.08,1.08)); days=int(rng.integers(280,780)); sanction=pd.Timestamp(DEMO_REFERENCE_DATE)-pd.Timedelta(days=days); expected_date=sanction+pd.Timedelta(days=int(rng.integers(240,600)))
  if i<14: over=float(rng.uniform(65,125)); progress=float(rng.uniform(18,39)); expected=float(rng.uniform(80,100)); ratio=float(rng.uniform(.82,1.04)); expected_date=pd.Timestamp(DEMO_REFERENCE_DATE)-pd.Timedelta(days=int(rng.integers(130,390)))
  elif i<50: over=float(rng.uniform(30,68)); progress=float(rng.uniform(30,58)); expected=float(rng.uniform(72,100)); ratio=float(rng.uniform(.68,.97)); expected_date=pd.Timestamp(DEMO_REFERENCE_DATE)-pd.Timedelta(days=int(rng.integers(60,240)))
  revised=est*(1+over/100); sanctioned=est*float(rng.uniform(1.00,1.10)); expenditure=sanctioned*ratio
  status='Completed' if progress>=98 else 'Delayed' if expected_date<pd.Timestamp(DEMO_REFERENCE_DATE) else 'In Progress'
  d=desc+f' in Ward {i%18+1}, {district}'
  if 50<=i<64: d=rows[i-50]['work_description']; lat=rows[i-50]['latitude']+float(rng.normal(0,.006)); lon=rows[i-50]['longitude']+float(rng.normal(0,.006))
  rows.append(dict(project_id=f'MPL-{260000+i:06d}',state=state,district=district,constituency=f'{district} Parliamentary Constituency',latitude=round(lat+float(rng.normal(0,.06)),5),longitude=round(lon+float(rng.normal(0,.06)),5),work_type=wt,work_description=d,implementing_agency=rng.choice(['District Rural Development Agency','Public Works Department','Municipal Corporation','District Education Office','Water Board']),sanctioned_amount=round(sanctioned,2),estimated_cost=round(est,2),revised_cost=round(revised,2),expenditure=round(expenditure,2),completion_percentage=round(progress,1),expected_completion_percentage=round(expected,1),sanction_date=str(sanction.date()),expected_completion_date=str(expected_date.date()),actual_completion_date=str((expected_date+pd.Timedelta(days=10)).date()) if status=='Completed' else '',number_of_payments=int(rng.integers(2,10) if i>=50 else rng.integers(10,22)),amount_last_payment=round(expenditure*float(rng.uniform(.08,.3)),2),project_status=status,beneficiary_count=int(rng.integers(300,18000))))
 df=pd.DataFrame(rows); DATA_PATH.parent.mkdir(parents=True,exist_ok=True); df.to_csv(DATA_PATH,index=False); return df

def build_pipeline(force=False):
 df=generate_seed() if force or not DATA_PATH.exists() else pd.read_csv(DATA_PATH).fillna('')
 for c in ['sanctioned_amount','estimated_cost','revised_cost','expenditure','completion_percentage','expected_completion_percentage','number_of_payments','latitude','longitude']:df[c]=pd.to_numeric(df[c],errors='coerce').fillna(0)
 df['cost_overrun_percent']=[calculate_cost_overrun(a,b,c) for a,b,c in zip(df.estimated_cost,df.revised_cost,df.expenditure)]
 df['expenditure_ratio']=[safe_div(a,b) for a,b in zip(df.expenditure,df.sanctioned_amount)]
 df['progress_gap']=(df.expected_completion_percentage-df.completion_percentage).clip(lower=0)
 df['delay_days']=[calculate_delay(a,b,c) for a,b,c in zip(df.expected_completion_date,df.project_status,df.actual_completion_date)]
 df['expenditure_per_progress_percent']=[safe_div(a*100,max(b,1)) for a,b in zip(df.expenditure_ratio,df.completion_percentage)]
 df['scale_band']=pd.qcut(df.estimated_cost,4,labels=['micro','small','medium','large'],duplicates='drop').astype(str)
 groups=df.groupby(['work_type','state','scale_band'])
 df['peer_median_cost']=groups['revised_cost'].transform('median'); df['peer_median_expenditure']=groups['expenditure'].transform('median'); df['peer_median_progress']=groups['completion_percentage'].transform('median')
 df['peer_cost_deviation']=[safe_div(a-b,b) for a,b in zip(df.revised_cost,df.peer_median_cost)]
 X=df[FEATURES].replace([np.inf,-np.inf],0).fillna(0)
 if SKLEARN_AVAILABLE:
  scaler=RobustScaler(); z=scaler.fit_transform(X); model=IsolationForest(n_estimators=240,contamination=CONTAMINATION,random_state=26102).fit(z); raw=-model.decision_function(z); ranks=pd.Series(raw).rank(pct=True)*100; df['anomaly_score']=ranks.round(1); df['anomaly_flag']=model.predict(z)==-1
  text=(df.work_type+' '+df.work_description+' '+df.district+' '+df.state).tolist(); vectorizer=TfidfVectorizer(ngram_range=(1,2),stop_words='english'); vec=vectorizer.fit_transform(text); sim=cosine_similarity(vec)
 else:
  # Development-sandbox fallback only; production/demo dependency install uses the real sklearn path above.
  z=(X-X.median())/(X.std().replace(0,1)); raw=np.sqrt((z*z).sum(axis=1)); df['anomaly_score']=(pd.Series(raw).rank(pct=True)*100).round(1); df['anomaly_flag']=df.anomaly_score>=100*(1-CONTAMINATION)
  tokens=[set(str(x).lower().split()) for x in (df.work_type+' '+df.work_description+' '+df.district+' '+df.state)]; sim=np.eye(len(df))
  for i in range(len(df)):
   for j in range(i+1,len(df)):
    v=len(tokens[i]&tokens[j])/max(1,len(tokens[i]|tokens[j]));sim[i,j]=sim[j,i]=v
 matches=[]; maxsim=[]
 for i in range(len(df)):
  opts=[]
  for j in np.argsort(sim[i])[::-1]:
   if i==j:continue
   dist=haversine(df.iloc[i].latitude,df.iloc[i].longitude,df.iloc[j].latitude,df.iloc[j].longitude); geo=max(0,1-dist/100); combined=.82*sim[i,j]+.18*geo
   opts.append({'project_id':df.iloc[j].project_id,'similarity':round(combined*100,1),'distance_km':round(dist,1),'district':df.iloc[j].district,'description':df.iloc[j].work_description,'reason':'Matching work description and nearby location' if dist<30 else 'Matching work description and work type'})
   if len(opts)==3:break
  matches.append(opts); maxsim.append(opts[0]['similarity'])
 df['duplicate_similarity']=maxsim
 df['risk_score']=[score_risk(r) for _,r in df.iterrows()]; df['risk_level']=[level(s) for s in df.risk_score]
 df['flagged_reasons']=[json.dumps(explanations(r)) for _,r in df.iterrows()]; df['similar_projects']=[json.dumps(x) for x in matches]
 MODEL_PATH.parent.mkdir(parents=True,exist_ok=True); 
 if SKLEARN_AVAILABLE: joblib.dump({'model':model,'scaler':scaler,'vectorizer':vectorizer,'features':FEATURES},MODEL_PATH)
 else: MODEL_PATH.write_bytes(pickle.dumps({'fallback':True,'features':FEATURES}))
 con=sqlite3.connect(DB_PATH); df.drop(columns=['scale_band']).to_sql('projects',con,if_exists='replace',index=False); con.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_project_id ON projects(project_id)'); con.commit(); con.close(); return df
