"""
PratiDhwani - Global Project Configuration
------------------------------------------
All project paths and global settings are defined here.
"""

from pathlib import Path
import torch

# =============================================================================
# PROJECT ROOT
# =============================================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# =============================================================================
# DATASET PATHS
# =============================================================================

DATASETS_ROOT = Path.home() / "Desktop" / "Datasets"

ASVSPOOF_ROOT = DATASETS_ROOT / "ASVspoof2019"
WAVEFAKE_ROOT = DATASETS_ROOT / "WaveFake"
CODESWITCH_ROOT = DATASETS_ROOT / "CodeSwitched"

# =============================================================================
# PROJECT DIRECTORIES
# =============================================================================

ML_DIR = PROJECT_ROOT / "ml"

CHECKPOINT_DIR = ML_DIR / "checkpoints"
FEATURE_DIR = ML_DIR / "features"
RESULT_DIR = ML_DIR / "results"

# =============================================================================
# RANDOMNESS
# =============================================================================

RANDOM_SEED = 42

# =============================================================================
# HARDWARE
# =============================================================================

DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

# =============================================================================
# AUDIO
# =============================================================================

SAMPLE_RATE = 16000

# =============================================================================
# TRAINING
# =============================================================================

BATCH_SIZE = 2
NUM_WORKERS = 0
LEARNING_RATE = 1e-5
NUM_EPOCHS = 1

# =============================================================================
# MODEL
# =============================================================================

BASE_MODEL = "facebook/wav2vec2-base"

MAX_AUDIO_LENGTH = 16000 * 10

# =============================================================================
# CREATE PROJECT DIRECTORIES
# =============================================================================

CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
FEATURE_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)