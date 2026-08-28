import statistics


class AnomalyDetector:

    def __init__(self, threshold=2.5):
        self.threshold = threshold

    def detect(self, values, current_value):

        if len(values) < 10:
            return False, 0

        mean = statistics.mean(values)

        standard_deviation = statistics.stdev(values)

        if standard_deviation == 0:
            return False, 0

        z_score = abs(
            (current_value - mean)
            / standard_deviation
        )

        is_anomaly = z_score > self.threshold

        return is_anomaly, round(z_score, 2)