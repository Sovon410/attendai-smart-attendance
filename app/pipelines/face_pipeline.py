import io
import math
from typing import List, Optional, Tuple

import dlib
import face_recognition_models
import numpy as np
from PIL import Image


# Global singletons for dlib models.
_detector = None
_shape_predictor = None
_face_encoder = None


def _get_models():
    """Lazy-load dlib landmark and ResNet face recognition models."""
    global _detector, _shape_predictor, _face_encoder
    
    if _detector is None:
        _detector = dlib.get_frontal_face_detector()
        _shape_predictor = dlib.shape_predictor(
            face_recognition_models.pose_predictor_model_location()
        )
        _face_encoder = dlib.face_recognition_model_v1(
            face_recognition_models.face_recognition_model_location()
        )
    return _detector, _shape_predictor, _face_encoder


def load_image_from_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """Read binary image data (JPEG, PNG, JPG, WebP) into an RGB numpy array.
    Returns None if decoding fails or data is corrupted.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        return np.array(image)
    except Exception:
        return None


def extract_face_embedding(image_bytes: bytes) -> Optional[List[float]]:
    """Detect the primary face in an image and return its 128-d descriptor vector.
    Returns None if no face is detected in the image or image cannot be decoded.
    """
    if not image_bytes:
        return None
    detector, shape_predictor, face_encoder = _get_models()
    img_array = load_image_from_bytes(image_bytes)
    if img_array is None:
        return None
    
    faces = detector(img_array, 1)
    if not faces:
        return None
    
    # Pick the largest face if multiple faces are present.
    largest_face = max(faces, key=lambda rect: rect.width() * rect.height())
    
    # Compute 68 landmarks & 128-dimensional embedding.
    shape = shape_predictor(
        img_array,
        largest_face
    )
    face_descriptor = face_encoder.compute_face_descriptor(
        img_array,
        shape,
        num_jitters=1
    )
    return [float(v) for v in face_descriptor]


def compute_face_distance(
    embedding1: List[float],
    embedding2: List[float]
) -> float:
    """Calculate Euclidean distance between two 128-d face embeddings."""
    if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
        return 1.0
    v1 = np.array(embedding1, dtype=np.float64)
    v2 = np.array(embedding2, dtype=np.float64)
    
    return float(np.linalg.norm(v1 - v2))
    v1 = np.array(embedding1, dtype=np.float64)
    v2 = np.array(embedding2, dtype=np.float64)
    
    return float(np.linalg.norm(v1 - v2))


def compare_faces(
    known_embedding: List[float],
    candidate_embedding: List[float],
    threshold: float = 0.6
) -> Tuple[bool, float]:
    """Compare candidate embedding against registered embedding.
    
    Uses calibrated logistic sigmoid centered at the threshold to calculate
    a realistic probabilistic match confidence score.
    
    Returns:
        (is_match, calibrated_confidence_between_0_and_1)
    """
    distance = compute_face_distance(
        known_embedding,
        candidate_embedding
    )
    is_match = distance <= threshold
    
    # Calibrated probability using a stable logistic function:
    # At distance = threshold (0.6): confidence = 0.50 (boundary)
    # At distance = 0.40: confidence ~ 0.83
    # At distance = 0.30: confidence ~ 0.92
    # At distance = 0.80: confidence ~ 0.17
    k = 8.0
    exponent = max(-20.0, min(20.0, k * (distance - threshold)))
    confidence = 1.0 / (1.0 + math.exp(exponent))
        
    return bool(is_match), float(round(confidence, 4))

