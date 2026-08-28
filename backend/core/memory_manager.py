from collections import deque


class MemoryManager:

    def __init__(self, window_size=100):
        self.window = deque(maxlen=window_size)

    def add_data(self, data):
        self.window.append(data)

    def get_data(self):
        return list(self.window)

    def get_size(self):
        return len(self.window)

    def clear(self):
        self.window.clear()