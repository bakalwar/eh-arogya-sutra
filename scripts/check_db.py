import sqlite3
conn = sqlite3.connect('eh-api/data/eh_arogya.db')
cursor = conn.cursor()
cursor.execute("SELECT name_english FROM diseases WHERE name_english LIKE '%Abdominal%' OR name_english LIKE '%Gastritis%' LIMIT 10")
print([r[0] for r in cursor.fetchall()])
conn.close()
