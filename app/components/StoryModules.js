"use client";

import { useState, useMemo } from "react";
import { Sparkles } from "lucide-react";

function createEmptyStep(stepType) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (stepType === "doctor") {
    return { id, type: "doctor", message: "", imageUrl: "" };
  }
  if (stepType === "user-input") {
    return { id, type: "user-input", message: "", placeholder: "", imageUrl: "" };
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

export default function StoryModules({
  selectedPassport,
  onSave,
  onPreview,
  initialData,
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [steps, setSteps] = useState(
    Array.isArray(initialData?.steps) ? initialData.steps : []
  );
  const [editingId, setEditingId] = useState(initialData?.id || null);
  const [activeStage, setActiveStage] = useState(1);
  const [sceneFont, setSceneFont] = useState(
    initialData?.fontPreset || "hand"
  );
  const [stageFraming, setStageFraming] = useState(
    initialData?.stageDesign?.framing || {
      focus: "greeting",
      scenario: "school",
      tone: "brave",
      parentGoal: "",
    }
  );
  const [stageImmersion, setStageImmersion] = useState(
    initialData?.stageDesign?.immersion || {
      feeling: "shy",
      coplay: "wave",
      imagery: "",
    }
  );
  const [stageReflection, setStageReflection] = useState(
    initialData?.stageDesign?.reflection || {
      tried: "",
      confidence: "Medium",
      comfort: "Medium",
    }
  );
  const [stageContinuity, setStageContinuity] = useState(
    initialData?.stageDesign?.continuity || {
      nextArc: "school-arc",
      cadence: "Every 2 days",
      badge: "bravery",
    }
  );

  function buildStageContext() {
    return {
      framing: { ...stageFraming },
      immersion: { ...stageImmersion },
      reflection: { ...stageReflection },
      continuity: { ...stageContinuity },
    };
  }

  function generateStepsFromStages() {
    const s = buildStageContext();
    const generated = [
      {
        type: "doctor",
        message:
          "Hi {{child.name}}! Today we're focusing on {{stages.framing.focus}} at {{stages.framing.scenario}}. We'll use our {{stages.framing.tone}} superpower.",
      },
      {
        type: "doctor",
        message:
          "Sometimes starting can feel new. {{child.name}} {{stages.immersion.feeling}}. Can we {{stages.immersion.coplay}} together?",
      },
      s.immersion.imagery
        ? {
            type: "doctor",
            message: "Look around: {{stages.immersion.imagery}}",
          }
        : null,
      {
        type: "choice",
        message: "Ready to try it?",
        options: ["Yes, let's try!", "Not yet", "Let's watch once first"],
      },
      {
        type: "doctor",
        message:
          "Great effort! You earned a {{stages.continuity.badge}} badge. Next time, we'll explore {{stages.continuity.nextArc}}.",
      },
    ]
      .filter(Boolean)
      .map((step) => {
        const base =
          step.type === "doctor"
            ? createEmptyStep("doctor")
            : step.type === "user-input"
            ? createEmptyStep("user-input")
            : createEmptyStep("choice");
        return { ...base, ...step };
      });

    setSteps((prev) => [...prev, ...generated]);
  }

  function addStep(stepType) {
    setSteps((prev) => [...prev, createEmptyStep(stepType)]);
  }

  function deleteStep(stepId) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  }

  function moveStep(stepId, direction) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function updateStep(stepId, field, value) {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
    );
  }

  function updateChoiceOption(stepId, optionIndex, value) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const options = Array.isArray(s.options) ? [...s.options] : [];
        options[optionIndex] = value;
        return { ...s, options };
      })
    );
  }

  function addChoiceOption(stepId) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const options = Array.isArray(s.options) ? [...s.options, ""] : [""];
        return { ...s, options };
      })
    );
  }

  function removeChoiceOption(stepId, optionIndex) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const options = (Array.isArray(s.options) ? s.options : []).filter(
          (_, i) => i !== optionIndex
        );
        return { ...s, options };
      })
    );
  }

  const modulePreview = useMemo(
    () => ({
      id: editingId || "preview",
      title: title || "Untitled Story",
      coverImage,
      steps,
      fontPreset: sceneFont || "hand",
    }),
    [editingId, title, coverImage, steps, sceneFont]
  );

  const isValid = validateModule(modulePreview);

  const handleSave = () => {
    const moduleDefinition = {
      id: editingId || `${Date.now()}`,
      title: title.trim(),
      coverImage: coverImage.trim(),
      steps,
      childId: selectedPassport?.id || null,
      stageDesign: {
        framing: { ...stageFraming },
        immersion: { ...stageImmersion },
        reflection: { ...stageReflection },
        continuity: { ...stageContinuity },
      },
      fontPreset: sceneFont || "hand",
    };
    if (!validateModule(moduleDefinition)) return;
    onSave(moduleDefinition);
  };

  const handlePreview = () => {
    onPreview(modulePreview);
  };

  return (
    <section className="mt-12">
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Story Modules</h1>
        <p className="text-zinc-700">
          Create personalized story modules for your child.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm text-zinc-700">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Calm Breathing Mission"
                className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
              />
            </div>
            <div>
              <label htmlFor="cover" className="block text-sm text-zinc-700">
                Cover Image URL (optional)
              </label>
              <input
                id="cover"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-700">Add step:</span>
              <button
                type="button"
                onClick={() => selectedPassport && addStep("doctor")}
                className="rounded-xl px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600"
              >
                Doctor message
              </button>
              <button
                type="button"
                onClick={() => selectedPassport && addStep("user-input")}
                className="rounded-xl px-3 py-1.5 bg-emerald-900 text-white hover:bg-emerald-600"
              >
                Ask for input
              </button>
              <button
                type="button"
                onClick={() => selectedPassport && addStep("choice")}
                className="rounded-xl px-3 py-1.5 bg-purple-500 text-white hover:bg-purple-600"
              >
                Multiple choice
              </button>
            </div>

            <ol className="space-y-4">
              {steps.map((step, idx) => (
                <li
                  key={step.id}
                  className="rounded-xl border border-zinc-200 p-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-600">
                      Step {idx + 1} • {step.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveStep(step.id, "up")}
                        className="rounded-lg px-2 py-1 text-zinc-700 hover:bg-zinc-100"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(step.id, "down")}
                        className="rounded-lg px-2 py-1 text-zinc-700 hover:bg-zinc-100"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStep(step.id)}
                        className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {step.type === "doctor" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Message
                        </label>
                        <textarea
                          value={step.message}
                          onChange={(e) =>
                            updateStep(step.id, "message", e.target.value)
                          }
                          rows={3}
                          placeholder="Write the doctor's message..."
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Step image URL (optional)
                        </label>
                        <input
                          value={step.imageUrl || ""}
                          onChange={(e) =>
                            updateStep(step.id, "imageUrl", e.target.value)
                          }
                          placeholder="https://example.com/scene.jpg"
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {step.type === "user-input" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Prompt
                        </label>
                        <textarea
                          value={step.message}
                          onChange={(e) =>
                            updateStep(step.id, "message", e.target.value)
                          }
                          rows={2}
                          placeholder="Ask the child a question..."
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Placeholder
                        </label>
                        <input
                          value={step.placeholder || ""}
                          onChange={(e) =>
                            updateStep(step.id, "placeholder", e.target.value)
                          }
                          placeholder="Type your answer..."
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Step image URL (optional)
                        </label>
                        <input
                          value={step.imageUrl || ""}
                          onChange={(e) =>
                            updateStep(step.id, "imageUrl", e.target.value)
                          }
                          placeholder="https://example.com/input-scene.jpg"
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {step.type === "choice" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Question
                        </label>
                        <textarea
                          value={step.message}
                          onChange={(e) =>
                            updateStep(step.id, "message", e.target.value)
                          }
                          rows={2}
                          placeholder="Ask the child to choose..."
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-sm text-zinc-700">
                            Options
                          </label>
                          <button
                            type="button"
                            onClick={() => addChoiceOption(step.id)}
                            className="rounded-lg px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-sm"
                          >
                            Add option
                          </button>
                        </div>
                        <div className="mt-2 space-y-2">
                          {(step.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                value={opt}
                                onChange={(e) =>
                                  updateChoiceOption(
                                    step.id,
                                    i,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => removeChoiceOption(step.id, i)}
                                className="rounded-lg px-2 py-2 text-red-600 hover:bg-red-50"
                                title="Remove option"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-700">
                          Step image URL (optional)
                        </label>
                        <input
                          value={step.imageUrl || ""}
                          onChange={(e) =>
                            updateStep(step.id, "imageUrl", e.target.value)
                          }
                          placeholder="https://example.com/choice-scene.jpg"
                          className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-300 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!isValid || !selectedPassport}
                className="rounded-xl px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-900 disabled:opacity-50"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid || !selectedPassport}
                className="rounded-xl px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {editingId ? "Update module" : "Save module"}
              </button>
            </div>
          </div>
        </div>

        {/* Scene Design — NT‑UX Stages */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">
              Design Guide
            </h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { n: 1, label: "1. Framing" },
              { n: 2, label: "2. Immersion" },
              { n: 3, label: "3. Reflection" },
              { n: 4, label: "4. Continuity" },
            ].map((tab) => (
              <button
                key={tab.n}
                type="button"
                onClick={() => setActiveStage(tab.n)}
                className={`px-4 py-2 rounded-full text-sm border ${
                  activeStage === tab.n
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeStage === 1 && (
              <div className="rounded-xl border border-zinc-200 p-4 bg-white space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Stage 1 · Narrative Framing
                </h3>
                <p className="text-sm text-zinc-600">
                  Personalize the setup and align with today's goal.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Today's focus
                    </label>
                    <select
                      value={stageFraming.focus}
                      onChange={(e) =>
                        setStageFraming({
                          ...stageFraming,
                          focus: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="greeting">Greeting / Saying hello</option>
                      <option value="sharing">Sharing / Turn‑taking</option>
                      <option value="routine">Morning routine</option>
                      <option value="sensory">
                        Managing sensory surprises
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Scenario
                    </label>
                    <select
                      value={stageFraming.scenario}
                      onChange={(e) =>
                        setStageFraming({
                          ...stageFraming,
                          scenario: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="school">School: arrival and wave</option>
                      <option value="playdate">
                        Playdate: meet a new friend
                      </option>
                      <option value="store">
                        Grocery store: checkout line
                      </option>
                      <option value="clinic">Clinic: waiting room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Desired tone
                    </label>
                    <select
                      value={stageFraming.tone}
                      onChange={(e) =>
                        setStageFraming({
                          ...stageFraming,
                          tone: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="brave">Encouraging & brave</option>
                      <option value="calm">Calm & soothing</option>
                      <option value="curious">Curious & playful</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Parent goal (optional)
                    </label>
                    <input
                      value={stageFraming.parentGoal}
                      onChange={(e) =>
                        setStageFraming({
                          ...stageFraming,
                          parentGoal: e.target.value,
                        })
                      }
                      placeholder="e.g., Practice waving back to a classmate"
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="rounded-xl border border-zinc-200 p-4 bg-white space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Stage 2 · Immersion
                </h3>
                <p className="text-sm text-zinc-600">
                  Guide imagery and perspective‑taking; co‑play the avatar.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Current feeling
                    </label>
                    <select
                      value={stageImmersion.feeling}
                      onChange={(e) =>
                        setStageImmersion({
                          ...stageImmersion,
                          feeling: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="shy">Shy</option>
                      <option value="excited">Excited</option>
                      <option value="nervous">Nervous</option>
                      <option value="proud">Proud</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Co‑play prompt
                    </label>
                    <select
                      value={stageImmersion.coplay}
                      onChange={(e) =>
                        setStageImmersion({
                          ...stageImmersion,
                          coplay: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="wave">Practice a superhero wave</option>
                      <option value="share">
                        Offer a toy and say "your turn"
                      </option>
                      <option value="count">Count to three together</option>
                      <option value="breathe">Do a 3‑breath sparkle</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-zinc-700">
                      Imagery line (optional)
                    </label>
                    <textarea
                      value={stageImmersion.imagery}
                      onChange={(e) =>
                        setStageImmersion({
                          ...stageImmersion,
                          imagery: e.target.value,
                        })
                      }
                      placeholder="Describe what your child sees (e.g., 'Blue backpack, Mia smiles and waves')."
                      rows={2}
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="rounded-xl border border-zinc-200 p-4 bg-white space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Stage 3 · Reflection
                </h3>
                <p className="text-sm text-zinc-600">
                  Connect the story to real‑life experiences and log progress.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-700">
                      What did your child try?
                    </label>
                    <input
                      value={stageReflection.tried}
                      onChange={(e) =>
                        setStageReflection({
                          ...stageReflection,
                          tried: e.target.value,
                        })
                      }
                      placeholder="e.g., Waved back and smiled"
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Parent confidence
                    </label>
                    <select
                      value={stageReflection.confidence}
                      onChange={(e) =>
                        setStageReflection({
                          ...stageReflection,
                          confidence: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Child comfort
                    </label>
                    <select
                      value={stageReflection.comfort}
                      onChange={(e) =>
                        setStageReflection({
                          ...stageReflection,
                          comfort: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <div className="rounded-xl border border-zinc-200 p-4 bg-white space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Stage 4 · Continuity
                </h3>
                <p className="text-sm text-zinc-600">
                  Keep the arc going with micro‑quests and badges.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Next arc
                    </label>
                    <select
                      value={stageContinuity.nextArc}
                      onChange={(e) =>
                        setStageContinuity({
                          ...stageContinuity,
                          nextArc: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="school-arc">
                        School Adventure (week)
                      </option>
                      <option value="friend-arc">New Friend Mini‑Arc</option>
                      <option value="store-arc">Helper at the Store</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">
                      Reminder cadence
                    </label>
                    <select
                      value={stageContinuity.cadence}
                      onChange={(e) =>
                        setStageContinuity({
                          ...stageContinuity,
                          cadence: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option>Daily</option>
                      <option>Every 2 days</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-700">Badge</label>
                    <select
                      value={stageContinuity.badge}
                      onChange={(e) =>
                        setStageContinuity({
                          ...stageContinuity,
                          badge: e.target.value,
                        })
                      }
                      className="mt-1 w-full bg-white/90 border border-zinc-200 rounded-xl px-4 py-2"
                    >
                      <option value="bravery">Bravery Badge</option>
                      <option value="sharing">Sharing Star</option>
                      <option value="helper">Helpful Hero</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={generateStepsFromStages}
              className="rounded-xl px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Generate steps with Ai{" "}
              <Sparkles className="inline-block w-4 h-4 mb-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

