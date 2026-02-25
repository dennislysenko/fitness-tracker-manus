import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { WorkoutSession, CheckIn, StreakInfo } from "./types";
import {
  getWorkouts,
  getCheckIns,
  saveWorkout,
  saveCheckIn,
  deleteWorkout,
  getTodayDate,
} from "./storage";

// ─── State ────────────────────────────────────────────────────────────────────

interface FitnessState {
  workouts: WorkoutSession[];
  checkIns: CheckIn[];
  loading: boolean;
}

type FitnessAction =
  | { type: "SET_WORKOUTS"; payload: WorkoutSession[] }
  | { type: "SET_CHECKINS"; payload: CheckIn[] }
  | { type: "ADD_WORKOUT"; payload: WorkoutSession }
  | { type: "DELETE_WORKOUT"; payload: string }
  | { type: "ADD_CHECKIN"; payload: CheckIn }
  | { type: "SET_LOADING"; payload: boolean };

function reducer(state: FitnessState, action: FitnessAction): FitnessState {
  switch (action.type) {
    case "SET_WORKOUTS":
      return { ...state, workouts: action.payload };
    case "SET_CHECKINS":
      return { ...state, checkIns: action.payload };
    case "ADD_WORKOUT":
      return { ...state, workouts: [action.payload, ...state.workouts] };
    case "DELETE_WORKOUT":
      return {
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.payload),
      };
    case "ADD_CHECKIN": {
      const filtered = state.checkIns.filter(
        (c) => c.date !== action.payload.date
      );
      return { ...state, checkIns: [action.payload, ...filtered] };
    }
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FitnessContextValue {
  workouts: WorkoutSession[];
  checkIns: CheckIn[];
  loading: boolean;
  addWorkout: (session: WorkoutSession) => Promise<void>;
  removeWorkout: (id: string) => Promise<void>;
  addCheckIn: (checkIn: CheckIn) => Promise<void>;
  todayCheckIn: CheckIn | null;
  streakInfo: StreakInfo;
  todayWorkouts: WorkoutSession[];
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

// ─── Streak Calculation ───────────────────────────────────────────────────────

function computeStreak(workouts: WorkoutSession[]): StreakInfo {
  if (workouts.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  const uniqueDates = [
    ...new Set(workouts.map((w) => w.date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Current streak: count consecutive days from today or yesterday
  const startDate = uniqueDates[0] === today || uniqueDates[0] === yesterdayStr
    ? uniqueDates[0]
    : null;

  if (startDate) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1] + "T00:00:00");
      const curr = new Date(uniqueDates[i] + "T00:00:00");
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + "T00:00:00");
    const curr = new Date(uniqueDates[i] + "T00:00:00");
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: uniqueDates[0] ?? null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    workouts: [],
    checkIns: [],
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const [workouts, checkIns] = await Promise.all([
        getWorkouts(),
        getCheckIns(),
      ]);
      dispatch({ type: "SET_WORKOUTS", payload: workouts });
      dispatch({ type: "SET_CHECKINS", payload: checkIns });
      dispatch({ type: "SET_LOADING", payload: false });
    }
    load();
  }, []);

  const addWorkout = useCallback(async (session: WorkoutSession) => {
    await saveWorkout(session);
    dispatch({ type: "ADD_WORKOUT", payload: session });
  }, []);

  const removeWorkout = useCallback(async (id: string) => {
    await deleteWorkout(id);
    dispatch({ type: "DELETE_WORKOUT", payload: id });
  }, []);

  const addCheckIn = useCallback(async (checkIn: CheckIn) => {
    await saveCheckIn(checkIn);
    dispatch({ type: "ADD_CHECKIN", payload: checkIn });
  }, []);

  const today = getTodayDate();
  const todayCheckIn = state.checkIns.find((c) => c.date === today) ?? null;
  const todayWorkouts = state.workouts.filter((w) => w.date === today);
  const streakInfo = computeStreak(state.workouts);

  return (
    <FitnessContext.Provider
      value={{
        workouts: state.workouts,
        checkIns: state.checkIns,
        loading: state.loading,
        addWorkout,
        removeWorkout,
        addCheckIn,
        todayCheckIn,
        streakInfo,
        todayWorkouts,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error("useFitness must be used within FitnessProvider");
  return ctx;
}
