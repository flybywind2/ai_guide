"""
다른 PC에서 실행: 데이터만 SQL로 내보내기
"""
import sqlite3

conn = sqlite3.connect('data/app.db')
cursor = conn.cursor()

with open('data_export.sql', 'w', encoding='utf-8') as f:
    # Stories 데이터
    f.write("-- Stories\n")
    cursor.execute("SELECT * FROM stories")
    for row in cursor.fetchall():
        f.write(f"INSERT OR REPLACE INTO stories VALUES {row};\n")
    
    # Passages 데이터
    f.write("\n-- Passages\n")
    cursor.execute("SELECT * FROM passages")
    for row in cursor.fetchall():
        f.write(f"INSERT OR REPLACE INTO passages VALUES {row};\n")
    
    # Links 데이터
    f.write("\n-- Links\n")
    cursor.execute("SELECT * FROM links")
    for row in cursor.fetchall():
        f.write(f"INSERT OR REPLACE INTO links VALUES {row};\n")

conn.close()
print("✅ data_export.sql 생성 완료")
