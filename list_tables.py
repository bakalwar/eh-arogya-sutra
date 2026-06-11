import sqlite3
c = sqlite3.connect('data/electrohomeopathy.db')
cursor = c.execute('SELECT name FROM sqlite_master WHERE type="table"')
for row in cursor.fetchall():
    print(row)
c.close()
