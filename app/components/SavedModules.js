"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../hooks/useTranslation";

export default function SavedModules({ modules, onEdit, onDelete }) {
  const { t } = useTranslation();
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-zinc-900">{t("savedModules")}</h2>
      <p className="text-sm text-zinc-600">
        {t("modulesSavedAccount")}
      </p>

      {modules.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600">{t("noModulesYet")}</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div
              key={m.id}
              className="group rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/80 backdrop-blur border border-zinc-200 relative"
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
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                    {t("noImage")}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-900 font-semibold leading-snug">
                  {m.title || t("untitledStory")}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    type="button"
                    onClick={() => onEdit(m)}
                    className="rounded-full w-8 h-8 flex items-center justify-center p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title={t("previewEdit")}
                    aria-label={t("previewEdit")}
                  >
                    <FontAwesomeIcon
                      icon={faPenToSquare}
                      className="w-3.5 h-3.5"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    className="rounded-full w-8 h-8 flex items-center justify-center p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
