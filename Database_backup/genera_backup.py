import psycopg2
import datetime

DB_CONFIG = dict(dbname='retroshop_db', user='postgres', password='biar', host='localhost', port=5432)
TABELLE = ['utenti', 'annunci', 'immagini_annuncio', 'sessioni', 'preferiti']

TYPE_MAP = {
    'character varying': 'VARCHAR',
    'integer':           'INTEGER',
    'double precision':  'FLOAT',
    'boolean':           'BOOLEAN',
    'date':              'DATE',
    'timestamp without time zone': 'TIMESTAMP',
    'text':              'TEXT',
}


def fmt_value(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def get_pk_cols(cur, table):
    cur.execute("""
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema   = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name   = %s
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
    """, (table,))
    return [r[0] for r in cur.fetchall()]


def get_unique_cols(cur, table):
    cur.execute("""
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema   = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name   = %s
          AND tc.constraint_type = 'UNIQUE'
    """, (table,))
    return {r[0] for r in cur.fetchall()}


def get_fk_map(cur, table):
    """Restituisce {col_name: (ref_table, ref_col, delete_rule)} per FK a colonna singola."""
    cur.execute("""
        SELECT
            a.attname AS col,
            c2.relname AS ref_table,
            a2.attname AS ref_col,
            CASE con.confdeltype
                WHEN 'a' THEN 'NO ACTION'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'd' THEN 'SET DEFAULT'
            END AS del_rule
        FROM pg_constraint con
        JOIN pg_class c  ON c.oid  = con.conrelid
        JOIN pg_class c2 ON c2.oid = con.confrelid
        JOIN pg_attribute a  ON a.attrelid  = c.oid  AND a.attnum = con.conkey[1]
        JOIN pg_attribute a2 ON a2.attrelid = c2.oid AND a2.attnum = con.confkey[1]
        WHERE con.contype = 'f'
          AND c.relname = %s
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    """, (table,))
    return {r[0]: (r[1], r[2], r[3]) for r in cur.fetchall()}


def build_schema(cur, tabelle):
    lines = ['-- ---- SCHEMA ----', '']
    for t in tabelle:
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (t,))
        columns = cur.fetchall()

        pk_cols    = get_pk_cols(cur, t)
        unique_cols = get_unique_cols(cur, t)
        fk_map     = get_fk_map(cur, t)
        single_pk  = len(pk_cols) == 1

        col_defs = []
        for col_name, data_type, is_nullable, col_default in columns:
            is_serial = bool(col_default and 'nextval' in col_default)
            type_str  = 'SERIAL' if is_serial else TYPE_MAP.get(data_type, data_type.upper())

            col_def = f'    {col_name} {type_str}'

            if single_pk and col_name in pk_cols:
                col_def += ' PRIMARY KEY'
            if col_name in unique_cols:
                col_def += ' UNIQUE'
            if is_nullable == 'NO' and col_name not in pk_cols:
                col_def += ' NOT NULL'
            if col_default and not is_serial:
                col_def += f' DEFAULT {col_default}'
            if col_name in fk_map:
                ref_table, ref_col, del_rule = fk_map[col_name]
                col_def += f' REFERENCES {ref_table}({ref_col})'
                if del_rule and del_rule != 'NO ACTION':
                    col_def += f' ON DELETE {del_rule}'

            col_defs.append(col_def)

        if not single_pk and pk_cols:
            col_defs.append(f'    PRIMARY KEY ({", ".join(pk_cols)})')

        lines.append(f'CREATE TABLE IF NOT EXISTS {t} (')
        for i, cd in enumerate(col_defs):
            lines.append(cd + (',' if i < len(col_defs) - 1 else ''))
        lines += [');', '']
    return lines


def build_data(cur, tabelle):
    lines = ['-- ---- DATI ----', '']
    for t in tabelle:
        cur.execute(f'SELECT * FROM {t}')
        rows = cur.fetchall()
        col_names = [d[0] for d in cur.description]
        if not rows:
            lines += [f'-- (nessun dato in {t})', '']
            continue
        lines.append(f'-- Tabella: {t} ({len(rows)} righe)')
        for row in rows:
            vals = ', '.join(fmt_value(v) for v in row)
            lines.append(f"INSERT INTO {t} ({', '.join(col_names)}) VALUES ({vals});")
        lines.append('')
    return lines


def build_sequences(cur, tabelle):
    lines = ['-- ---- RESET SEQUENZE ----', '']
    cur.execute("""
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = ANY(%s)
          AND column_default LIKE 'nextval%%'
        ORDER BY table_name, ordinal_position
    """, (tabelle,))
    for table_name, col_name in cur.fetchall():
        lines.append(
            f"SELECT setval(pg_get_serial_sequence('{table_name}', '{col_name}'), "
            f"COALESCE((SELECT MAX(\"{col_name}\") FROM {table_name}), 1));"
        )
    lines.append('')
    return lines


# ---- MAIN ----
conn = psycopg2.connect(**DB_CONFIG)
cur  = conn.cursor()

header = [
    '-- ============================================================',
    '-- RetroShop DB — backup completo',
    '-- Generato il: ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
    '-- ============================================================',
    '',
    '-- ISTRUZIONI PER IL RIPRISTINO:',
    '-- 1. Crea il database:  createdb -U postgres retroshop_db',
    '-- 2. Esegui il file:    psql -U postgres -d retroshop_db -f retroshop_db.sql',
    '--    oppure in pgAdmin: Query Tool > Apri file > Esegui',
    '--    (crea le tabelle, inserisce i dati e ripristina le sequenze)',
    '-- 3. Aggiorna la password in backend/database/database.py',
    '',
    "SET client_encoding = 'UTF8';",
    '',
    'BEGIN;',
    '',
]

lines = header
lines += build_schema(cur, TABELLE)
lines += build_data(cur, TABELLE)
lines += build_sequences(cur, TABELLE)
lines += ['COMMIT;', '']

cur.close()
conn.close()

with open('retroshop_db.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Backup completato: retroshop_db.sql')
