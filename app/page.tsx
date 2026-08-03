"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const starterScript = `Today I am practicing clear English communication.

My goal is to speak clearly, breathe naturally, and sound confident.

I will teach one useful idea at a time.

If I make a mistake, I will pause, smile, and continue.

This video is for sharing knowledge, helping people, and becoming better every day.`;

type ScrollMode = "wpm" | "timed";
type ScriptLanguage = "english" | "hindi" | "marathi";
type ExperienceMode = "welcome" | "studio";
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

const calibrationPassages: Record<ScriptLanguage, string> = {
  english:
    "Today I want to speak with calm energy. I will look near the camera, keep my sentences natural, and explain one useful idea in a way that helps the listener understand quickly.",
  hindi:
    "आज मैं शांत आत्मविश्वास के साथ बोलना चाहता हूं। मैं कैमरे के पास देखूंगा, अपने वाक्य सरल रखूंगा, और एक उपयोगी विचार को ऐसे समझाऊंगा कि सुनने वाले को जल्दी समझ आए।",
  marathi:
    "आज मला शांत आत्मविश्वासाने बोलायचे आहे। मी कॅमेऱ्याजवळ पाहीन, माझी वाक्ये नैसर्गिक ठेवीन, आणि एक उपयोगी विचार असा समजावून सांगेन की ऐकणाऱ्याला पटकन समजेल.",
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
  const [experienceMode, setExperienceMode] =
    useState<ExperienceMode>("welcome");
  const [script, setScript] = useState(starterScript);
  const [activeLine, setActiveLine] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(145);
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
  const [calibrationInsight, setCalibrationInsight] =
    useState<SessionInsight | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationRemaining, setCalibrationRemaining] = useState(30);
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
  const calibrationStartRef = useRef<number | null>(null);

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
          calibrationInsight?: SessionInsight;
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
        if (parsed.calibrationInsight) {
          setCalibrationInsight(parsed.calibrationInsight);
          setLastInsight(parsed.calibrationInsight);
          setSpeed(Math.min(280, Math.max(80, parsed.calibrationInsight.wpm)));
        }
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
        calibrationInsight,
      }),
    );
  }, [
    calibrationInsight,
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
      const averageWordsPerLine = Math.max(3, wordCount / Math.max(1, lines.length));
      const wpmPixelsPerSecond = Math.max(
        56,
        ((fontSize * 2.4) / averageWordsPerLine) * (speed / 60),
      );
      const pixelsPerSecond =
        scrollMode === "timed"
          ? Math.max(48, totalScrollable / estimatedSeconds)
          : wpmPixelsPerSecond;
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
  }, [
    countdown,
    estimatedSeconds,
    fontSize,
    isRunning,
    lines.length,
    scrollMode,
    speed,
    textPosition,
    wordCount,
  ]);

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, isRunning]);

  useEffect(() => {
    if (!isCalibrating) return;
    if (calibrationRemaining <= 0) {
      finishCalibration();
      return;
    }
    const timer = window.setTimeout(() => {
      setCalibrationRemaining((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [calibrationRemaining, isCalibrating]);

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

  function startCalibration() {
    setCalibrationRemaining(30);
    calibrationStartRef.current = performance.now();
    setIsCalibrating(true);
  }

  function finishCalibration() {
    if (calibrationStartRef.current === null) return;
    const elapsedSeconds = Math.max(
      5,
      (performance.now() - calibrationStartRef.current) / 1000,
    );
    const passageWords = countWords(calibrationPassages[scriptLanguage]);
    const measuredWpm = Math.max(
      80,
      Math.min(280, Math.round((passageWords / elapsedSeconds) * 60)),
    );
    const insight = {
      durationSeconds: Math.round(elapsedSeconds),
      readWords: passageWords,
      wpm: measuredWpm,
    };
    setCalibrationInsight(insight);
    setLastInsight(insight);
    setSpeed(measuredWpm);
    setScrollMode("wpm");
    setIsCalibrating(false);
    setCalibrationRemaining(30);
    calibrationStartRef.current = null;
  }

  if (experienceMode === "welcome") {
    return (
      <main className="welcome-shell">
        <section className="welcome-hero" aria-label="LumoCue welcome">
          <nav className="welcome-nav">
            <div>
              <span className="mark">LC</span>
              <strong>LumoCue</strong>
            </div>
            <a href="/signin-with-chatgpt?return_to=%2F">Sign in</a>
          </nav>

          <div className="hero-copy">
            <p className="eyebrow">Teleprompter for Indian creators</p>
            <h1>Speak like yourself. Let the script follow your pace.</h1>
            <p>
              A polished browser teleprompter for teachers, students, coaches,
              founders, and creators recording in English, Hindi, and Marathi.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setExperienceMode("studio")}
              >
                Enter studio
              </button>
              <a href="/signin-with-chatgpt?return_to=%2F">Continue with sign in</a>
            </div>
          </div>

          <div className="hero-preview" aria-label="Product preview">
            <div className="preview-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-stage">
              <p>Calibrate once.</p>
              <p className="active">Read naturally with eye contact.</p>
              <p>Record your clearest take.</p>
            </div>
          </div>
        </section>

        <section className="welcome-features" aria-label="Feature preview">
          <div>
            <strong>Pace calibration</strong>
            <span>Read a short passage, then LumoCue suggests your roll speed.</span>
          </div>
          <div>
            <strong>India-first scripts</strong>
            <span>English, हिन्दी, and मराठी samples are ready without a database.</span>
          </div>
          <div>
            <strong>Studio controls</strong>
            <span>Camera preview, recording, mirror mode, timed scroll, and fullscreen.</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="Script editor">
        <div className="brand-row">
          <div>
            <p className="eyebrow">India-first creator prompter</p>
            <h1>LumoCue</h1>
          </div>
          <div className="status-pill">{lines.length} lines</div>
        </div>

        <div className="creator-intro">
          <p>Read naturally, keep eye contact, and record clean videos in English, Hindi, or Marathi. Everything runs in your browser for now.</p>
          <div className="intro-tags" aria-label="LumoCue highlights">
            <span>Smooth auto-roll</span>
            <span>हिन्दी</span>
            <span>मराठी</span>
            <span>Camera ready</span>
            <span>Local scripts</span>
          </div>
        </div>

        <div className="studio-strip" aria-label="Studio highlights">
          <div>
            <strong>Prompt</strong>
            <span>Paste or import a script</span>
          </div>
          <div>
            <strong>Rehearse</strong>
            <span>Tune roll speed and size</span>
          </div>
          <div>
            <strong>Record</strong>
            <span>Download your browser video</span>
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

        <div className="calibration-card" aria-label="Pace calibration">
          <div className="calibration-header">
            <div>
              <small>Personal pace</small>
              <strong>
                {calibrationInsight
                  ? `${calibrationInsight.wpm} wpm`
                  : "Calibrate before recording"}
              </strong>
            </div>
            <span>{isCalibrating ? `${calibrationRemaining}s` : "30s test"}</span>
          </div>
          <p lang={scriptLanguage === "hindi" ? "hi" : scriptLanguage === "marathi" ? "mr" : "en"}>
            {calibrationPassages[scriptLanguage]}
          </p>
          <div className="calibration-actions">
            <button
              type="button"
              className="primary-button"
              onClick={isCalibrating ? finishCalibration : startCalibration}
            >
              {isCalibrating ? "Finish calibration" : "Start pace test"}
            </button>
            <button
              type="button"
              disabled={!calibrationInsight}
              onClick={() => {
                if (!calibrationInsight) return;
                setSpeed(calibrationInsight.wpm);
                setScrollMode("wpm");
              }}
            >
              Use my pace
            </button>
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
              min="80"
              max="280"
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
                    280,
                    Math.max(80, lastInsight.wpm),
                  )} wpm.`
                : "After you pause or finish, LumoCue estimates your pace and suggests a better roll speed."}
            </span>
          </div>
          <button
            type="button"
            disabled={!lastInsight}
            onClick={() => {
              if (!lastInsight) return;
              setSpeed(Math.min(280, Math.max(80, lastInsight.wpm)));
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
