"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StoryPlayer from "../components/StoryPlayer";
import SiteFont from "../components/SiteFont";
import SavedModules from "../components/SavedModules";
import ReflectionJournal from "../components/ReflectionJournal";
import CommunicationPassports from "../components/CommunicationPassports";
import StoryModules from "../components/StoryModules";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const STORAGE_KEY = "storypal.modules";
const PASSPORTS_KEY = "storypal.passports";
const REFLECTIONS_KEY = "storypal.reflections";

function scopedKey(base, uid) {
  return uid ? `${base}.${uid}` : base;
}

function loadModulesFromStorage(uid) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(scopedKey(STORAGE_KEY, uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveModulesToStorage(modules, uid) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    scopedKey(STORAGE_KEY, uid),
    JSON.stringify(modules)
  );
}

function loadPassportsFromStorage(uid) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(scopedKey(PASSPORTS_KEY, uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePassportsToStorage(passports, uid) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    scopedKey(PASSPORTS_KEY, uid),
    JSON.stringify(passports)
  );
}

function loadReflectionsFromStorage(uid) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(scopedKey(REFLECTIONS_KEY, uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReflectionsToStorage(reflections, uid) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    scopedKey(REFLECTIONS_KEY, uid),
    JSON.stringify(reflections)
  );
}

function createEmptyStep(stepType) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (stepType === "doctor") {
    return { id, type: "doctor", message: "", imageUrl: "" };
  }
  if (stepType === "user-input") {
    return {
      id,
      type: "user-input",
      message: "",
      placeholder: "",
      imageUrl: "",
    };
  }
  return { id, type: "choice", message: "", options: [""], imageUrl: "" };
}

function validateModule(moduleDef) {
  if (!moduleDef.title.trim()) return false;
  if (!Array.isArray(moduleDef.steps) || moduleDef.steps.length === 0)
    return false;
  for (const step of moduleDef.steps) {
    if (step.type === "doctor" && !step.message.trim()) return false;
    if (step.type === "user-input" && !step.message.trim()) return false;
    if (step.type === "choice") {
      if (!step.message.trim()) return false;
      if (!Array.isArray(step.options) || step.options.length === 0)
        return false;
      if (step.options.some((o) => !o.trim())) return false;
    }
  }
  return true;
}

// Simple pregenerated example story modules shown by default
const DEFAULT_MODULES = [
  {
    id: "demo-calm-breathing",
    title: "Calm Breathing Mission",
    coverImage: "",
    fontPreset: "classic",
    childId: null,
    stageDesign: null,
    steps: [
      {
        type: "doctor",
        message:
          "Hi {{child.name}}! Today our mission is to help your body feel calmer with three sparkle breaths.",
      },
      {
        type: "doctor",
        message:
          "First, put one hand on your chest and one hand on your tummy. Feel them move as you breathe in and out.",
      },
      {
        type: "choice",
        message: "How does your body feel right now?",
        options: ["A little wiggly", "Very wiggly", "Pretty calm"],
      },
      {
        type: "doctor",
        message:
          "Let’s try three slow sparkle breaths together. Breathe in through your nose… and blow the sparkles out gently.",
      },
    ],
  },
  {
    id: "demo-school-wave",
    title: "Brave School Wave",
    coverImage: "",
    fontPreset: "hand",
    childId: null,
    stageDesign: null,
    steps: [
      {
        type: "doctor",
        message:
          "StoryPal time! Today we practice a brave wave for when you arrive at school.",
      },
      {
        type: "doctor",
        message:
          "Imagine you are standing by the classroom door. Your teacher smiles and says your name.",
      },
      {
        type: "choice",
        message: "What feels like a good first step?",
        options: [
          "A tiny wave with your hand",
          "Just looking and nodding",
          "Holding your grown‑up’s hand and waving together",
        ],
      },
      {
        type: "user-input",
        message:
          "Together, choose one brave micro‑step for tomorrow morning. Type it here as your mission.",
        placeholder:
          "e.g., I will look at the teacher and lift my hand a little.",
      },
    ],
  },
];

// Static interactive training module for parents
const PARENT_TRAINING_MODULE = {
  id: "parent-training",
  title: "Interactive Parent Training: The Science of StoryPal & Co‑Action",
  coverImage: "",
  fontPreset: "classic",
  steps: [
    {
      type: "doctor",
      message:
        "Welcome to StoryPal! This short training shows you how StoryPal uses simple stories and visuals to support your child's social and emotional growth.",
    },
    {
      type: "doctor",
      message:
        "StoryPal is built on narrative therapy, co‑regulation, and neurodiversity‑affirming practice. Instead of 'fixing' your child, we celebrate their strengths and give them scaffolds for tricky moments.",
    },
    {
      type: "doctor",
      message:
        'One key idea is "Co‑Action": you and your child acting together. You model the skill, co‑play the action, and then gradually hand more control to your child when they feel ready.',
    },
    {
      type: "choice",
      message: "How familiar does Co‑Action feel to you right now?",
      options: [
        "Very new concept for me",
        "I’ve heard of similar ideas",
        "I already use something like this",
      ],
    },
    {
      type: "doctor",
      message:
        "In StoryPal, each step is a small Co‑Action moment: you read or listen together, pause to check in, and sometimes practice the move in real life—a wave, a deep breath, or asking for help.",
    },
    {
      type: "user-input",
      message:
        "Think of one everyday situation where you’d like StoryPal to help your child. Type a quick note so you remember it later.",
      placeholder: "e.g., saying hello at school drop‑off, waiting in a line…",
    },
    {
      type: "doctor",
      message:
        'Beautiful. As you build modules, keep coming back to Co‑Action: "How can we try this together, side‑by‑side, in a way that feels safe and playful?" You’re not alone—StoryPal is here to coach you step by step.',
    },
  ],
};

export default function ParentPortal() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [passports, setPassports] = useState([]);
  const [selectedPassportId, setSelectedPassportId] = useState(null);
  // Reflection Journal state
  const [reflections, setReflections] = useState([]);
  // Story module editing state
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Require authenticated parent
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthReady(false);
        setAuthChecking(false);
        setCurrentUser(null);
        router.replace("/parent/auth");
        return;
      }
      setCurrentUser(user);
      setAuthReady(true);
      setAuthChecking(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    const uid = currentUser.uid;
    const storedModules = loadModulesFromStorage(uid) || [];
    // Ensure the two demo modules are present at least once
    const missingDefaults = DEFAULT_MODULES.filter(
      (demo) => !storedModules.some((m) => m.id === demo.id)
    );
    const mergedModules =
      missingDefaults.length > 0
        ? [...storedModules, ...missingDefaults]
        : storedModules;
    setModules(mergedModules);
    if (missingDefaults.length > 0) {
      saveModulesToStorage(mergedModules, uid);
    }
    const loadedPassports = loadPassportsFromStorage(uid);
    setPassports(loadedPassports);
    if (loadedPassports.length > 0) {
      setSelectedPassportId(loadedPassports[0].id);
    }
    setReflections(loadReflectionsFromStorage(uid));
  }, [authReady, currentUser]);

  const showAuthGate = authChecking || !authReady;

  function buildContextFromPassport(p) {
    if (!p) return {};
    return {
      child: {
        name: p.childName || "",
        age: p.age || "",
        avatar: p.avatar || "",
        pronouns: {
          subject: p.pronouns?.subject || "",
          object: p.pronouns?.object || "",
          possessiveAdjective: p.pronouns?.possessiveAdjective || "",
          possessivePronoun: p.pronouns?.possessivePronoun || "",
        },
      },
      communication: {
        modalities: (p.communication?.modalities || []).join(", "),
        comprehensionLevel: p.communication?.comprehensionLevel || "",
        latency: p.communication?.latency || "",
        yesNoConventions: p.communication?.yesNoConventions || "",
        dontUnderstandSignals: p.communication?.dontUnderstandSignals || "",
      },
      sensory: { ...p.sensory },
      preferences: {
        reinforcement: p.interaction?.reinforcementPreferences || "",
        interests: p.interaction?.interests || "",
        dosDonts: p.interaction?.dosDonts || "",
        identityLanguage: p.interaction?.identityLanguage || "",
        culturalContext: p.interaction?.culturalContext || "",
      },
      access: {
        accessibilityNeeds: p.accessSafety?.accessibilityNeeds || "",
        deescalationStrategies: p.accessSafety?.deescalationStrategies || "",
        caregiverNotes: p.accessSafety?.caregiverNotes || "",
        consentScope: p.accessSafety?.consentScope || "",
      },
    };
  }

  const selectedPassport = useMemo(
    () => passports.find((p) => p.id === selectedPassportId) || null,
    [passports, selectedPassportId]
  );

  function deleteModule(id) {
    const next = modules.filter((m) => m.id !== id);
    setModules(next);
    saveModulesToStorage(next, currentUser?.uid);
    if (editingModuleId === id) {
      setEditingModuleId(null);
    }
  }

  function handleModuleSave(moduleDefinition) {
    const next = [...modules];
    const existingIdx = next.findIndex((m) => m.id === moduleDefinition.id);
    if (existingIdx >= 0) {
      next[existingIdx] = moduleDefinition;
    } else {
      next.unshift(moduleDefinition);
    }
    setModules(next);
    saveModulesToStorage(next, currentUser?.uid);
    setEditingModuleId(null);
  }

  function handleModulePreview(modulePreview) {
    setPreviewModule(modulePreview);
    setShowPreview(true);
  }

  function handleModuleEdit(module) {
    setEditingModuleId(module.id);
  }

  if (showAuthGate) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-rose-50 via-white to-blue-50">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-zinc-800">
            Checking parent sign-in…
          </div>
          <div className="text-sm text-zinc-600">
            If this takes long, please sign in again.
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-zinc-900">
            Parent Portal
          </h1>
        </div>

        {/* Interactive Parent Training – always available */}
        <section className="mt-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Interactive Parent Training
          </h2>
          <p className="mt-2 text-sm text-zinc-700">
            Learn the science behind StoryPal and how to use{" "}
            <span className="font-semibold">Co‑Action</span>—doing the steps
            together with your child—to make stories feel safe, playful, and
            effective.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPreviewModule(PARENT_TRAINING_MODULE);
                setShowPreview(true);
              }}
              className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold"
            >
              Start training
            </button>
            <span className="text-xs text-zinc-500">
              3–5 minutes · Read or listen together
            </span>
          </div>
        </section>

        {passports.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center min-h-[40vh]">
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-semibold text-zinc-900 mb-4">
                Create a Passport to Continue
              </h2>
              <p className="text-lg text-zinc-700 mb-6">
                Before you can design story modules, you need to create a
                Communication Passport for your child.
              </p>
              <CommunicationPassports
                passports={[]}
                selectedPassportId={null}
                onPassportChange={(next) => {
                  setPassports(next);
                  savePassportsToStorage(next, currentUser?.uid);
                }}
                onSelectedPassportChange={setSelectedPassportId}
              />
            </div>
          </div>
        ) : (
          <>
            <CommunicationPassports
              passports={passports}
              selectedPassportId={selectedPassportId}
              onPassportChange={(next) => {
                setPassports(next);
                savePassportsToStorage(next, currentUser?.uid);
              }}
              onSelectedPassportChange={setSelectedPassportId}
            />

            <StoryModules
              selectedPassport={selectedPassport}
              onSave={handleModuleSave}
              onPreview={handleModulePreview}
              initialData={
                editingModuleId
                  ? modules.find((m) => m.id === editingModuleId)
                  : null
              }
            />

            {/* Saved Modules - below the grid */}
            <SavedModules
              modules={modules}
              onEdit={(m) => {
                if (m.childId) setSelectedPassportId(m.childId);
                handleModuleEdit(m);
              }}
              onDelete={deleteModule}
            />

            {/* Reflection Journal */}
            <ReflectionJournal
              modules={modules}
              reflections={reflections}
              onSave={(reflectionData) => {
                const reflection = {
                  id: reflectionData.id || `${Date.now()}`,
                  storyId: reflectionData.storyId,
                  childComfort: reflectionData.childComfort,
                  parentConfidence: reflectionData.parentConfidence,
                  observations: reflectionData.observations.trim(),
                  successMoments: reflectionData.successMoments.trim(),
                  createdAt: reflectionData.id
                    ? reflections.find((r) => r.id === reflectionData.id)
                        ?.createdAt || new Date().toISOString()
                    : new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                const next = [...reflections];
                const existingIdx = next.findIndex(
                  (r) => r.id === reflection.id
                );
                if (existingIdx >= 0) {
                  next[existingIdx] = reflection;
                } else {
                  next.push(reflection);
                }
                setReflections(next);
                saveReflectionsToStorage(next, currentUser?.uid);
              }}
              onEdit={(reflection) => {
                // Component handles this internally
              }}
              onDelete={(id) => {
                const next = reflections.filter((r) => r.id !== id);
                setReflections(next);
                saveReflectionsToStorage(next, currentUser?.uid);
              }}
            />
          </>
        )}

        {/* Removed duplicate passport form - handled by CommunicationPassports component */}
        {false && (
          <div className="mt-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                New Passport
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPassportForm(false);
                  resetPassportForm();
                }}
                className="rounded-lg px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Choose avatar
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3 ">
                  {["bird", "giraffe", "elephant"].map((a) => {
                    const meta =
                      a === "elephant"
                        ? {
                            bg: "bg-[#4f87d8]",
                            src: "/elephant.png",
                            label: "Elephant",
                          }
                        : a === "giraffe"
                        ? {
                            bg: "bg-[#f97316]",
                            src: "/jiraffe.png",
                            label: "Giraffe",
                          }
                        : {
                            bg: "bg-[#34a853]",
                            src: "/bird.png",
                            label: "Bird",
                          };
                    const isSel = cpAvatar === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setCpAvatar(a)}
                        className={`rounded-xl px-3 py-4 border ${
                          isSel ? "border-zinc-900" : "border-zinc-200"
                        } ${
                          meta.bg
                        } text-white flex flex-col items-center justify-center gap-2`}
                        title={meta.label}
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/60 border border-white/50">
                          <img
                            src={meta.src}
                            alt={meta.label}
                            className="w-16 h-16 object-cover"
                          />
                        </div>
                        <div className="text-sm font-semibold">
                          {meta.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-700">
                  Child name
                </label>
                <input
                  value={cpName}
                  onChange={(e) => setCpName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">
                  Age (optional)
                </label>
                <input
                  value={cpAge}
                  onChange={(e) => setCpAge(e.target.value)}
                  placeholder="e.g., 6"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">Pronouns</label>
                <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    value={cpPronouns.subject}
                    onChange={(e) =>
                      setCpPronouns({
                        ...cpPronouns,
                        subject: e.target.value,
                      })
                    }
                    placeholder="Subject (they)"
                    className="bg-white/90 border border-zinc-200 rounded-xl px-3 py-2"
                  />
                  <input
                    value={cpPronouns.object}
                    onChange={(e) =>
                      setCpPronouns({
                        ...cpPronouns,
                        object: e.target.value,
                      })
                    }
                    placeholder="Object (them)"
                    className="bg-white/90 border border-zinc-200 rounded-xl px-3 py-2"
                  />
                  <input
                    value={cpPronouns.possessiveAdjective}
                    onChange={(e) =>
                      setCpPronouns({
                        ...cpPronouns,
                        possessiveAdjective: e.target.value,
                      })
                    }
                    placeholder="Poss. adj. (their)"
                    className="bg-white/90 border border-zinc-200 rounded-xl px-3 py-2"
                  />
                  <input
                    value={cpPronouns.possessivePronoun}
                    onChange={(e) =>
                      setCpPronouns({
                        ...cpPronouns,
                        possessivePronoun: e.target.value,
                      })
                    }
                    placeholder="Poss. pron. (theirs)"
                    className="bg-white/90 border border-zinc-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Communication Modalities
                </label>
                <div className="mt-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {["AAC", "PECS", "Gestures", "Sign", "Verbal"].map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cpModalities[key]}
                        onChange={(e) =>
                          setCpModalities({
                            ...cpModalities,
                            [key]: e.target.checked,
                          })
                        }
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-700">
                  Comprehension level
                </label>
                <input
                  value={cpCommunication.comprehensionLevel}
                  onChange={(e) =>
                    setCpCommunication({
                      ...cpCommunication,
                      comprehensionLevel: e.target.value,
                    })
                  }
                  placeholder="e.g., simple 1-step instructions"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700">Latency</label>
                <input
                  value={cpCommunication.latency}
                  onChange={(e) =>
                    setCpCommunication({
                      ...cpCommunication,
                      latency: e.target.value,
                    })
                  }
                  placeholder="e.g., needs 5–10 seconds"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Yes/No conventions
                </label>
                <input
                  value={cpCommunication.yesNoConventions}
                  onChange={(e) =>
                    setCpCommunication({
                      ...cpCommunication,
                      yesNoConventions: e.target.value,
                    })
                  }
                  placeholder="e.g., nodding, thumbs up, AAC buttons"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  "Don't understand" signals
                </label>
                <input
                  value={cpCommunication.dontUnderstandSignals}
                  onChange={(e) =>
                    setCpCommunication({
                      ...cpCommunication,
                      dontUnderstandSignals: e.target.value,
                    })
                  }
                  placeholder="e.g., covers ears, says 'break'"
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Sensory sensitivities
                </label>
                <textarea
                  value={cpSensory.sensitivities}
                  onChange={(e) =>
                    setCpSensory({
                      ...cpSensory,
                      sensitivities: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">Triggers</label>
                <textarea
                  value={cpSensory.triggers}
                  onChange={(e) =>
                    setCpSensory({ ...cpSensory, triggers: e.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Regulation strategies
                </label>
                <textarea
                  value={cpSensory.strategies}
                  onChange={(e) =>
                    setCpSensory({
                      ...cpSensory,
                      strategies: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Safe words / cues
                </label>
                <textarea
                  value={cpSensory.safeWordsCues}
                  onChange={(e) =>
                    setCpSensory({
                      ...cpSensory,
                      safeWordsCues: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Reinforcement preferences
                </label>
                <textarea
                  value={cpInteraction.reinforcementPreferences}
                  onChange={(e) =>
                    setCpInteraction({
                      ...cpInteraction,
                      reinforcementPreferences: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">Interests</label>
                <textarea
                  value={cpInteraction.interests}
                  onChange={(e) =>
                    setCpInteraction({
                      ...cpInteraction,
                      interests: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Do / Don't
                </label>
                <textarea
                  value={cpInteraction.dosDonts}
                  onChange={(e) =>
                    setCpInteraction({
                      ...cpInteraction,
                      dosDonts: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Identity language
                </label>
                <textarea
                  value={cpInteraction.identityLanguage}
                  onChange={(e) =>
                    setCpInteraction({
                      ...cpInteraction,
                      identityLanguage: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Cultural / linguistic context
                </label>
                <textarea
                  value={cpInteraction.culturalContext}
                  onChange={(e) =>
                    setCpInteraction({
                      ...cpInteraction,
                      culturalContext: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Accessibility needs
                </label>
                <textarea
                  value={cpAccess.accessibilityNeeds}
                  onChange={(e) =>
                    setCpAccess({
                      ...cpAccess,
                      accessibilityNeeds: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  De-escalation strategies
                </label>
                <textarea
                  value={cpAccess.deescalationStrategies}
                  onChange={(e) =>
                    setCpAccess({
                      ...cpAccess,
                      deescalationStrategies: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Caregiver notes
                </label>
                <textarea
                  value={cpAccess.caregiverNotes}
                  onChange={(e) =>
                    setCpAccess({
                      ...cpAccess,
                      caregiverNotes: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-700">
                  Consent scope
                </label>
                <textarea
                  value={cpAccess.consentScope}
                  onChange={(e) =>
                    setCpAccess({
                      ...cpAccess,
                      consentScope: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={upsertPassport}
                disabled={!cpName.trim()}
                className="rounded-xl px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                Save Passport
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPassportForm(false);
                  resetPassportForm();
                }}
                className="rounded-xl px-4 py-2 bg-zinc-100 hover:bg-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Site Font */}
        <SiteFont />
      </div>

      {showPreview && previewModule && (
        <StoryPlayer
          moduleDefinition={previewModule}
          templateContext={
            previewModule.id === "parent-training" || !selectedPassport
              ? {}
              : buildContextFromPassport(selectedPassport)
          }
          onClose={() => {
            setShowPreview(false);
            setPreviewModule(null);
          }}
          onFinished={() => {
            setShowPreview(false);
            setPreviewModule(null);
          }}
        />
      )}
    </div>
  );
}
