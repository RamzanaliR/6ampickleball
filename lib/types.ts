export type SkillTier = "beginner" | "intermediate" | "advanced";
export type PlayerStatus = "pending" | "approved" | "rejected";
export type PlayerRole = "player" | "admin";

export interface Player {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skill_tier: SkillTier | null;
  points: number;
  wins: number;
  losses: number;
  status: PlayerStatus;
  role: PlayerRole;
  profile_photo_url: string | null;
  created_at: string;
}

export type SessionStatus = "upcoming" | "completed" | "cancelled";

export interface PickleballSession {
  id: string;
  title: string;
  date_time: string;
  location: string;
  capacity: number;
  created_by: string;
  status: SessionStatus;
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

export interface Match {
  id: string;
  session_id: string;
  player_ids: string[];
  score: string;
  winner_id: string | null;
  verified: boolean;
  submitted_by: string;
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
}

export interface CommunityFeedPost {
  id: string;
  posted_by: string;
  content: string;
  image_url: string | null;
  created_at: string;
}
