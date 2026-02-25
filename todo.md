# FitTrack – Project TODO

## Branding & Setup
- [x] Generate custom app logo (orange/teal fitness theme)
- [x] Update app.config.ts with FitTrack branding
- [x] Update theme colors (orange primary, teal accent)
- [x] Add all required icon mappings to icon-symbol.tsx

## Navigation
- [x] Set up 4-tab navigation: Home, Workouts, Check-In, Progress
- [x] Add tab icons for all tabs

## Data Layer
- [x] Define TypeScript types for WorkoutSession, Exercise, CheckIn
- [x] Create AsyncStorage service for workouts
- [x] Create AsyncStorage service for check-ins
- [x] Create React Context for workout state
- [x] Create React Context for check-in state

## Home Screen
- [x] Greeting with date
- [x] Streak counter badge
- [x] Today's summary card (workouts done, check-in status)
- [x] Quick action buttons (Log Workout, Check In)
- [x] Recent activity feed (last 3 workouts)
- [x] Motivational quote of the day

## Workout Log Screen
- [x] Date-grouped FlatList of workout sessions
- [x] Workout session card component
- [x] Floating Action Button (FAB) to add workout
- [x] Empty state for no workouts

## Log Workout Modal
- [x] Exercise name input with suggestions
- [x] Sets, reps, weight inputs
- [x] Duration picker
- [x] Notes field
- [x] Save with haptic feedback

## Check-In Screen
- [x] Today's check-in form
- [x] Body weight input with kg/lbs toggle
- [x] Mood selector (emoji scale)
- [x] Energy level slider
- [x] Notes text area
- [x] Check-in history list
- [x] Already checked-in state

## Progress Screen
- [x] Tab selector: Workouts | Body
- [x] Weekly workout bar chart (react-native-svg)
- [x] Weight trend line chart
- [x] Stats summary cards (total workouts, volume, streak)
- [x] Empty state for no data
