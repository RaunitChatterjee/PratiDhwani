"""
PratiDhwani
------------
Prediction API
"""

import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException

from backend.schemas.response import PredictionResponse
from backend.services.prediction_service import PredictionService

router = APIRouter()

prediction_service = PredictionService()


@router.post(
    "/predict",
    response_model=PredictionResponse,
)
async def predict(file: UploadFile = File(...)):

    allowed_extensions = {".wav", ".flac"}

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only .wav and .flac files are supported.",
        )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension,
    ) as temp_file:

        shutil.copyfileobj(
            file.file,
            temp_file,
        )

        temp_path = temp_file.name

    result = prediction_service.predict(
        temp_path,
    )

    Path(temp_path).unlink(missing_ok=True)

    return PredictionResponse(
        prediction=result["prediction"],
        confidence=result["confidence"] * 100,
        bonafide=result["probabilities"]["bonafide"] * 100,
        spoof=result["probabilities"]["spoof"] * 100,
    )