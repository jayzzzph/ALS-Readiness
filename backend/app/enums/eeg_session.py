from enum import Enum


class EEGSessionType(str, Enum):
    BASELINE = "baseline"
    EXPOSED = "exposed"
    