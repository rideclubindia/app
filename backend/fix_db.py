import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
db_url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

try:
    cur.execute('ALTER TABLE public.navigation_sessions ALTER COLUMN user_id TYPE text;')
    print('Changed navigation_sessions user_id to text.')
    cur.execute('ALTER TABLE public.navigation_sessions ADD CONSTRAINT navigation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL;')
    print('Added correct constraint.')
except Exception as e:
    print('Error:', e)
