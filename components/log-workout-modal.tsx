import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useFitness } from "@/lib/fitness-context";
import { generateId, getTodayDate } from "@/lib/storage";
import { Exercise, WorkoutSession } from "@/lib/types";
import { IconSymbol } from "@/components/ui/icon-symbol";

const EXERCISE_SUGGESTIONS = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Pull-Up",
  "Push-Up",
  "Overhead Press",
  "Barbell Row",
  "Dumbbell Curl",
  "Tricep Dip",
  "Leg Press",
  "Lunges",
  "Plank",
  "Running",
  "Cycling",
  "Jump Rope",
];

interface ExerciseForm {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface Props {
  onClose: () => void;
}

export function LogWorkoutModal({ onClose }: Props) {
  const colors = useColors();
  const { addWorkout } = useFitness();

  const [workoutTitle, setWorkoutTitle] = useState("Morning Workout");
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: "", sets: "3", reps: "10", weight: "0" },
  ]);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);

  function updateExercise(index: number, field: keyof ExerciseForm, value: string) {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { name: "", sets: "3", reps: "10", weight: "0" },
    ]);
  }

  function removeExercise(index: number) {
    if (exercises.length === 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!workoutTitle.trim()) {
      Alert.alert("Missing Title", "Please enter a workout title.");
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      Alert.alert("No Exercises", "Please add at least one exercise.");
      return;
    }

    setSaving(true);
    try {
      const exerciseList: Exercise[] = validExercises.map((e) => ({
        id: generateId(),
        name: e.name.trim(),
        sets: parseInt(e.sets) || 1,
        reps: parseInt(e.reps) || 1,
        weight: parseFloat(e.weight) || 0,
        weightUnit: "kg",
      }));

      const session: WorkoutSession = {
        id: generateId(),
        date: getTodayDate(),
        title: workoutTitle.trim(),
        exercises: exerciseList,
        durationMinutes: parseInt(duration) || 30,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addWorkout(session);

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Log Workout</Text>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveText, { color: colors.primary }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Workout Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>WORKOUT TITLE</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
            placeholder="e.g. Morning Workout"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>DURATION (MINUTES)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            value={duration}
            onChangeText={setDuration}
            placeholder="45"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>EXERCISES</Text>
          {exercises.map((exercise, index) => (
            <View
              key={index}
              style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseNum, { color: colors.primary }]}>
                  #{index + 1}
                </Text>
                {exercises.length > 1 && (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    onPress={() => removeExercise(index)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
                  </Pressable>
                )}
              </View>

              {/* Exercise Name */}
              <TextInput
                style={[styles.exerciseInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                value={exercise.name}
                onChangeText={(v) => {
                  updateExercise(index, "name", v);
                  setShowSuggestions(v.length > 0 ? index : null);
                }}
                onFocus={() => setShowSuggestions(exercise.name.length > 0 ? index : null)}
                onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                placeholder="Exercise name"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />

              {/* Suggestions */}
              {showSuggestions === index && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionsScroll}
                  contentContainerStyle={styles.suggestionsContent}
                  keyboardShouldPersistTaps="always"
                >
                  {EXERCISE_SUGGESTIONS.filter((s) =>
                    s.toLowerCase().includes(exercise.name.toLowerCase())
                  ).map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={[styles.suggestionChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}
                      onPress={() => {
                        updateExercise(index, "name", suggestion);
                        setShowSuggestions(null);
                      }}
                    >
                      <Text style={[styles.suggestionText, { color: colors.primary }]}>
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Sets / Reps / Weight */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Sets</Text>
                  <TextInput
                    style={[styles.metricInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    value={exercise.sets}
                    onChangeText={(v) => updateExercise(index, "sets", v)}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Reps</Text>
                  <TextInput
                    style={[styles.metricInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    value={exercise.reps}
                    onChangeText={(v) => updateExercise(index, "reps", v)}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.metricInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    value={exercise.weight}
                    onChangeText={(v) => updateExercise(index, "weight", v)}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.addExerciseBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={addExercise}
          >
            <IconSymbol name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addExerciseText, { color: colors.primary }]}>
              Add Exercise
            </Text>
          </Pressable>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go?"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <IconSymbol name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {saving ? "Saving…" : "Save Workout"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  exerciseInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionsScroll: {
    marginTop: 4,
  },
  suggestionsContent: {
    gap: 6,
    paddingRight: 8,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  metricInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
