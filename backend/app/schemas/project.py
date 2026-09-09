from pydantic import BaseModel,ConfigDict
from typing import Any
class Project(BaseModel):
 model_config=ConfigDict(extra='allow')
 project_id:str; state:str; district:str; work_type:str; work_description:str; risk_score:float; risk_level:str
class ProjectList(BaseModel):
 items:list[dict[str,Any]]; total:int; page:int; page_size:int
