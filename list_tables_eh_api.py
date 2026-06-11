import sqlite3
c = sqlite3.connect('eh-api/data/eh_arogya.db')
cursor = c.execute('SELECT name FROM sqlite_master WHERE type="table"')
for row in cursor.fetchall():
    print(row)
c.close()
