import sqlite3
c = sqlite3.connect('eh-api/data/eh_arogya.db')
total = c.execute('SELECT COUNT(*) FROM diseases').fetchone()[0]
cats = c.execute('SELECT category, COUNT(*) FROM diseases GROUP BY category ORDER BY COUNT(*) DESC').fetchall()
print(f'Total diseases: {total}')
for cat in cats[:10]: print(f'  {cat[0]}: {cat[1]}')
c.close()
