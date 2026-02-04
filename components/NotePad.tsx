"use client";

import { useState } from "react";

interface NotePadProps {
  initialNote?: string;
  title?: string;
}

const NotePad = ({ initialNote = "", title = "Quick Note" }: NotePadProps) => {
  const [note, setNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(!initialNote);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>
      {isEditing ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Start typing your note..."
          className="h-48 w-full rounded border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <div className="min-h-[12rem] rounded border border-gray-200 bg-gray-50 p-3 whitespace-pre-wrap">
          {note || <span className="text-gray-400">No note yet. Click Edit to add one.</span>}
        </div>
      )}
      {note && (
        <div className="mt-2 text-xs text-gray-500">
          {note.length} characters
        </div>
      )}
    </div>
  );
};

export default NotePad;
