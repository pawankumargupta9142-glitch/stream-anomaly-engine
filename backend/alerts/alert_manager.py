import logging
from pathlib import Path

from collections import deque


class AlertManager:
	def __init__(self, max_items=50):
		self.alerts = deque(maxlen=max_items)

	def record(self, event):
		if event["is_anomaly"]:
			alert = {"timestamp": event["timestamp"], "value": event["value"], "z_score": event["z_score"]}
			self.alerts.appendleft(alert)
			return alert
		return None

	def recent(self):
		return list(self.alerts)
# Get backend folder path
BASE_DIR = Path(__file__).resolve().parent.parent

# Logs folder
LOG_DIR = BASE_DIR / "logs"

# Create logs folder if it doesn't exist
LOG_DIR.mkdir(exist_ok=True)

# Log file path
LOG_FILE = LOG_DIR / "anomalies.log"


# Configure logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.WARNING,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


class AlertManager:

    def create_alert(self, data):

        if not data.get("anomaly"):
            return None

        alert = {
            "message": "Anomaly detected!",
            "timestamp": data["timestamp"],
            "cpu": data["cpu"],
            "anomaly_score": data["anomaly_score"]
        }

        logging.warning(
            f"ANOMALY DETECTED | "
            f"CPU: {data['cpu']} | "
            f"Score: {data['anomaly_score']}"
        )


class AlertManager:

    def __init__(self):
        self.alerts = []

    def add_alert(self, value, message):

        alert = {
            "value": value,
            "message": message
        }

        self.alerts.append(alert)

        return alert

    def get_alerts(self):
        return self.alerts
      