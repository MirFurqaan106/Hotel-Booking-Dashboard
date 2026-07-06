import sqlite3

db_path = r'd:\Personal Projects\Hotel Booking Dashboard\backend\hotel_booking.db'
conn = sqlite3.connect(db_path)
conn.execute('PRAGMA foreign_keys = OFF;')

# Fix bookings table: make user_id nullable
conn.execute("""
CREATE TABLE IF NOT EXISTS bookings_new (
    id INTEGER NOT NULL,
    booking_code VARCHAR NOT NULL,
    user_id INTEGER,
    room_id INTEGER NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    booking_status VARCHAR DEFAULT 'Pending',
    total_amount INTEGER NOT NULL,
    paid_amount INTEGER DEFAULT 0,
    payment_option VARCHAR DEFAULT 'Later',
    created_at DATETIME,
    PRIMARY KEY (id),
    UNIQUE (booking_code),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
)
""")
conn.execute('INSERT INTO bookings_new SELECT * FROM bookings')
conn.execute('DROP TABLE bookings')
conn.execute('ALTER TABLE bookings_new RENAME TO bookings')

# Fix hotels table: make manager_id nullable
conn.execute("""
CREATE TABLE IF NOT EXISTS hotels_new (
    id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    address VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    manager_id INTEGER,
    is_approved BOOLEAN DEFAULT 0,
    created_at DATETIME,
    PRIMARY KEY (id),
    UNIQUE (name),
    FOREIGN KEY (manager_id) REFERENCES users(id)
)
""")
conn.execute('INSERT INTO hotels_new SELECT * FROM hotels')
conn.execute('DROP TABLE hotels')
conn.execute('ALTER TABLE hotels_new RENAME TO hotels')

conn.execute('PRAGMA foreign_keys = ON;')
conn.commit()
conn.close()
print('Migration complete: user_id and manager_id are now nullable.')
