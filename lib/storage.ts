import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkoutSession, CheckIn } from "./types";

const WORKOUTS_KEY = "@fittrack:workouts";
const CHECKINS_KEY = "@fittrack:checkins";

// ─── Workout Storage ──────────────────────────────────────────────────────────

export async function getWorkouts(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSession[];
  } catch {
    return [];
  }
}

export async function saveWorkout(session: WorkoutSession): Promise<void> {
  const existing = await getWorkouts();
  const updated = [session, ...existing];
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
}

export async function deleteWorkout(id: string): Promise<void> {
  const existing = await getWorkouts();
  const updated = existing.filter((w) => w.id !== id);
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
}

// ─── Check-In Storage ─────────────────────────────────────────────────────────

export async function getCheckIns(): Promise<CheckIn[]> {
  try {
    const raw = await AsyncStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CheckIn[];
  } catch {
    return [];
  }
}

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  const existing = await getCheckIns();
  // Replace if same date already exists
  const updated = [checkIn, ...existing.filter((c) => c.date !== checkIn.date)];
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(updated));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
