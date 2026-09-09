from pathlib import Path
import pandas as pd
from ..config import DATA_PATH
class ProjectDataSource:
    def load_projects(self): return pd.read_csv(DATA_PATH)
    def refresh_projects(self):
        # TODO: connect an authorised official/open MPLADS adapter here.
        return self.load_projects()
