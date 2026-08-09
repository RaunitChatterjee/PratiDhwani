"""
PratiDhwani
------------
Prediction API
"""

import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.core.config import Settings, get_settings
from backend.core.dependencies import get_prediction_service
from backend.core.logging_config import get_logger
from backend.core.upload_validation import is_valid_audio_signature, safe_temp_suffix
from backend.schemas.response import PredictionResponse
from backend.services.prediction_service import PredictionService

router = APIRouter()

logger = get_logger("pratidhwani.api.predict")


@router.post(
    "/predict",
    response_model=PredictionResponse,
)
async def predict(
    file: UploadFile = File(...),
    prediction_service: PredictionService = Depends(get_prediction_service),
    settings: Settings = Depends(get_settings),
):
    extension = Path(file.filename or "").suffix.lower()

    if extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail="Only .wav and .flac files are supported.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    temp_path = None
    safe_suffix = safe_temp_suffix(extension)

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=safe_suffix,
        ) as temp_file:

            total_bytes = 0
            first_chunk = True
            # Stream in chunks and enforce the size cap while writing,
            # rather than buffering the whole upload before checking —
            # this avoids holding an oversized file fully in memory.
            while chunk := await file.read(1024 * 1024):
                if first_chunk:
                    if not is_valid_audio_signature(extension, chunk[:12]):
                        raise HTTPException(
                            status_code=400,
                            detail="File content doesn't match a valid .wav or .flac file.",
                        )
                    first_chunk = False

                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {settings.max_upload_size_mb} MB upload limit.",
                    )
                temp_file.write(chunk)

            temp_path = temp_file.name

        if total_bytes == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        try:
            result = prediction_service.predict(temp_path)
        except HTTPException:
            raise
        except Exception:
            logger.exception("prediction_error", extra={"uploaded_filename": file.filename})
            raise HTTPException(
                status_code=500,
                detail="The inference engine encountered an error while analyzing this recording.",
            )

        return PredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"] * 100,
            bonafide=result["probabilities"]["bonafide"] * 100,
            spoof=result["probabilities"]["spoof"] * 100,
        )

    finally:
        # Always clean up the temp file, including on validation errors
        # and inference failures — not just the success path.
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
        await file.close()
