import sqlite3
from .config import DB_PATH
def connect():
 c=sqlite3.connect(DB_PATH); c.row_factory=sqlite3.Row; return c
