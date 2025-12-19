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
  childId = null,
  onStarsCollected,
}) {
  const title = moduleDefinition?.title || "Story";
  const coverImage = moduleDefinition?.coverImage || "";
  const moduleId = moduleDefinition?.id || "";
  const steps = useMemo(
    () => moduleDefinition?.steps || [],
    [moduleDefinition]
  );
  const fontPreset = moduleDefinition?.fontPreset || null; // null -> use app font
  const fontStyle = useMemo(() => {
    if (!fontPreset) return { fontFamily: "var(--app-font)" };
    if (fontPreset === "playful") {
      return { fontFamily: "var(--font-slackey)" };
    }
    if (fontPreset === "classic" || fontPreset === "mono") {
      return { fontFamily: "var(--font-epilogue)" };
    }
    if (fontPreset === "hand") {
      return { fontFamily: "var(--font-shadows-into-light)" };
    }
    return { fontFamily: "var(--app-font)" };
  }, [fontPreset]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userInputValue, setUserInputValue] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [starsCollected, setStarsCollected] = useState(false);

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
    return (
      path.split(".").reduce((acc, key) => {
        if (acc == null) return "";
        return acc[key];
      }, obj) ?? ""
    );
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
      // Show celebration screen on last step completion
      resetTransientState();
      setShowCelebration(true);
    }
  }

  function handleCollectStars() {
    const stars = 3; // Award 3 stars per completed module
    setStarsCollected(true);

    // Call the parent callback to save stars
    if (onStarsCollected && childId && moduleId) {
      onStarsCollected(childId, moduleId, stars);
    }

    // Close after a short delay
    setTimeout(() => {
      onFinished?.();
      onClose?.();
    }, 1500);
  }

  if (!Array.isArray(steps) || steps.length === 0) return null;

  // Generate parent guide content based on step type
  const parentGuide = useMemo(() => {
    if (!currentStep) return null;

    // Check if step has custom parent guide
    if (currentStep.parentGuide) {
      return currentStep.parentGuide;
    }

    // Default parent guides based on step type
    if (currentStep.type === "doctor") {
      return {
        title: "Guide Moment",
        description:
          "Read this message together with your child at their pace.",
        coActionPrompt:
          "Practice: Pause after reading and ask, 'How does that feel?'",
      };
    }
    if (currentStep.type === "user-input") {
      return {
        title: "Co-Action Prompt",
        description: "Work together to share thoughts and feelings.",
        coActionPrompt:
          "Practice: 'Let's think about this together. What would you like to say?'",
      };
    }
    if (currentStep.type === "choice") {
      return {
        title: "Choice Support",
        description: "Give your child time to think and choose.",
        coActionPrompt:
          "Practice: 'There's no wrong answer. Which one feels right to you?'",
      };
    }
    return null;
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-lg animate-[fadeInUp_200ms_ease-out] flex flex-col lg:flex-row overflow-hidden">
        {/* Main Story Content */}
        <div className="flex-1 flex flex-col overflow-y-auto relative">
          {/* Close button for desktop */}
          <button
            type="button"
            onClick={handleClose}
            className="hidden lg:flex absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md items-center justify-center text-zinc-700 hover:text-zinc-900 transition-all"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {coverImage ? (
            <div className="relative w-full aspect-4/3 overflow-hidden">
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
          <div className="p-6 flex-1 flex flex-col" style={fontStyle}>
            <h3
              className="text-2xl font-semibold text-zinc-900 mb-4"
              style={fontStyle}
            >
              {interpolate(title)}
            </h3>

            {currentStep && (
              <div className="flex-1 space-y-4">
                {currentStep.imageUrl && (
                  <div className="w-full rounded-2xl overflow-hidden border border-zinc-200">
                    <img
                      src={currentStep.imageUrl}
                      alt={interpolate(currentStep.message || title)}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {currentStep.type === "doctor" && (
                  <div className="bg-[#f5f0ff] rounded-2xl p-4 border border-[#e4d7ff]">
                    <p className="text-zinc-900 text-lg leading-relaxed">
                      {interpolate(currentStep.message || "")}
                    </p>
                  </div>
                )}

                {currentStep.type === "user-input" && (
                  <div className="space-y-3">
                    <div className="bg-[#f5f0ff] rounded-2xl p-4 border border-[#e4d7ff]">
                      <p className="text-zinc-900 text-lg mb-2">
                        {interpolate(currentStep.message || "")}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={userInputValue}
                      onChange={(e) => setUserInputValue(e.target.value)}
                      placeholder={interpolate(
                        currentStep.placeholder || "Type your answer..."
                      )}
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

                {currentStep.type === "choice" &&
                  Array.isArray(currentStep.options) && (
                    <div className="space-y-3">
                      <div className="bg-[#f5f0ff] rounded-2xl p-4 border border-[#e4d7ff]">
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
                                  ? "bg-[#5b217f] text-white shadow-md"
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

                <div className="flex justify-between items-center pt-4 border-t border-zinc-200 lg:hidden">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl px-4 py-2 text-zinc-700 hover:bg-zinc-100"
                  >
                    Close
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStepIndex > 0) {
                          setCurrentStepIndex((idx) => idx - 1);
                          resetTransientState();
                        }
                      }}
                      disabled={currentStepIndex === 0}
                      className="rounded-xl px-4 py-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        (currentStep.type === "user-input" &&
                          !userInputValue.trim()) ||
                        (currentStep.type === "choice" && !selectedChoice)
                      }
                      className="rounded-xl px-6 py-2 bg-[#5b217f] text-white hover:bg-[#7c2da3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isLastStep ? "Finish" : "Next"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parent Guide Panel */}
        {parentGuide && (
          <div className="lg:w-96 bg-[#fef9f0] border-l border-[#f5e6d3] p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-800 text-xs font-semibold tracking-wide uppercase flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Parent Guide
              </span>
            </div>

            <h3 className="text-xl font-semibold text-amber-900 mb-2">
              {parentGuide.title}
            </h3>
            <p className="text-amber-800 text-sm mb-6">
              {parentGuide.description}
            </p>

            {parentGuide.coActionPrompt && (
              <div className="bg-white/50 rounded-xl p-4 border border-amber-200">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                  Co-Action Prompt
                </div>
                <p className="text-amber-900 text-sm italic leading-relaxed">
                  {parentGuide.coActionPrompt}
                </p>
              </div>
            )}

            {/* Step Progress */}
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  if (currentStepIndex > 0) {
                    setCurrentStepIndex((idx) => idx - 1);
                    resetTransientState();
                  }
                }}
                disabled={currentStepIndex === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-amber-800 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous step"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <span className="text-sm text-amber-800 font-medium">
                {currentStepIndex + 1} / {steps.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep?.type === "user-input" &&
                    !userInputValue.trim()) ||
                  (currentStep?.type === "choice" && !selectedChoice)
                }
                className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                aria-label={isLastStep ? "Finish" : "Next step"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-yellow-400/95 backdrop-blur-sm animate-[fadeIn_300ms_ease-out] overflow-hidden">
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-2xl animate-[confettiFall_3s_ease-out_infinite]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.7 + Math.random() * 0.3,
                  }}
                >
                  {
                    ["🎉", "🎊", "⭐", "✨", "🌟"][
                      Math.floor(Math.random() * 5)
                    ]
                  }
                </div>
              ))}
            </div>

            <div className="text-center px-6 py-8 max-w-lg relative z-10">
              {/* Bouncing Trophy */}
              <div className="mb-8 animate-[bounce_1s_ease-in-out_infinite]">
                <div className="text-9xl">🏆</div>
              </div>

              {/* Congratulations Text */}
              <h2 className="text-5xl font-bold text-white mb-4 animate-[fadeInUp_400ms_ease-out] drop-shadow-lg">
                Congratulations!
              </h2>
              <p className="text-2xl text-white/90 mb-8 animate-[fadeInUp_500ms_ease-out] drop-shadow-md">
                You completed <span className="font-bold">{title}</span>!
              </p>

              {/* Collect Stars Button */}
              {!starsCollected ? (
                <button
                  type="button"
                  onClick={handleCollectStars}
                  className="group relative px-8 py-4 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 animate-[fadeInUp_600ms_ease-out]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:animate-bounce">
                      ⭐
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                        Collect Your
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        3 Stars
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                </button>
              ) : (
                <div className="animate-[fadeInUp_200ms_ease-out]">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-2xl font-bold text-white drop-shadow-lg">
                    3 Stars Collected!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
