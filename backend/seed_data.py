import os
import uuid
import random
from datetime import datetime, timedelta
import psycopg

DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/analytics_db"

def seed_data():
    now = datetime.now()
    days_to_seed = 180
    start_date = now - timedelta(days=days_to_seed)
    
    visitors = []
    # Generate 500 unique visitors
    for _ in range(500):
        visitors.append({
            "id": str(uuid.uuid4()),
            "first_seen": start_date + timedelta(days=random.randint(0, days_to_seed)),
        })
        
    print(f"Connecting to database...")
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            # 1. Insert visitors
            print(f"Inserting {len(visitors)} visitors...")
            for v in visitors:
                cur.execute(
                    """
                    INSERT INTO analytics_visitors (visitor_id, first_seen_at, last_seen_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING;
                    """,
                    (v["id"], v["first_seen"], v["first_seen"])
                )
                
            # 2. Generate visits per day
            print(f"Inserting visits for the last {days_to_seed} days...")
            total_visits = 0
            paths = ["/", "/#about", "/#github", "/#music"]
            
            for day_offset in range(days_to_seed + 1):
                current_date = start_date + timedelta(days=day_offset)
                
                # Realistic trend: more visits on weekends, some random spikes
                base_visits = random.randint(5, 20)
                if current_date.weekday() >= 5: # Weekend
                    base_visits += random.randint(10, 30)
                
                # Random spike
                if random.random() < 0.05: # 5% chance of a spike
                    base_visits += random.randint(30, 80)
                    
                visits_for_day = base_visits
                total_visits += visits_for_day
                
                for _ in range(visits_for_day):
                    visitor = random.choice(visitors)
                    # Visit time is randomly distributed throughout the day
                    visit_time = current_date + timedelta(
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59),
                        seconds=random.randint(0, 59)
                    )
                    
                    cur.execute(
                        """
                        INSERT INTO analytics_visits (idempotency_key, visitor_id, path, created_at)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                        """,
                        (str(uuid.uuid4()), visitor["id"], random.choice(paths), visit_time)
                    )
            
            print(f"Inserted ~{total_visits} visits.")
            
            # 3. Generate some track listens
            print(f"Inserting track listens...")
            total_listens = int(total_visits * 0.4) # ~40% of visits result in a listen
            tracks = [
                ("track-1", "Cyberpunk City"),
                ("track-2", "Neon Drive"),
                ("track-3", "Midnight Run"),
                ("track-4", "Digital Horizon")
            ]
            
            for _ in range(total_listens):
                visitor = random.choice(visitors)
                listen_time = start_date + timedelta(
                    days=random.randint(0, days_to_seed),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                track = random.choice(tracks)
                
                cur.execute(
                    """
                    INSERT INTO analytics_track_listens (idempotency_key, visitor_id, track_id, track_title, listened_seconds, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                    """,
                    (str(uuid.uuid4()), visitor["id"], track[0], track[1], random.randint(30, 300), listen_time)
                )
            
            print(f"Inserted ~{total_listens} track listens.")
            conn.commit()

if __name__ == "__main__":
    seed_data()
    print("Done! 🎉")
