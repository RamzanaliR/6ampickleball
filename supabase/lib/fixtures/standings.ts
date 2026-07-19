import type { FixtureRankBy, FixtureScoring, FixtureTiebreak, MatchSet } from "@/lib/types";

export interface StandingsRow {
  playerId: string;
  wins: number;
  losses: number;
  points: number;
  pf: number;
  pa: number;
}

interface StandingsInputMatch {
  team_a: string[];
  team_b: string[];
  sets: MatchSet[];
  winning_team: "a" | "b" | null;
  verified: boolean;
}

/**
 * Aggregates a list of matches into per-player standings. Used both
 * for a single session's same-day standings and for a tournament's
 * cumulative standings across every session tagged to it — the
 * function itself doesn't care about session boundaries, it just
 * sums whatever matches it's given.
 */
export function computeStandings(
  matches: StandingsInputMatch[],
  scoring: FixtureScoring
): Map<string, StandingsRow> {
  const rows = new Map<string, StandingsRow>();

  function ensure(id: string): StandingsRow {
    let row = rows.get(id);
    if (!row) {
      row = { playerId: id, wins: 0, losses: 0, points: 0, pf: 0, pa: 0 };
      rows.set(id, row);
    }
    return row;
  }

  for (const m of matches) {
    if (!m.verified || !m.winning_team) continue;

    const winners = m.winning_team === "a" ? m.team_a : m.team_b;
    const losers = m.winning_team === "a" ? m.team_b : m.team_a;
    const winnerPoints = m.sets.reduce(
      (sum, s) => sum + (m.winning_team === "a" ? s.a : s.b),
      0
    );
    const loserPoints = m.sets.reduce(
      (sum, s) => sum + (m.winning_team === "a" ? s.b : s.a),
      0
    );

    for (const id of winners) {
      const row = ensure(id);
      row.wins += 1;
      if (scoring === "points") row.points += 1;
      row.pf += winnerPoints;
      row.pa += loserPoints;
    }
    for (const id of losers) {
      const row = ensure(id);
      row.losses += 1;
      row.pf += loserPoints;
      row.pa += winnerPoints;
    }
  }

  return rows;
}

export function sortStandings(
  rows: StandingsRow[],
  rankBy: FixtureRankBy,
  tiebreak: FixtureTiebreak
): StandingsRow[] {
  const primary = (r: StandingsRow) => (rankBy === "points" ? r.points : r.wins);
  const secondary = (r: StandingsRow) =>
    tiebreak === "point_diff" ? r.pf - r.pa : r.wins;

  return [...rows].sort((a, b) => {
    const p = primary(b) - primary(a);
    if (p !== 0) return p;
    return secondary(b) - secondary(a);
  });
}
