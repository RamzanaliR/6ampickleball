"use client";

type CsvMatch = {
  team_a: string[];
  team_b: string[];
  sets: { a: number; b: number }[];
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportMatchesCsvButton({
  sessionTitle,
  dateLabel,
  matches,
  nameById,
  duprById,
}: {
  sessionTitle: string;
  dateLabel: string;
  matches: CsvMatch[];
  nameById: Map<string, string>;
  duprById: Map<string, string | null>;
}) {
  function handleExport() {
    const header = [
      "Date",
      "P1",
      "P1 DUPR",
      "P2",
      "P2 DUPR",
      "P3",
      "P3 DUPR",
      "P4",
      "P4 DUPR",
      "TEAM 1 Score",
      "TEAM 2 Score",
    ];

    const rows = matches
      .filter((m) => m.sets.length > 0)
      .map((m) => {
        const [p1, p2] = m.team_a;
        const [p3, p4] = m.team_b;
        const teamAScore = m.sets.reduce((sum, s) => sum + s.a, 0);
        const teamBScore = m.sets.reduce((sum, s) => sum + s.b, 0);

        const nameOrBlank = (id?: string) => (id ? (nameById.get(id) ?? "Unknown") : "");
        const duprOrBlank = (id?: string) => (id ? (duprById.get(id) ?? "") : "");

        return [
          dateLabel,
          nameOrBlank(p1),
          duprOrBlank(p1),
          nameOrBlank(p2),
          duprOrBlank(p2),
          nameOrBlank(p3),
          duprOrBlank(p3),
          nameOrBlank(p4),
          duprOrBlank(p4),
          String(teamAScore),
          String(teamBScore),
        ];
      });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = sessionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `${safeTitle || "session"}-results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
    >
      Export results (CSV)
    </button>
  );
}
