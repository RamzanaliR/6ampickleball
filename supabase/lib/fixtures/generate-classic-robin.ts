import type { MatchSet } from "@/lib/types";

export interface GeneratedFixtureMatch {
  round: number;
  court: number;
  teamA: [string, string];
  teamB: [string, string];
}

/** Fisher–Yates shuffle, returns a new array. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sorted ascending by sit-out count so far, randomized within players
 * who have the same count. Array.sort is stable, so shuffling first
 * and sorting second gives "sorted by count, random among ties" —
 * exactly what fair-but-not-robotic bye rotation needs.
 */
function orderForByes(players: string[], sitOutCount: Map<string, number>): string[] {
  return shuffle(players).sort((a, b) => sitOutCount.get(a)! - sitOutCount.get(b)!);
}

/** Single greedy attempt: prefers partners a player hasn't had yet. */
function formPairsAttempt(
  playersThisRound: string[],
  partnerHistory: Map<string, Set<string>>
): [string, string][] {
  const pool = shuffle(playersThisRound);
  const used = new Set<string>();
  const pairs: [string, string][] = [];

  for (const p of pool) {
    if (used.has(p)) continue;
    used.add(p);

    const candidates = shuffle(pool.filter((q) => q !== p && !used.has(q)));
    candidates.sort((a, b) => {
      const aRepeat = partnerHistory.get(p)!.has(a) ? 1 : 0;
      const bRepeat = partnerHistory.get(p)!.has(b) ? 1 : 0;
      return aRepeat - bRepeat;
    });

    const partner = candidates[0];
    used.add(partner);
    pairs.push([p, partner]);
  }

  return pairs;
}

function countRepeatPartners(
  pairs: [string, string][],
  partnerHistory: Map<string, Set<string>>
): number {
  let repeats = 0;
  for (const [a, b] of pairs) {
    if (partnerHistory.get(a)!.has(b)) repeats++;
  }
  return repeats;
}

/**
 * A single greedy pass can back itself into a corner (pick fine early
 * partnerships that leave only repeats available for whoever's left).
 * Running several randomized attempts and keeping the one with the
 * fewest repeats avoids that without needing a full matching solver —
 * cheap to do since a round is at most a couple dozen players.
 */
function formPairs(
  playersThisRound: string[],
  partnerHistory: Map<string, Set<string>>,
  attempts = 40
): [string, string][] {
  let best = formPairsAttempt(playersThisRound, partnerHistory);
  let bestScore = countRepeatPartners(best, partnerHistory);

  for (let i = 1; i < attempts && bestScore > 0; i++) {
    const candidate = formPairsAttempt(playersThisRound, partnerHistory);
    const score = countRepeatPartners(candidate, partnerHistory);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function repeatOpponentScore(
  teamA: [string, string],
  teamB: [string, string],
  opponentHistory: Map<string, Set<string>>
): number {
  let score = 0;
  for (const a of teamA) {
    for (const b of teamB) {
      if (opponentHistory.get(a)!.has(b)) score++;
    }
  }
  return score;
}

/** Single greedy attempt at grouping pairs into 2-vs-2 matches. */
function formMatchesAttempt(
  pairs: [string, string][],
  opponentHistory: Map<string, Set<string>>
): { teamA: [string, string]; teamB: [string, string] }[] {
  const pool = shuffle(pairs);
  const used = new Set<number>();
  const matches: { teamA: [string, string]; teamB: [string, string] }[] = [];

  for (let i = 0; i < pool.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const teamA = pool[i];

    const candidateIndices = shuffle(
      pool.map((_, idx) => idx).filter((idx) => idx !== i && !used.has(idx))
    );
    candidateIndices.sort(
      (idxA, idxB) =>
        repeatOpponentScore(teamA, pool[idxA], opponentHistory) -
        repeatOpponentScore(teamA, pool[idxB], opponentHistory)
    );

    const bestIdx = candidateIndices[0];
    used.add(bestIdx);
    matches.push({ teamA, teamB: pool[bestIdx] });
  }

  return matches;
}

function countRepeatOpponentScore(
  matches: { teamA: [string, string]; teamB: [string, string] }[],
  opponentHistory: Map<string, Set<string>>
): number {
  return matches.reduce(
    (sum, m) => sum + repeatOpponentScore(m.teamA, m.teamB, opponentHistory),
    0
  );
}

/** Groups pairs into 2-vs-2 matches, preferring opponents not yet faced. */
function formMatches(
  pairs: [string, string][],
  opponentHistory: Map<string, Set<string>>,
  attempts = 40
): { teamA: [string, string]; teamB: [string, string] }[] {
  let best = formMatchesAttempt(pairs, opponentHistory);
  let bestScore = countRepeatOpponentScore(best, opponentHistory);

  for (let i = 1; i < attempts && bestScore > 0; i++) {
    const candidate = formMatchesAttempt(pairs, opponentHistory);
    const score = countRepeatOpponentScore(candidate, opponentHistory);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

/**
 * The classic "circle method" for round-robin scheduling: fix one
 * slot, rotate the rest. Produces `total - 1` rounds that cover
 * every possible pair exactly once — a mathematical guarantee, not
 * a heuristic. `total` must be even. One slot may be a phantom bye
 * (pass it in like any other entry) — whichever real player it
 * lands opposite in a given round sits out that round.
 */
function circleMethodRounds(slots: string[]): [string, string][][] {
  const total = slots.length;
  let arr = [...slots];
  const rounds: [string, string][][] = [];

  for (let r = 0; r < total - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < total / 2; i++) {
      pairs.push([arr[i], arr[total - 1 - i]]);
    }
    rounds.push(pairs);
    arr = [arr[0], arr[total - 1], ...arr.slice(1, total - 1)];
  }

  return rounds;
}

/**
 * Generates a full Classic Robin schedule: a fixed number of rounds,
 * locked in upfront.
 *
 * Partner rotation uses the deterministic circle method whenever at
 * most one player has to sit out per round (no players, or courts
 * limit exactly one bye) — that's a mathematical guarantee of zero
 * repeat partnerships for up to N-1 rounds, not just a best effort.
 * It only falls back to randomized search when 2+ players must sit
 * out every round (courts can't fit everyone even to within one
 * spare), since a fixed pair of "bye slots" would occasionally have
 * to face each other, which the courts don't have room for. Either
 * way, opponent matching (which pair plays which) is always
 * randomized search — there's no equivalent clean guarantee for
 * avoiding repeat opponents on top of guaranteed-fresh partners.
 */
export function generateClassicRobin(
  playerIds: string[],
  courts: number,
  rounds: number
): GeneratedFixtureMatch[] {
  if (playerIds.length < 4) {
    throw new Error("Need at least 4 confirmed players to generate fixtures.");
  }
  if (courts < 1) {
    throw new Error("Need at least 1 court.");
  }

  const n = playerIds.length;
  const maxPlayable = courts * 4;
  const playableCount = Math.floor(Math.min(n, maxPlayable) / 4) * 4;
  const numByeSlots = n - playableCount; // constant every round — roster is fixed for Classic Robin

  const partnerHistory = new Map<string, Set<string>>();
  const opponentHistory = new Map<string, Set<string>>();
  const sitOutCount = new Map<string, number>();
  for (const p of playerIds) {
    partnerHistory.set(p, new Set());
    opponentHistory.set(p, new Set());
    sitOutCount.set(p, 0);
  }

  const schedule: GeneratedFixtureMatch[] = [];
  const PHANTOM = "__BYE__";

  let deterministicRounds: [string, string][][] = [];
  if (numByeSlots <= 1) {
    const slots = numByeSlots === 1 ? [...playerIds, PHANTOM] : [...playerIds];
    deterministicRounds = circleMethodRounds(shuffle(slots));
  }

  for (let round = 1; round <= rounds; round++) {
    let pairs: [string, string][];

    if (round <= deterministicRounds.length) {
      const rawPairs = deterministicRounds[round - 1];
      pairs = rawPairs.filter(([a, b]) => a !== PHANTOM && b !== PHANTOM);
      for (const [a, b] of rawPairs) {
        if (a === PHANTOM) sitOutCount.set(b, sitOutCount.get(b)! + 1);
        if (b === PHANTOM) sitOutCount.set(a, sitOutCount.get(a)! + 1);
      }
    } else {
      const ordered = orderForByes(playerIds, sitOutCount);
      const sittingOut = ordered.slice(0, numByeSlots);
      const playingThisRound = ordered.slice(numByeSlots);
      for (const p of sittingOut) sitOutCount.set(p, sitOutCount.get(p)! + 1);
      pairs = formPairs(playingThisRound, partnerHistory);
    }

    for (const [a, b] of pairs) {
      partnerHistory.get(a)!.add(b);
      partnerHistory.get(b)!.add(a);
    }

    const matches = formMatches(pairs, opponentHistory);
    matches.forEach((m) => {
      for (const a of m.teamA) {
        for (const b of m.teamB) {
          opponentHistory.get(a)!.add(b);
          opponentHistory.get(b)!.add(a);
        }
      }
    });

    matches.forEach((m, i) => {
      schedule.push({ round, court: i + 1, teamA: m.teamA, teamB: m.teamB });
    });
  }

  return schedule;
}

/** Computes the winning side from a set of scores. */
export function winningTeamFromSets(sets: MatchSet[]): "a" | "b" {
  const setsWonByA = sets.filter((s) => s.a > s.b).length;
  const setsWonByB = sets.length - setsWonByA;
  if (setsWonByA === setsWonByB) {
    throw new Error("Sets are tied overall.");
  }
  return setsWonByA > setsWonByB ? "a" : "b";
}
