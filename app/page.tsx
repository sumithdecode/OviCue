"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const starterScript = `Today I am practicing clear English communication.

My goal is to speak clearly, breathe naturally, and sound confident.

I will teach one useful idea at a time.

If I make a mistake, I will pause, smile, and continue.

This video is for sharing knowledge, helping people, and becoming better every day.`;

type ScrollMode = "wpm" | "timed";
type ScriptLanguage = "english" | "hindi" | "marathi";
type SessionInsight = {
  durationSeconds: number;
  readWords: number;
  wpm: number;
};

const languageSamples: Record<ScriptLanguage, string> = {
  english: starterScript,
  hindi: `नमस्ते, आज मैं स्पष्ट और आत्मविश्वास से बोलने का अभ्यास कर रहा हूं।

मेरा लक्ष्य है कि मैं धीरे बोलूं, स्वाभाविक रूप से सांस लूं, और हर विचार को आसान भाषा में समझाऊं।

अगर मुझसे गलती होती है, तो मैं रुकूंगा, मुस्कुराऊंगा, और फिर आगे बढ़ूंगा।

यह वीडियो सीखने, सिखाने, और लोगों की मदद करने के लिए है।`,
  marathi: `नमस्कार, आज मी स्पष्ट आणि आत्मविश्वासाने बोलण्याचा सराव करत आहे.

माझा उद्देश आहे की मी शांतपणे बोलेन, नैसर्गिक श्वास घेईन, आणि प्रत्येक विचार सोप्या भाषेत समजावून सांगेन.

जर माझ्याकडून चूक झाली, तर मी थांबेन, हसेन, आणि पुन्हा पुढे बोलेन.

हा व्हिडिओ शिकण्यासाठी, शिकवण्यासाठी, आणि लोकांना मदत करण्यासाठी आहे.`,
};

const languageLabels: Record<ScriptLanguage, string> = {
  english: "English",
  hindi: "हिन्दी",
  marathi: "मराठी",
};

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

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function Home() {
  const [script, setScript] = useState(starterScript);
  const [activeLine, setActiveLine] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(120);
  const [fontSize, setFontSize] = useState(52);
  const [countdown, setCountdown] = useState(0);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("wpm");
  const [targetMinutes, setTargetMinutes] = useState(2);
  const [mirrorHorizontal, setMirrorHorizontal] = useState(false);
  const [mirrorVertical, setMirrorVertical] = useState(false);
  const [dimPast, setDimPast] = useState(true);
  const [textPosition, setTextPosition] = useState(48);
  const [scriptLanguage, setScriptLanguage] =
    useState<ScriptLanguage>("english");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [lastInsight, setLastInsight] = useState<SessionInsight | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const lineListRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  const lines = useMemo(() => splitLines(script), [script]);
  const wordCount = useMemo(
    () => countWords(script),
    [script],
  );
  const wordsRead = useMemo(
    () =>
      lines
        .slice(0, Math.min(activeLine + 1, lines.length))
        .reduce((total, line) => total + countWords(line), 0),
    [activeLine, lines],
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
          scriptLanguage?: ScriptLanguage;
        };
        if (parsed.script) setScript(parsed.script);
        if (parsed.speed) setSpeed(parsed.speed < 40 ? 120 : parsed.speed);
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
        if (parsed.scriptLanguage) setScriptLanguage(parsed.scriptLanguage);
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
        scriptLanguage,
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
    scriptLanguage,
    scrollMode,
    speed,
    targetMinutes,
    textPosition,
  ]);

  useEffect(() => {
    if (isRunning || !lineRefs.current[activeLine]) return;
    lineRefs.current[activeLine]?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeLine, isRunning]);

  useEffect(() => {
    if (!isRunning || countdown > 0 || lines.length === 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    function tick(now: number) {
      const list = lineListRef.current;
      if (!list) return;

      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const deltaSeconds = Math.min(0.08, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const totalScrollable = Math.max(1, list.scrollHeight - list.clientHeight);
      const pixelsPerSecond = totalScrollable / estimatedSeconds;
      list.scrollTop = Math.min(
        totalScrollable,
        list.scrollTop + pixelsPerSecond * deltaSeconds,
      );

      const center =
        list.getBoundingClientRect().top +
        list.clientHeight * (textPosition / 100);
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      lineRefs.current.forEach((line, index) => {
        if (!line) return;
        const rect = line.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveLine((current) =>
        current === closestIndex ? current : closestIndex,
      );

      if (list.scrollTop >= totalScrollable - 1) {
        finishSession();
        setIsRunning(false);
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    }

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
    };
  }, [countdown, estimatedSeconds, isRunning, lines.length, textPosition]);

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
        setIsRunning((value) => {
          if (value) {
            finishSession();
            setCountdown(0);
          } else {
            startPrompt();
          }
          return !value;
        });
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveByLine(1);
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveByLine(-1);
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
    if (activeLine >= lines.length - 1) {
      setActiveLine(0);
      if (lineListRef.current) lineListRef.current.scrollTop = 0;
    } else if (activeLine === 0 && lineListRef.current) {
      lineListRef.current.scrollTop = 0;
    }
    sessionStartRef.current = performance.now() + 3000;
    setCountdown(3);
    setIsRunning(true);
  }

  function resetPrompt() {
    finishSession();
    setIsRunning(false);
    setCountdown(0);
    setActiveLine(0);
    if (lineListRef.current) lineListRef.current.scrollTop = 0;
  }

  function moveByLine(direction: 1 | -1) {
    if (lines.length === 0) return;
    setActiveLine((line) => {
      const nextLine = Math.min(lines.length - 1, Math.max(0, line + direction));
      lineRefs.current[nextLine]?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return nextLine;
    });
  }

  function finishSession() {
    if (sessionStartRef.current === null) return;
    const durationSeconds = Math.max(
      1,
      (performance.now() - sessionStartRef.current) / 1000,
    );
    const readWords = Math.max(1, wordsRead);
    const measuredWpm = Math.max(1, Math.round((readWords / durationSeconds) * 60));
    setLastInsight({
      durationSeconds: Math.round(durationSeconds),
      readWords,
      wpm: measuredWpm,
    });
    sessionStartRef.current = null;
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

  function useLanguageSample(language: ScriptLanguage) {
    setScriptLanguage(language);
    setScript(languageSamples[language]);
    resetPrompt();
  }

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="Script editor">
        <div className="brand-row">
          <div>
            <p className="eyebrow">Public creator studio</p>
            <h1>Sumit Decode</h1>
          </div>
          <div className="status-pill">{lines.length} lines</div>
        </div>

        <div className="creator-intro">
          <p>Decode your ideas into confident videos with a warm teleprompter for Indian teachers, students, creators, and graders.</p>
          <div className="intro-tags" aria-label="PromptFlow highlights">
            <span>Camera ready</span>
            <span>हिन्दी</span>
            <span>मराठी</span>
            <span>Sign in ready</span>
            <span>Premium path</span>
          </div>
        </div>

        <div className="account-panel">
          <div>
            <strong>Start free</strong>
            <span>Use 15 practice runs to test your scripts. Upgrade when you want unlimited creator sessions.</span>
          </div>
          <a href="/signin-with-chatgpt?return_to=%2F">Sign in</a>
        </div>

        <div className="pricing-panel" aria-label="Plans">
          <div>
            <small>Free</small>
            <strong>15 runs</strong>
            <span>Practice, import text, and record short sessions.</span>
          </div>
          <div className="premium-plan">
            <small>Premium</small>
            <strong>₹99/year</strong>
            <span>Unlimited prompting, longer scripts, and future saved history.</span>
          </div>
        </div>

        <div className="script-actions">
          <label className="script-label" htmlFor="script">
            Your video script
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

        <div className="language-panel" aria-label="Script language">
          <span>Script language</span>
          <div className="language-buttons">
            {(Object.keys(languageLabels) as ScriptLanguage[]).map((language) => (
              <button
                key={language}
                type="button"
                className={scriptLanguage === language ? "selected" : ""}
                onClick={() => useLanguageSample(language)}
              >
                {languageLabels[language]}
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="script"
          value={script}
          onChange={(event) => {
            setScript(event.target.value);
            resetPrompt();
          }}
          spellCheck
          lang={
            scriptLanguage === "hindi"
              ? "hi"
              : scriptLanguage === "marathi"
                ? "mr"
                : "en"
          }
          placeholder="Paste the words you want to teach, present, or practice..."
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

        <div className="creator-note">
          <strong>Auto-roll rhythm</strong>
          <span>Press Start once. The script now moves upward continuously at the pace or target time you choose.</span>
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
              min="60"
              max="220"
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
                  finishSession();
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
              ref={lineListRef}
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

        <div className="insight-panel" aria-label="Reading speed insight">
          <div>
            <small>Reading insight</small>
            <strong>
              {lastInsight ? `${lastInsight.wpm} wpm` : "Start a session"}
            </strong>
            <span>
              {lastInsight
                ? `${lastInsight.readWords} words in ${formatTime(
                    lastInsight.durationSeconds,
                  )}. Suggested roll speed is ${Math.min(
                    220,
                    Math.max(60, lastInsight.wpm),
                  )} wpm.`
                : "After you pause or finish, Sumit Decode estimates your pace and suggests a better roll speed."}
            </span>
          </div>
          <button
            type="button"
            disabled={!lastInsight}
            onClick={() => {
              if (!lastInsight) return;
              setSpeed(Math.min(220, Math.max(60, lastInsight.wpm)));
              setScrollMode("wpm");
            }}
          >
            Use suggested pace
          </button>
        </div>
      </section>
    </main>
  );
}
