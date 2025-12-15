"use client";

export default function SavedModules({ modules, onEdit, onDelete }) {
  return (
    <section className="mt-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Saved modules</h2>
      <p className="text-sm text-zinc-600">Stored in this browser.</p>
      <ul className="mt-3 space-y-3">
        {modules.length === 0 && (
          <li className="text-sm text-zinc-600">No modules yet.</li>
        )}
        {modules.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-zinc-200 p-3 bg-white"
          >
            <div className="font-medium text-zinc-900">{m.title}</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(m)}
                className="rounded-lg px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-sm"
              >
                Preview / Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(m.id)}
                className="rounded-lg px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

