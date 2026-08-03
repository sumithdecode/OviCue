"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const starterScript = `Today I am practicing clear English communication.

My goal is to speak slowly, breathe naturally, and sound confident.

I will explain one idea at a time.

If I make a mistake, I will pause, smile, and continue.

This video is for learning, teaching, and becoming better every day.`;

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
  const [mirror, setMirror] = useState(false);
  const [dimPast, setDimPast] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => splitLines(script), [script]);
  const wordCount = useMemo(
    () => script.trim().split(/\s+/).filter(Boolean).length,
    [script],
  );
  const estimatedSeconds = Math.max(10, Math.round((wordCount / speed) * 60));
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
          mirror?: boolean;
          dimPast?: boolean;
        };
        if (parsed.script) setScript(parsed.script);
        if (parsed.speed) setSpeed(parsed.speed);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (typeof parsed.mirror === "boolean") setMirror(parsed.mirror);
        if (typeof parsed.dimPast === "boolean") setDimPast(parsed.dimPast);
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
      JSON.stringify({ script, speed, fontSize, mirror, dimPast }),
    );
  }, [dimPast, fontSize, isLoaded, mirror, script, speed]);

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
    const delay = Math.max(900, (currentWords / speed) * 60000);
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
  }, [activeLine, countdown, isRunning, lines, speed]);

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, isRunning]);

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
        setActiveLine(0);
        setIsRunning(false);
        setCountdown(0);
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

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="Script editor">
        <div className="brand-row">
          <div>
            <p className="eyebrow">Daily video practice</p>
            <h1>PromptFlow</h1>
          </div>
          <div className="status-pill">{lines.length} lines</div>
        </div>

        <label className="script-label" htmlFor="script">
          Paste your script
        </label>
        <textarea
          id="script"
          value={script}
          onChange={(event) => {
            setScript(event.target.value);
            setActiveLine(0);
            setIsRunning(false);
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
            <small>estimated</small>
          </div>
          <div>
            <span>{progress}%</span>
            <small>progress</small>
          </div>
        </div>

        <div className="control-stack">
          <label>
            <span>Speaking pace</span>
            <input
              type="range"
              min="8"
              max="28"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <strong>{speed} wpm</strong>
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
        </div>

        <div className="toggle-grid">
          <label>
            <input
              type="checkbox"
              checked={mirror}
              onChange={(event) => setMirror(event.target.checked)}
            />
            <span>Mirror text</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={dimPast}
              onChange={(event) => setDimPast(event.target.checked)}
            />
            <span>Dim completed lines</span>
          </label>
        </div>
      </section>

      <section className="prompt-panel" aria-label="Teleprompter">
        <div className="prompt-toolbar">
          <div>
            <p>Line {Math.min(activeLine + 1, lines.length)} of {lines.length}</p>
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
          className={`prompt-stage ${mirror ? "is-mirrored" : ""}`}
        >
          <div className="camera-guide" aria-hidden="true">
            <span />
            <span />
          </div>
          {countdown > 0 && <div className="countdown">{countdown}</div>}
          {lines.length === 0 ? (
            <div className="empty-state">Paste a script to begin.</div>
          ) : (
            <div className="line-list" style={{ fontSize }}>
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
          <span>Space starts or pauses. Arrow keys move line by line.</span>
        </div>
      </section>
    </main>
  );
}
