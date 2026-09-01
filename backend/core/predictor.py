class Predictor:

    def __init__(self, window_size=5):
        self.window_size = window_size

    def predict(self, values):

        # Not enough history yet.
        # Return the current average instead of None.
        if not values:
            return 0.0

        if len(values) < self.window_size:
            prediction = sum(values) / len(values)
            return round(prediction, 2)

        recent_values = values[-self.window_size:]

        prediction = sum(recent_values) / len(recent_values)

        return round(prediction, 2)