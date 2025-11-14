"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";

/**
 * A reusable player that renders a sequence of story steps (module).
 * Supported step types:
 * - { type: "doctor", message: string }
 * - { type: "user-input", message: string, placeholder?: string }
 * - { type: "choice", message: string, options: string[] }
 */
export default function StoryPlayer({
  moduleDefinition,
  onClose,
  onFinished,
  templateContext,
  narrate = false,
  preferredVoice = "female",
}) {
  const title = moduleDefinition?.title || "Story";
  const coverImage = moduleDefinition?.coverImage || "";
  const steps = useMemo(() => moduleDefinition?.steps || [], [moduleDefinition]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userInputValue, setUserInputValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // --- Speech synthesis (optional narration) ---
  const voicesRef = useRef([]);
  const isSpeakingRef = useRef(false);

  function loadVoices() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const list = window.speechSynthesis.getVoices();
    if (list && list.length) {
      voicesRef.current = list;
    }
  }

  function pickPreferredVoice() {
    const list = voicesRef.current || [];
    if (!list.length) return null;
    const heuristics = [
      /female/i,
      /zir|jenny|aria|samantha|victoria|karen|allison|zoe|michelle|lisa|susan|hazel/i,
    ];
    for (const h of heuristics) {
      const v = list.find((voice) => h.test(voice.name));
      if (v) return v;
    }
    return list[0];
  }

  function speak(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!text) return;
    // cancel previous utterance
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickPreferredVoice();
    if (voice) utter.voice = voice;
    // slightly slower and brighter pitch to sound friendlier
    utter.rate = 0.95;
    utter.pitch = preferredVoice === "female" ? 1.1 : 1.0;
    isSpeakingRef.current = true;
    window.speechSynthesis.speak(utter);
    utter.onend = () => {
      isSpeakingRef.current = false;
    };
  }

  useEffect(() => {
    if (!narrate) return;
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [narrate]);

  useEffect(() => {
    if (!narrate || !currentStep) return;
    const type = currentStep.type;
    if (type === "doctor") {
      speak(interpolate(currentStep.message || ""));
    } else if (type === "user-input" || type === "choice") {
      speak(interpolate(currentStep.message || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrate, currentStepIndex]);

  function getByPath(obj, path) {
    if (!obj || !path) return "";
    return path.split(".").reduce((acc, key) => {
      if (acc == null) return "";
      return acc[key];
    }, obj) ?? "";
  }

  function interpolate(text) {
    if (typeof text !== "string") return text;
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
      const value = getByPath(templateContext, expr.trim());
      return value == null ? "" : String(value);
    });
  }

  function resetTransientState() {
    setUserInputValue("");
    setSelectedChoice(null);
  }

  function handleClose() {
    resetTransientState();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onClose?.();
  }

  function handleNext() {
    if (currentStep?.type === "user-input" && !userInputValue.trim()) return;
    if (currentStep?.type === "choice" && !selectedChoice) return;

    if (!isLastStep) {
      setCurrentStepIndex((idx) => idx + 1);
      resetTransientState();
    } else {
      resetTransientState();
      onFinished?.();
      onClose?.();
    }
  }

  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-lg animate-[fadeInUp_200ms_ease-out] flex flex-col">
        {coverImage ? (
          <div className="relative w-full aspect-4/3 rounded-t-2xl overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              unoptimized
              sizes="90vw"
            />
          </div>
        ) : null}
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <h3 className="text-2xl font-semibold text-zinc-900 mb-4">{interpolate(title)}</h3>

          {currentStep && (
            <div className="flex-1 space-y-4">
              {currentStep.type === "doctor" && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-zinc-900 text-lg leading-relaxed">
                    {interpolate(currentStep.message || "")}
                  </p>
                </div>
              )}

              {currentStep.type === "user-input" && (
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-zinc-900 text-lg mb-2">
                      {interpolate(currentStep.message || "")}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={userInputValue}
                    onChange={(e) => setUserInputValue(e.target.value)}
                    placeholder={interpolate(currentStep.placeholder || "Type your answer...")}
                    className="w-full bg-white/90 border-2 border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && userInputValue.trim()) {
                        handleNext();
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}

              {currentStep.type === "choice" && Array.isArray(currentStep.options) && (
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-zinc-900 text-lg mb-2">
                      {interpolate(currentStep.message || "")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {currentStep.options.map((option, idx) => {
                      const label = interpolate(option);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedChoice(label)}
                          className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                            selectedChoice === label
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-zinc-700 hover:bg-zinc-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep.type === "user-input" && !userInputValue.trim()) ||
                    (currentStep.type === "choice" && !selectedChoice)
                  }
                  className="rounded-xl px-6 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLastStep ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


