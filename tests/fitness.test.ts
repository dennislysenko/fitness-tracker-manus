import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock AsyncStorage ────────────────────────────────────────────────────────
const store: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete store[key];
    }),
  },
}));

// ─── Mock expo-haptics ────────────────────────────────────────────────────────
vi.mock("expo-haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));

import {
  getWorkouts,
  saveWorkout,
  deleteWorkout,
  getCheckIns,
  saveCheckIn,
  generateId,
  getTodayDate,
  formatDate,
} from "../lib/storage";
import { WorkoutSession, CheckIn } from "../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkout(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: generateId(),
    date: getTodayDate(),
    title: "Test Workout",
    exercises: [
      {
        id: generateId(),
        name: "Bench Press",
        sets: 3,
        reps: 10,
        weight: 60,
        weightUnit: "kg",
      },
    ],
    durationMinutes: 45,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: generateId(),
    date: getTodayDate(),
    weight: 75,
    weightUnit: "kg",
    mood: 4,
    energy: 7,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("getTodayDate", () => {
  it("returns a date string in YYYY-MM-DD format", () => {
    const date = getTodayDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatDate", () => {
  it("formats a date string into a readable format", () => {
    const formatted = formatDate("2025-01-15");
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
  });
});

describe("Workout Storage", () => {
  beforeEach(() => {
    // Clear store between tests
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("returns empty array when no workouts stored", async () => {
    const workouts = await getWorkouts();
    expect(workouts).toEqual([]);
  });

  it("saves and retrieves a workout", async () => {
    const workout = makeWorkout();
    await saveWorkout(workout);
    const workouts = await getWorkouts();
    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe(workout.id);
    expect(workouts[0].title).toBe("Test Workout");
  });

  it("prepends new workouts to the list", async () => {
    const w1 = makeWorkout({ title: "First" });
    const w2 = makeWorkout({ title: "Second" });
    await saveWorkout(w1);
    await saveWorkout(w2);
    const workouts = await getWorkouts();
    expect(workouts[0].title).toBe("Second");
    expect(workouts[1].title).toBe("First");
  });

  it("deletes a workout by id", async () => {
    const w1 = makeWorkout({ title: "Keep" });
    const w2 = makeWorkout({ title: "Delete Me" });
    await saveWorkout(w1);
    await saveWorkout(w2);
    await deleteWorkout(w2.id);
    const workouts = await getWorkouts();
    expect(workouts).toHaveLength(1);
    expect(workouts[0].title).toBe("Keep");
  });

  it("calculates exercise volume correctly", () => {
    const workout = makeWorkout();
    const volume = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets * ex.reps * ex.weight,
      0
    );
    expect(volume).toBe(3 * 10 * 60); // 1800 kg
  });
});

describe("CheckIn Storage", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("returns empty array when no check-ins stored", async () => {
    const checkIns = await getCheckIns();
    expect(checkIns).toEqual([]);
  });

  it("saves and retrieves a check-in", async () => {
    const checkIn = makeCheckIn();
    await saveCheckIn(checkIn);
    const checkIns = await getCheckIns();
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].id).toBe(checkIn.id);
    expect(checkIns[0].mood).toBe(4);
    expect(checkIns[0].energy).toBe(7);
  });

  it("replaces check-in for the same date", async () => {
    const c1 = makeCheckIn({ date: "2025-01-01", mood: 2 });
    const c2 = makeCheckIn({ date: "2025-01-01", mood: 5 });
    await saveCheckIn(c1);
    await saveCheckIn(c2);
    const checkIns = await getCheckIns();
    const jan1 = checkIns.filter((c) => c.date === "2025-01-01");
    expect(jan1).toHaveLength(1);
    expect(jan1[0].mood).toBe(5);
  });

  it("stores multiple check-ins for different dates", async () => {
    const c1 = makeCheckIn({ date: "2025-01-01" });
    const c2 = makeCheckIn({ date: "2025-01-02" });
    await saveCheckIn(c1);
    await saveCheckIn(c2);
    const checkIns = await getCheckIns();
    expect(checkIns).toHaveLength(2);
  });
});

describe("Data Types Validation", () => {
  it("workout session has required fields", () => {
    const workout = makeWorkout();
    expect(workout).toHaveProperty("id");
    expect(workout).toHaveProperty("date");
    expect(workout).toHaveProperty("title");
    expect(workout).toHaveProperty("exercises");
    expect(workout).toHaveProperty("durationMinutes");
    expect(workout).toHaveProperty("createdAt");
    expect(Array.isArray(workout.exercises)).toBe(true);
  });

  it("check-in has required fields", () => {
    const checkIn = makeCheckIn();
    expect(checkIn).toHaveProperty("id");
    expect(checkIn).toHaveProperty("date");
    expect(checkIn).toHaveProperty("mood");
    expect(checkIn).toHaveProperty("energy");
    expect(checkIn).toHaveProperty("weightUnit");
    expect(checkIn.mood).toBeGreaterThanOrEqual(1);
    expect(checkIn.mood).toBeLessThanOrEqual(5);
    expect(checkIn.energy).toBeGreaterThanOrEqual(1);
    expect(checkIn.energy).toBeLessThanOrEqual(10);
  });
});
