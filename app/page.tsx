"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const starterScript = `Today I am practicing clear English communication.

My goal is to speak slowly, breathe naturally, and sound confident.

I will explain one idea at a time.

If I make a mistake, I will pause, smile, and continue.

This video is for learning, teaching, and becoming better every day.`;

type ScrollMode = "wpm" | "timed";

function splitLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.floor(totalSeconds % 60));
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [script, setScript] = useState(starterScript);
  const [activeLine, setActiveLine] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(14);
  const [fontSize, setFontSize] = useState(52);
  const [countdown, setCountdown] = useState(0);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("wpm");
  const [targetMinutes, setTargetMinutes] = useState(2);
  const [mirrorHorizontal, setMirrorHorizontal] = useState(false);
  const [mirrorVertical, setMirrorVertical] = useState(false);
  const [dimPast, setDimPast] = useState(true);
  const [textPosition, setTextPosition] = useState(48);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const lines = useMemo(() => splitLines(script), [script]);
  const wordCount = useMemo(
    () => script.trim().split(/\s+/).filter(Boolean).length,
    [script],
  );
  const wpmSeconds = Math.max(10, Math.round((wordCount / speed) * 60));
  const timedSeconds = Math.max(15, Math.round(targetMinutes * 60));
  const estimatedSeconds = scrollMode === "timed" ? timedSeconds : wpmSeconds;
  const progress =
    lines.length > 1 ? Math.round((activeLine / (lines.length - 1)) * 100) : 0;

  useEffect(() => {
    const saved = window.localStorage.getItem("daily-prompter-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          script?: string;
          speed?: number;
          fontSize?: number;
          scrollMode?: ScrollMode;
          targetMinutes?: number;
          mirrorHorizontal?: boolean;
          mirrorVertical?: boolean;
          dimPast?: boolean;
          textPosition?: number;
        };
        if (parsed.script) setScript(parsed.script);
        if (parsed.speed) setSpeed(parsed.speed);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.scrollMode) setScrollMode(parsed.scrollMode);
        if (parsed.targetMinutes) setTargetMinutes(parsed.targetMinutes);
        if (typeof parsed.mirrorHorizontal === "boolean") {
          setMirrorHorizontal(parsed.mirrorHorizontal);
        }
        if (typeof parsed.mirrorVertical === "boolean") {
          setMirrorVertical(parsed.mirrorVertical);
        }
        if (typeof parsed.dimPast === "boolean") setDimPast(parsed.dimPast);
        if (parsed.textPosition) setTextPosition(parsed.textPosition);
      } catch {
        window.localStorage.removeItem("daily-prompter-state");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(
      "daily-prompter-state",
      JSON.stringify({
        script,
        speed,
        fontSize,
        scrollMode,
        targetMinutes,
        mirrorHorizontal,
        mirrorVertical,
        dimPast,
        textPosition,
      }),
    );
  }, [
    dimPast,
    fontSize,
    isLoaded,
    mirrorHorizontal,
    mirrorVertical,
    script,
    scrollMode,
    speed,
    targetMinutes,
    textPosition,
  ]);

  useEffect(() => {
    lineRefs.current[activeLine]?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeLine]);

  useEffect(() => {
    if (!isRunning || countdown > 0 || lines.length === 0) return;
    const currentWords = Math.max(
      4,
      lines[activeLine]?.split(/\s+/).filter(Boolean).length ?? 6,
    );
    const wpmDelay = Math.max(900, (currentWords / speed) * 60000);
    const timedDelay = Math.max(900, (targetMinutes * 60000) / lines.length);
    const delay = scrollMode === "timed" ? timedDelay : wpmDelay;
    const timer = window.setTimeout(() => {
      setActiveLine((line) => {
        if (line >= lines.length - 1) {
          setIsRunning(false);
          return line;
        }
        return line + 1;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeLine, countdown, isRunning, lines, scrollMode, speed, targetMinutes]);

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, isRunning]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [cameraEnabled]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA" || target?.tagName === "INPUT") {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setIsRunning((value) => !value);
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveLine((line) => Math.min(lines.length - 1, line + 1));
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveLine((line) => Math.max(0, line - 1));
      }

      if (event.key.toLowerCase() === "r") {
        resetPrompt();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lines.length]);

  function startPrompt() {
    if (lines.length === 0) return;
    setCountdown(3);
    setIsRunning(true);
  }

  function resetPrompt() {
    setIsRunning(false);
    setCountdown(0);
    setActiveLine(0);
  }

  function goFullscreen() {
    stageRef.current?.requestFullscreen?.();
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
    } catch {
      setCameraError("Camera or microphone permission was blocked.");
      setCameraEnabled(false);
    }
  }

  function stopCamera() {
    if (isRecording) return;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraEnabled(false);
  }

  async function toggleRecording() {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (!streamRef.current) {
      await startCamera();
    }

    if (!streamRef.current) return;

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl("");
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedUrl(URL.createObjectURL(blob));
      setIsRecording(false);
    };
    recorder.start();
    setIsRecording(true);
    startPrompt();
  }

  async function importScript(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setScript(text);
    resetPrompt();
  }

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="Script editor">
        <div className="brand-row">
          <div>
            <p className="eyebrow">Daily video studio</p>
            <h1>PromptFlow</h1>
          </div>
          <div className="status-pill">{lines.length} lines</div>
        </div>

        <div className="script-actions">
          <label className="script-label" htmlFor="script">
            Paste your script
          </label>
          <label className="import-button">
            Import .txt
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(event) => importScript(event.target.files?.[0])}
            />
          </label>
        </div>
        <textarea
          id="script"
          value={script}
          onChange={(event) => {
            setScript(event.target.value);
            resetPrompt();
          }}
          spellCheck
          placeholder="Paste the words you want to practice..."
        />

        <div className="stats-grid" aria-label="Script statistics">
          <div>
            <span>{wordCount}</span>
            <small>words</small>
          </div>
          <div>
            <span>{formatTime(estimatedSeconds)}</span>
            <small>{scrollMode === "timed" ? "target" : "estimated"}</small>
          </div>
          <div>
            <span>{progress}%</span>
            <small>progress</small>
          </div>
        </div>

        <div className="segmented-control" aria-label="Scroll mode">
          <button
            type="button"
            className={scrollMode === "wpm" ? "selected" : ""}
            onClick={() => setScrollMode("wpm")}
          >
            WPM
          </button>
          <button
            type="button"
            className={scrollMode === "timed" ? "selected" : ""}
            onClick={() => setScrollMode("timed")}
          >
            Timed
          </button>
        </div>

        <div className="control-stack">
          <label>
            <span>Speaking pace</span>
            <input
              type="range"
              min="8"
              max="32"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <strong>{speed} wpm</strong>
          </label>
          <label>
            <span>Target time</span>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.5"
              value={targetMinutes}
              onChange={(event) => setTargetMinutes(Number(event.target.value))}
            />
            <strong>{targetMinutes}m</strong>
          </label>
          <label>
            <span>Text size</span>
            <input
              type="range"
              min="32"
              max="84"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
            <strong>{fontSize}px</strong>
          </label>
          <label>
            <span>Text position</span>
            <input
              type="range"
              min="28"
              max="62"
              value={textPosition}
              onChange={(event) => setTextPosition(Number(event.target.value))}
            />
            <strong>{textPosition}%</strong>
          </label>
        </div>

        <div className="toggle-grid">
          <label>
            <input
              type="checkbox"
              checked={mirrorHorizontal}
              onChange={(event) => setMirrorHorizontal(event.target.checked)}
            />
            <span>Mirror horizontal</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={mirrorVertical}
              onChange={(event) => setMirrorVertical(event.target.checked)}
            />
            <span>Mirror vertical</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={dimPast}
              onChange={(event) => setDimPast(event.target.checked)}
            />
            <span>Dim completed lines</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={cameraEnabled}
              onChange={(event) =>
                event.target.checked ? startCamera() : stopCamera()
              }
            />
            <span>Camera preview</span>
          </label>
        </div>
      </section>

      <section className="prompt-panel" aria-label="Teleprompter">
        <div className="prompt-toolbar">
          <div>
            <p>
              Line {Math.min(activeLine + 1, lines.length)} of {lines.length}
            </p>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="button-row">
            <button type="button" onClick={resetPrompt} aria-label="Reset">
              Reset
            </button>
            <button type="button" onClick={goFullscreen} aria-label="Fullscreen">
              Fullscreen
            </button>
            <button
              type="button"
              className={isRecording ? "recording-button" : ""}
              onClick={toggleRecording}
            >
              {isRecording ? "Stop rec" : "Record"}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (isRunning) {
                  setIsRunning(false);
                  setCountdown(0);
                } else {
                  startPrompt();
                }
              }}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
          </div>
        </div>

        <div
          ref={stageRef}
          className={[
            "prompt-stage",
            mirrorHorizontal ? "mirror-x" : "",
            mirrorVertical ? "mirror-y" : "",
            cameraEnabled ? "has-camera" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />
          <div className="camera-shade" aria-hidden="true" />
          <div
            className="camera-guide"
            aria-hidden="true"
            style={{ top: `${textPosition}%` }}
          >
            <span />
            <span />
          </div>
          {cameraError && <div className="camera-error">{cameraError}</div>}
          {countdown > 0 && <div className="countdown">{countdown}</div>}
          {lines.length === 0 ? (
            <div className="empty-state">Paste a script to begin.</div>
          ) : (
            <div
              className="line-list"
              style={{
                fontSize,
                paddingTop: `${textPosition}vh`,
                paddingBottom: `${100 - textPosition}vh`,
              }}
            >
              {lines.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  ref={(element) => {
                    lineRefs.current[index] = element;
                  }}
                  className={[
                    index === activeLine ? "active" : "",
                    dimPast && index < activeLine ? "past" : "",
                    index > activeLine ? "future" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="practice-strip">
          <button
            type="button"
            onClick={() => setActiveLine((line) => Math.max(0, line - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveLine((line) => Math.min(lines.length - 1, line + 1))
            }
          >
            Next line
          </button>
          {recordedUrl ? (
            <a href={recordedUrl} download="promptflow-recording.webm">
              Download video
            </a>
          ) : (
            <span>Space starts or pauses. Arrow keys move line by line.</span>
          )}
        </div>
      </section>
    </main>
  );
}
