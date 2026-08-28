class Predictor:

    def __init__(self, window_size=5):
        self.window_size = window_size

    def predict(self, values):

        if len(values) < self.window_size:
            return None

        recent_values = values[-self.window_size:]

        prediction = sum(recent_values) / len(recent_values)

        return round(prediction, 2)