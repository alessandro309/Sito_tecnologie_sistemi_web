import psycopg2
import datetime

conn = psycopg2.connect(dbname='retroshop_db', user='postgres', password='biar', host='localhost', port=5432)
cur = conn.cursor()

lines = []
lines.append('-- ============================================================')
lines.append('-- RetroShop DB — backup completo')
lines.append('-- Generato il: ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))
lines.append('-- ============================================================')
lines.append('')
lines.append('-- ISTRUZIONI PER IL RIPRISTINO:')
lines.append('-- 1. Crea il database:  createdb -U postgres retroshop_db')
lines.append('-- 2. Esegui il file:    psql -U postgres -d retroshop_db -f retroshop_db.sql')
lines.append('--    oppure in pgAdmin: Query Tool > Apri file > Esegui')
lines.append('-- 3. Aggiorna la password in backend/database/database.py')
lines.append('')
lines.append("SET client_encoding = 'UTF8';")
lines.append('')

tabelle = ['utenti', 'annunci', 'immagini_annuncio', 'sessioni', 'preferiti']

lines.append('-- ---- DATI ----')
lines.append('')

for t in tabelle:
    cur.execute(f'SELECT * FROM {t}')
    rows = cur.fetchall()
    col_names = [desc[0] for desc in cur.description]
    if not rows:
        lines.append(f'-- (nessun dato in {t})')
        lines.append('')
        continue
    lines.append(f'-- Tabella: {t} ({len(rows)} righe)')
    for row in rows:
        vals = []
        for v in row:
            if v is None:
                vals.append('NULL')
            elif isinstance(v, bool):
                vals.append('true' if v else 'false')
            elif isinstance(v, (int, float)):
                vals.append(str(v))
            else:
                vals.append("'" + str(v).replace("'", "''") + "'")
        lines.append(f"INSERT INTO {t} ({', '.join(col_names)}) VALUES ({', '.join(vals)});")
    lines.append('')

cur.close()
conn.close()

with open('retroshop_db.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Backup completato: retroshop_db.sql')