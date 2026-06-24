import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker, FaceDetector } from "@mediapipe/tasks-vision";
import { MovingAverage, processSmileResult, processCustomerResult } from "../utils/smileUtils";

const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";
const DETECT_INTERVAL_MS = 50; // 20 FPS

/**
 * useAIDetection — Runs MediaPipe detection directly in the browser.
 *
 * Teller: FaceLandmarker with FaceBlendshapes for accurate smile detection + face mesh landmarks
 * Nasabah: FaceDetector for customer presence + bounding box
 *
 * @param {Object} options
 * @param {React.RefObject} options.videoRef — Reference to <video> element
 * @param {"teller"|"nasabah"} options.type — Camera type
 * @param {boolean} options.enabled — Whether detection is active
 * @returns {Object} { data, isConnected, error, fps }
 */
export function useAIDetection({ videoRef, type, enabled }) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [fps, setFps] = useState(0);

  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const smootherRef = useRef(new MovingAverage(3));
  const frameCountRef = useRef(0);
  const fpsStartRef = useRef(Date.now());
  const initializingRef = useRef(false);

  const initDetector = useCallback(async () => {
    if (detectorRef.current || initializingRef.current) return;
    initializingRef.current = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);

      if (type === "teller") {
        detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "/models/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });
      } else {
        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "/models/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
      }

      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error(`[AI] Failed to init ${type} detector:`, err);
      setError(`Gagal memuat model AI: ${err.message}`);
      setIsConnected(false);
    } finally {
      initializingRef.current = false;
    }
  }, [type]);

  const processFrame = useCallback(() => {
    const video = videoRef?.current;
    const detector = detectorRef.current;

    if (!video || !detector || video.readyState < 2 || video.videoWidth === 0) {
      return;
    }

    const now = performance.now();

    try {
      if (type === "teller") {
        const results = detector.detectForVideo(video, now);
        const smileData = processSmileResult(results, smootherRef.current);
        setData(smileData);
      } else {
        const results = detector.detectForVideo(video, now);
        const customerData = processCustomerResult(results);
        setData(customerData);
      }

      // FPS tracking
      frameCountRef.current += 1;
      const elapsed = (Date.now() - fpsStartRef.current) / 1000;
      if (elapsed >= 1) {
        setFps(Math.round(frameCountRef.current / elapsed));
        frameCountRef.current = 0;
        fpsStartRef.current = Date.now();
      }
    } catch {
      // Silently skip frame errors
    }
  }, [videoRef, type]);

  const startLoop = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(processFrame, DETECT_INTERVAL_MS);
  }, [processFrame]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      initDetector().then(() => {
        if (detectorRef.current) {
          startLoop();
        }
      });
    } else {
      stopLoop();
      setData(null);
      setFps(0);
      smootherRef.current.reset();
    }
    return () => stopLoop();
  }, [enabled, initDetector, startLoop, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
    };
  }, [stopLoop]);

  return { data, isConnected, error, fps };
}

export default useAIDetection;
