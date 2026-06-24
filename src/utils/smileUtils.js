/**
 * smileUtils.js — Smile detection using MediaPipe FaceBlendshapes.
 *
 * Uses ML-learned blendshape coefficients for accurate smile detection.
 *
 * CATATAN KALIBRASI:
 * Nilai blendshape MediaPipe untuk orang nyata (bukan model) pada senyum wajar
 * biasanya berkisar 0.10–0.45. Nilai > 0.5 hanya dicapai saat senyum sangat lebar.
 * Oleh karena itu normalisasi dilakukan terhadap "realistic max" = 0.45,
 * bukan 1.0 (yang tidak pernah tercapai dalam kondisi normal).
 */

// Realistic max raw score untuk senyum — nilai di atas ini dianggap "excellent"
const REALISTIC_MAX = 0.45;

/**
 * Classify smile score (0-100) into a human-readable status & DB kategori.
 *
 * 0-24   → No Smile    → "Kurang Senyum"
 * 25-44  → Sedikit     → "Kurang Senyum"
 * 45-64  → Normal      → "Netral"
 * 65-84  → Good Smile  → "Senyum"
 * 85-100 → Excellent   → "Senyum"
 */
export function classifySmile(score) {
  if (score < 25) return { status: "No Smile", kategori: "Kurang Senyum" };
  if (score < 45) return { status: "Sedikit Senyum", kategori: "Kurang Senyum" };
  if (score < 65) return { status: "Senyum Normal", kategori: "Netral" };
  if (score < 85) return { status: "Senyum Baik", kategori: "Senyum" };
  return { status: "Senyum Sangat Baik", kategori: "Senyum" };
}

/**
 * MovingAverage — smoothing buffer untuk stabilisasi score.
 * Window 3 frame (lebih responsif dari sebelumnya yang 5 frame).
 */
export class MovingAverage {
  constructor(windowSize = 3) {
    this.windowSize = windowSize;
    this.buffer = [];
  }

  update(value) {
    this.buffer.push(value);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
  }

  reset() {
    this.buffer = [];
  }

  get current() {
    if (this.buffer.length === 0) return 0;
    return this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
  }
}

/**
 * Extract a blendshape score by category name.
 *
 * @param {Array} blendshapes - Array of { categoryName, score }
 * @param {string} name - Blendshape category name
 * @returns {number} Score 0.0 - 1.0, or 0 if not found
 */
function getBlendshapeScore(blendshapes, name) {
  const entry = blendshapes.find((b) => b.categoryName === name);
  return entry ? entry.score : 0;
}

/**
 * Calculate smile score from FaceBlendshapes (ML-learned coefficients).
 *
 * Blendshapes yang digunakan:
 *   - mouthSmileLeft/Right  (55%) — sudut mulut terangkat (primary indicator)
 *   - cheekSquintLeft/Right (25%) — pipi naik = Duchenne smile (genuine smile marker)
 *   - mouthDimpleLeft/Right (15%) — lesung pipi saat senyum
 *   - mouthStretchLeft/Right (5%) — bibir melebar
 *
 * Normalisasi: rawScore dipetakan ke realistic max (0.45), bukan 1.0.
 * Senyum wajar (~0.20 raw) → ~44% score (Normal range).
 * Senyum lebar (~0.35 raw) → ~78% score (Good Smile range).
 *
 * @param {Array} blendshapes - FaceLandmarker blendshapes[0].categories
 * @returns {Object} { rawScore (0-1), normalizedScore (0-100) }
 */
export function calculateSmileFromBlendshapes(blendshapes) {
  if (!blendshapes || blendshapes.length === 0) {
    return { rawScore: 0, normalizedScore: 0 };
  }

  // Primary: sudut mulut naik
  const mouthSmileL = getBlendshapeScore(blendshapes, "mouthSmileLeft");
  const mouthSmileR = getBlendshapeScore(blendshapes, "mouthSmileRight");

  // Secondary: pipi naik (Duchenne marker = senyum tulus)
  const cheekSquintL = getBlendshapeScore(blendshapes, "cheekSquintLeft");
  const cheekSquintR = getBlendshapeScore(blendshapes, "cheekSquintRight");

  // Tertiary: lesung pipi
  const dimpleL = getBlendshapeScore(blendshapes, "mouthDimpleLeft");
  const dimpleR = getBlendshapeScore(blendshapes, "mouthDimpleRight");

  // Quaternary: bibir melebar
  const stretchL = getBlendshapeScore(blendshapes, "mouthStretchLeft");
  const stretchR = getBlendshapeScore(blendshapes, "mouthStretchRight");

  const mouthSmile   = (mouthSmileL + mouthSmileR) / 2;
  const cheekSmile   = (cheekSquintL + cheekSquintR) / 2;
  const dimpleSmile  = (dimpleL + dimpleR) / 2;
  const stretchSmile = (stretchL + stretchR) / 2;

  // Weighted combination
  const rawScore =
    mouthSmile   * 0.55 +
    cheekSmile   * 0.25 +
    dimpleSmile  * 0.15 +
    stretchSmile * 0.05;

  // Normalisasi terhadap realistic max (bukan 1.0 yang tidak realistis)
  // rawScore 0.45 → 100%, rawScore 0.20 → ~44%
  const normalized = rawScore / REALISTIC_MAX;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, normalized * 100)));

  return { rawScore, normalizedScore };
}

/**
 * Process FaceLandmarker results into a complete smile detection result.
 *
 * @param {Object} result - FaceLandmarker result
 * @param {MovingAverage} scoreSmoother
 * @returns {Object} Smile detection result for DB storage
 */
export function processSmileResult(result, scoreSmoother) {
  if (
    !result.faceLandmarks ||
    result.faceLandmarks.length === 0 ||
    !result.faceBlendshapes ||
    result.faceBlendshapes.length === 0
  ) {
    scoreSmoother.update(0);
    return {
      face_detected: false,
      smile_score: Math.round(scoreSmoother.current),
      status: "No Smile",
      kategori: "Kurang Senyum",
      confidence: 0,
    };
  }

  const blendshapes = result.faceBlendshapes[0].categories;
  const { normalizedScore } = calculateSmileFromBlendshapes(blendshapes);

  const smoothedScore = Math.round(scoreSmoother.update(normalizedScore));
  const { status, kategori } = classifySmile(smoothedScore);

  return {
    face_detected: true,
    smile_score: smoothedScore,
    status,
    kategori,
    confidence: 95,
    landmarks: result.faceLandmarks[0], // for skeleton drawing
  };
}

/**
 * Process FaceDetector results for customer detection.
 *
 * @param {Object} result - FaceDetector result
 * @returns {Object} Customer detection result
 */
export function processCustomerResult(result) {
  if (!result.detections || result.detections.length === 0) {
    return {
      customer_detected: false,
      confidence: 0,
      bounding_box: null,
    };
  }

  // Use highest-confidence detection
  const best = result.detections.reduce((a, b) =>
    (b.categories?.[0]?.score ?? 0) > (a.categories?.[0]?.score ?? 0) ? b : a
  );

  const confidence = Math.round((best.categories?.[0]?.score ?? 0) * 100);
  const bbox = best.boundingBox;

  return {
    customer_detected: true,
    confidence,
    bounding_box: bbox
      ? {
          x: Math.round(bbox.originX),
          y: Math.round(bbox.originY),
          w: Math.round(bbox.width),
          h: Math.round(bbox.height),
        }
      : null,
  };
}
