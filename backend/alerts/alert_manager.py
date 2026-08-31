import logging
from pathlib import Path


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
    """Manages anomaly alerts for the stream analytics engine."""

    def __init__(self):
        self.alerts = []

    def add_alert(self, value, message):
        """Add a new alert to the list."""
        alert = {
            "value": value,
            "message": message
        }

        self.alerts.append(alert)

        logging.warning(
            f"ALERT: {message} | Value: {value}"
        )

        return alert

    def get_alerts(self):
        """Get all current alerts."""
        return self.alerts
      