from datetime import datetime, timezone

from core.anomaly_detector import AnomalyDetector
from core.memory_manager import MemoryManager
from stream.data_generator import DataGenerator


class StreamProcessor:
	def __init__(self):
		self.detector = AnomalyDetector()
		self.memory = MemoryManager()
		self.generator = DataGenerator()

	def process(self, value=None):
		value = self.generator.next_value() if value is None else float(value)
		result = self.detector.inspect(value)
		result["timestamp"] = datetime.now(timezone.utc).isoformat()
		self.memory.add(result)
		return result

	def recent(self, limit=60):
		return self.memory.recent(limit)
