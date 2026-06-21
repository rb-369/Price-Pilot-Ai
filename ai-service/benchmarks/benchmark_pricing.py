import time
import sys
import os
from statistics import mean, median

# Add parent dir to path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.pricing import optimize_price

def generate_mock_data(num_items):
    data = []
    for i in range(num_items):
        product = {
            "name": f"Product {i}",
            "currentPrice": 1000 + (i * 10),
            "baseCost": 800 + (i * 8),
            "stockLevel": 100,
            "reorderThreshold": 20,
            "minMargin": 0.1
        }
        competitors = [
            {"price": product["currentPrice"] * 0.95, "inStock": True},
            {"price": product["currentPrice"] * 1.05, "inStock": True}
        ]
        demand = [
            {"compositeDemandScore": 0.6, "searchTrendScore": 60}
        ] * 14
        data.append((product, competitors, demand))
    return data

def run_benchmark(num_items=1000):
    print(f"Generating {num_items} mock products for benchmark...")
    mock_data = generate_mock_data(num_items)
    
    print("Running pricing engine benchmark...")
    
    # Warmup
    optimize_price(*mock_data[0])
    
    times = []
    start_time_total = time.perf_counter()
    
    for item in mock_data:
        start = time.perf_counter()
        optimize_price(*item)
        end = time.perf_counter()
        times.append((end - start) * 1000) # Convert to ms
        
    end_time_total = time.perf_counter()
    total_time = end_time_total - start_time_total
    
    print("\n--- Benchmark Results ---")
    print(f"Total Items Processed : {num_items}")
    print(f"Total Time Taken      : {total_time:.4f} seconds")
    print(f"Throughput            : {num_items / total_time:.2f} items/sec")
    print("\n--- Per Item Latency ---")
    print(f"Average               : {mean(times):.4f} ms")
    print(f"Median                : {median(times):.4f} ms")
    print(f"Min                   : {min(times):.4f} ms")
    print(f"Max                   : {max(times):.4f} ms")
    
if __name__ == "__main__":
    run_benchmark(1000)
