"""
PratiDhwani
-----------
AASIST model adapter.

Wraps the official AASIST architecture used by PratiDhwani's
multi-model deepfake detection ensemble.

The official AASIST evaluation pipeline expects a mono waveform of
64,600 samples. This adapter matches the official evaluation padding
behavior:

    - Audio shorter than 64,600 samples is repeated until long enough.
    - Audio longer than 64,600 samples is truncated to the first
      64,600 samples.
    - No additional waveform normalization is applied.

The adapter converts the official AASIST output into PratiDhwani's
standard prediction contract.
"""

from pathlib import Path
from typing import Any, Dict

import numpy as np
import soundfile as sf
import torch
import torch.nn.functional as F

from backend.models.base_model import BaseModel


class AasistModel(BaseModel):

    name = "aasist"
    is_implemented = True

    SAMPLE_RATE = 16000
    NUM_SAMPLES = 64600

    def __init__(
        self,
        checkpoint_path: str = "ml/checkpoints/aasist/AASIST.pth",
    ):
        from backend.models.aasist.AASIST import Model

        self.checkpoint_path = Path(checkpoint_path)

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        if not self.checkpoint_path.exists():
            raise FileNotFoundError(
                f"AASIST checkpoint not found: {self.checkpoint_path}"
            )

        # Official AASIST configuration.
        model_config = {
            "architecture": "AASIST",
            "nb_samp": self.NUM_SAMPLES,
            "first_conv": 128,
            "filts": [
                70,
                [1, 32],
                [32, 32],
                [32, 64],
                [64, 64],
            ],
            "gat_dims": [64, 32],
            "pool_ratios": [0.5, 0.7, 0.5, 0.5],
            "temperatures": [2.0, 2.0, 100.0, 100.0],
        }

        self.model = Model(model_config)

        checkpoint = torch.load(
            self.checkpoint_path,
            map_location=self.device,
        )

        # Official checkpoints may either be a raw state_dict
        # or contain the state_dict under the "state_dict" key.
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint

        # Handle checkpoints saved using DataParallel.
        state_dict = {
            key.removeprefix("module."): value
            for key, value in state_dict.items()
        }

        self.model.load_state_dict(
            state_dict,
            strict=True,
        )

        self.model.to(self.device)
        self.model.eval()

    @staticmethod
    def _load_audio(audio_path: str) -> np.ndarray:
        """
        Load audio and convert it to mono 16 kHz.

        AASIST's official ASVspoof2019 evaluation data is already
        16 kHz, so resampling is only needed for external audio.
        """
        waveform, sample_rate = sf.read(
            audio_path,
            dtype="float32",
        )

        # Convert stereo/multi-channel audio to mono.
        if waveform.ndim > 1:
            waveform = np.mean(
                waveform,
                axis=1,
            )

        waveform = waveform.astype(
            np.float32,
            copy=False,
        )

        # Resample non-16-kHz audio.
        if sample_rate != AasistModel.SAMPLE_RATE:
            waveform_tensor = torch.from_numpy(
                waveform
            ).unsqueeze(0)

            target_length = round(
                len(waveform)
                * AasistModel.SAMPLE_RATE
                / sample_rate
            )

            waveform_tensor = F.interpolate(
                waveform_tensor.unsqueeze(0),
                size=target_length,
                mode="linear",
                align_corners=False,
            ).squeeze(0).squeeze(0)

            waveform = waveform_tensor.numpy()

        return waveform

    @classmethod
    def _prepare_waveform(
        cls,
        waveform: np.ndarray,
    ) -> torch.Tensor:
        """
        Match the official AASIST data_utils.pad() behavior.

        Official implementation:

            if x_len >= max_len:
                return x[:max_len]

            num_repeats = int(max_len / x_len) + 1
            padded_x = np.tile(x, (1, num_repeats))[:, :max_len][0]

        Therefore:

        - Long audio: first 64,600 samples.
        - Short audio: repeat the complete waveform.
        - No center crop.
        - No peak normalization.
        """
        waveform = np.asarray(
            waveform,
            dtype=np.float32,
        )

        if waveform.size == 0:
            raise ValueError(
                "Cannot run AASIST inference on empty audio."
            )

        if waveform.size >= cls.NUM_SAMPLES:
            waveform = waveform[: cls.NUM_SAMPLES]

        else:
            repeat_count = (
                int(cls.NUM_SAMPLES / waveform.size) + 1
            )

            waveform = np.tile(
                waveform,
                repeat_count,
            )[: cls.NUM_SAMPLES]

        return torch.from_numpy(
            waveform.astype(
                np.float32,
                copy=False,
            )
        ).unsqueeze(0)

    @torch.inference_mode()
    def predict(
        self,
        audio_path: str,
    ) -> Dict[str, Any]:
        """
        Run AASIST inference and return PratiDhwani's
        standard prediction contract.
        """
        waveform = self._load_audio(
            audio_path
        )

        waveform_tensor = self._prepare_waveform(
            waveform
        ).to(self.device)

        output = self.model(
            waveform_tensor
        )

        # Official AASIST Model.forward() returns:
        #
        #     last_hidden, output
        #
        if isinstance(output, tuple):
            output = output[1]

        # Convert the two output logits to probabilities.
        probabilities = torch.softmax(
            output,
            dim=-1,
        )[0]

        # Official AASIST class ordering:
        #
        #   class 0 -> spoof
        #   class 1 -> bonafide
        #
        # The official evaluation code uses:
        #
        #     batch_out[:, 1]
        #
        # as the bona-fide/positive score.
        spoof_probability = float(
            probabilities[0].item()
        )

        bonafide_probability = float(
            probabilities[1].item()
        )

        prediction = (
            "spoof"
            if spoof_probability >= bonafide_probability
            else "bonafide"
        )

        confidence = max(
            spoof_probability,
            bonafide_probability,
        )

        return {
            "prediction": prediction,
            "confidence": confidence,
            "probabilities": {
                "bonafide": bonafide_probability,
                "spoof": spoof_probability,
            },
        }