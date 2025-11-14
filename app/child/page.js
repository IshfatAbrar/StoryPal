"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import StoryPlayer from "../components/StoryPlayer";

const STORAGE_KEY = "storypal.modules";
const PASSPORTS_KEY = "storypal.passports";

function loadModulesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadPassportsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PASSPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function buildContextFromPassport(p) {
  if (!p) return {};
  return {
    child: {
      name: p.childName || "",
      age: p.age || "",
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

export default function ChildPortal() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [passports, setPassports] = useState([]);
  const [selectedPassportId, setSelectedPassportId] = useState("");

  useEffect(() => {
    setModules(loadModulesFromStorage());
    const loadedPassports = loadPassportsFromStorage();
    setPassports(loadedPassports);
    if (loadedPassports.length === 1) {
      setSelectedPassportId(loadedPassports[0].id);
    }
  }, []);

  const selectedPassport = passports.find((p) => p.id === selectedPassportId) || null;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-zinc-900">Child Portal</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:underline">
              Home
            </Link>
            <Link href="/parent" className="text-blue-600 hover:underline">
              Parent Portal
            </Link>
          </div>
        </div>
        <p className="mt-2 text-zinc-700">Tap a story to begin.</p>

        <div className="mt-4 rounded-2xl bg-white/80 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-700">Select your profile</label>
            <select
              value={selectedPassportId}
              onChange={(e) => setSelectedPassportId(e.target.value)}
              className="bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
            >
              <option value="">— None —</option>
              {passports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.childName}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">
              Passports are created in the Parent Portal.
            </span>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.length === 0 && (
            <div className="text-zinc-600">No stories yet. Ask your parent to create one.</div>
          )}
          {modules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModule(m)}
              className="text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/80 backdrop-blur"
            >
              <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden mb-3 bg-zinc-100">
                {m.coverImage ? (
                  <Image
                    src={m.coverImage}
                    alt={m.title}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    No image
                  </div>
                )}
              </div>
              <div className="text-zinc-900 font-semibold leading-snug">{m.title}</div>
            </button>
          ))}
        </section>
      </div>

      {selectedModule && (
        <StoryPlayer
          moduleDefinition={selectedModule}
          templateContext={buildContextFromPassport(selectedPassport)}
          narrate={true}
          preferredVoice="female"
          onClose={() => setSelectedModule(null)}
          onFinished={() => setSelectedModule(null)}
        />
      )}
    </div>
  );
}


