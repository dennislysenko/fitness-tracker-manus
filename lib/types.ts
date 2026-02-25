// ─── Workout Types ────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number; // in kg
  weightUnit: "kg" | "lbs";
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  exercises: Exercise[];
  durationMinutes: number;
  notes?: string;
  createdAt: string; // ISO timestamp
}

// ─── Check-In Types ───────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface CheckIn {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  weight?: number;
  weightUnit: "kg" | "lbs";
  mood: MoodLevel;
  energy: EnergyLevel;
  notes?: string;
  createdAt: string; // ISO timestamp
}

// ─── Stats Types ──────────────────────────────────────────────────────────────

export interface WeeklyStats {
  weekLabel: string;
  sessionCount: number;
  totalVolume: number; // kg * reps summed
  totalDuration: number; // minutes
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}
