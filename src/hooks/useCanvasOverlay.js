import { useCallback, useEffect, useRef } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * FACE_MESH_TESSELATION_INDICES
 *
 * MediaPipe face mesh tessellation connections — a subset of the full 468 landmarks
 * forming triangles that create the wireframe skeleton effect.
 * We use FaceLandmarker.FACE_LANDMARKS_TESSELATION for the full set.
 */

const DRAW_INTERVAL_MS = 33; // ~30 FPS drawing

/**
 * useCanvasOverlay — Draws AI detection overlays on a canvas positioned over a video.
 *
 * Teller camera: face mesh skeleton wireframe (green lines connecting landmarks)
 * Nasabah camera: bounding box around detected customer
 *
 * @param {Object} options
 * @param {React.RefObject} options.canvasRef — Reference to <canvas> element
 * @param {React.RefObject} options.videoRef — Reference to <video> element
 * @param {"teller"|"nasabah"} options.type — Camera type
 * @param {Object|null} options.data — Detection data from useAIDetection
 * @param {boolean} options.enabled — Whether overlay drawing is active
 */
export function useCanvasOverlay({ canvasRef, videoRef, type, data, enabled }) {
  const dataRef = useRef(data);
  const intervalRef = useRef(null);

  // Keep data ref in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /**
   * Draw teller overlay: face mesh skeleton wireframe.
   *
   * MediaPipe landmarks are NORMALIZED (0.0–1.0).
   * We draw directly in canvas pixel coordinates: landmark.x * canvasW, landmark.y * canvasH
   * No setTransform scaling needed — canvas is already sized to match the display.
   */
  const drawTellerOverlay = useCallback((ctx, cw, ch, currentData) => {
    ctx.clearRect(0, 0, cw, ch);

    if (!currentData?.face_detected || !currentData?.landmarks) return;

    const landmarks = currentData.landmarks;

    // ── Face mesh tessellation (full wireframe skeleton) ──────────────
    const connections = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
    ctx.strokeStyle = "rgba(0, 255, 128, 0.22)";
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    for (const connection of connections) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!start || !end) continue;
      // Landmarks are normalized → multiply by canvas display size
      ctx.moveTo(start.x * cw, start.y * ch);
      ctx.lineTo(end.x * cw, end.y * ch);
    }
    ctx.stroke();

    // ── Face oval contour (more visible) ──────────────────────────────
    const contourConnections = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
    ctx.strokeStyle = "rgba(0, 255, 200, 0.65)";
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    for (const connection of contourConnections) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!start || !end) continue;
      ctx.moveTo(start.x * cw, start.y * ch);
      ctx.lineTo(end.x * cw, end.y * ch);
    }
    ctx.stroke();

    // ── Lip contour (color changes based on smile score) ──────────────
    const isSmiling = currentData.smile_score > 50;
    const lipColor = isSmiling
      ? "rgba(0, 255, 100, 0.9)"
      : "rgba(255, 120, 100, 0.75)";

    const lipConnections = FaceLandmarker.FACE_LANDMARKS_LIPS;
    ctx.strokeStyle = lipColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    for (const connection of lipConnections) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!start || !end) continue;
      ctx.moveTo(start.x * cw, start.y * ch);
      ctx.lineTo(end.x * cw, end.y * ch);
    }
    ctx.stroke();

    // ── Eye contours ──────────────────────────────────────────────────
    const leftEye = FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
    const rightEye = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;
    ctx.strokeStyle = "rgba(120, 210, 255, 0.7)";
    ctx.lineWidth = 1.2;

    for (const eyeConns of [leftEye, rightEye]) {
      ctx.beginPath();
      for (const connection of eyeConns) {
        const start = landmarks[connection.start];
        const end = landmarks[connection.end];
        if (!start || !end) continue;
        ctx.moveTo(start.x * cw, start.y * ch);
        ctx.lineTo(end.x * cw, end.y * ch);
      }
      ctx.stroke();
    }

    // ── Key landmark dots (nose tip, mouth corners) ───────────────────
    // Indices: 1=nose, 61=mouth-left, 291=mouth-right, 13=upper-lip, 14=lower-lip
    const keyLandmarks = [1, 61, 291, 13, 14];
    ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
    for (const idx of keyLandmarks) {
      const lm = landmarks[idx];
      if (!lm) continue;
      ctx.beginPath();
      ctx.arc(lm.x * cw, lm.y * ch, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  /**
   * Draw nasabah overlay: bounding box around detected customer.
   *
   * BoundingBox from MediaPipe FaceDetector is in ABSOLUTE PIXEL coordinates
   * relative to the VIDEO dimensions. We must scale to canvas display size.
   */
  const drawNasabahOverlay = useCallback((ctx, cw, ch, videoW, videoH, currentData) => {
    ctx.clearRect(0, 0, cw, ch);

    if (!currentData?.customer_detected || !currentData?.bounding_box) return;

    const bbox = currentData.bounding_box;
    const confidence = currentData.confidence || 0;

    // Scale bbox from video pixel space → canvas display space
    // Also compensate for CSS object-fit: cover crop offset
    const videoAspect = videoW / videoH;
    const canvasAspect = cw / ch;

    let renderW, renderH, offsetX, offsetY;
    if (videoAspect > canvasAspect) {
      // Video wider than canvas → letterbox on sides (left/right cropped)
      renderH = ch;
      renderW = ch * videoAspect;
      offsetX = (cw - renderW) / 2;
      offsetY = 0;
    } else {
      // Video taller than canvas → letterbox on top/bottom
      renderW = cw;
      renderH = cw / videoAspect;
      offsetX = 0;
      offsetY = (ch - renderH) / 2;
    }

    const scaleX = renderW / videoW;
    const scaleY = renderH / videoH;

    const x = bbox.x * scaleX + offsetX;
    const y = bbox.y * scaleY + offsetY;
    const bw = bbox.w * scaleX;
    const bh = bbox.h * scaleY;

    // ── Full bounding rectangle ────────────────────────────────────────
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, bw, bh);

    // ── Corner accents ─────────────────────────────────────────────────
    const cornerLen = Math.min(bw, bh) * 0.2;
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cornerLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + bh - cornerLen); ctx.lineTo(x, y + bh); ctx.lineTo(x + cornerLen, y + bh);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cornerLen, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - cornerLen);
    ctx.stroke();

    // ── Label badge ────────────────────────────────────────────────────
    const label = `Nasabah ${confidence}%`;
    ctx.font = "bold 13px Inter, sans-serif";
    const textMetrics = ctx.measureText(label);
    const textW = textMetrics.width + 16;
    const textH = 24;

    ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
    roundRect(ctx, x, y - textH - 4, textW, textH, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 8, y - 10);
  }, []);

  /**
   * Main draw loop.
   *
   * KEY FIX: Canvas resolution is set to its DISPLAY size (clientWidth/clientHeight).
   * Landmarks are normalized (0–1) → multiply directly by canvas display size.
   * BBox is in video pixel coords → scale by (canvasSize / videoSize).
   * NO setTransform scaling — that was causing the double-scale misalignment.
   */
  const draw = useCallback(() => {
    const canvas = canvasRef?.current;
    const video = videoRef?.current;
    if (!canvas || !video) return;

    // Always sync canvas resolution to its CSS display size
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }

    if (displayW === 0 || displayH === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset any previous transform — we draw in native canvas pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const currentData = dataRef.current;

    if (type === "teller") {
      // Pass canvas display dimensions — landmarks are normalized, so multiply by these
      drawTellerOverlay(ctx, displayW, displayH, currentData);
    } else {
      // Pass canvas display dimensions AND video natural dimensions for bbox scaling
      const videoW = video.videoWidth || displayW;
      const videoH = video.videoHeight || displayH;
      drawNasabahOverlay(ctx, displayW, displayH, videoW, videoH, currentData);
    }
  }, [canvasRef, videoRef, type, drawTellerOverlay, drawNasabahOverlay]);

  // Start/stop draw loop
  useEffect(() => {
    if (enabled) {
      intervalRef.current = setInterval(draw, DRAW_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear canvas
      const canvas = canvasRef?.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, draw, canvasRef]);
}

/**
 * Helper: draw a rounded rectangle path.
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default useCanvasOverlay;
