import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from model.trainer import train_and_save
train_and_save(verbose=True)
