"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TrackingProps = Record<string, boolean | number | string>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: TrackingProps) => void;
    };
  }
}

const starterScript = `Every creator knows this moment.

The idea is clear in your mind, the camera is ready, but the words start jumping. You look down, you lose eye contact, you record again, and a simple video suddenly takes one full hour.

OviCue changes that moment.

Paste your script, choose your reading speed, or run the personal pace test so the prompter learns how you naturally speak. Then your words move upward smoothly, like movie credits, while your eyes stay close to the camera.

Use it for lessons, reels, YouTube videos, speeches, sales explainers, English practice, or any video where confidence matters.

Your script stays on your device. You can mirror the text, use camera preview, record in the browser, and practice in English, Hindi, or Marathi.

If you want videos that feel prepared, natural, and professional without complicated setup, OviCue is built for you.`;

type ScrollMode = "wpm" | "timed";
type ScriptLanguage = "english" | "hindi" | "marathi";
type StaticPageMode =
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "accessibility"
  | "help"
  | "changelog"
  | "not-found";
type ExperienceMode = "welcome" | "studio" | StaticPageMode;
type TextAlign = "left" | "center" | "right";
type PermissionIntent = "calibration" | "camera" | "recording";
type SessionInsight = {
  durationSeconds: number;
  readWords: number;
  wpm: number;
};

const productName = "OviCue";
const demoSpeedPresets = [90, 110, 130, 150, 170];
const studioSpeedPresets = [90, 110, 130, 150, 170];
const minCustomWpm = 30;
const maxCustomWpm = 1400;
const feedbackFormBaseUrl = "";
const upiQrPath = "/upi-qr.jpeg";
const lastUpdated = "August 3, 2026";

const landingDemoScript = `This is a real teleprompter, not a picture of one.

The text is moving at one hundred and thirty words a minute -- about the speed of a teacher explaining something.

Speed two is calm practice. Speed four is a fast creator read. The number beside it is real words per minute, so it means something.

Turn on mirror mode if you shoot through beam-splitter glass. The reflection flips the text, so we flip it first.

Click the text to edit it. Paste your own script and read it right here, before you sign up for anything. Because you never have to.`;

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

const routeModes: Record<string, ExperienceMode> = {
  "/": "welcome",
  "/prompt": "studio",
  "/about": "about",
  "/contact": "contact",
  "/privacy": "privacy",
  "/terms": "terms",
  "/accessibility": "accessibility",
  "/help": "help",
  "/changelog": "changelog",
};

function modeToPath(mode: ExperienceMode) {
  if (mode === "welcome") return "/";
  if (mode === "studio") return "/prompt";
  if (mode === "not-found") return "/404";
  return `/${mode}`;
}

function splitLines(text: string) {
  const cueLines: string[] = [];
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let current: string[] = [];

      words.forEach((word) => {
        current.push(word);
        const hasNaturalBreak = /[.!?।,:;]$/.test(word);
        const shouldBreak =
          current.length >= 12 || (current.length >= 7 && hasNaturalBreak);

        if (shouldBreak) {
          cueLines.push(current.join(" "));
          current = [];
        }
      });

      if (current.length > 0) cueLines.push(current.join(" "));
    });

  return cueLines;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.floor(totalSeconds % 60));
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trackEvent(eventName: string, eventData?: TrackingProps) {
  if (typeof window === "undefined") return;
  window.umami?.track(eventName, eventData);
}

function CueDivider({ label }: { label: string }) {
  return (
    <div className="ovi-cue">
      <i />
      <span />
      <strong className="ovi-mono">{label}</strong>
      <span />
      <i />
    </div>
  );
}

function FeatureRow({
  title,
  copy,
  reverse = false,
  visual,
}: {
  title: string;
  copy: string;
  reverse?: boolean;
  visual: ReactNode;
}) {
  return (
    <div className={reverse ? "ovi-split reverse" : "ovi-split"}>
      <div>
        <h2>{title}</h2>
        <p className="ovi-lead">{copy}</p>
      </div>
      {visual}
    </div>
  );
}

function PlanCard({
  label,
  price,
  suffix,
  items,
  action,
  hot = false,
  onClick,
}: {
  label: string;
  price: string;
  suffix: string;
  items: string[];
  action: string;
  hot?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={hot ? "ovi-plan hot" : "ovi-plan"}>
      <span className="ovi-mono">{label}</span>
      <div className="ovi-price">
        {price}
        {suffix && <small>{suffix}</small>}
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        type="button"
        className={hot ? "ovi-btn ovi-btn-dark" : "ovi-btn ovi-btn-ghost"}
        onClick={onClick}
      >
        {action}
      </button>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="ovi-info-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function StaticPage({
  mode,
  onNavigate,
}: {
  mode: StaticPageMode;
  onNavigate: (mode: ExperienceMode) => void;
}) {
  const pageContent: Record<StaticPageMode, ReactNode> = {
    about: (
      <>
        <span className="ovi-mono">About OviCue</span>
        <h1>One person, one problem, one page.</h1>
        <p className="ovi-lead">
          OviCue was built because too many teleprompters ask for an account,
          watermark the result, or charge for simple mirror mode. This one is
          for creators, teachers, students, and speakers who need to paste a
          script and read clearly.
        </p>
        <InfoCard title="Why it stays free">
          <p>
            The core prompter is a public tool: paste, rehearse, pace-test,
            full screen, mirror, camera preview, and local recording. Paid
            features can come later for syncing scripts across devices.
          </p>
        </InfoCard>
        <InfoCard title="Where your scripts live">
          <p>
            In this version, scripts stay in your browser on your device. OviCue
            does not upload your script text to a database.
          </p>
        </InfoCard>
        <InfoCard title="What it is not">
          <p>
            It is not a social app, not an ad network, and not a place that
            reads your script for data. It is a focused reading surface.
          </p>
        </InfoCard>
        <InfoCard title="Who is behind it">
          <p>
            Built from Pune for Indian creators first, with English interface
            support and Hindi and Marathi reading samples.
          </p>
        </InfoCard>
      </>
    ),
    contact: (
      <>
        <span className="ovi-mono">Contact</span>
        <h1>Get in touch.</h1>
        <p className="ovi-lead">
          One person reads everything here. Send broken flows, missing features,
          confusing screens, or anything that would make OviCue better.
        </p>
        <div className="ovi-info-grid">
          <InfoCard title="Something is broken">
            <p>Tell us the device, browser, what you clicked, and what happened.</p>
          </InfoCard>
          <InfoCard title="Something is missing">
            <p>Suggest the feature that would save you time while recording.</p>
          </InfoCard>
          <InfoCard title="Anything else">
            <p>Use the feedback button on the home page until the form is connected.</p>
          </InfoCard>
        </div>
        <p className="ovi-muted">
          Please do not send private scripts or sensitive personal information
          through feedback.
        </p>
      </>
    ),
    privacy: (
      <>
        <span className="ovi-mono">Last updated {lastUpdated}</span>
        <h1>Privacy policy.</h1>
        <p className="ovi-lead">
          OviCue is designed so the teleprompter can run smoothly without a
          database. The important rule: your script text stays on your device in
          this version.
        </p>
        <InfoCard title="Scripts">
          <p>
            Scripts are stored in your browser local storage so they are still
            there when you return on the same device. We do not receive or read
            the script text.
          </p>
        </InfoCard>
        <InfoCard title="Camera and microphone">
          <p>
            Microphone access is requested for pace testing. Camera access is
            requested only for camera preview or recording. Browser recording
            happens on your device and downloads from your browser.
          </p>
        </InfoCard>
        <InfoCard title="Analytics">
          <p>
            OviCue may use privacy-friendly anonymous analytics to understand
            visits, button clicks, and errors. It does not track your script
            content.
          </p>
        </InfoCard>
        <InfoCard title="Payments and accounts">
          <p>
            Payments and login are not active yet. When added, they will use
            third-party services with their own policies.
          </p>
        </InfoCard>
        <InfoCard title="Rights">
          <p>
            If you are in India, the Digital Personal Data Protection Act, 2023
            may apply. If you are in the EU or UK, GDPR-style rights may apply.
            A real support email will be added before accounts or payments go live.
          </p>
        </InfoCard>
      </>
    ),
    terms: (
      <>
        <span className="ovi-mono">Last updated {lastUpdated}</span>
        <h1>Terms of service.</h1>
        <p className="ovi-lead">
          Use OviCue for lawful speaking, teaching, rehearsal, and content creation.
          The tool is provided as-is while the product is being improved.
        </p>
        <InfoCard title="Your content">
          <p>
            You own the scripts you write or paste. You are responsible for
            having rights to use that content.
          </p>
        </InfoCard>
        <InfoCard title="No guarantees">
          <p>
            OviCue should help you rehearse and record, but you should test it
            before important live work. Browser permissions, recording, and
            fullscreen behavior can vary by device.
          </p>
        </InfoCard>
        <InfoCard title="Payments later">
          <p>
            Paid plans are not active now. Any future paid plan will show its
            price, renewal terms, and cancellation rules before purchase.
          </p>
        </InfoCard>
        <InfoCard title="Governing law">
          <p>
            These terms are governed by the laws of India, with courts in Pune,
            Maharashtra, unless another rule is required by law.
          </p>
        </InfoCard>
      </>
    ),
    accessibility: (
      <>
        <span className="ovi-mono">Accessibility</span>
        <h1>Built to be readable.</h1>
        <p className="ovi-lead">
          OviCue is a reading tool, so accessibility starts with clean contrast,
          keyboard controls, visible focus, responsive layout, and adjustable
          text size.
        </p>
        <InfoCard title="What is built in">
          <p>
            Keyboard play and pause, adjustable font size, alignment controls,
            reduced-motion support, labels for controls, and no horizontal page
            scroll on supported screens.
          </p>
        </InfoCard>
        <InfoCard title="What needs work">
          <p>
            More screen-reader testing, better captions around recording
            downloads, and a dedicated feedback form for accessibility issues.
          </p>
        </InfoCard>
      </>
    ),
    help: (
      <>
        <span className="ovi-mono">Guides</span>
        <h1>Small guides for better videos.</h1>
        <div className="ovi-info-grid">
          <InfoCard title="Hardware rig">
            <p>Use mirror mode when reading through teleprompter glass.</p>
          </InfoCard>
          <InfoCard title="Phone setup">
            <p>Keep the prompter close to the camera lens so your eyes stay natural.</p>
          </InfoCard>
          <InfoCard title="Scroll speed">
            <p>Start at speed 2 or 3. Use the 60-second pace test for a personal WPM.</p>
          </InfoCard>
          <InfoCard title="Mirror mode">
            <p>Horizontal flip is for glass. Vertical flip helps with some mounted rigs.</p>
          </InfoCard>
          <InfoCard title="Keyboard">
            <p>Space starts or pauses. Arrow keys move line by line when practicing.</p>
          </InfoCard>
          <InfoCard title="Offline">
            <p>After the page loads, the app shell can reopen from browser cache.</p>
          </InfoCard>
        </div>
      </>
    ),
    changelog: (
      <>
        <span className="ovi-mono">Changelog</span>
        <h1>What changed.</h1>
        <InfoCard title="August 3, 2026">
          <p>
            Added continuous credit-style scrolling, pace testing, Hindi and
            Marathi samples, UPI support, camera permission primer, fullscreen
            controls, and a public website structure.
          </p>
        </InfoCard>
        <InfoCard title="Next">
          <p>
            Feedback inbox, saved scripts, real account login, custom domain,
            and optional paid syncing.
          </p>
        </InfoCard>
      </>
    ),
    "not-found": (
      <>
        <span className="ovi-mono">404</span>
        <h1>That page is not here.</h1>
        <p className="ovi-lead">
          The prompter is ready. The page you opened is not.
        </p>
      </>
    ),
  };

  return (
    <main className="ovi-page">
      <nav className="ovi-nav">
        <div className="ovi-wrap">
          <button
            type="button"
            className="ovi-brand ovi-brand-button"
            onClick={() => onNavigate("welcome")}
            aria-label="Open OviCue front page"
          >
            <i /> {productName}
          </button>
          <div className="ovi-navlinks">
            <button type="button" onClick={() => onNavigate("about")}>About</button>
            <button type="button" onClick={() => onNavigate("help")}>Help</button>
            <button type="button" onClick={() => onNavigate("contact")}>Contact</button>
          </div>
          <button
            type="button"
            className="ovi-btn ovi-btn-dark ovi-btn-sm"
            onClick={() => onNavigate("studio")}
          >
            Start prompting
          </button>
        </div>
      </nav>
      <section className="ovi-section ovi-static-page">
        <div className="ovi-wrap">
          {pageContent[mode]}
          <div className="ovi-static-actions">
            <button
              type="button"
              className="ovi-btn ovi-btn-dark"
              onClick={() => onNavigate("studio")}
            >
              Start prompting
            </button>
            <button
              type="button"
              className="ovi-btn ovi-btn-ghost"
              onClick={() => onNavigate("welcome")}
            >
              Back to front page
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [experienceMode, setExperienceMode] =
    useState<ExperienceMode>("welcome");
  const [script, setScript] = useState(starterScript);
  const [activeLine, setActiveLine] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(145);
  const [customSpeedValue, setCustomSpeedValue] = useState("145");
  const [fontSize, setFontSize] = useState(52);
  const [textAlign, setTextAlign] = useState<TextAlign>("center");
  const [textWeight, setTextWeight] = useState(800);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const [permissionIntent, setPermissionIntent] =
    useState<PermissionIntent | null>(null);
  const [permissionPrimed, setPermissionPrimed] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [lastInsight, setLastInsight] = useState<SessionInsight | null>(null);
  const [calibrationInsight, setCalibrationInsight] =
    useState<SessionInsight | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationRemaining, setCalibrationRemaining] = useState(60);
  const [isLoaded, setIsLoaded] = useState(false);
  const [demoText, setDemoText] = useState(landingDemoScript);
  const [demoWpm, setDemoWpm] = useState(130);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoMirror, setDemoMirror] = useState(false);
  const [demoEditing, setDemoEditing] = useState(false);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const lineListRef = useRef<HTMLDivElement | null>(null);
  const rollContentRef = useRef<HTMLDivElement | null>(null);
  const promptPanelRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const demoTrackRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationRef = useRef<number | null>(null);
  const demoAnimationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const demoLastFrameRef = useRef<number | null>(null);
  const demoOffsetRef = useRef(0);
  const rollOffsetRef = useRef(0);
  const rollProgressRef = useRef(0);
  const activeLineRef = useRef(0);
  const promptFinishedTrackedRef = useRef(false);
  const scriptPastedTrackedRef = useRef(false);
  const textEditedTrackedRef = useRef(false);
  const demoPlayingRef = useRef(false);
  const demoEditingRef = useRef(false);
  const sessionStartRef = useRef<number | null>(null);
  const calibrationStartRef = useRef<number | null>(null);

  function goTo(mode: ExperienceMode) {
    setExperienceMode(mode);
    if (typeof window === "undefined") return;
    const nextPath = modeToPath(mode);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const lines = useMemo(() => splitLines(script), [script]);
  const demoLines = useMemo(() => splitLines(demoText), [demoText]);
  const demoWordCount = useMemo(() => countWords(demoText), [demoText]);
  const demoDuration = Math.max(1, Math.round((demoWordCount / demoWpm) * 60));
  const feedbackUrl = useMemo(() => {
    if (!feedbackFormBaseUrl) return "#feedback";
    if (typeof navigator === "undefined") return feedbackFormBaseUrl;
    const query = new URLSearchParams({ ua: navigator.userAgent });
    return `${feedbackFormBaseUrl}?${query.toString()}`;
  }, []);
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
  const customSpeedSelected = !studioSpeedPresets.some(
    (preset) => Math.abs(speed - preset) < 13,
  );

  useEffect(() => {
    function syncRoute() {
      const pathname = window.location.pathname.replace(/\/$/, "") || "/";
      setExperienceMode(routeModes[pathname] ?? "not-found");
    }

    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("daily-prompter-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          script?: string;
          speed?: number;
          fontSize?: number;
          textAlign?: TextAlign;
          textWeight?: number;
          textItalic?: boolean;
          textUnderline?: boolean;
          scrollMode?: ScrollMode;
          targetMinutes?: number;
          mirrorHorizontal?: boolean;
          mirrorVertical?: boolean;
          dimPast?: boolean;
          textPosition?: number;
          scriptLanguage?: ScriptLanguage;
          calibrationInsight?: SessionInsight;
        };
        // Restoring local draft state once on mount is intentional for the offline prompter.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.script) setScript(parsed.script);
        if (parsed.speed) {
          const savedSpeed = Math.min(
            maxCustomWpm,
            Math.max(minCustomWpm, parsed.speed < 40 ? 120 : parsed.speed),
          );
          setSpeed(savedSpeed);
          setCustomSpeedValue(String(savedSpeed));
        }
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.textAlign) setTextAlign(parsed.textAlign);
        if (parsed.textWeight) setTextWeight(parsed.textWeight);
        if (typeof parsed.textItalic === "boolean") setTextItalic(parsed.textItalic);
        if (typeof parsed.textUnderline === "boolean") setTextUnderline(parsed.textUnderline);
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
          const savedPace = Math.min(
            maxCustomWpm,
            Math.max(minCustomWpm, parsed.calibrationInsight.wpm),
          );
          setSpeed(savedPace);
          setCustomSpeedValue(String(savedPace));
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
        textAlign,
        textWeight,
        textItalic,
        textUnderline,
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
    textAlign,
    textItalic,
    textUnderline,
    textWeight,
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
    activeLineRef.current = activeLine;
  }, [activeLine]);

  useEffect(() => {
    demoPlayingRef.current = demoPlaying;
    demoEditingRef.current = demoEditing;
  }, [demoEditing, demoPlaying]);

  useEffect(() => {
    if (experienceMode !== "welcome") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setDemoPlaying(true), 1400);
    return () => window.clearTimeout(timer);
  }, [experienceMode]);

  useEffect(() => {
    if (experienceMode !== "welcome") return;

    function tick(now: number) {
      const track = demoTrackRef.current;
      if (!track) return;
      if (demoLastFrameRef.current === null) demoLastFrameRef.current = now;
      const deltaSeconds = Math.min(
        (now - demoLastFrameRef.current) / 1000,
        0.05,
      );
      demoLastFrameRef.current = now;

      const words = Math.max(1, countWords(track.innerText));
      const trackHeight = Math.max(
        1,
        track.scrollHeight - track.offsetHeight * 0.6,
      );
      const pixelsPerSecond = (demoWpm / 60) * (trackHeight / words);

      if (demoPlayingRef.current && !demoEditingRef.current) {
        demoOffsetRef.current += pixelsPerSecond * deltaSeconds;
        if (demoOffsetRef.current > track.scrollHeight - 60) {
          demoOffsetRef.current = 0;
        }
      }

      track.style.transform = `translate3d(-50%, ${-demoOffsetRef.current}px, 0) scaleX(${
        demoMirror ? -1 : 1
      })`;
      demoAnimationRef.current = requestAnimationFrame(tick);
    }

    demoAnimationRef.current = requestAnimationFrame(tick);
    return () => {
      if (demoAnimationRef.current) cancelAnimationFrame(demoAnimationRef.current);
      demoAnimationRef.current = null;
      demoLastFrameRef.current = null;
    };
  }, [demoMirror, demoWpm, experienceMode]);

  useEffect(() => {
    function handleDemoKeys(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        experienceMode !== "welcome" ||
        demoEditingRef.current ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT"
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setDemoPlaying((value) => !value);
      }

      if (event.code === "ArrowUp") {
        event.preventDefault();
        setDemoWpm((value) => Math.min(250, value + 10));
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();
        setDemoWpm((value) => Math.max(60, value - 10));
      }
    }

    window.addEventListener("keydown", handleDemoKeys);
    return () => window.removeEventListener("keydown", handleDemoKeys);
  }, [experienceMode]);

  useEffect(() => {
    if (!isRunning || countdown > 0 || lines.length === 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    function tick(now: number) {
      const list = lineListRef.current;
      const content = rollContentRef.current;
      if (!list || !content) return;

      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const deltaSeconds = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const totalScrollable = Math.max(
        0,
        content.scrollHeight - list.clientHeight,
      );
      if (totalScrollable <= 0) {
        content.style.transform = `translate3d(0, 0, 0) scale(${
          mirrorHorizontal ? -1 : 1
        }, ${mirrorVertical ? -1 : 1})`;
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      const wpmPixelsPerSecond = Math.min(520, Math.max(10, speed * 0.28));
      const pixelsPerSecond =
        scrollMode === "timed"
          ? Math.min(96, Math.max(18, totalScrollable / estimatedSeconds))
          : wpmPixelsPerSecond;
      const nextOffset = Math.min(
        totalScrollable,
        rollOffsetRef.current + pixelsPerSecond * deltaSeconds,
      );
      rollOffsetRef.current = nextOffset;
      rollProgressRef.current = nextOffset / totalScrollable;
      content.style.transform = `translate3d(0, ${-nextOffset}px, 0) scale(${
        mirrorHorizontal ? -1 : 1
      }, ${mirrorVertical ? -1 : 1})`;

      const cueLineY = nextOffset + list.clientHeight * (textPosition / 100);
      let nextActiveLine = activeLineRef.current;
      for (let index = 0; index < lineRefs.current.length; index += 1) {
        const line = lineRefs.current[index];
        if (!line) continue;
        if (line.offsetTop <= cueLineY) {
          nextActiveLine = index;
        } else {
          break;
        }
      }

      if (nextActiveLine !== activeLineRef.current) {
        activeLineRef.current = nextActiveLine;
        setActiveLine(nextActiveLine);
      }

      if (!promptFinishedTrackedRef.current && rollProgressRef.current >= 0.9) {
        promptFinishedTrackedRef.current = true;
        trackEvent("prompt_finished", {
          progress: 90,
          speed,
          words: wordCount,
        });
      }

      if (nextOffset >= totalScrollable - 1) {
        activeLineRef.current = lines.length - 1;
        setActiveLine(lines.length - 1);
        finishSession(wordCount);
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
    mirrorHorizontal,
    mirrorVertical,
    scrollMode,
    speed,
    textPosition,
    wordCount,
  ]);

  useEffect(() => {
    function trackAbandonedPrompt() {
      if (isRunning && rollProgressRef.current < 0.25) {
        trackEvent("prompt_abandoned", {
          progress: Math.round(rollProgressRef.current * 100),
        });
      }
    }

    window.addEventListener("pagehide", trackAbandonedPrompt);
    return () => window.removeEventListener("pagehide", trackAbandonedPrompt);
  }, [isRunning]);

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
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === promptPanelRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (experienceMode !== "studio") return;
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
            return false;
          } else {
            startPrompt();
            return true;
          }
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
  }, [experienceMode, lines.length]);

  function startPrompt() {
    if (lines.length === 0) return;
    promptFinishedTrackedRef.current = false;
    trackEvent("prompt_started", {
      speed,
      words: wordCount,
    });
    if (activeLine >= lines.length - 1) {
      setActiveLine(0);
      activeLineRef.current = 0;
      if (lineListRef.current) lineListRef.current.scrollTop = 0;
      if (rollContentRef.current) {
        rollOffsetRef.current = 0;
        rollContentRef.current.style.transform = "";
      }
    } else if (activeLine === 0 && lineListRef.current) {
      activeLineRef.current = 0;
      lineListRef.current.scrollTop = 0;
      if (rollContentRef.current) {
        rollOffsetRef.current = 0;
        rollContentRef.current.style.transform = "";
      }
    }
    sessionStartRef.current = performance.now();
    setCountdown(0);
    setIsRunning(true);
  }

  function resetPrompt() {
    finishSession();
    setIsRunning(false);
    setCountdown(0);
    setActiveLine(0);
    promptFinishedTrackedRef.current = false;
    rollProgressRef.current = 0;
    activeLineRef.current = 0;
    if (lineListRef.current) lineListRef.current.scrollTop = 0;
    rollOffsetRef.current = 0;
    if (rollContentRef.current) rollContentRef.current.style.transform = "";
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

  function finishSession(readWordsOverride?: number) {
    if (sessionStartRef.current === null) return;
    const durationSeconds = Math.max(
      1,
      (performance.now() - sessionStartRef.current) / 1000,
    );
    if (durationSeconds < 8) {
      sessionStartRef.current = null;
      return;
    }
    const readWords = Math.min(
      wordCount,
      Math.max(1, readWordsOverride ?? wordsRead),
    );
    const measuredWpm = Math.max(1, Math.round((readWords / durationSeconds) * 60));
    setLastInsight({
      durationSeconds: Math.round(durationSeconds),
      readWords,
      wpm: measuredWpm,
    });
    sessionStartRef.current = null;
  }

  async function goFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    await promptPanelRef.current?.requestFullscreen?.();
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
      trackEvent("camera_allowed");
      return true;
    } catch {
      setCameraError("Camera or microphone permission was blocked.");
      setCameraEnabled(false);
      trackEvent("camera_denied");
      return false;
    }
  }

  async function startMicrophone() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      micStreamRef.current = stream;
      trackEvent("microphone_allowed");
      return true;
    } catch {
      setCameraError("Microphone permission was blocked.");
      trackEvent("microphone_denied");
      return false;
    }
  }

  async function requestPersonalSpace(intent: PermissionIntent) {
    setPermissionIntent(intent);
  }

  async function acceptPersonalSpace() {
    const intent = permissionIntent;
    setPermissionIntent(null);
    setPermissionPrimed(true);

    if (intent === "calibration") {
      const allowed = await startMicrophone();
      if (allowed) startCalibrationCore();
      return;
    }

    if (intent === "camera") {
      await startCamera();
      return;
    }

    if (intent === "recording") {
      await startRecordingCore();
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

    if (!permissionPrimed && !streamRef.current) {
      requestPersonalSpace("recording");
      return;
    }

    await startRecordingCore();
  }

  async function startRecordingCore() {
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
    trackEvent("recording_started");
    startPrompt();
  }

  async function importScript(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setScript(text);
    if (!scriptPastedTrackedRef.current) {
      scriptPastedTrackedRef.current = true;
      trackEvent("script_pasted");
    }
    if (!textEditedTrackedRef.current) {
      textEditedTrackedRef.current = true;
      trackEvent("text_edited");
    }
    resetPrompt();
  }

  function applyLanguageSample(language: ScriptLanguage) {
    setScriptLanguage(language);
    setScript(languageSamples[language]);
    resetPrompt();
  }

  function startCalibration() {
    if (!micStreamRef.current) {
      requestPersonalSpace("calibration");
      return;
    }
    startCalibrationCore();
  }

  function startCalibrationCore() {
    if (script.trim().length === 0) {
      setScript(starterScript);
    }
    resetPrompt();
    setCalibrationRemaining(60);
    calibrationStartRef.current = performance.now();
    setIsCalibrating(true);
    window.setTimeout(() => {
      startPrompt();
    }, 0);
  }

  function finishCalibration() {
    if (calibrationStartRef.current === null) return;
    const elapsedSeconds = Math.max(
      5,
      (performance.now() - calibrationStartRef.current) / 1000,
    );
    const passageWords = Math.min(
      countWords(script.trim() ? script : starterScript),
      Math.max(1, wordsRead),
    );
    const measuredWpm = Math.max(
      80,
      Math.min(maxCustomWpm, Math.round((passageWords / elapsedSeconds) * 60)),
    );
    const insight = {
      durationSeconds: Math.round(elapsedSeconds),
      readWords: passageWords,
      wpm: measuredWpm,
    };
    setCalibrationInsight(insight);
    setLastInsight(insight);
    setSpeed(measuredWpm);
    setCustomSpeedValue(String(measuredWpm));
    setScrollMode("wpm");
    trackEvent("pace_test_completed", {
      wpm: measuredWpm,
      seconds: insight.durationSeconds,
    });
    setIsCalibrating(false);
    setCalibrationRemaining(60);
    calibrationStartRef.current = null;
  }

  function chooseStudioSpeed(preset: number, level: number) {
    setSpeed(preset);
    setCustomSpeedValue(String(preset));
    setScrollMode("wpm");
    trackEvent("speed_changed", {
      speed: level,
      wpm: preset,
    });
  }

  function chooseCustomSpeed(value: string) {
    setCustomSpeedValue(value);
    if (value.trim() === "") return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const customWpm = Math.min(
      maxCustomWpm,
      Math.max(minCustomWpm, Math.round(parsed)),
    );
    setSpeed(customWpm);
    setScrollMode("wpm");
    trackEvent("speed_changed", {
      speed: "custom",
      wpm: customWpm,
    });
  }

  function commitCustomSpeed() {
    if (customSpeedValue.trim() === "") {
      setCustomSpeedValue(String(speed));
      return;
    }
    setCustomSpeedValue(String(speed));
  }

  function trackTextEditedOnce() {
    if (textEditedTrackedRef.current) return;
    textEditedTrackedRef.current = true;
    trackEvent("text_edited");
  }

  function trackScriptPastedOnce() {
    if (scriptPastedTrackedRef.current) return;
    scriptPastedTrackedRef.current = true;
    trackEvent("script_pasted");
  }

  function handleFeedbackClick() {
    trackEvent("feedback_clicked");
  }

  function openFeedback(event: MouseEvent<HTMLAnchorElement>) {
    handleFeedbackClick();
    if (!feedbackFormBaseUrl) return;
    event.currentTarget.href = feedbackUrl;
  }

  if (
    experienceMode !== "welcome" &&
    experienceMode !== "studio"
  ) {
    return <StaticPage mode={experienceMode} onNavigate={goTo} />;
  }

  if (experienceMode === "welcome") {
    return (
      <main className="ovi-page">
        <nav className="ovi-nav">
          <div className="ovi-wrap">
            <a className="ovi-brand" href="#top" aria-label="OviCue home">
              <i /> {productName}
            </a>
            <div className="ovi-navlinks">
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#free">What&apos;s free</a>
              <button type="button" onClick={() => goTo("about")}>About</button>
              <button type="button" onClick={() => goTo("help")}>Help</button>
            </div>
            <button
              type="button"
              className="ovi-btn ovi-btn-dark ovi-btn-sm"
              onClick={() => goTo("studio")}
            >
              Start prompting
            </button>
          </div>
        </nav>

        <header className="ovi-hero" id="top">
          <div className="ovi-wrap">
            <span className="ovi-pill ovi-mono ovi-reveal">
              Free · <b>no signup</b> · works offline
            </span>
            <h1 className="ovi-reveal delay-1">
              Paste your script.
              <em>Start reading.</em>
            </h1>
            <p className="ovi-lead ovi-reveal delay-2">
              Add your text, choose Scroll Speed 1 to 5, and let it roll upward
              smoothly while you speak. Built for creators, teachers, and
              students who want clean videos without setup drama.
            </p>
            <div className="ovi-cta-row ovi-reveal delay-3">
              <button
                type="button"
                className="ovi-btn ovi-btn-dark"
                onClick={() => goTo("studio")}
              >
                Start prompting -- it&apos;s free
              </button>
              <a className="ovi-btn ovi-btn-ghost" href="#how">
                See how it works
              </a>
            </div>
            <div className="ovi-hero-note ovi-reveal delay-4">
              <span className="ovi-chip ovi-mono">Phone, laptop, tablet</span>
              <span className="ovi-chip ovi-mono">Scripts stay on your device</span>
              <span className="ovi-chip ovi-mono">No watermark</span>
            </div>
          </div>
        </header>

        <section className="ovi-wrap ovi-rig" id="rig" aria-label="Live teleprompter preview">
          <div className="ovi-glass ovi-reveal delay-5">
            <div className={demoPlaying ? "ovi-stage dim" : "ovi-stage"}>
              <div
                ref={demoTrackRef}
                className="ovi-track"
                contentEditable={demoEditing}
                suppressContentEditableWarning
                tabIndex={0}
                onClick={() => {
                  setDemoPlaying(false);
                  setDemoEditing(true);
                  demoOffsetRef.current = 0;
                }}
                onBlur={(event) => {
                  setDemoEditing(false);
                  setDemoText(event.currentTarget.innerText);
                }}
                onInput={(event) => {
                  setDemoText(event.currentTarget.innerText);
                  trackTextEditedOnce();
                }}
              >
                {demoLines.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
              <div className="ovi-cueline" />
              <div className="ovi-fade-top" />
              <div className="ovi-fade-bottom" />
            </div>
            <div className="ovi-deck">
              <button
                type="button"
                className="ovi-key play"
                onClick={() => setDemoPlaying((value) => !value)}
              >
                {demoPlaying ? "Pause" : "Play"}
              </button>
              <div className="ovi-speed-bank" aria-label="Scroll speed">
                <span>Scroll Speed</span>
                {demoSpeedPresets.map((preset, index) => (
                  <button
                    key={preset}
                    type="button"
                    className={Math.abs(demoWpm - preset) < 8 ? "selected" : ""}
                    aria-pressed={Math.abs(demoWpm - preset) < 8}
                    onClick={() => {
                      setDemoWpm(preset);
                      trackEvent("speed_changed", {
                        speed: index + 1,
                        wpm: preset,
                      });
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="ovi-key"
                aria-pressed={demoMirror}
                aria-label="Mirror mode"
                onClick={() =>
                  setDemoMirror((value) => {
                    if (!value) trackEvent("mirror_toggled");
                    return !value;
                  })
                }
              >
                ⇋
              </button>
              <button
                type="button"
                className="ovi-key"
                aria-label="Back to start"
                onClick={() => {
                  demoOffsetRef.current = 0;
                  if (demoTrackRef.current) {
                    demoTrackRef.current.style.transform = `translate3d(-50%, 0, 0) scaleX(${
                      demoMirror ? -1 : 1
                    })`;
                  }
                }}
              >
                ↺
              </button>
              <div className="ovi-spacer" />
              <div className="ovi-readout">
                <b>{demoWpm}</b> wpm <span>·</span> <span>{demoWordCount}</span>{" "}
                words <span>·</span> <span>{formatTime(demoDuration)}</span>
              </div>
            </div>
          </div>
          <p className="ovi-mono ovi-shortcut">
            Space = play · ↑ ↓ = speed · click the text to edit
          </p>
        </section>

        <section className="ovi-section" id="how">
          <div className="ovi-wrap">
            <CueDivider label="How it works" />
            <h2>Three steps. No account in any of them.</h2>
            <div className="ovi-grid">
              <div className="ovi-card">
                <span className="ovi-mono">Step one</span>
                <h3>Paste the script</h3>
                <p>
                  Type it, paste it, or drop in a text file. Word count and read
                  time appear as you write, so a 60-second reel script is 60
                  seconds before you record it.
                </p>
              </div>
              <div className="ovi-card">
                <span className="ovi-mono">Step two</span>
                <h3>Set your speed</h3>
                <p>
                  Pick speed 1 to 5 for a quick start, or type your exact
                  custom WPM when you already know your rhythm. Read time
                  updates as you type.
                </p>
              </div>
              <div className="ovi-card">
                <span className="ovi-mono">Step three</span>
                <h3>Read</h3>
                <p>
                  Full screen, black background, cue line at 38% so your eyes
                  stay near the lens. Space bar pauses.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="ovi-section no-top" id="features">
          <div className="ovi-wrap">
            <CueDivider label="Built for the way people actually shoot" />
            <FeatureRow
              title="Mirror mode, both ways"
              copy="Beam-splitter glass flips your text left to right. Rigs mounted above the lens flip it top to bottom. Both toggles are here, and both are free."
              visual={<div className="ovi-mini flip">Read me in the glass<div className="ovi-cueline" /></div>}
            />
            <FeatureRow
              reverse
              title="We ask before the browser does"
              copy="Before pace testing, camera preview, or recording, OviCue shows a personal space message. Then the browser asks for access. Your script stays on this device."
              visual={<div className="ovi-mini call"><span>Camera + mic only when you allow.</span></div>}
            />
            <FeatureRow
              title="It learns your pace"
              copy="Read a short passage for 60 seconds. The studio estimates your words per minute and lets you apply that speed to the real teleprompter."
              visual={<div className="ovi-mini tracking"><small>01:00 SAMPLE</small><span>and that is why we changed the process</span><span>which took about six weeks in total</span><b>▸ YOUR PACE · 128 WPM</b></div>}
            />
          </div>
        </section>

        <section className="ovi-section no-top" id="free">
          <div className="ovi-wrap">
            <div className="ovi-free">
              <h2>Free means free. Here is the whole list.</h2>
              <ul>
                <li>Scripts of any length</li>
                <li>Unlimited prompting time</li>
                <li>Mirror horizontal and vertical</li>
                <li>Every font and size</li>
                <li>Camera preview behind the text</li>
                <li>Full screen reading mode</li>
                <li>English, Hindi, and Marathi samples</li>
                <li>60-second pace calibration</li>
                <li>Browser recording download</li>
                <li>No watermark on anything</li>
                <li>Works with no internet once the page has loaded</li>
                <li>No account, ever, if you don&apos;t want one</li>
              </ul>
              <p>Nothing on that list will move behind a paywall later.</p>
            </div>
          </div>
        </section>

        <section className="ovi-section no-top">
          <div className="ovi-wrap">
            <CueDivider label="Who reads with it" />
            <div className="ovi-strip">
              {[
                "News desks",
                "YouTubers",
                "Reels and Shorts",
                "Teachers",
                "Online tutors",
                "Corporate trainers",
                "Keynote speakers",
                "Podcasters",
                "Doctors and lawyers",
                "Students rehearsing",
                "Speakers who need it slower",
                "People practicing English",
              ].map((item) => (
                <span className="ovi-chip" key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="ovi-section no-top" id="pricing">
          <div className="ovi-wrap">
            <CueDivider label="Pricing" />
            <h2>Pay only when you want it on every device.</h2>
            <div className="ovi-plans">
              <PlanCard
                label="Free"
                price="₹0"
                suffix=" forever"
                items={["Everything in the list above", "Saved in this browser", "Five-minute recordings", "No signup"]}
                action="Start prompting"
                onClick={() => goTo("studio")}
              />
              <PlanCard
                hot
                label="Pro"
                price="Coming soon"
                suffix=""
                items={["Voice tracking", "Sync across your devices", "Recordings of any length", "Share scripts by link", "Phone as a remote control"]}
                action="Join later"
                onClick={() => goTo("studio")}
              />
              <PlanCard
                label="Team"
                price="Coming soon"
                suffix=""
                items={["Everything in Pro", "Shared script library", "Roles and brand presets", "Team seats"]}
                action="Talk later"
                onClick={() => goTo("studio")}
              />
            </div>
          </div>
        </section>

        <section className="ovi-section no-top">
          <div className="ovi-wrap ovi-faq">
            <CueDivider label="Questions" />
            <details open>
              <summary>Do I need to sign up?</summary>
              <p>No. Open the page, paste, read. An account can come later only so a script written on your laptop shows up on your phone.</p>
            </details>
            <details>
              <summary>Where do my scripts go?</summary>
              <p>Into your browser&apos;s own storage on this device. Nothing is uploaded in this version. You can import and keep working locally. We count anonymous visits and which buttons get pressed, so we know what to fix. Your script text is never sent, never stored, and never seen by us.</p>
            </details>
            <details>
              <summary>Will my recording have a watermark?</summary>
              <p>No. The browser recording is downloaded directly from your device.</p>
            </details>
            <details>
              <summary>Does it work on a phone?</summary>
              <p>Yes, including the front camera and one-handed controls. The layout is built to work down to small screens.</p>
            </details>
            <details>
              <summary>Can I use it with a hardware teleprompter?</summary>
              <p>Yes. Turn on mirror mode, go full screen, and lay the tablet or laptop face-up under the glass. Vertical flip, for rigs mounted above the lens, is coming next.</p>
            </details>
            <details>
              <summary>What about other languages?</summary>
              <p>English, Hindi, and Marathi samples are included. The interface stays English-first for Indian creators.</p>
            </details>
          </div>
        </section>

        <section className="ovi-section no-top">
          <div className="ovi-wrap ovi-closing">
            <h2>Your script is already written. Go read it.</h2>
            <button
              type="button"
              className="ovi-btn ovi-btn-dark"
              onClick={() => goTo("studio")}
            >
              Start prompting -- it&apos;s free
            </button>
          </div>
        </section>

        <section className="ovi-section no-top" id="sample">
          <div className="ovi-wrap ovi-sample-script">
            <CueDivider label="Sample script" />
            <h2>Try a one-minute creator intro.</h2>
            <p>
              This is loaded in the studio by default, so a new visitor can test
              OviCue before writing anything.
            </p>
            <blockquote>{starterScript}</blockquote>
            <button
              type="button"
              className="ovi-btn ovi-btn-dark"
              onClick={() => {
                setScript(starterScript);
                resetPrompt();
                goTo("studio");
              }}
            >
              Open this sample
            </button>
          </div>
        </section>

        <section className="ovi-section no-top" id="feedback">
          <div className="ovi-wrap ovi-feedback-block">
            <CueDivider label="Feedback" />
            <h2>Found a bug, or want something added?</h2>
            <p>
              Tell me what broke, what device you used, and what you expected to
              happen. The form will open here once the feedback link is
              connected.
            </p>
            {feedbackFormBaseUrl ? (
              <a
                className="ovi-btn ovi-btn-dark"
                href={feedbackUrl}
                target="_blank"
                rel="noreferrer"
                onClick={openFeedback}
              >
                Send feedback
              </a>
            ) : (
              <span className="feedback-pending">
                Feedback form setup pending
              </span>
            )}
          </div>
        </section>

        <section className="ovi-tip-strip" aria-label="Support OviCue">
          <div className="ovi-wrap">
            <div>
              <p>
                OviCue is free and stays free. If it saved you a reshoot, you can
                support it with UPI.
              </p>
              <span>Scan the QR with PhonePe, GPay, Paytm, or any UPI app.</span>
            </div>
            <img src={upiQrPath} alt="UPI QR code for supporting OviCue" />
          </div>
        </section>

        <footer className="ovi-footer">
          <div className="ovi-wrap ovi-foot">
            <div>
              <button
                type="button"
                className="ovi-brand ovi-brand-button"
                onClick={() => goTo("welcome")}
              >
                <i /> {productName}
              </button>
              <p>Free online teleprompter for Indian creators.</p>
            </div>
            <div>
              <strong>Product</strong>
              <button type="button" onClick={() => goTo("studio")}>Prompter</button>
              <button type="button" onClick={() => goTo("help")}>Guides</button>
              <button type="button" onClick={() => goTo("changelog")}>Changelog</button>
            </div>
            <div>
              <strong>Tools</strong>
              <a href="#sample">Sample script</a>
              <a href="#how">Script timer</a>
              <a href="#features">Pace test</a>
            </div>
            <div>
              <strong>Company</strong>
              <button type="button" onClick={() => goTo("about")}>About</button>
              <button type="button" onClick={() => goTo("privacy")}>Privacy</button>
              <button type="button" onClick={() => goTo("terms")}>Terms</button>
              <button type="button" onClick={() => goTo("accessibility")}>Accessibility</button>
              <button type="button" onClick={() => goTo("contact")}>Contact</button>
            </div>
            <div className="ovi-footer-bottom">
              <span>Built in Pune</span>
              <span>No cookies</span>
              <span>No ads</span>
              <span>Your scripts never leave your device</span>
              <a href={feedbackUrl} onClick={openFeedback}>
                {feedbackFormBaseUrl ? "Report a problem" : "Feedback form setup pending"}
              </a>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="workspace-sidebar" aria-label="OviCue workspace">
        <button
          type="button"
          className="workspace-brand"
          onClick={() => goTo("welcome")}
          aria-label="Open OviCue landing page"
        >
          <i />
          <span>{productName}</span>
          <strong>Free</strong>
        </button>
        <nav className="workspace-nav" aria-label="Workspace sections">
          <button type="button" onClick={() => goTo("welcome")}>
            <span>Front page</span>
          </button>
          <button type="button" className="selected">
            <span>Prompt studio</span>
          </button>
          <button type="button" onClick={() => setAccountPanelOpen(true)}>
            <span>My scripts</span>
            <small>soon</small>
          </button>
          <button type="button" onClick={() => setAccountPanelOpen(true)}>
            <span>Pace insights</span>
            <small>local</small>
          </button>
          <button type="button" onClick={() => setAccountPanelOpen(true)}>
            <span>Profile</span>
          </button>
          <a href="#feedback" onClick={openFeedback}>
            <span>Feedback</span>
          </a>
          <button type="button" onClick={() => goTo("help")}>
            <span>Help guides</span>
          </button>
        </nav>
        <div className="workspace-bottom">
          <button
            type="button"
            className="signin-button"
            onClick={() => setAccountPanelOpen(true)}
          >
            Sign in
          </button>
          <p>
            Local mode today. Sign in is staged for saved scripts, history, and
            paid plans later.
          </p>
        </div>
      </aside>
      <section className="editor-panel" aria-label="Script editor">
        <div className="brand-row">
          <div>
            <p className="eyebrow">India-first creator prompter</p>
            <h1>{productName}</h1>
          </div>
          <div className="brand-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => goTo("welcome")}
            >
              Front page
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setAccountPanelOpen(true)}
              aria-label="Account and sign in options"
            >
              Sign in
            </button>
            <div className="status-pill">{lines.length} lines</div>
          </div>
        </div>

        <div className="creator-intro">
          <p>Read naturally, keep eye contact, and record clean videos in English, Hindi, or Marathi. Everything runs in your browser for now.</p>
          <div className="intro-tags" aria-label={`${productName} highlights`}>
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
                onClick={() => applyLanguageSample(language)}
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
            <span>{isCalibrating ? `${calibrationRemaining}s` : "60s test"}</span>
          </div>
          <p>
            Uses the script below. Press start, read the same words on the
            teleprompter, and OviCue will estimate your natural WPM.
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
          onPaste={trackScriptPastedOnce}
          onChange={(event) => {
            setScript(event.target.value);
            trackTextEditedOnce();
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
          <span>Press Start once. The whole script now moves upward like movie credits at the pace or target time you choose.</span>
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

        <div className="promptr-controls" aria-label="Reading controls">
          <div>
            <span>Scroll speed</span>
            {studioSpeedPresets.map((preset, index) => (
              <button
                key={preset}
                type="button"
                className={Math.abs(speed - preset) < 13 ? "selected" : ""}
                onClick={() => {
                  chooseStudioSpeed(preset, index + 1);
                }}
              >
                {index + 1}
              </button>
            ))}
            <label
              className={
                customSpeedSelected
                  ? "custom-speed-field selected"
                  : "custom-speed-field"
              }
            >
              <small>Custom</small>
              <input
                type="number"
                min={minCustomWpm}
                max={maxCustomWpm}
                step="1"
                value={customSpeedValue}
                onBlur={commitCustomSpeed}
                onChange={(event) => chooseCustomSpeed(event.target.value)}
                aria-label="Custom scroll speed in words per minute"
              />
              <small>wpm</small>
            </label>
          </div>
          <div>
            <span>Text size</span>
            {[40, 52, 68].map((size, index) => (
              <button
                key={size}
                type="button"
                className={Math.abs(fontSize - size) < 7 ? "selected" : ""}
                onClick={() => setFontSize(size)}
              >
                {["S", "M", "L"][index]}
              </button>
            ))}
          </div>
          <div>
            <span>Align</span>
            {(["left", "center", "right"] as TextAlign[]).map((align) => (
              <button
                key={align}
                type="button"
                className={textAlign === align ? "selected" : ""}
                onClick={() => setTextAlign(align)}
              >
                {align.slice(0, 1).toUpperCase()}
              </button>
            ))}
          </div>
          <div>
            <span>Style</span>
            <button
              type="button"
              className={textWeight > 800 ? "selected" : ""}
              onClick={() => setTextWeight((value) => (value > 800 ? 800 : 950))}
              aria-label="Bold text"
            >
              B
            </button>
            <button
              type="button"
              className={textItalic ? "selected" : ""}
              onClick={() => setTextItalic((value) => !value)}
              aria-label="Italic text"
            >
              I
            </button>
            <button
              type="button"
              className={textUnderline ? "selected" : ""}
              onClick={() => setTextUnderline((value) => !value)}
              aria-label="Underline text"
            >
              U
            </button>
          </div>
        </div>

        <div className="control-stack">
          <label>
            <span>Speaking pace</span>
            <input
              type="range"
              min={minCustomWpm}
              max={maxCustomWpm}
              value={speed}
              onChange={(event) => chooseCustomSpeed(event.target.value)}
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
              onChange={(event) => {
                if (event.target.checked) trackEvent("mirror_toggled");
                setMirrorHorizontal(event.target.checked);
              }}
            />
            <span>Mirror horizontal</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={mirrorVertical}
              onChange={(event) => {
                if (event.target.checked) trackEvent("mirror_toggled");
                setMirrorVertical(event.target.checked);
              }}
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
                event.target.checked
                  ? permissionPrimed || streamRef.current
                    ? startCamera()
                    : requestPersonalSpace("camera")
                  : stopCamera()
              }
            />
            <span>Camera preview</span>
          </label>
        </div>
      </section>

      <section
        ref={promptPanelRef}
        className={isFullscreen ? "prompt-panel is-fullscreen" : "prompt-panel"}
        aria-label="Teleprompter"
      >
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
            <div className="toolbar-speed-control" aria-label="Scroll speed">
              <span>Scroll Speed</span>
              {studioSpeedPresets.map((preset, index) => (
                <button
                  key={preset}
                  type="button"
                  className={Math.abs(speed - preset) < 13 ? "selected" : ""}
                  aria-pressed={Math.abs(speed - preset) < 13}
                  onClick={() => {
                    chooseStudioSpeed(preset, index + 1);
                  }}
                >
                  {index + 1}
                </button>
              ))}
              <label
                className={
                  customSpeedSelected
                    ? "toolbar-custom-speed selected"
                    : "toolbar-custom-speed"
                }
              >
                <span>Custom</span>
                <input
                  type="number"
                  min={minCustomWpm}
                  max={maxCustomWpm}
                  step="1"
                  value={customSpeedValue}
                  onBlur={commitCustomSpeed}
                  onChange={(event) => chooseCustomSpeed(event.target.value)}
                  aria-label="Custom scroll speed in words per minute"
                />
              </label>
            </div>
            <button type="button" onClick={resetPrompt} aria-label="Reset">
              Reset
            </button>
            <button type="button" onClick={goFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
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
            isRunning && countdown === 0 ? "credits-running" : "",
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
              className={isRunning && countdown === 0 ? "line-list rolling" : "line-list"}
              style={{
                fontSize,
                textAlign,
              }}
            >
              <div
                ref={rollContentRef}
                className="roll-content"
                style={{
                  fontStyle: textItalic ? "italic" : "normal",
                  fontWeight: textWeight,
                  paddingTop: `${textPosition}vh`,
                  paddingBottom: `${100 - textPosition}vh`,
                  textDecoration: textUnderline ? "underline" : "none",
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
            </div>
          )}
        </div>

        <div className="practice-strip">
          <button
            type="button"
            onClick={() =>
              setActiveLine((line) => {
                const nextLine = Math.max(0, line - 1);
                activeLineRef.current = nextLine;
                return nextLine;
              })
            }
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveLine((line) => {
                const nextLine = Math.min(lines.length - 1, line + 1);
                activeLineRef.current = nextLine;
                return nextLine;
              })
            }
          >
            Next line
          </button>
          {recordedUrl ? (
            <a href={recordedUrl} download="OviCue-recording.webm">
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
                  )}. Your measured speaking pace is ${lastInsight.wpm} wpm.`
                : `Read for at least eight seconds, then ${productName} can estimate your natural speaking pace.`}
            </span>
          </div>
          <button
            type="button"
            disabled={!lastInsight}
            onClick={() => {
              if (!lastInsight) return;
              const suggestedSpeed = Math.min(
                maxCustomWpm,
                Math.max(minCustomWpm, lastInsight.wpm),
              );
              setSpeed(suggestedSpeed);
              setCustomSpeedValue(String(suggestedSpeed));
              setScrollMode("wpm");
            }}
          >
            Use suggested pace
          </button>
        </div>
      </section>
      {permissionIntent && (
        <div className="permission-overlay" role="dialog" aria-modal="true">
          <div className="permission-card">
            <span className="permission-mark">Personal space</span>
            <h2>
              {permissionIntent === "calibration"
                ? "Allow microphone?"
                : "Allow camera and microphone?"}
            </h2>
            <p>
              OviCue uses access only for this browser session:
              {permissionIntent === "calibration"
                ? " to run the 60-second pace test while you read the same script."
                : permissionIntent === "recording"
                  ? " to record your video and audio directly in your browser."
                  : " to show your camera behind the teleprompter text."}
            </p>
            <ul>
              <li>Your script stays on this device.</li>
              <li>No recording is uploaded from this version.</li>
              <li>
                {permissionIntent === "calibration"
                  ? "Camera is not requested for pace testing."
                  : "You can turn camera preview off anytime."}
              </li>
            </ul>
            <div className="permission-actions">
              <button
                type="button"
                onClick={() => {
                  setPermissionIntent(null);
                  if (permissionIntent === "camera") setCameraEnabled(false);
                }}
              >
                Not now
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={acceptPersonalSpace}
              >
                Allow and continue
              </button>
            </div>
          </div>
        </div>
      )}
      {accountPanelOpen && (
        <div className="permission-overlay" role="dialog" aria-modal="true">
          <div className="account-card">
            <div className="account-card-header">
              <span className="permission-mark">Account preview</span>
              <button
                type="button"
                onClick={() => setAccountPanelOpen(false)}
                aria-label="Close account options"
              >
                Close
              </button>
            </div>
            <h2>Sign in options are ready for the next phase.</h2>
            <p>
              OviCue still works without login. Later, signing in can save scripts,
              sync devices, keep pace history, and unlock paid plans.
            </p>
            <div className="signin-options" aria-label="Future sign in options">
              <button type="button">Continue with Google</button>
              <button type="button">Continue with email</button>
              <button type="button">Continue with phone</button>
            </div>
            <div className="account-roadmap">
              <span>Planned after database setup</span>
              <ul>
                <li>Saved scripts across phone and laptop</li>
                <li>Reading history and pace reports</li>
                <li>Feedback inbox and issue tracking</li>
                <li>Optional premium plan access</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
