import type { FixtureRankBy, FixtureScoring, FixtureTiebreak, MatchSet } from "@/lib/types";

export interface StandingsRow {
  playerId: string;
  wins: number;
  losses: number;
  points: number;
  setDiff: number;
}

interface StandingsInputMatch {
  team_a: string[];
  team_b: string[];
  sets: MatchSet[];
  winning_team: "a" | "b" | null;
  verified: boolean;
}

export function computeSameDayStandings(
  matches: StandingsInputMatch[],
  scoring: FixtureScoring
): Map<string, StandingsRow> {
  const rows = new Map<string, StandingsRow>();

  function ensure(id: string): StandingsRow {
    let row = rows.get(id);
    if (!row) {
      row = { playerId: id, wins: 0, losses: 0, points: 0, setDiff: 0 };
      rows.set(id, row);
    }
    return row;
  }

  for (const m of matches) {
    if (!m.verified || !m.winning_team) continue;

    const winners = m.winning_team === "a" ? m.team_a : m.team_b;
    const losers = m.winning_team === "a" ? m.team_b : m.team_a;
    const setsWonByWinners = m.sets.filter((s) =>
      m.winning_team === "a" ? s.a > s.b : s.b > s.a
    ).length;
    const setsWonByLosers = m.sets.length - setsWonByWinners;

    for (const id of winners) {
      const row = ensure(id);
      row.wins += 1;
      if (scoring === "points") row.points += 1;
      row.setDiff += setsWonByWinners - setsWonByLosers;
    }
    for (const id of losers) {
      const row = ensure(id);
      row.losses += 1;
      row.setDiff += setsWonByLosers - setsWonByWinners;
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
  const secondary = (r: StandingsRow) => (tiebreak === "point_diff" ? r.setDiff : r.wins);

  return [...rows].sort((a, b) => {
    const p = primary(b) - primary(a);
    if (p !== 0) return p;
    return secondary(b) - secondary(a);
  });
}
