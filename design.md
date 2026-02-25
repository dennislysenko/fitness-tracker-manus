# FitTrack – Mobile App Interface Design

## Brand Identity
- **App Name:** FitTrack
- **Tagline:** "Every rep counts."
- **Primary Color:** `#FF6B35` (Energetic Orange) – conveys energy and motivation
- **Accent Color:** `#2DD4BF` (Teal) – progress, calm, achievement
- **Background (light):** `#FFFFFF`
- **Background (dark):** `#0F1117`
- **Surface (light):** `#F8F9FA`
- **Surface (dark):** `#1A1D24`

---

## Screen List

1. **Home (Dashboard)** – Daily overview, streak counter, quick actions
2. **Workout Log** – Browse, add, and manage workout sessions
3. **Log Workout Modal** – Form to log a new workout (exercise, sets, reps, weight, duration)
4. **Check-In** – Daily body check-in (weight, mood, energy level, notes)
5. **Progress** – Charts and stats showing workout history and body metrics over time

---

## Primary Content & Functionality

### 1. Home (Dashboard)
- Greeting with user's name and current date
- Today's streak badge (flame icon + count)
- Today's summary card: workouts done, calories burned estimate, check-in status
- Quick action buttons: "Log Workout" and "Check In"
- Recent activity feed (last 3 workouts)
- Motivational quote of the day

### 2. Workout Log Screen
- Date-grouped list of workout sessions (FlatList)
- Each session card shows: date, exercises list, total sets, duration
- FAB (Floating Action Button) to add new workout
- Filter by week / month

### 3. Log Workout Modal (Sheet)
- Exercise name input (with common suggestions)
- Sets, reps, weight inputs
- Duration picker (minutes)
- Notes field
- Save button with haptic feedback

### 4. Check-In Screen
- Today's check-in form (if not done yet) or summary (if done)
- Body weight input (kg/lbs toggle)
- Mood selector (emoji scale 1–5)
- Energy level slider (1–10)
- Optional notes text area
- History list of past check-ins

### 5. Progress Screen
- Tab selector: "Workouts" | "Body"
- Workouts tab: bar chart of sessions per week, total volume chart
- Body tab: line chart of weight over time, mood trend
- Stats summary cards: total workouts, total volume, best streak, current streak

---

## Key User Flows

### Flow 1: Log a Workout
1. Home → Tap "Log Workout" → Log Workout Modal opens
2. Fill in exercise name, sets, reps, weight, duration
3. Tap "Save" → haptic success feedback → modal closes
4. Home dashboard updates with new workout count

### Flow 2: Daily Check-In
1. Home → Tap "Check In" → Check-In screen
2. Enter weight, select mood, set energy level, add notes
3. Tap "Save Check-In" → success animation → button changes to "Checked In ✓"

### Flow 3: View Progress
1. Tab bar → Progress tab
2. See weekly workout bar chart
3. Switch to "Body" tab → view weight trend line chart
4. Scroll down to see stats summary cards

---

## Navigation Structure

```
Tab Bar (bottom)
├── Home (house.fill)
├── Workouts (dumbbell.fill)
├── Check-In (checkmark.circle.fill)
└── Progress (chart.bar.fill)
```

Modal stack:
- Log Workout Modal (presented from Home or Workouts tab)

---

## Layout Principles
- **Portrait-first, one-handed usage** – primary actions within thumb reach
- **Cards with rounded corners (16px)** for workout entries and stats
- **Bold section headers** with muted subtitles
- **FAB** for primary add action on Workouts screen
- **Sticky header** on Progress screen with chart pinned at top
- **Empty states** with illustration + CTA for first-time users
