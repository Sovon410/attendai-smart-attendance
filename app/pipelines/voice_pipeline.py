import io
import subprocess
from typing import List, Optional, Tuple

import librosa
import numpy as np
from resemblyzer import VoiceEncoder
import soundfile as sf

_voice_encoder = None


def _get_encoder() -> VoiceEncoder:
    """Lazy-load the Resemblyzer voice encoder model."""
    global _voice_encoder
    if _voice_encoder is None:
        _voice_encoder = VoiceEncoder()
    return _voice_encoder


def _decode_with_ffmpeg(audio_bytes: bytes, target_sr: int = 16000) -> np.ndarray:
    """Fallback decoder using FFmpeg to convert arbitrary audio (WebM, Opus, MP3, AAC, OGG) to 16kHz mono PCM."""
    proc = subprocess.run(
        [
            "ffmpeg",
            "-v", "error",
            "-i", "pipe:0",
            "-f", "wav",
            "-ar", str(target_sr),
            "-ac", "1",
            "pipe:1"
        ],
        input=audio_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
        timeout=15
    )
    wav, sr = sf.read(io.BytesIO(proc.stdout), dtype="float32")
    return wav


def preprocess_audio(
    audio_byts: bytes,
    target_sr: int = 16000
) -> np.ndarray:
    """Load and normalize audio waveform from bytes, converting to 16kHz mono.
    
    Supports WAV, WebM, Opus, MP3, OGG, and AAC formats.
    """
    if not audio_byts:
        raise ValueError("Audio data is empty.")

    try:
        wav, sr = librosa.load(io.BytesIO(audio_byts), sr=target_sr, mono=True)
    except Exception:
        # Fallback to FFmpeg transcoding for WebM / Opus / browser MediaRecorder blobs
        wav = _decode_with_ffmpeg(audio_byts, target_sr=target_sr)

    # Trim leading and trailing silence
    trimmed, _ = librosa.effects.trim(wav, top_db=20)
    return trimmed


def extract_voice_embedding(audio_bytes: bytes) -> Optional[List[float]]:
    """Extract 256-dimensional d-vector voice embedding from audio bytes.
    
    Returns None if the audio is empty, too short, or format is unrecognized.
    """
    if not audio_bytes or len(audio_bytes) < 64:
        return None

    try:
        wav = preprocess_audio(audio_bytes)
    except Exception:
        return None

    if wav is None or len(wav) < 1600:
        return None
    
    try:
        encoder = _get_encoder()
        embedding = encoder.embed_utterance(wav)
        return [float(v) for v in embedding]
    except Exception:
        return None


def compare_voices(
    known_embedding: List[float],
    candidate_embedding: List[float],
    threshold: float = 0.75
) -> Tuple[bool, float]:
    """Compute cosine similarity between two voice embeddings.
    
    Returns:
        (is_match, similarity_score_between_0_and_1)
    """
    if not known_embedding or not candidate_embedding or len(known_embedding) != len(candidate_embedding):
        return False, 0.0

    v1 = np.array(
        known_embedding,
        dtype=np.float64
    )
    v2 = np.array(
        candidate_embedding,
        dtype=np.float64
    )
    
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0.0 or norm2 == 0:
        return False, 0.0
    
    cosine_similarity = float(np.dot(v1, v2) / (norm1 * norm2))
    
    # Clip between 0.0 and 1.0 for clean confidence
    score = max(0.0, min(1.0, cosine_similarity))
    is_match = score >= threshold
    
    return bool(is_match), float(round(score, 4))