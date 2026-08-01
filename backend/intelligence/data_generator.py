import numpy as np
import pandas as pd
import os

def generate_dummy_gps_data(num_records=10000):
    """
    Generate synthetic GPS data for training models.
    """
    np.random.seed(42)
    
    # Simulate rides
    ride_ids = np.random.randint(1, 100, num_records)
    user_ids = np.random.randint(1, 50, num_records)
    
    # Base location (Hyderabad)
    base_lat = 17.3850
    base_lon = 78.4867
    
    lats = base_lat + np.random.normal(0, 0.1, num_records)
    lons = base_lon + np.random.normal(0, 0.1, num_records)
    
    speeds = np.random.exponential(30, num_records)
    speeds = np.clip(speeds, 0, 150)
    
    # Add fake stops (speed < 3 for duration > 3)
    is_stop = speeds < 3
    
    # Separation features
    dist_to_leader = np.abs(np.random.normal(50, 1000, num_records)) # meters
    separated = dist_to_leader > 2000 # 2km threshold
    
    df = pd.DataFrame({
        'ride_id': ride_ids,
        'user_id': user_ids,
        'latitude': lats,
        'longitude': lons,
        'speed_kmh': speeds,
        'is_stop': is_stop.astype(int),
        'dist_to_leader': dist_to_leader,
        'is_separated': separated.astype(int),
        'hour_of_day': np.random.randint(0, 24, num_records),
        'day_of_week': np.random.randint(0, 7, num_records)
    })
    
    os.makedirs('intelligence/data', exist_ok=True)
    df.to_csv('intelligence/data/dummy_gps_data.csv', index=False)
    print(f"Generated {num_records} dummy GPS records.")

if __name__ == "__main__":
    generate_dummy_gps_data()
