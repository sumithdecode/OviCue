"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TrackingProps = Record<string, boolean | number | string>;
type SpeechRecognitionAlternativeLike = {
  transcript: string;
};
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};
type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};
type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultListLike;
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: TrackingProps) => void;
    };
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const starterScript = `Every creator knows this moment.

The idea is clear in your head. The camera is ready.

Then the words start jumping.

You look down. You lose the eye contact. You record it again.

And a two-minute video quietly takes an hour.

This fixes that moment.

Paste your script. Pick a speed, or press Find my pace and let it learn how you actually talk.

Then the words come up towards you, steady, like film credits, while your eyes stay next to the lens.

Use it for lessons. For reels. For a speech you cannot afford to fumble.

For practising English out loud, at a speed that does not run away from you.

Your script never leaves this device. Mirror it for teleprompter glass, put the camera behind it, record straight from the browser.

No account. No watermark. No limit on how long you read.

If you want your videos to sound prepared instead of rehearsed, this was built for you.

Now delete all of this, and paste your own.`;

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
type ExperienceMode = "welcome" | "studio" | "speech-speed-test" | StaticPageMode;
type TextAlign = "left" | "center" | "right";
type FrontTool = "prompter-demo" | "speed-test";
type MediaConsentIntent =
  | "microphone"
  | "camera"
  | "recording"
  | "speech-auto-stop";
type PaceSource = "voice-match" | "speech-test" | null;
type SpeechTestKind = "conversational" | "presentation" | "news";
type SessionInsight = {
  durationSeconds: number;
  readWords: number;
  wpm: number;
};
type SpeechTestResult = {
  kind: SpeechTestKind;
  seconds: number;
  wpm: number;
};
type FeedbackType = "bug" | "feature" | "hardware" | "other";
type AudienceKey =
  | "creator"
  | "teacher"
  | "student"
  | "english"
  | "speaker"
  | "advisor"
  | "hindi"
  | "marathi";

const productName = "OviCue";
const demoSpeedPresets = [90, 110, 130, 150, 170];
const studioSpeedPresets = [90, 110, 130, 150, 170];
const minCustomWpm = 30;
const maxCustomWpm = 1400;
const upiQrPath = "/upi-qr.jpeg";
const lastUpdated = "August 3, 2026";

const landingDemoScript = `This is a real teleprompter, not a picture of one.

The text is moving at one hundred and thirty words a minute -- about the speed of a teacher explaining something.

Speed two is calm practice. Speed four is a fast creator read. The number beside it is real words per minute, so it means something.

Turn on mirror mode if you shoot through beam-splitter glass. The reflection flips the text, so we flip it first.

Click the text to edit it. Paste your own script and read it right here, before you sign up for anything. Because you never have to.`;

const audienceScripts: Record<AudienceKey, { label: string; text: string }> = {
  creator: {
    label: "Creator",
    text: starterScript,
  },
  teacher: {
    label: "Teacher",
    text: `Good morning, everyone. Before we start, one thing about today's topic.

You have seen this idea before, but probably not in this order.

We are going to do three things.

First, the part everybody already knows, quickly, so we are on the same page.

Second, the part that trips most people up. We will slow down there.

Third, one question I want you to try before the next class.

If you lose me at any point, stop me. It is much easier to fix a small gap now than a big one later.

Right. Let us begin.

Now delete this and paste your own lesson.`,
  },
  student: {
    label: "Student",
    text: `Thank you for the opportunity.

Let me start with a short introduction.

I come from a background in this field, and over the last few years I have worked mainly on problems of this kind.

The thing I am most proud of is not the result. It is that I was wrong at the start, and I changed my approach when the evidence said I should.

What draws me to this role is the chance to do that at a larger scale.

I am still learning, and I would rather say that clearly than pretend otherwise.

I am happy to take any questions.

Now delete this and paste your own answer.`,
  },
  english: {
    label: "English practice",
    text: `I am practising speaking clearly.

Not quickly. Clearly.

When I hurry, my words run into each other, and the person listening has to work harder than I do.

So I will slow down. I will finish each sentence before I begin the next one.

A short pause is not a mistake. It gives the listener a moment, and it gives me a moment too.

If I make an error, I will keep going. Stopping to correct one word breaks the rhythm of the whole sentence.

Fluency is not about speed. It is about not stopping.

I will read this again tomorrow, a little more easily than today.

Now delete this and paste your own practice text.`,
  },
  speaker: {
    label: "Speaker",
    text: `Good evening, and thank you all for being here.

I will keep this short, because the best part of tonight is not the speech.

There is one thing I want to say, and then I will get out of the way.

When we started, nobody was certain this would work. There were plenty of good reasons to think it would not.

What changed it was not a plan. It was a small number of people who kept turning up.

Some of them are in this room.

So before anything else, thank you.

Now, please, enjoy the evening.

Now delete this and paste your own speech.`,
  },
  advisor: {
    label: "Advisor",
    text: `Thanks for taking the time.

Before we go into the details, let me be clear about what this is and what it is not.

This is a long-term product. It is not designed for quick returns, and anyone who tells you otherwise is selling you something else.

There are three things you should understand before you decide.

What it costs. What it does in a bad year. And what happens if you need the money early.

I will go through each one, and then you can take as long as you need.

Please read the terms in full before you sign anything.

Now delete this and paste your own script.`,
  },
  hindi: {
    label: "हिंदी",
    text: `हर बार वही होता है।

बात दिमाग़ में साफ़ है। कैमरा तैयार है।

लेकिन शब्द भागने लगते हैं।

आप नीचे देखते हैं, नज़र हट जाती है, और वीडियो दोबारा शुरू।

दो मिनट का वीडियो एक घंटा ले लेता है।

यहाँ वही ठीक होता है।

अपनी स्क्रिप्ट डालिए, अपनी गति चुनिए, और शब्द ऊपर की ओर बहने लगेंगे।

आपकी नज़र कैमरे पर रहेगी।

कोई अकाउंट नहीं। कोई वॉटरमार्क नहीं।

अब यह सब हटाइए, और अपनी स्क्रिप्ट डालिए।`,
  },
  marathi: {
    label: "मराठी",
    text: `प्रत्येक वेळी हेच होतं.

विचार स्पष्ट असतो. कॅमेरा तयार असतो.

पण शब्द सुटायला लागतात.

तुम्ही खाली बघता, नजर हटते, आणि पुन्हा सुरुवात.

दोन मिनिटांचा व्हिडिओ एक तास घेतो.

इथे तेच सुटतं.

तुमची स्क्रिप्ट टाका, वेग निवडा, आणि शब्द वर सरकत येतील.

तुमची नजर कॅमेऱ्यावरच राहील.

अकाउंट नाही. वॉटरमार्क नाही.

आता हे सगळं काढा, आणि तुमची स्क्रिप्ट टाका.`,
  },
};

const audienceOrder: AudienceKey[] = [
  "creator",
  "teacher",
  "student",
  "english",
  "speaker",
  "advisor",
  "hindi",
  "marathi",
];

const speechSpeedPassages: Record<
  SpeechTestKind,
  { label: string; wordCount: number; text: string }
> = {
  conversational: {
    label: "Conversational",
    wordCount: 181,
    text: `The strange thing about talking to a camera is that nobody teaches you how.

You learn to write in school. You learn to read out loud. Nobody ever sits you down and explains what to do with your hands, or where to look, or how fast to go when there is no one in front of you nodding along.

So most people do the same two things. They speak far too quickly, because silence feels longer than it is. And they look slightly away from the lens, because looking straight into a piece of glass feels unnatural.

Both are fixable, and neither takes talent.

Speed is fixable with practice and a number. Once you know how fast you actually talk, you can decide whether to stay there or move.

Eye contact is fixable with position. Whatever you are reading from needs to sit as close to the lens as you can get it.

That is most of it. The rest is just doing it more than once.`,
  },
  presentation: {
    label: "Presentation",
    wordCount: 178,
    text: `Every good talk does the same three things, in the same order.

First it tells you why you should care. Not what the talk is about, but what changes for you if you listen. People decide within the first minute whether to stay with you, and they decide on that alone.

Second it gives you one idea, not five. The talks people remember carry a single thought and turn it over from different sides. The talks people forget carry a list.

Third it tells you what to do next. Even if the answer is only to think about something differently, the ending should point somewhere.

Almost everything else is decoration. Better slides do not save a talk with no argument. A confident voice does not save one with no ending.

The good news is that all three of these are decided before you open your mouth. They are written, not performed. Which means the hardest part of speaking well happens quietly, at a desk, on a day when nobody is watching.`,
  },
  news: {
    label: "News read",
    wordCount: 176,
    text: `A short update on the weather across the region this morning.

Rain is expected to continue through most of the day in the western districts, easing by late afternoon. Travellers heading out early should allow extra time, as visibility on the main roads is likely to stay poor until the middle of the morning.

Temperatures will remain a few degrees below normal for this time of year, with a steady wind from the south. Coastal areas can expect stronger gusts through the evening, and small boats have been advised to stay close to shore.

Conditions are expected to improve by tomorrow, with clearer skies returning across most of the region by the middle of the week. Farmers in the eastern belt will welcome the break, following a wetter than usual month.

That is the outlook for now. We will bring you an update at the top of the next hour, along with the traffic report and the day's main headlines.`,
  },
};

const speechSpeedBands = [
  {
    range: "Under 100",
    label: "Deliberate",
    description:
      "Careful and formal. Good for complex material or a room learning the language.",
  },
  {
    range: "100-125",
    label: "Teaching",
    description:
      "A steady explaining pace. Easy to follow, easy to take notes from.",
  },
  {
    range: "125-150",
    label: "Conversational",
    description:
      "How most people talk to someone they know. The default for good reason.",
  },
  {
    range: "150-175",
    label: "Creator and news",
    description:
      "Energy without strain. Where most YouTube and broadcast reads sit.",
  },
  {
    range: "175-200",
    label: "Fast",
    description:
      "Works if your audience knows the subject. Tiring over long stretches.",
  },
  {
    range: "Over 200",
    label: "Very fast",
    description:
      "Commentary pace. Most listeners lose the thread within a few minutes.",
  },
];

const languageSamples: Record<ScriptLanguage, string> = {
  english: starterScript,
  hindi: `हर क्रिएटर इस पल को जानता है।

आइडिया आपके दिमाग में साफ होता है। कैमरा तैयार होता है।

फिर शब्द इधर-उधर होने लगते हैं।

आप नीचे देखते हैं। आंखों का संपर्क टूट जाता है। आप फिर से रिकॉर्ड करते हैं।

और दो मिनट का वीडियो चुपचाप एक घंटा ले लेता है।

OviCue उसी पल को ठीक करता है।

अपना script paste करें। Speed चुनें, या Find my pace दबाएं और OviCue को आपकी असली बोलने की गति सीखने दें।

फिर शब्द आपकी तरफ ऊपर आते हैं, film credits की तरह steady, और आपकी आंखें camera के पास रहती हैं।

इसे lessons के लिए इस्तेमाल करें। Reels के लिए। किसी speech के लिए जहां गलती नहीं चाहिए।

English practice के लिए भी, ऐसी speed पर जो आपसे आगे न भागे।

आपका script इसी device पर रहता है। Teleprompter glass के लिए mirror करें, camera पीछे लगाएं, और browser से record करें।

No account. No watermark. जितना चाहें उतना पढ़ें।

अगर आप चाहते हैं कि आपके videos rehearsed नहीं, prepared लगें, तो OviCue आपके लिए बना है।

अब यह delete करें, और अपना script paste करें।`,
  marathi: `प्रत्येक creator ला हा क्षण माहिती असतो.

Idea डोक्यात स्पष्ट असतो. Camera तयार असतो.

मग शब्द इकडे-तिकडे होऊ लागतात.

तुम्ही खाली पाहता. Eye contact तुटतो. तुम्ही पुन्हा record करता.

आणि दोन मिनिटांचा video शांतपणे एक तास घेतो.

OviCue तो क्षण ठीक करतो.

तुमचा script paste करा. Speed निवडा, किंवा Find my pace दाबा आणि OviCue ला तुमची खरी बोलण्याची गती शिकू द्या.

मग शब्द film credits सारखे steady वर येतात, आणि तुमचे डोळे lens जवळ राहतात.

Lessons साठी वापरा. Reels साठी. अशा speech साठी जिथे चूक परवडत नाही.

English practice साठीही, अशा speed वर जी तुमच्यापेक्षा पुढे पळत नाही.

तुमचा script या device वरच राहतो. Teleprompter glass साठी mirror करा, camera मागे ठेवा, आणि browser मधून record करा.

No account. No watermark. कितीही वेळ वाचा.

तुमचे videos rehearsed नाही, prepared वाटावेत असे वाटत असेल, तर OviCue तुमच्यासाठी बनले आहे.

आता हे delete करा, आणि तुमचा script paste करा.`,
};

const languageLabels: Record<ScriptLanguage, string> = {
  english: "English",
  hindi: "हिन्दी",
  marathi: "मराठी",
};

function isLegacyDefaultScript(text: string) {
  return (
    text.includes("OviCue changes that moment.") ||
    text.includes("Hi, my name is ______") ||
    text.includes("आज मैं स्पष्ट और आत्मविश्वास से बोलने का अभ्यास") ||
    text.includes("आज मी स्पष्ट आणि आत्मविश्वासाने बोलण्याचा सराव")
  );
}

const routeModes: Record<string, ExperienceMode> = {
  "/": "welcome",
  "/prompt": "studio",
  "/tools/speech-speed-test": "speech-speed-test",
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
  if (mode === "speech-speed-test") return "/tools/speech-speed-test";
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

function speechSpeedBandFor(wpm: number) {
  if (wpm < 100) return speechSpeedBands[0];
  if (wpm < 125) return speechSpeedBands[1];
  if (wpm < 150) return speechSpeedBands[2];
  if (wpm < 175) return speechSpeedBands[3];
  if (wpm < 200) return speechSpeedBands[4];
  return speechSpeedBands[5];
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
        <h1>Built in Pune for creators everywhere.</h1>
        <p className="ovi-lead">
          OviCue was built because too many teleprompters ask for an account,
          watermark the result, or hide simple recording tools behind paid
          walls. This one is for creators, teachers, students, and speakers who
          need to paste a script and read clearly.
        </p>
        <InfoCard title="Zero setup. Zero drama.">
          <p>
            Open the site, paste your words, choose a pace, and start reading.
            The core prompter stays free because clean speaking practice should
            not require a forced account.
          </p>
        </InfoCard>
        <InfoCard title="Local-first architecture">
          <p>
            In this version, scripts stay in your browser on your device. OviCue
            does not upload your script text to a database or use it for
            advertising.
          </p>
        </InfoCard>
        <InfoCard title="Hardware friendly">
          <p>
            Horizontal and vertical mirror modes support beam-splitter glass,
            phone rigs, laptop recording, and simple everyday rehearsal.
          </p>
        </InfoCard>
        <InfoCard title="Built for creators">
          <p>
            OviCue combines smooth scrolling, pace testing, camera preview, and
            clean browser recording without watermarks.
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
            <p>Use the feedback form on the home page. It is local-only until a real inbox is connected.</p>
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
          OviCue is engineered as a local-first web application. Your scripts,
          speech practice, and browser recordings belong entirely to you.
        </p>
        <InfoCard title="The zero-data core promise">
          <p>
            Your script text, teleprompter speed settings, and custom
            configurations stay inside your web browser. OviCue does not need a
            database to run the core prompter.
          </p>
        </InfoCard>
        <InfoCard title="Local storage and retention">
          <p>
            Scripts and user settings can be saved in browser storage such as
            localStorage or IndexedDB. Clearing browser data can remove them.
            We do not operate a server that ingests or stores your script
            contents in this version.
          </p>
        </InfoCard>
        <InfoCard title="Hardware and sensor permissions">
          <p>
            Prompting itself never needs permission. Microphone access is used
            only for optional voice-based pace features or recording. Camera
            access is used only for preview or recording. Audio and video are
            processed locally by your browser and are not uploaded by OviCue.
          </p>
        </InfoCard>
        <InfoCard title="Analytics and external services">
          <p>
            OviCue may collect minimal anonymous telemetry such as page views,
            feature clicks, and browser errors to improve reliability. Script
            text, personal identity, and sensitive information are not included.
            Voluntary UPI support is handled by the UPI app you choose; OviCue
            does not process bank details.
          </p>
        </InfoCard>
        <InfoCard title="Contact">
          <p>
            Questions about privacy can be sent through the feedback section.
            Please do not include private scripts or sensitive personal data in
            feedback.
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
            You retain full ownership of scripts and recordings created through
            OviCue. You are responsible for having the rights to use the
            content you paste, display, speak, or record.
          </p>
        </InfoCard>
        <InfoCard title="License and acceptable use">
          <p>
            OviCue grants you a non-exclusive, revocable license to use the web
            app for personal, educational, and commercial speaking or video
            production. Do not misuse the service or attempt to interfere with
            its operation.
          </p>
        </InfoCard>
        <InfoCard title="Voluntary support">
          <p>
            UPI contributions are optional support for hosting and development.
            They do not create ownership, equity, guaranteed custom work, or a
            refundable purchase.
          </p>
        </InfoCard>
        <InfoCard title="No guarantees">
          <p>
            The service is provided as-is and as-available. Test it before
            important live work because browser permissions, recording, and
            fullscreen behavior vary by device.
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
            <p>Place your tablet or laptop face-up under teleprompter glass, then turn on Mirror Horizontal so the reflection reads normally.</p>
          </InfoCard>
          <InfoCard title="Phone setup">
            <p>Keep the prompter close to the camera lens so your eyes stay natural.</p>
          </InfoCard>
          <InfoCard title="Scroll speed">
            <p>Most speaking sits around 120 to 150 WPM. Teaching often feels better near 120 to 130 WPM; fast creator reads can go higher.</p>
          </InfoCard>
          <InfoCard title="Mirror mode">
            <p>Horizontal flip is for glass. Vertical flip helps with some mounted rigs.</p>
          </InfoCard>
          <InfoCard title="Permissions">
            <p>Prompting needs no permission. Camera and microphone prompts appear only when you use preview, recording, or optional voice tools.</p>
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
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [mediaConsentIntent, setMediaConsentIntent] =
    useState<MediaConsentIntent | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [lastInsight, setLastInsight] = useState<SessionInsight | null>(null);
  const [calibrationInsight, setCalibrationInsight] =
    useState<SessionInsight | null>(null);
  const [personalPaceSource, setPersonalPaceSource] =
    useState<PaceSource>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationRemaining, setCalibrationRemaining] = useState(60);
  const [isVoiceMatching, setIsVoiceMatching] = useState(false);
  const [liveSpokenWords, setLiveSpokenWords] = useState(0);
  const [voiceMatchStatus, setVoiceMatchStatus] = useState(
    "Matches the scroll speed to your spoken WPM while you read.",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedAudience, setSelectedAudience] =
    useState<AudienceKey>("creator");
  const [demoText, setDemoText] = useState(audienceScripts.creator.text);
  const [demoWpm, setDemoWpm] = useState(130);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoMirror, setDemoMirror] = useState(false);
  const [demoEditing, setDemoEditing] = useState(false);
  const [frontTool, setFrontTool] = useState<FrontTool>("prompter-demo");
  const [speechTestKind, setSpeechTestKind] =
    useState<SpeechTestKind>("conversational");
  const [isSpeechTestRunning, setIsSpeechTestRunning] = useState(false);
  const [speechTestElapsed, setSpeechTestElapsed] = useState(0);
  const [speechTestTextSnapshot, setSpeechTestTextSnapshot] = useState("");
  const [speechTestResult, setSpeechTestResult] =
    useState<SpeechTestResult | null>(null);
  const [speechTestError, setSpeechTestError] = useState("");
  const [speechTestAutoStop, setSpeechTestAutoStop] = useState(false);
  const [speechTestAutoStopAvailable, setSpeechTestAutoStopAvailable] =
    useState(false);
  const [proEmail, setProEmail] = useState("");
  const [proWaitlistMessage, setProWaitlistMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackDevice, setFeedbackDevice] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const lineListRef = useRef<HTMLDivElement | null>(null);
  const rollContentRef = useRef<HTMLDivElement | null>(null);
  const promptPanelRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const demoTrackRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechTestRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
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
  const voiceMatchStartRef = useRef<number | null>(null);
  const spokenWordsRef = useRef(0);
  const stopVoiceMatchRef = useRef(false);
  const speechTestStartedAtRef = useRef<number | null>(null);
  const speechTestMicStreamRef = useRef<MediaStream | null>(null);
  const stopSpeechTestRecognitionRef = useRef(false);

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
  const mediaStatus = isRecording
    ? "Recording"
    : isVoiceMatching
      ? "Mic in use"
      : cameraEnabled
        ? "Camera in use"
        : "Media off";
  const mediaIsLive = isRecording || isVoiceMatching || cameraEnabled;

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
    if (experienceMode === "speech-speed-test") {
      document.title =
        "Speech Speed Test - How Many Words Per Minute Do You Speak?";
      const description =
        "Free speech speed test. Read a short passage out loud and find your words per minute. No microphone, no signup, works in any browser.";
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    } else {
      document.title = "OviCue - Free Online Teleprompter for Indian Creators";
    }
  }, [experienceMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSpeechTestAutoStopAvailable(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    const savedAudience =
      window.localStorage.getItem("ovicue.audience") as AudienceKey | null;
    if (!savedAudience || !audienceScripts[savedAudience]) return;
    setSelectedAudience(savedAudience);
    setDemoText(audienceScripts[savedAudience].text);
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
          personalPaceSource?: PaceSource;
        };
        if (parsed.script) {
          const savedLanguage = parsed.scriptLanguage ?? "english";
          // Restoring local draft state once on mount is intentional for the offline prompter.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setScript(
            isLegacyDefaultScript(parsed.script)
              ? languageSamples[savedLanguage]
              : parsed.script,
          );
        }
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
        if (parsed.personalPaceSource) {
          setPersonalPaceSource(parsed.personalPaceSource);
        }
        if (parsed.calibrationInsight) {
          setCalibrationInsight(parsed.calibrationInsight);
          if (parsed.calibrationInsight.durationSeconds > 0) {
            setLastInsight(parsed.calibrationInsight);
          }
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
    const savedStandalonePace = window.localStorage.getItem("ovicue.pace");
    if (savedStandalonePace) {
      const parsedPace = Number(savedStandalonePace);
      if (Number.isFinite(parsedPace)) {
        const savedPace = Math.min(
          maxCustomWpm,
          Math.max(minCustomWpm, Math.round(parsedPace)),
        );
        setSpeed(savedPace);
        setCustomSpeedValue(String(savedPace));
        setCalibrationInsight({
          durationSeconds: 0,
          readWords: 0,
          wpm: savedPace,
        });
        setPersonalPaceSource("speech-test");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (experienceMode !== "studio") return;
    const params = new URLSearchParams(window.location.search);
    const wpmParam = params.get("wpm");
    if (!wpmParam) return;
    const parsed = Number(wpmParam);
    if (!Number.isFinite(parsed)) return;
    const queryWpm = Math.min(
      maxCustomWpm,
      Math.max(minCustomWpm, Math.round(parsed)),
    );
    setSpeed(queryWpm);
    setCustomSpeedValue(String(queryWpm));
    setScrollMode("wpm");
    setCalibrationInsight({
      durationSeconds: 0,
      readWords: 0,
      wpm: queryWpm,
    });
    setPersonalPaceSource("speech-test");
  }, [experienceMode]);

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
        personalPaceSource,
      }),
    );
  }, [
    calibrationInsight,
    dimPast,
    fontSize,
    isLoaded,
    mirrorHorizontal,
    mirrorVertical,
    personalPaceSource,
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
      stopVoiceMatchRef.current = true;
      recognitionRef.current?.abort();
      speechTestRecognitionRef.current?.abort();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      speechTestMicStreamRef.current?.getTracks().forEach((track) =>
        track.stop(),
      );
    };
  }, []);

  useEffect(() => {
    if (!isSpeechTestRunning || speechTestStartedAtRef.current === null) return;
    const timer = window.setInterval(() => {
      if (speechTestStartedAtRef.current === null) return;
      setSpeechTestElapsed(
        (performance.now() - speechTestStartedAtRef.current) / 1000,
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [isSpeechTestRunning]);

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

  async function startCamera(includeAudio = false) {
    setCameraError("");
    const cameraPerm = window.localStorage.getItem("ovicue.perm.camera");
    const micPerm = window.localStorage.getItem("ovicue.perm.mic");
    if (cameraPerm === "denied" || (includeAudio && micPerm === "denied")) {
      setCameraError(
        cameraPerm === "denied"
          ? "Camera is blocked in your browser settings."
          : "Microphone is blocked in your browser settings.",
      );
      setCameraEnabled(false);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: includeAudio,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
      window.localStorage.setItem("ovicue.perm.camera", "granted");
      if (includeAudio) window.localStorage.setItem("ovicue.perm.mic", "granted");
      trackEvent("camera_allowed");
      return true;
    } catch {
      window.localStorage.setItem("ovicue.perm.camera", "denied");
      if (includeAudio) window.localStorage.setItem("ovicue.perm.mic", "denied");
      setCameraError(
        includeAudio
          ? "Camera or microphone permission was blocked."
          : "Camera permission was blocked.",
      );
      setCameraEnabled(false);
      trackEvent("camera_denied");
      return false;
    }
  }

  async function startMicrophone() {
    setCameraError("");
    if (window.localStorage.getItem("ovicue.perm.mic") === "denied") {
      setCameraError("Microphone is blocked in your browser settings.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      micStreamRef.current = stream;
      window.localStorage.setItem("ovicue.perm.mic", "granted");
      trackEvent("microphone_allowed");
      return true;
    } catch {
      window.localStorage.setItem("ovicue.perm.mic", "denied");
      setCameraError("Microphone permission was blocked.");
      trackEvent("microphone_denied");
      return false;
    }
  }

  function speechRecognitionLanguage() {
    if (scriptLanguage === "hindi") return "hi-IN";
    if (scriptLanguage === "marathi") return "mr-IN";
    return "en-IN";
  }

  function extractSpeechText(results: SpeechRecognitionResultListLike) {
    const transcript: string[] = [];
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      if (result?.[0]?.transcript) transcript.push(result[0].transcript);
    }
    return transcript.join(" ");
  }

  function applyLiveVoicePace(spokenWords: number) {
    if (voiceMatchStartRef.current === null) return;
    const elapsedSeconds = Math.max(
      1,
      (performance.now() - voiceMatchStartRef.current) / 1000,
    );
    if (elapsedSeconds < 1.5 || spokenWords < 1) return;
    const liveWpm = Math.min(
      maxCustomWpm,
      Math.max(minCustomWpm, Math.round((spokenWords / elapsedSeconds) * 60)),
    );
    setSpeed(liveWpm);
    setCustomSpeedValue(String(liveWpm));
    setScrollMode("wpm");
    setVoiceMatchStatus(`Matching your voice at ${liveWpm} wpm`);
  }

  function startVoiceMatching() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMatchStatus(
        "Live voice matching is not supported in this browser. Finish the test to apply your measured pace.",
      );
      return false;
    }

    recognitionRef.current?.abort();
    stopVoiceMatchRef.current = false;
    spokenWordsRef.current = 0;
    setLiveSpokenWords(0);
    setIsVoiceMatching(true);
    setVoiceMatchStatus("Listening and matching your reading speed...");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechRecognitionLanguage();
    recognition.onresult = (event) => {
      const spokenWords = countWords(extractSpeechText(event.results));
      spokenWordsRef.current = spokenWords;
      setLiveSpokenWords(spokenWords);
      applyLiveVoicePace(spokenWords);
    };
    recognition.onerror = () => {
      setVoiceMatchStatus(
        "Voice matching paused. You can finish the test to use the measured pace.",
      );
    };
    recognition.onend = () => {
      if (stopVoiceMatchRef.current) return;
      try {
        recognition.start();
      } catch {
        setIsVoiceMatching(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      setIsVoiceMatching(false);
      setVoiceMatchStatus(
        "Voice matching could not start. Finish the test to use the measured pace.",
      );
      return false;
    }
  }

  function stopVoiceMatching() {
    stopVoiceMatchRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsVoiceMatching(false);
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  }

  function releaseCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraEnabled(false);
  }

  function stopCamera() {
    if (isRecording) return;
    releaseCameraStream();
  }

  function stopSpeechSpeedAutoStop() {
    stopSpeechTestRecognitionRef.current = true;
    speechTestRecognitionRef.current?.stop();
    speechTestRecognitionRef.current = null;
    speechTestMicStreamRef.current?.getTracks().forEach((track) =>
      track.stop(),
    );
    speechTestMicStreamRef.current = null;
  }

  function getCurrentSpeechTestText() {
    if (experienceMode === "welcome") return demoText;
    return speechSpeedPassages[speechTestKind].text;
  }

  async function startSpeechSpeedAutoStop() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      speechTestMicStreamRef.current = stream;
      stopSpeechTestRecognitionRef.current = false;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.onresult = (event) => {
        const spokenWords = countWords(extractSpeechText(event.results));
        const sourceWords = countWords(
          speechTestTextSnapshot || getCurrentSpeechTestText(),
        );
        const targetWords = sourceWords * 0.9;
        if (spokenWords >= targetWords) {
          finishSpeechSpeedTest();
        }
      };
      recognition.onend = () => {
        if (stopSpeechTestRecognitionRef.current) return;
        try {
          recognition.start();
        } catch {
          stopSpeechSpeedAutoStop();
        }
      };
      speechTestRecognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch {
      setSpeechTestError(
        "Microphone auto-stop could not start. Untick it and run the manual test.",
      );
      setSpeechTestAutoStop(false);
      stopSpeechSpeedAutoStop();
      return false;
    }
  }

  function hasVisitMediaConsent() {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("ovicue-media-consent") === "true";
  }

  function rememberVisitMediaConsent() {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("ovicue-media-consent", "true");
  }

  async function startSpeechSpeedTest(mediaAlreadyConfirmed = false) {
    setSpeechTestResult(null);
    setSpeechTestError("");
    setSpeechTestElapsed(0);
    const sourceText = getCurrentSpeechTestText();
    setSpeechTestTextSnapshot(sourceText);

    if (speechTestAutoStop) {
      if (!mediaAlreadyConfirmed && !hasVisitMediaConsent()) {
        setMediaConsentIntent("speech-auto-stop");
        return;
      }
      const started = await startSpeechSpeedAutoStop();
      if (!started) return;
    }

    speechTestStartedAtRef.current = performance.now();
    setIsSpeechTestRunning(true);
    trackEvent("speech_speed_test_started", {
      passage: speechTestKind,
      autoStop: speechTestAutoStop,
    });
  }

  function finishSpeechSpeedTest() {
    if (speechTestStartedAtRef.current === null) return;
    const seconds = (performance.now() - speechTestStartedAtRef.current) / 1000;
    const sourceText = speechTestTextSnapshot || getCurrentSpeechTestText();
    const sourceWords = countWords(sourceText);
    const rawWpm = Math.round(((sourceWords / seconds) * 60) / 5) * 5;
    const measuredWpm = Math.min(maxCustomWpm, Math.max(60, rawWpm));

    speechTestStartedAtRef.current = null;
    setIsSpeechTestRunning(false);
    setSpeechTestElapsed(seconds);
    stopSpeechSpeedAutoStop();

    if (seconds < 25 || sourceWords < 20) {
      setSpeechTestResult(null);
      setSpeechTestError("That did not look like a full read - try again.");
      trackEvent("speech_speed_test_rejected", {
        seconds: Math.round(seconds),
        wpm: measuredWpm,
      });
      return;
    }

    setSpeechTestResult({
      kind: speechTestKind,
      seconds,
      wpm: measuredWpm,
    });
    window.localStorage.setItem("ovicue.pace", String(measuredWpm));
    trackEvent("speech_speed_test_completed", {
      passage: speechTestKind,
      seconds: Math.round(seconds),
      wpm: measuredWpm,
    });
  }

  function resetSpeechSpeedTest() {
    speechTestStartedAtRef.current = null;
    setIsSpeechTestRunning(false);
    setSpeechTestElapsed(0);
    setSpeechTestError("");
    setSpeechTestResult(null);
    stopSpeechSpeedAutoStop();
  }

  function openPrompterWithWpm(wpm: number) {
    const personalWpm = Math.min(
      maxCustomWpm,
      Math.max(minCustomWpm, Math.round(wpm)),
    );
    setSpeed(personalWpm);
    setCustomSpeedValue(String(personalWpm));
    setScrollMode("wpm");
    setCalibrationInsight({
      durationSeconds: 0,
      readWords: 0,
      wpm: personalWpm,
    });
    setPersonalPaceSource("speech-test");
    setExperienceMode("studio");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/prompt?wpm=${personalWpm}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function acceptMediaConsent(scope: "visit" | "once" = "once") {
    const intent = mediaConsentIntent;
    setMediaConsentIntent(null);
    if (scope === "visit") rememberVisitMediaConsent();

    if (intent === "microphone") {
      const allowed = await startMicrophone();
      if (allowed) startCalibrationCore();
      return;
    }

    if (intent === "camera") {
      await startCamera(false);
      return;
    }

    if (intent === "recording") {
      await startRecordingCore();
      return;
    }

    if (intent === "speech-auto-stop") {
      await startSpeechSpeedTest(true);
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (hasVisitMediaConsent()) {
      await startRecordingCore();
      return;
    }

    setMediaConsentIntent("recording");
  }

  async function startRecordingCore() {
    const hasLiveVideo = streamRef.current
      ?.getVideoTracks()
      .some((track) => track.readyState === "live");
    const hasLiveAudio = streamRef.current
      ?.getAudioTracks()
      .some((track) => track.readyState === "live");

    if (!hasLiveVideo || !hasLiveAudio) {
      releaseCameraStream();
      await startCamera(true);
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
      setIsRunning(false);
      setCountdown(0);
      releaseCameraStream();
      trackEvent("recording_stopped");
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

  async function startCalibration() {
    if (!micStreamRef.current) {
      if (hasVisitMediaConsent()) {
        const allowed = await startMicrophone();
        if (allowed) startCalibrationCore();
        return;
      }
      setMediaConsentIntent("microphone");
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
    voiceMatchStartRef.current = performance.now();
    setIsCalibrating(true);
    startVoiceMatching();
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
    const spokenWords = spokenWordsRef.current;
    const passageWords =
      spokenWords > 0
        ? spokenWords
        : Math.min(
            countWords(script.trim() ? script : starterScript),
            Math.max(1, wordsRead),
          );
    const measuredWpm = Math.max(
      minCustomWpm,
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
    setPersonalPaceSource("voice-match");
    setIsRunning(false);
    setCountdown(0);
    stopVoiceMatching();
    trackEvent("pace_test_completed", {
      wpm: measuredWpm,
      seconds: insight.durationSeconds,
    });
    setIsCalibrating(false);
    setCalibrationRemaining(60);
    calibrationStartRef.current = null;
    voiceMatchStartRef.current = null;
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

  function showFeedbackSection() {
    handleFeedbackClick();
    setExperienceMode("welcome");
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
    window.setTimeout(() => {
      document.getElementById("feedback")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function saveFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackNotice("Add a short message first.");
      return;
    }
    const entry = {
      type: feedbackType,
      device: feedbackDevice.trim(),
      message,
      createdAt: new Date().toISOString(),
      page: typeof window === "undefined" ? "/" : window.location.pathname,
      userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    };
    let existing: Array<typeof entry> = [];
    try {
      const saved = window.localStorage.getItem("ovicue.feedback");
      existing = saved ? (JSON.parse(saved) as Array<typeof entry>) : [];
    } catch {
      existing = [];
    }
    window.localStorage.setItem(
      "ovicue.feedback",
      JSON.stringify([entry, ...existing].slice(0, 25)),
    );
    setFeedbackMessage("");
    setFeedbackDevice("");
    setFeedbackType("bug");
    setFeedbackNotice(
      "Saved on this device. A real feedback inbox can be connected next.",
    );
    trackEvent("feedback_saved_locally", { type: entry.type });
  }

  function chooseAudience(audience: AudienceKey) {
    setSelectedAudience(audience);
    setDemoPlaying(false);
    setDemoEditing(false);
    setDemoText(audienceScripts[audience].text);
    resetSpeechSpeedTest();
    demoOffsetRef.current = 0;
    if (demoTrackRef.current) {
      demoTrackRef.current.style.transform = `translate3d(-50%, 0, 0) scaleX(${
        demoMirror ? -1 : 1
      })`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ovicue.audience", audience);
    }
  }

  function saveProWaitlist() {
    const email = proEmail.trim();
    if (!email) {
      setProWaitlistMessage("Add your email first.");
      return;
    }
    const saved = window.localStorage.getItem("ovicue.proWaitlist");
    let emails: string[] = [];
    try {
      emails = saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      emails = [];
    }
    const nextEmails = Array.from(new Set([...emails, email]));
    window.localStorage.setItem("ovicue.proWaitlist", JSON.stringify(nextEmails));
    setProWaitlistMessage("Saved on this device for now. We will connect a real list before Pro launches.");
    setProEmail("");
  }

  function showFrontSpeedTest() {
    setExperienceMode("welcome");
    setFrontTool("speed-test");
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
    window.setTimeout(() => {
      document.getElementById("rig")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  if (experienceMode === "speech-speed-test") {
    const activePassage = speechSpeedPassages[speechTestKind];
    const resultBand = speechTestResult
      ? speechSpeedBandFor(speechTestResult.wpm)
      : null;
    const resultWpm = speechTestResult?.wpm ?? speed;
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do I need a microphone?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. The test measures time, not sound. Nothing is recorded and nothing is sent anywhere.",
          },
        },
        {
          "@type": "Question",
          name: "Does it work on a phone?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, in any browser.",
          },
        },
        {
          "@type": "Question",
          name: "Why does my number change each time?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Speaking speed moves with mood, time of day, and how familiar the words are. Run it three times and take the middle number.",
          },
        },
        {
          "@type": "Question",
          name: "Can I test in Hindi or Marathi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, but word counts work differently across languages, so treat the number as a guide within one language rather than a comparison between them.",
          },
        },
      ],
    };

    return (
      <main className="ovi-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <nav className="ovi-nav">
          <div className="ovi-wrap">
            <button
              type="button"
              className="ovi-brand ovi-brand-button"
              onClick={() => goTo("welcome")}
              aria-label="Open OviCue front page"
            >
              <i /> {productName}
            </button>
            <div className="ovi-navlinks">
              <button type="button" onClick={() => goTo("studio")}>Prompter</button>
              <button type="button" onClick={() => goTo("help")}>Help</button>
              <button type="button" onClick={() => goTo("about")}>About</button>
            </div>
            <button
              type="button"
              className="ovi-btn ovi-btn-dark ovi-btn-sm"
              onClick={() => openPrompterWithWpm(resultWpm)}
            >
              Open prompter
            </button>
          </div>
        </nav>

        <section className="ovi-section speech-tool-hero">
          <div className="ovi-wrap">
            <span className="ovi-pill ovi-mono">Free tool · no signup · no mic needed</span>
            <h1>Speech Speed Test</h1>
            <p className="ovi-lead">
              Find out how many words a minute you speak. Read a short passage
              out loud, press Done, and turn that number into your personal
              OviCue prompter pace.
            </p>

            <div className="speech-test-panel">
              <div className="speech-test-top">
                <div className="speech-test-tabs" aria-label="Passage type">
                  {(Object.keys(speechSpeedPassages) as SpeechTestKind[]).map(
                    (kind) => (
                      <button
                        key={kind}
                        type="button"
                        disabled={isSpeechTestRunning}
                        className={speechTestKind === kind ? "selected" : ""}
                        onClick={() => {
                          resetSpeechSpeedTest();
                          setSpeechTestKind(kind);
                        }}
                      >
                        {speechSpeedPassages[kind].label}
                      </button>
                    ),
                  )}
                </div>
                <strong>{formatTime(speechTestElapsed)}</strong>
              </div>

              <p className="speech-test-instruction">
                {isSpeechTestRunning
                  ? "Read out loud at your normal speaking voice."
                  : "Pick the kind of speaking you want to measure."}
              </p>

              <div className="speech-test-passage" aria-label="Speech test passage">
                {activePassage.text.split(/\n+/).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {speechTestError && (
                <div className="speech-test-error">{speechTestError}</div>
              )}

              {speechTestResult && resultBand && (
                <div className="speech-test-result">
                  <span className="ovi-mono">Your speech speed</span>
                  <strong>{speechTestResult.wpm} words per minute</strong>
                  <p>
                    {resultBand.label}. {resultBand.description}
                  </p>
                </div>
              )}

              <div className="speech-test-actions">
                {!isSpeechTestRunning && !speechTestResult && (
                  <button
                    type="button"
                    className="ovi-btn ovi-btn-dark"
                    onClick={() => startSpeechSpeedTest()}
                  >
                    Start the test
                  </button>
                )}
                {isSpeechTestRunning && (
                  <button
                    type="button"
                    className="ovi-btn ovi-btn-dark"
                    onClick={finishSpeechSpeedTest}
                  >
                    Done
                  </button>
                )}
                {speechTestResult && (
                  <>
                    <button
                      type="button"
                      className="ovi-btn ovi-btn-dark"
                      onClick={() => openPrompterWithWpm(speechTestResult.wpm)}
                    >
                      Start prompting at {speechTestResult.wpm} wpm
                    </button>
                    <button
                      type="button"
                      className="ovi-btn ovi-btn-ghost"
                      onClick={resetSpeechSpeedTest}
                    >
                      Test again
                    </button>
                  </>
                )}
              </div>

              {speechTestAutoStopAvailable && !isSpeechTestRunning && !speechTestResult && (
                <label className="speech-auto-stop">
                  <input
                    type="checkbox"
                    checked={speechTestAutoStop}
                    onChange={(event) =>
                      setSpeechTestAutoStop(event.target.checked)
                    }
                  />
                  <span>
                    Stop the timer automatically when I finish. Uses your
                    microphone; nothing is recorded or sent.
                  </span>
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="ovi-section no-top">
          <div className="ovi-wrap speech-content">
            <CueDivider label="What your number means" />
            <div className="speech-band-table">
              {speechSpeedBands.map((band) => (
                <div key={band.range}>
                  <strong>{band.range}</strong>
                  <span>{band.label}</span>
                  <p>{band.description}</p>
                </div>
              ))}
            </div>
            <p className="ovi-muted">
              These bands are a guide, not a rule. Language, subject, and how
              well your listener knows you all move them.
            </p>

            <h2>Why reading aloud is not quite the same as speaking</h2>
            <p>
              Reading a passage measures your reading-aloud speed. Speaking off
              the top of your head is usually 10 to 20 words a minute slower,
              because you are choosing words as you go. If you are setting a
              teleprompter, the reading number is the one you want. If you are
              timing a talk you will improvise, take about 15 off.
            </p>

            <h2>Is there a right speed?</h2>
            <p>
              There is no single correct number, but there is a comfortable
              range for listeners. Around 140 to 160 words a minute is where
              most people follow easily when the subject is familiar. Slower
              helps when the material is new, technical, or in a language your
              listener is still learning.
            </p>

            <h2>How to change your speaking speed</h2>
            <p>
              To slow down, shorten your sentences before you speak them. To
              speed up, cut filler at the start of sentences. To hold a pace on
              camera, use a teleprompter set to your measured number.
            </p>
            <button
              type="button"
              className="ovi-btn ovi-btn-dark"
              onClick={() => openPrompterWithWpm(resultWpm)}
            >
              Open the prompter at {resultWpm} wpm
            </button>

            <div className="ovi-faq speech-faq">
              <CueDivider label="Questions" />
              <details open>
                <summary>Do I need a microphone?</summary>
                <p>No. The test measures time, not sound. Nothing is recorded and nothing is sent anywhere.</p>
              </details>
              <details>
                <summary>Does it work on a phone?</summary>
                <p>Yes, in any browser.</p>
              </details>
              <details>
                <summary>Why does my number change each time?</summary>
                <p>Speaking speed moves with mood, time of day, and how familiar the words are. Run it three times and take the middle number.</p>
              </details>
              <details>
                <summary>Can I test in Hindi or Marathi?</summary>
                <p>Yes, pick the language above the passage in future versions. Word counts work differently across languages, so treat the number as a guide within one language rather than a comparison between them.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (
    experienceMode !== "welcome" &&
    experienceMode !== "studio"
  ) {
    return <StaticPage mode={experienceMode} onNavigate={goTo} />;
  }

  if (experienceMode === "welcome") {
    const frontResultBand = speechTestResult
      ? speechSpeedBandFor(speechTestResult.wpm)
      : null;

    return (
      <main className="ovi-page">
        <nav className="ovi-nav">
          <div className="ovi-wrap">
            <a className="ovi-brand" href="#top" aria-label="OviCue home">
              <i /> {productName}
            </a>
            <div className="ovi-navlinks">
              <a href="#how">How it works</a>
              <button type="button" onClick={showFrontSpeedTest}>Speed test</button>
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
              Add your text and read smoothly, or first measure your natural
              speaking speed and start the prompter at that personal pace.
              Built for creators, teachers, and students who want clean videos
              without setup drama.
            </p>
            <div className="ovi-cta-row ovi-reveal delay-3">
              <button
                type="button"
                className="ovi-btn ovi-btn-dark"
                onClick={() => goTo("studio")}
              >
                Start prompting -- it&apos;s free
              </button>
              <button
                type="button"
                className="ovi-btn ovi-btn-ghost"
                onClick={showFrontSpeedTest}
              >
                Do the speed test
              </button>
            </div>
            <div className="ovi-hero-note ovi-reveal delay-4">
              <span className="ovi-chip ovi-mono">Phone, laptop, tablet</span>
              <span className="ovi-chip ovi-mono">Prompter + speed test</span>
              <span className="ovi-chip ovi-mono">Scripts stay on your device</span>
              <span className="ovi-chip ovi-mono">No watermark</span>
            </div>
          </div>
        </header>

        <section
          className="ovi-wrap ovi-rig"
          id="rig"
          aria-label={frontTool === "speed-test" ? "Speech speed test" : "Live teleprompter preview"}
        >
          <div className="audience-switcher" aria-label="Choose sample script audience">
            {audienceOrder.map((audience) => (
              <button
                key={audience}
                type="button"
                className={selectedAudience === audience ? "selected" : ""}
                onClick={() => chooseAudience(audience)}
              >
                {audienceScripts[audience].label}
              </button>
            ))}
          </div>

          <div className="front-tool-switch" aria-label="Choose OviCue tool">
            <button
              type="button"
              className={frontTool === "prompter-demo" ? "selected" : ""}
              onClick={() => setFrontTool("prompter-demo")}
            >
              Prompter preview
            </button>
            <button
              type="button"
              className={frontTool === "speed-test" ? "selected" : ""}
              onClick={() => setFrontTool("speed-test")}
            >
              Speed test
            </button>
          </div>

          {frontTool === "prompter-demo" ? (
            <>
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
            </>
          ) : (
            <div className="speech-test-panel front-speech-test">
              <div className="speech-test-top">
                <span className="ovi-mono">Find my pace · {audienceScripts[selectedAudience].label}</span>
                <strong>{formatTime(speechTestElapsed)}</strong>
              </div>
              <p className="speech-test-instruction">
                {isSpeechTestRunning
                  ? "Read out loud at your normal speaking voice."
                  : "Use the same script from the prompter preview. Press Start, read it aloud, then press Done."}
              </p>
              <div className="speech-test-passage" aria-label="Speech test passage">
                {demoText.split(/\n+/).filter(Boolean).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {speechTestError && (
                <div className="speech-test-error">{speechTestError}</div>
              )}
              {speechTestResult && frontResultBand && (
                <div className="speech-test-result">
                  <span className="ovi-mono">Your speech speed</span>
                  <strong>{speechTestResult.wpm} words per minute</strong>
                  <p>
                    {frontResultBand.label}. {frontResultBand.description}
                  </p>
                </div>
              )}
              <div className="speech-test-actions">
                {!isSpeechTestRunning && !speechTestResult && (
                  <button
                    type="button"
                    className="ovi-btn ovi-btn-dark"
                    onClick={() => startSpeechSpeedTest()}
                  >
                    Start the test
                  </button>
                )}
                {isSpeechTestRunning && (
                  <button
                    type="button"
                    className="ovi-btn ovi-btn-dark"
                    onClick={finishSpeechSpeedTest}
                  >
                    Done
                  </button>
                )}
                {speechTestResult && (
                  <>
                    <button
                      type="button"
                      className="ovi-btn ovi-btn-dark"
                      onClick={() => openPrompterWithWpm(speechTestResult.wpm)}
                    >
                      Start prompting at {speechTestResult.wpm} wpm
                    </button>
                    <button
                      type="button"
                      className="ovi-btn ovi-btn-ghost"
                      onClick={resetSpeechSpeedTest}
                    >
                      Test again
                    </button>
                  </>
                )}
              </div>
              {speechTestAutoStopAvailable && !isSpeechTestRunning && !speechTestResult && (
                <label className="speech-auto-stop">
                  <input
                    type="checkbox"
                    checked={speechTestAutoStop}
                    onChange={(event) =>
                      setSpeechTestAutoStop(event.target.checked)
                    }
                  />
                  <span>
                    Stop the timer automatically when I finish. Uses your
                    microphone; nothing is recorded or sent.
                  </span>
                </label>
              )}
            </div>
          )}
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
                  time appear as you write, so the script length is clear before
                  you record it.
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
                <li>Pace test that learns your speed</li>
                <li>Browser recording download</li>
                <li>No watermark on anything</li>
                <li>Works with no internet once the page has loaded</li>
                <li>No account, ever, if you don&apos;t want one</li>
              </ul>
              <p>Nothing on that list will move behind a paywall later.</p>
            </div>
          </div>
        </section>

        <section className="ovi-section no-top" id="features">
          <div className="ovi-wrap">
            <FeatureRow
              title="Mirror mode, both ways"
              copy="Beam-splitter glass flips your text left to right. Rigs mounted above the lens flip it top to bottom. Both toggles are here, and both are free."
              visual={<div className="ovi-mini flip">Read me in the glass<div className="ovi-cueline" /></div>}
            />
            <FeatureRow
              reverse
              title="We ask before the browser does"
              copy="Before camera preview or recording, OviCue explains what is needed. Prompting itself never needs permission, and your script stays on this device."
              visual={<div className="ovi-mini call"><span>Camera only when you switch preview on. Mic only for recording.</span></div>}
            />
            <FeatureRow
              title="It learns your pace"
              copy="Read your own script out loud once. OviCue works out your natural speed and sets the prompter to it."
              visual={<div className="ovi-mini tracking"><small>YOUR PACE</small><span>132 wpm</span><span>speed set from your read</span><b>▸ READY</b></div>}
            />
          </div>
        </section>

        <section className="ovi-section no-top">
          <div className="ovi-wrap audience-section">
            <h2>Built for anyone who has to say written words out loud.</h2>
            <p className="ovi-lead">
              A wedding host, an exam candidate, a news reader and a teacher
              have nothing in common except this: the words are already written,
              and they do not want to sound like they are reading them.
            </p>
            <div className="ovi-strip audience-strip">
              {[
                "Teachers",
                "Reels and Shorts",
                "YouTubers",
                "Students and interviews",
                "English practice",
                "Speakers and hosts",
                "Advisors and sales",
                "Podcasters",
              ].map((item) => (
                <span className="ovi-chip" key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="ovi-section no-top" id="speech-speed-test">
          <div className="ovi-wrap speech-signpost">
            <div>
              <span className="ovi-mono section-eyebrow">Free tool</span>
              <h2>How fast do you actually speak?</h2>
              <p className="ovi-lead">
                Most people guess wrong by twenty or thirty words a minute.
                Read a short passage out loud, press Done, and find out. It
                takes about ninety seconds, needs no microphone, and works in
                any browser.
              </p>
              <div className="ovi-cta-row">
                <button
                  type="button"
                  className="ovi-btn ovi-btn-dark"
                  onClick={showFrontSpeedTest}
                >
                  Take the speech speed test
                </button>
                <button
                  type="button"
                  className="ovi-btn ovi-btn-ghost"
                  onClick={() => goTo("studio")}
                >
                  Skip it, just let me read
                </button>
              </div>
            </div>
            <div className="speech-preview-card">
              <span className="ovi-mono">Your pace</span>
              <strong>142</strong>
              <p>words per minute</p>
              <b>A fast creator read</b>
            </div>
          </div>
        </section>

        <section className="ovi-section no-top" id="pricing">
          <div className="ovi-wrap pricing-single">
            <CueDivider label="Pricing" />
            <h2>Start free. Stay free.</h2>
            <div className="ovi-plans single-plan">
              <PlanCard
                label="Free"
                price="₹0"
                suffix=" forever"
                items={[
                  "Everything in the list above",
                  "Saved in this browser",
                  "Five-minute recordings",
                  "No signup",
                ]}
                action="Start prompting"
                onClick={() => goTo("studio")}
              />
            </div>
            <p className="pro-note">
              Pro and Team are being built. Voice tracking, sync across devices,
              and shared script libraries.
            </p>
            <div className="pro-waitlist">
              <input
                type="email"
                value={proEmail}
                onChange={(event) => setProEmail(event.target.value)}
                placeholder="Email for Pro updates"
                aria-label="Email for Pro updates"
              />
              <button type="button" className="ovi-btn ovi-btn-dark" onClick={saveProWaitlist}>
                Tell me when Pro is ready
              </button>
            </div>
            {proWaitlistMessage && <p className="pro-message">{proWaitlistMessage}</p>}
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

        <section className="ovi-section no-top" id="feedback">
          <div className="ovi-wrap ovi-feedback-block">
            <h2>Found a bug, or want something added?</h2>
            <p>
              Tell me what broke, what device you used, and what would make
              OviCue better. This version saves feedback locally until a real
              inbox is connected.
            </p>
            <form className="ovi-feedback-form" onSubmit={saveFeedback}>
              <label>
                <span>Feedback category</span>
                <select
                  value={feedbackType}
                  onChange={(event) =>
                    setFeedbackType(event.target.value as FeedbackType)
                  }
                >
                  <option value="bug">Report a bug</option>
                  <option value="feature">Request a feature</option>
                  <option value="hardware">Prompter hardware issue</option>
                  <option value="other">General feedback</option>
                </select>
              </label>
              <label>
                <span>Device and browser, optional</span>
                <input
                  type="text"
                  value={feedbackDevice}
                  onChange={(event) => setFeedbackDevice(event.target.value)}
                  placeholder="MacBook Air / Safari, Android / Chrome"
                />
              </label>
              <label>
                <span>Your message</span>
                <textarea
                  required
                  rows={4}
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  placeholder="What happened? What did you expect? What should we improve?"
                />
              </label>
              <button type="submit" className="ovi-btn ovi-btn-dark">
                Save feedback
              </button>
            </form>
            {feedbackNotice && <p className="feedback-notice">{feedbackNotice}</p>}
          </div>
        </section>

        <section className="ovi-tip-strip" id="support" aria-label="Support OviCue">
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
              <button type="button" onClick={showFrontSpeedTest}>Speech speed test</button>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <strong>Support</strong>
              <button type="button" onClick={() => goTo("help")}>Help center</button>
              <button type="button" onClick={() => goTo("about")}>About OviCue</button>
              <button type="button" onClick={showFeedbackSection}>Report a bug</button>
              <button type="button" onClick={() => goTo("changelog")}>Changelog</button>
            </div>
            <div>
              <strong>Legal</strong>
              <button type="button" onClick={() => goTo("privacy")}>Privacy policy</button>
              <button type="button" onClick={() => goTo("terms")}>Terms of service</button>
              <button type="button" onClick={() => goTo("accessibility")}>Accessibility</button>
            </div>
            <div>
              <strong>Company</strong>
              <button type="button" onClick={() => goTo("contact")}>Contact</button>
              <a href="#support">Support via UPI</a>
            </div>
            <div className="ovi-footer-bottom">
              <span>© {new Date().getFullYear()} OviCue</span>
              <span>Built in Pune</span>
              <span>No cookies</span>
              <span>No ads</span>
              <span>Your scripts never leave your device</span>
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
          <button type="button" onClick={showFeedbackSection}>
            <span>Feedback</span>
          </button>
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
            <div className={mediaIsLive ? "status-pill live" : "status-pill"}>
              {mediaStatus}
            </div>
            <div className="status-pill">{lines.length} lines</div>
          </div>
        </div>

        <div className="creator-intro">
          <p>Read naturally, keep eye contact, and record clean videos in English, Hindi, or Marathi. Everything runs in your browser for now.</p>
          <div className="intro-tags" aria-label={`${productName} highlights`}>
            <span>Smooth auto-roll</span>
            <span>हिन्दी</span>
            <span>मराठी</span>
            <span>{isVoiceMatching ? "Mic listening" : "Mic off"}</span>
            <span>{cameraEnabled || isRecording ? "Camera live" : "Camera off"}</span>
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
            <span>
              {isCalibrating
                ? `${calibrationRemaining}s`
                : personalPaceSource === "speech-test"
                  ? "Tested pace"
                  : "Live match"}
            </span>
          </div>
          {personalPaceSource === "speech-test" && calibrationInsight ? (
            <p>
              This pace came from your Speech Speed Test. OviCue is already set
              to roll at {calibrationInsight.wpm} wpm, so you can paste your
              script and start prompting without matching your voice again.
            </p>
          ) : (
            <p>
              Uses the script below. Read naturally and OviCue will move faster
              or slower with your spoken WPM.
              {isVoiceMatching ? ` ${voiceMatchStatus}` : ""}
              {liveSpokenWords > 0 ? ` ${liveSpokenWords} words heard.` : ""}
            </p>
          )}
          <div className="calibration-actions">
            {personalPaceSource === "speech-test" && calibrationInsight ? (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setSpeed(calibrationInsight.wpm);
                    setCustomSpeedValue(String(calibrationInsight.wpm));
                    setScrollMode("wpm");
                    startPrompt();
                  }}
                >
                  Start reading at this pace
                </button>
                <button
                  type="button"
                  onClick={showFrontSpeedTest}
                >
                  Retest speed
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={isCalibrating ? finishCalibration : startCalibration}
                >
                  {isCalibrating ? "Done" : "Find my pace"}
                </button>
                <button
                  type="button"
                  disabled={!calibrationInsight}
                  onClick={() => {
                    if (!calibrationInsight) return;
                    setSpeed(calibrationInsight.wpm);
                    setCustomSpeedValue(String(calibrationInsight.wpm));
                    setScrollMode("wpm");
                  }}
                >
                  Use my pace
                </button>
              </>
            )}
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
                  ? hasVisitMediaConsent()
                    ? startCamera(false)
                    : setMediaConsentIntent("camera")
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
      {mediaConsentIntent && (
        <div className="permission-overlay" role="dialog" aria-modal="true">
          <div className="permission-card browser-permission">
            <button
              type="button"
              className="permission-close"
              onClick={() => {
                setMediaConsentIntent(null);
                if (mediaConsentIntent === "camera") setCameraEnabled(false);
              }}
              aria-label="Close access request"
            >
              x
            </button>
            <h2>
              {mediaConsentIntent === "microphone"
                ? `${productName} wants to use your microphone`
                : mediaConsentIntent === "camera"
                  ? `${productName} wants to use your camera`
                  : mediaConsentIntent === "speech-auto-stop"
                    ? `${productName} wants to use your microphone`
                    : `${productName} wants to use your camera and microphone`}
            </h2>
            <div className="permission-request-line">
              <span>
                {mediaConsentIntent === "camera"
                  ? "camera"
                  : mediaConsentIntent === "recording"
                    ? "camera + mic"
                    : "mic"}
              </span>
              <p>
                {mediaConsentIntent === "camera"
                  ? "Camera preview only. Turn it off anytime."
                  : mediaConsentIntent === "recording"
                    ? "Browser recording only. Nothing is uploaded."
                    : "Used only for this speaking-speed action. Nothing is recorded or sent."}
              </p>
            </div>
            <div className="permission-actions browser-actions">
              <button
                type="button"
                className="permission-choice"
                onClick={() => acceptMediaConsent("visit")}
              >
                Allow while visiting the site
              </button>
              <button
                type="button"
                className="permission-choice"
                onClick={() => acceptMediaConsent("once")}
              >
                Allow this time
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mediaConsentIntent === "camera") {
                    window.localStorage.setItem("ovicue.perm.camera", "denied");
                  }
                  if (
                    mediaConsentIntent === "microphone" ||
                    mediaConsentIntent === "speech-auto-stop"
                  ) {
                    window.localStorage.setItem("ovicue.perm.mic", "denied");
                  }
                  if (mediaConsentIntent === "recording") {
                    window.localStorage.setItem("ovicue.perm.camera", "denied");
                    window.localStorage.setItem("ovicue.perm.mic", "denied");
                  }
                  setMediaConsentIntent(null);
                  if (mediaConsentIntent === "camera") setCameraEnabled(false);
                }}
                className="permission-choice"
              >
                Never allow
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
