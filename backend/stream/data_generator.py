import random
from datetime import datetime


def generate_data():

    cpu = round(random.uniform(30, 70), 2)
    ram = round(random.uniform(40, 80), 2)
    network = round(random.uniform(10, 60), 2)

    # Occasionally generate high CPU
    if random.random() < 0.05:
        cpu = round(random.uniform(90, 100), 2)

    return {
        "timestamp": datetime.now().isoformat(),
        "cpu": cpu,
        "ram": ram,
        "network": network
    }