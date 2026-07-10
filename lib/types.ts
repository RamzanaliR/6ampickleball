export type SkillTier = "beginner" | "intermediate" | "advanced";
export type PlayerStatus = "pending" | "approved" | "rejected";
export type PlayerRole = "player" | "admin";

export interface Player {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  skill_tier: SkillTier | null;
  points: number;
  wins: number;
  losses: number;
  status: PlayerStatus;
  role: PlayerRole;
  is_guest: boolean;
  profile_photo_url: string | null;
  created_at: string;
}

export type SessionStatus = "upcoming" | "completed" | "cancelled";

export type FixtureScoring = "points" | "no_points";
export type FixtureRankBy = "wins" | "points";
export type FixtureTiebreak = "point_diff" | "wins";

export interface FixtureSettings {
  courts: number;
  roundMinutesLabel: string; // "8 min" | "10 min" | "12 min" | "15 min" | "No limit"
  scoring: FixtureScoring;
  rankBy: FixtureRankBy;
  tiebreak: FixtureTiebreak;
}

export interface PickleballSession {
  id: string;
  title: string;
  date_time: string;
  location: string;
  capacity: number;
  courts: number | null;
  created_by: string;
  status: SessionStatus;
  fixture_settings: FixtureSettings | null;
}

export type RsvpStatus = "confirmed" | "waitlisted" | "cancelled";

export interface Rsvp {
  id: string;
  player_id: string;
  session_id: string;
  status: RsvpStatus;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  player_id: string;
  checked_in_by: string;
  checked_in_at: string;
}

export interface MatchSet {
  a: number;
  b: number;
}

export type MatchSource = "manual" | "fixture";

export interface Match {
  id: string;
  session_id: string;
  team_a: string[];
  team_b: string[];
  sets: MatchSet[];
  winning_team: "a" | "b" | null;
  verified: boolean;
  submitted_by: string;
  created_at: string;
  round_number: number | null;
  court_number: number | null;
  source: MatchSource;
}

export type PaymentType = "session_fee" | "membership";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "manual" | "mobile_money" | "card";

export interface Payment {
  id: string;
  player_id: string;
  session_id: string | null;
  period: string | null;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
  marked_by: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CommunityFeedPost {
  id: string;
  posted_by: string;
  content: string;
  image_url: string | null;
  created_at: string;
}
