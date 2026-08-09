"""
PratiDhwani
------------
Upload validation beyond file extension — checks the actual file
signature (magic bytes) so a renamed arbitrary file can't masquerade as
a .wav or .flac. This runs before the file ever reaches the ML pipeline;
it doesn't touch audio decoding, preprocessing, or inference at all.
"""

WAV_MAGIC = b"RIFF"
WAV_FORMAT = b"WAVE"
FLAC_MAGIC = b"fLaC"


def is_valid_audio_signature(extension: str, header_bytes: bytes) -> bool:
    """
    `header_bytes` should be at least the first 12 bytes of the file.
    Returns False for anything that doesn't match the expected container
    signature for its claimed extension.
    """
    extension = extension.lower()

    if extension == ".wav":
        return (
            len(header_bytes) >= 12
            and header_bytes[0:4] == WAV_MAGIC
            and header_bytes[8:12] == WAV_FORMAT
        )

    if extension == ".flac":
        return len(header_bytes) >= 4 and header_bytes[0:4] == FLAC_MAGIC

    return False


def safe_temp_suffix(extension: str) -> str:
    """
    Whitelists the temp-file suffix to exactly the two known-good
    extensions, regardless of what the client claims — defense against
    path/suffix injection via a crafted filename.
    """
    normalized = extension.lower()
    return normalized if normalized in {".wav", ".flac"} else ".bin"
