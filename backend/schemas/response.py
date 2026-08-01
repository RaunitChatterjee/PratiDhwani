"""
PratiDhwani
------------
Response schemas.
"""

from pydantic import BaseModel


class PredictionResponse(BaseModel):

    prediction: str
    confidence: float

    bonafide: float
    spoof: float