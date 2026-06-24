import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useAIDetection } from "../../hooks/useAIDetection";
import { useCanvasOverlay } from "../../hooks/useCanvasOverlay";
import {
  startSession,
  stopSession,
  saveSmileDetection,
} from "../../services/monitoringService";
import "./LiveMonitoring.css";

/**
 * Helper: get score level for CSS class mapping.
 */
function getScoreLevel(score) {
  if (score < 30) return "low";
  if (score < 60) return "mid";
  return "high";
}

/**
 * LiveMonitoring — Main page component.
 * 
 * Features:
 * - Camera feeds for teller and nasabah
 * - Face mesh skeleton overlay on teller video
 * - Bounding box overlay on nasabah video
 * - Small "Smile Score: XX%" text below teller video (no big panel)
 * - Auto service_session start/stop based on nasabah detection
 * - Smile data saved to DB every 5 seconds
 * - Duration tracking from nasabah detection
 * - "Mulai Monitoring" button for admin (spv) and teller roles
 */
function LiveMonitoring() {
  const { user, isAdmin, isTeller } = useAuth();

  // Camera refs
  const nasabahVideoRef = useRef(null);
  const tellerVideoRef = useRef(null);
  const nasabahStreamRef = useRef(null);
  const tellerStreamRef = useRef(null);

  // Canvas overlay refs
  const tellerCanvasRef = useRef(null);
  const nasabahCanvasRef = useRef(null);

  // Camera state
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState({
    nasabah: "",
    teller: "",
  });
  const [cameraStatus, setCameraStatus] = useState({
    nasabah: "off",
    teller: "off",
  });

  // Monitoring state
  const [lastTrigger, setLastTrigger] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Session state (linked to DB)
  const [sessionId, setSessionId] = useState(null);
  const [tellerId, setTellerId] = useState(null);
  const [nasabahDetectedAt, setNasabahDetectedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const smileSaveIntervalRef = useRef(null);
  const nasabahGoneTimerRef = useRef(null);

  // ─── Refs untuk menghindari stale closure & race condition ─────────────
  // Ref untuk baca data AI terbaru tanpa menyebabkan effect re-run
  const tellerAIDataRef = useRef(null);
  // Ref shadow dari sessionId untuk dipakai di async callback
  const sessionIdRef = useRef(null);
  // Flag untuk mencegah duplicate startSession saat async belum selesai
  const isStartingSessionRef = useRef(false);
  // Akumulator smile score per sesi (disimpan lokal, kirim 1 baris saat sesi selesai)
  const smileAccumulatorRef = useRef([]);

  // AI Detection hooks
  const tellerAI = useAIDetection({
    videoRef: tellerVideoRef,
    type: "teller",
    enabled: isMonitoring && cameraStatus.teller === "on",
  });

  const nasabahAI = useAIDetection({
    videoRef: nasabahVideoRef,
    type: "nasabah",
    enabled: isMonitoring && cameraStatus.nasabah === "on",
  });

  // Canvas overlay hooks
  useCanvasOverlay({
    canvasRef: tellerCanvasRef,
    videoRef: tellerVideoRef,
    type: "teller",
    data: tellerAI.data,
    enabled: isMonitoring && cameraStatus.teller === "on" && tellerAI.isConnected,
  });

  useCanvasOverlay({
    canvasRef: nasabahCanvasRef,
    videoRef: nasabahVideoRef,
    type: "nasabah",
    data: nasabahAI.data,
    enabled: isMonitoring && cameraStatus.nasabah === "on" && nasabahAI.isConnected,
  });

  // ─── Sync refs dengan state terbaru ────────────────────────────────────
  useEffect(() => {
    tellerAIDataRef.current = tellerAI.data;
  }, [tellerAI.data]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // ─── Resolve teller ID from logged-in user ──────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    fetch(`${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}/api/monitoring/teller-id/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTellerId(data.id_teller);
      })
      .catch(() => {});
  }, [user?.id]);

  // ─── Track nasabah presence → start/stop duration timer ─────────────
  useEffect(() => {
    if (!isMonitoring) return;

    const detected = nasabahAI.data?.customer_detected ?? false;

    if (detected && !nasabahDetectedAt) {
      // Nasabah just appeared → start timer immediately
      if (nasabahGoneTimerRef.current) {
        clearTimeout(nasabahGoneTimerRef.current);
        nasabahGoneTimerRef.current = null;
      }
      setNasabahDetectedAt(new Date());
      setElapsedSeconds(0);
    }

    if (!detected && nasabahDetectedAt) {
      // Nasabah gone → wait 3 seconds before resetting (avoid flicker)
      if (!nasabahGoneTimerRef.current) {
        nasabahGoneTimerRef.current = setTimeout(() => {
          setNasabahDetectedAt(null);
          setElapsedSeconds(0);
          nasabahGoneTimerRef.current = null;
        }, 3000);
      }
    } else if (detected && nasabahGoneTimerRef.current) {
      // Nasabah came back within 3s → cancel reset
      clearTimeout(nasabahGoneTimerRef.current);
      nasabahGoneTimerRef.current = null;
    }
  }, [nasabahAI.data?.customer_detected, isMonitoring, nasabahDetectedAt]);

  // ─── Helper: simpan smile teragregasi & stop sesi di DB ────────────────
  const finishSession = useCallback(async (currentSessionId) => {
    if (!currentSessionId) return;

    try {
      // Hitung rata-rata dari akumulator lokal
      const scores = smileAccumulatorRef.current;
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;
        // Cari kategori paling sering muncul
        const kategoris = scores.map((s) => s.kategori);
        const dominantKategori = kategoris.sort(
          (a, b) =>
            kategoris.filter((k) => k === b).length -
            kategoris.filter((k) => k === a).length
        )[0] || "Netral";

        // Kirim 1 baris teragregasi ke DB (bukan ribuan baris per frame)
        await saveSmileDetection(currentSessionId, avgScore, dominantKategori);
      }
      smileAccumulatorRef.current = [];
      await stopSession(currentSessionId);
    } catch (err) {
      console.error("[Session] finishSession error:", err);
    }
  }, []);

  // ─── Auto DB session start/stop (independent of timer) ─────────────
  useEffect(() => {
    if (!isMonitoring || !tellerId) return;

    const detected = nasabahAI.data?.customer_detected ?? false;

    if (detected && !sessionIdRef.current && !isStartingSessionRef.current) {
      // Flag agar tidak double-call saat async pending
      isStartingSessionRef.current = true;
      startSession(tellerId)
        .then((res) => {
          if (res.success) {
            sessionIdRef.current = res.id_transaksi;
            setSessionId(res.id_transaksi);
          }
        })
        .catch((err) => console.error("[Session] Start error:", err))
        .finally(() => {
          isStartingSessionRef.current = false;
        });
    }

    if (!detected && sessionIdRef.current) {
      // Nasabah pergi → tunggu 5 detik lalu stop sesi
      const capturedSessionId = sessionIdRef.current;
      const stopTimer = setTimeout(() => {
        // Pastikan sesi belum diganti (user tidak menekan stop manual)
        if (sessionIdRef.current === capturedSessionId) {
          finishSession(capturedSessionId).then(() => {
            sessionIdRef.current = null;
            setSessionId(null);
          });
        }
      }, 5000);

      return () => clearTimeout(stopTimer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nasabahAI.data?.customer_detected, isMonitoring, tellerId, finishSession]);
  // ↑ sessionId SENGAJA tidak dimasukkan agar tidak loop — pakai sessionIdRef

  // ─── Akumulasi smile score setiap 5 detik (simpan lokal, TIDAK ke DB) ──
  // Saat sesi selesai, 1 baris teragregasi baru dikirim ke DB.
  // Ini mencegah tabel smile_detections membengkak.
  useEffect(() => {
    if (!isMonitoring || !sessionId) {
      if (smileSaveIntervalRef.current) {
        clearInterval(smileSaveIntervalRef.current);
        smileSaveIntervalRef.current = null;
      }
      return;
    }

    smileSaveIntervalRef.current = setInterval(() => {
      // Baca dari REF bukan dari closure — selalu data terbaru tanpa reset interval
      const smileData = tellerAIDataRef.current;
      if (!smileData?.face_detected) return;

      smileAccumulatorRef.current.push({
        score: smileData.smile_score / 100,
        kategori: smileData.kategori || "Netral",
      });
    }, 5000);

    return () => {
      if (smileSaveIntervalRef.current) {
        clearInterval(smileSaveIntervalRef.current);
        smileSaveIntervalRef.current = null;
      }
    };
  // ↓ PERBAIKAN KRITIS: tellerAI.data TIDAK ada di sini
  // Sebelumnya ada → interval direset setiap frame AI → data tidak pernah tersimpan!
  }, [isMonitoring, sessionId]);

  // ─── Duration timer (counts up every second while nasabah detected) ─
  useEffect(() => {
    if (!nasabahDetectedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nasabahDetectedAt]);

  // ─── Camera utilities ───────────────────────────────────────────────
  const getCameraErrorMessage = (err) => {
    switch (err?.name) {
      case "NotAllowedError":
      case "SecurityError":
        return "Izin kamera ditolak. Pastikan permission kamera sudah diizinkan.";
      case "NotFoundError":
        return "Perangkat kamera tidak ditemukan.";
      case "NotReadableError":
        return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.";
      case "OverconstrainedError":
        return "Perangkat kamera tidak sesuai. Coba pilih device lain.";
      default:
        return "Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.";
    }
  };

  const clearStream = (streamRef, videoRef) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = useCallback((target) => {
    if (target === "teller") clearStream(tellerStreamRef, tellerVideoRef);
    if (target === "nasabah") clearStream(nasabahStreamRef, nasabahVideoRef);
    setCameraStatus((prev) => ({ ...prev, [target]: "off" }));
  }, []);

  const stopAllCameras = useCallback(() => {
    stopCamera("teller");
    stopCamera("nasabah");
  }, [stopCamera]);

  const refreshDevices = useCallback(async () => {
    setStatus("loading");
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("Browser tidak mendukung akses kamera.");
      return;
    }

    let permissionError = null;
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      permissionStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      permissionError = err;
    }

    const deviceList = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = deviceList.filter((d) => d.kind === "videoinput");
    setDevices(videoDevices);

    setSelectedDeviceIds((prev) => {
      const hasPrevTeller = prev.teller && videoDevices.some((d) => d.deviceId === prev.teller);
      const hasPrevNasabah = prev.nasabah && videoDevices.some((d) => d.deviceId === prev.nasabah);
      return {
        teller: hasPrevTeller ? prev.teller : videoDevices[0]?.deviceId || "",
        nasabah: hasPrevNasabah ? prev.nasabah : videoDevices[1]?.deviceId || "",
      };
    });

    if (videoDevices.length === 0) {
      setStatus("error");
      setError("Tidak ada perangkat kamera yang terdeteksi.");
      return;
    }
    if (permissionError) {
      setStatus("error");
      setError(getCameraErrorMessage(permissionError));
      return;
    }
    setStatus("ready");
  }, []);

  const startCamera = useCallback(
    async (target) => {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Browser tidak mendukung akses kamera.");
        return;
      }

      const deviceId = selectedDeviceIds[target];
      if (!deviceId) {
        setError("Pilih perangkat kamera terlebih dahulu.");
        return;
      }

      setCameraStatus((prev) => ({ ...prev, [target]: "loading" }));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });

        if (target === "teller") {
          tellerStreamRef.current = stream;
          if (tellerVideoRef.current) tellerVideoRef.current.srcObject = stream;
        }
        if (target === "nasabah") {
          nasabahStreamRef.current = stream;
          if (nasabahVideoRef.current) nasabahVideoRef.current.srcObject = stream;
        }

        setCameraStatus((prev) => ({ ...prev, [target]: "on" }));
      } catch (err) {
        setCameraStatus((prev) => ({ ...prev, [target]: "off" }));
        setError(getCameraErrorMessage(err));
      }
    },
    [selectedDeviceIds]
  );

  const handleDeviceSelect = (target, deviceId) => {
    setSelectedDeviceIds((prev) => ({ ...prev, [target]: deviceId }));
    stopCamera(target);
  };

  const handleCameraToggle = (target) => {
    if (cameraStatus[target] === "on") {
      stopCamera(target);
      return;
    }
    startCamera(target);
  };

  useEffect(() => {
    refreshDevices();
    return () => stopAllCameras();
  }, [refreshDevices, stopAllCameras]);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return undefined;
    const handler = () => refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
  }, [refreshDevices]);

  // ─── Monitoring toggle ──────────────────────────────────────────────
  const handleMonitoringToggle = async () => {
    const nextMonitoring = !isMonitoring;
    setIsMonitoring(nextMonitoring);
    setLastTrigger({ type: nextMonitoring ? "start" : "stop", time: new Date() });

    if (!nextMonitoring) {
      // Stop: selesaikan sesi aktif (simpan agregat smile + stop sesi DB)
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) {
        await finishSession(currentSessionId);
        sessionIdRef.current = null;
        setSessionId(null);
      }
      setNasabahDetectedAt(null);
      setElapsedSeconds(0);
      isStartingSessionRef.current = false;

      if (nasabahGoneTimerRef.current) {
        clearTimeout(nasabahGoneTimerRef.current);
        nasabahGoneTimerRef.current = null;
      }
    }
  };

  // ─── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (nasabahGoneTimerRef.current) clearTimeout(nasabahGoneTimerRef.current);
      if (smileSaveIntervalRef.current) clearInterval(smileSaveIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────
  const canMonitor = isAdmin || isTeller;

  const statusLabel = {
    idle: "Menunggu izin kamera",
    loading: "Memuat kamera",
    ready: "Terkoneksi",
    error: "Gagal",
  };

  const statusTone = {
    idle: "bg-slate-100 text-slate-600",
    loading: "bg-amber-100 text-amber-700",
    ready: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
  };

  const triggerLabel = { start: "Monitoring dimulai", stop: "Monitoring dihentikan" };
  const lastTriggerText = lastTrigger
    ? `${triggerLabel[lastTrigger.type]} - ${lastTrigger.time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    : "Belum ada";

  const durationLabel = nasabahDetectedAt
    ? new Date(elapsedSeconds * 1000).toISOString().slice(11, 19)
    : "00:00:00";
  const durationNote = nasabahDetectedAt ? "Sedang dihitung" : "Menunggu deteksi nasabah";

  const aiConnected = tellerAI.isConnected || nasabahAI.isConnected;
  const aiStatusLabel = isMonitoring
    ? aiConnected ? "AI Aktif" : "Menghubungkan AI..."
    : "AI Standby";
  const aiStatusClass = isMonitoring
    ? aiConnected ? "ai-status-badge--online" : "ai-status-badge--connecting"
    : "ai-status-badge--offline";

  const cameraCards = [
    {
      key: "teller",
      title: "Kamera Teller",
      description: "Siap untuk deteksi senyum teller secara real-time.",
      videoRef: tellerVideoRef,
      canvasRef: tellerCanvasRef,
      deviceId: selectedDeviceIds.teller,
      status: cameraStatus.teller,
      badge: "Teller",
      ai: tellerAI,
    },
    {
      key: "nasabah",
      title: "Kamera Nasabah",
      description: "Pantau durasi nasabah berada di depan teller.",
      videoRef: nasabahVideoRef,
      canvasRef: nasabahCanvasRef,
      deviceId: selectedDeviceIds.nasabah,
      status: cameraStatus.nasabah,
      badge: "Nasabah",
      ai: nasabahAI,
    },
  ];

  return (
    <div>
      <Navbar title="Live Monitoring" subtitle="Monitoring" />
      <section className="section-enter mt-8">
        <div className="rounded-3xl bg-white p-6 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.5)]">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Live Camera</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">Feed Teller & Nasabah</h2>
              <p className="mt-1 text-sm text-slate-500">
                Kamera depan akan dipakai untuk teller, sementara kamera nasabah opsional.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${statusTone[status]}`}>
                {statusLabel[status]}
              </span>

              {isMonitoring && (
                <span className={`ai-status-badge ${aiStatusClass}`}>
                  <span className="ai-status-dot" />
                  {aiStatusLabel}
                </span>
              )}

              <button
                type="button"
                onClick={refreshDevices}
                disabled={status === "loading"}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Muat Ulang Kamera
              </button>

              {canMonitor && (
                <button
                  type="button"
                  id="btn-monitoring-toggle"
                  onClick={handleMonitoringToggle}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition ${
                    isMonitoring ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {isMonitoring ? "Hentikan Monitoring" : "Mulai Monitoring"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">Trigger terakhir: {lastTriggerText}</div>

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          )}

          {isMonitoring && (tellerAI.error || nasabahAI.error) && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              ⚠ AI: {tellerAI.error || nasabahAI.error}. Pastikan koneksi internet tersedia untuk memuat model MediaPipe.
            </div>
          )}

          {/* Camera Cards */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {cameraCards.map((camera) => {
              const selectedDevice = devices.find((d) => d.deviceId === camera.deviceId);
              const deviceLabel = selectedDevice?.label
                ? selectedDevice.label
                : camera.deviceId ? "Perangkat kamera terdeteksi" : "Belum ada perangkat";
              const overlayText = camera.status === "loading"
                ? "Memuat kamera..."
                : !camera.deviceId
                  ? "Pilih perangkat kamera terlebih dahulu."
                  : "Kamera dimatikan. Klik Hidupkan Kamera.";

              return (
                <div key={camera.key} className="rounded-3xl border border-slate-100 p-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{camera.title}</h3>
                      <p className="text-xs text-slate-500">{camera.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {camera.badge}
                    </span>
                  </div>

                  {/* Device Select */}
                  <div className="mt-3 grid gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                      Pilih Device
                    </label>
                    <select
                      value={camera.deviceId}
                      onChange={(e) => handleDeviceSelect(camera.key, e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-slate-300 focus:outline-none"
                    >
                      <option value="">Pilih kamera</option>
                      {devices.map((d, i) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Kamera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleCameraToggle(camera.key)}
                        disabled={!camera.deviceId || camera.status === "loading"}
                        className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {camera.status === "on" ? "Matikan Kamera" : "Hidupkan Kamera"}
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Status: {camera.status === "on" ? "Aktif" : camera.status === "loading" ? "Memuat" : "Mati"}
                      </span>
                    </div>
                  </div>

                  {/* Video + Canvas Overlay */}
                  <div className="camera-video-container mt-4" style={{ height: "clamp(288px, 40vw, 384px)" }}>
                    <video ref={camera.videoRef} autoPlay playsInline muted />
                    <canvas ref={camera.canvasRef} className="camera-overlay-canvas" />

                    {camera.status !== "on" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 px-6 text-center text-xs text-white" style={{ zIndex: 15 }}>
                        {overlayText}
                      </div>
                    )}

                    {isMonitoring && camera.status === "on" && (
                      <div className="monitoring-active-indicator">
                        <span className="monitoring-active-dot" />
                        AI Monitoring
                      </div>
                    )}

                    {isMonitoring && camera.key === "teller" && camera.status === "on" &&
                      camera.ai.isConnected && camera.ai.data && !camera.ai.data.face_detected && (
                        <div className="no-face-overlay">
                          <span className="no-face-overlay__dot" />
                          Wajah tidak terdeteksi — hadapkan wajah ke kamera
                        </div>
                      )}
                  </div>

                  {/* Teller: elegant smile score bar */}
                  {camera.key === "teller" && isMonitoring && camera.status === "on" && camera.ai.data && (
                    <div className="smile-bar">
                      <div className={`smile-bar__dot smile-bar__dot--${getScoreLevel(camera.ai.data.smile_score || 0)}`} />
                      <span className="smile-bar__label">Smile Score</span>
                      <span className={`smile-bar__score smile-bar__score--${getScoreLevel(camera.ai.data.smile_score || 0)}`}>
                        {camera.ai.data.smile_score || 0}%
                      </span>
                      <span className="smile-bar__divider" />
                      <span className={`smile-bar__status smile-bar__status--${getScoreLevel(camera.ai.data.smile_score || 0)}`}>
                        {camera.ai.data.status || "—"}
                      </span>
                      <span className="smile-bar__fps">{camera.ai.fps || 0} FPS</span>
                    </div>
                  )}

                  {/* Nasabah: detection panel + duration */}
                  {camera.key === "nasabah" && (
                    <>
                      {isMonitoring && camera.status === "on" && camera.ai.data && (
                        <div className={`customer-panel ${camera.ai.data.customer_detected ? "customer-panel--detected" : "customer-panel--not-detected"}`}>
                          <div className={`customer-panel__icon ${camera.ai.data.customer_detected ? "customer-panel__icon--detected" : "customer-panel__icon--not-detected"}`}>
                            {camera.ai.data.customer_detected ? "👤" : "—"}
                          </div>
                          <span className="customer-panel__label">
                            {camera.ai.data.customer_detected ? "Nasabah Terdeteksi" : "Tidak Ada Nasabah"}
                          </span>
                          {camera.ai.data.customer_detected && (
                            <span className="customer-panel__confidence">
                              {camera.ai.data.confidence}%
                            </span>
                          )}
                        </div>
                      )}

                      <div className="duration-panel">
                        <span>Durasi duduk:</span>
                        <span className="duration-panel__value">{durationLabel}</span>
                        <span className="duration-panel__note">{durationNote}</span>
                      </div>
                    </>
                  )}

                  {/* Device label + status */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{deviceLabel}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {camera.status === "on" ? "Live Stream" : "Offline"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LiveMonitoring;
