"use client";

import { useState } from "react";

export type DuprMatchRow = {
  date: string; // YYYY-MM-DD
  location: string;
  teamA: string[]; // exactly 2 player ids
  teamB: string[]; // exactly 2 player ids
  sets: { a: number; b: number }[];
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADER = [
  "matchType",
  "event",
  "date",
  "playerA1",
  "playerA1DuprId",
  "playerA1ExternalId",
  "playerA2",
  "playerA2DuprId",
  "playerA2ExternalId",
  "playerB1",
  "playerB1DuprId",
  "playerB1ExternalId",
  "playerB2",
  "playerB2DuprId",
  "playerB2ExternalId",
  "teamAGame1",
  "teamBGame1",
  "teamAGame2",
  "teamBGame2",
  "teamAGame3",
  "teamBGame3",
  "teamAGame4",
  "teamBGame4",
  "teamAGame5",
  "teamBGame5",
  "location",
  "scoreType",
];

export function ExportDuprCsvButton({
  event,
  matches,
  nameById,
  duprById,
  fileNameHint,
  triggerClassName,
}: {
  event: string;
  matches: DuprMatchRow[];
  nameById: Map<string, string>;
  duprById: Map<string, string | null>;
  fileNameHint: string;
  triggerClassName?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);

    const played = matches.filter((m) => m.sets.length > 0);
    if (played.length === 0) {
      setError("No completed matches to export yet.");
      return;
    }

    const participantIds = new Set(played.flatMap((m) => [...m.teamA, ...m.teamB]));
    const missing = [...participantIds]
      .filter((id) => !duprById.get(id))
      .map((id) => nameById.get(id) ?? "Unknown player");

    if (missing.length > 0) {
      setError(
        `Missing DUPR ID for: ${missing.join(", ")}. Add their DUPR ID on the Players page, then try again.`
      );
      return;
    }

    const rows = played.map((m) => {
      const [a1, a2] = m.teamA;
      const [b1, b2] = m.teamB;
      const gameCols: string[] = [];
      for (let i = 0; i < 5; i++) {
        const set = m.sets[i];
        gameCols.push(set ? String(set.a) : "", set ? String(set.b) : "");
      }
      return [
        "D",
        event,
        m.date,
        nameById.get(a1) ?? "",
        duprById.get(a1) ?? "",
        a1,
        nameById.get(a2) ?? "",
        duprById.get(a2) ?? "",
        a2,
        nameById.get(b1) ?? "",
        duprById.get(b1) ?? "",
        b1,
        nameById.get(b2) ?? "",
        duprById.get(b2) ?? "",
        b2,
        ...gameCols,
        m.location,
        "SIDEOUT",
      ];
    });

    const csv = [HEADER, ...rows]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = fileNameHint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${safeTitle || "matches"}-dupr.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        className={
          triggerClassName ??
          "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
        }
      >
        Export to DUPR
      </button>
      {error && (
        <p className="mt-2 max-w-md rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
