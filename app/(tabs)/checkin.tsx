import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFitness } from "@/lib/fitness-context";
import { generateId, getTodayDate, formatDate } from "@/lib/storage";
import { CheckIn, MoodLevel, EnergyLevel } from "@/lib/types";

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

type WeightUnit = "kg" | "lbs";

export default function CheckInScreen() {
  const colors = useColors();
  const { checkIns, addCheckIn, todayCheckIn } = useFitness();

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [mood, setMood] = useState<MoodLevel>(3);
  const [energy, setEnergy] = useState<EnergyLevel>(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"form" | "history">("form");

  async function handleSave() {
    setSaving(true);
    try {
      const checkIn: CheckIn = {
        id: generateId(),
        date: getTodayDate(),
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit,
        mood,
        energy,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addCheckIn(checkIn);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "Failed to save check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const pastCheckIns = checkIns.filter((c) => c.date !== getTodayDate());

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Check-In</Text>
        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              viewMode === "form" && { backgroundColor: colors.primary },
              viewMode !== "form" && { backgroundColor: colors.surface },
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => setViewMode("form")}
          >
            <Text style={[styles.tabBtnText, { color: viewMode === "form" ? "#fff" : colors.muted }]}>
              Today
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              viewMode === "history" && { backgroundColor: colors.primary },
              viewMode !== "history" && { backgroundColor: colors.surface },
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => setViewMode("history")}
          >
            <Text style={[styles.tabBtnText, { color: viewMode === "history" ? "#fff" : colors.muted }]}>
              History
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === "form" ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {todayCheckIn ? (
            /* Already checked in today */
            <View style={styles.checkedInState}>
              <Text style={styles.checkedInEmoji}>✅</Text>
              <Text style={[styles.checkedInTitle, { color: colors.foreground }]}>
                Checked in today!
              </Text>
              <Text style={[styles.checkedInDate, { color: colors.muted }]}>
                {formatDate(todayCheckIn.date)}
              </Text>
              <View style={[styles.checkedInCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.checkedInRow}>
                  <Text style={[styles.checkedInLabel, { color: colors.muted }]}>Mood</Text>
                  <Text style={styles.checkedInValue}>
                    {MOOD_OPTIONS.find((m) => m.value === todayCheckIn.mood)?.emoji}{" "}
                    {MOOD_OPTIONS.find((m) => m.value === todayCheckIn.mood)?.label}
                  </Text>
                </View>
                <View style={[styles.checkedInDivider, { backgroundColor: colors.border }]} />
                <View style={styles.checkedInRow}>
                  <Text style={[styles.checkedInLabel, { color: colors.muted }]}>Energy</Text>
                  <Text style={[styles.checkedInValue, { color: colors.foreground }]}>
                    {todayCheckIn.energy}/10
                  </Text>
                </View>
                {todayCheckIn.weight && (
                  <>
                    <View style={[styles.checkedInDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.checkedInRow}>
                      <Text style={[styles.checkedInLabel, { color: colors.muted }]}>Weight</Text>
                      <Text style={[styles.checkedInValue, { color: colors.foreground }]}>
                        {todayCheckIn.weight} {todayCheckIn.weightUnit}
                      </Text>
                    </View>
                  </>
                )}
                {todayCheckIn.notes && (
                  <>
                    <View style={[styles.checkedInDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.checkedInRow}>
                      <Text style={[styles.checkedInLabel, { color: colors.muted }]}>Notes</Text>
                      <Text style={[styles.checkedInValue, { color: colors.foreground }]}>
                        {todayCheckIn.notes}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.reCheckBtn,
                  { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  // Allow re-check-in by resetting state
                  setMood(todayCheckIn.mood);
                  setEnergy(todayCheckIn.energy);
                  setWeight(todayCheckIn.weight?.toString() ?? "");
                  setNotes(todayCheckIn.notes ?? "");
                }}
              >
                <Text style={[styles.reCheckBtnText, { color: colors.primary }]}>
                  Update Today's Check-In
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Check-in form */
            <>
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.formCardTitle, { color: colors.foreground }]}>
                  📅 {formatDate(getTodayDate())}
                </Text>
              </View>

              {/* Mood */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>HOW ARE YOU FEELING?</Text>
                <View style={styles.moodRow}>
                  {MOOD_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={({ pressed }) => [
                        styles.moodBtn,
                        mood === opt.value && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                        mood !== opt.value && { backgroundColor: colors.surface, borderColor: colors.border },
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                      onPress={() => setMood(opt.value)}
                    >
                      <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.moodLabel, { color: mood === opt.value ? colors.primary : colors.muted }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Energy Level */}
              <View style={styles.section}>
                <View style={styles.energyHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>ENERGY LEVEL</Text>
                  <Text style={[styles.energyValue, { color: colors.primary }]}>{energy}/10</Text>
                </View>
                <View style={styles.energySlider}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <Pressable
                      key={level}
                      style={({ pressed }) => [
                        styles.energyDot,
                        level <= energy
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.border },
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => setEnergy(level as EnergyLevel)}
                    />
                  ))}
                </View>
                <View style={styles.energyLabels}>
                  <Text style={[styles.energyLabelText, { color: colors.muted }]}>Low</Text>
                  <Text style={[styles.energyLabelText, { color: colors.muted }]}>High</Text>
                </View>
              </View>

              {/* Weight */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>BODY WEIGHT (OPTIONAL)</Text>
                <View style={styles.weightRow}>
                  <TextInput
                    style={[
                      styles.weightInput,
                      { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                    ]}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="0.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                  <View style={styles.unitToggle}>
                    {(["kg", "lbs"] as WeightUnit[]).map((u) => (
                      <Pressable
                        key={u}
                        style={({ pressed }) => [
                          styles.unitBtn,
                          weightUnit === u && { backgroundColor: colors.primary },
                          weightUnit !== u && { backgroundColor: colors.surface },
                          { opacity: pressed ? 0.75 : 1 },
                        ]}
                        onPress={() => setWeightUnit(u)}
                      >
                        <Text style={[styles.unitBtnText, { color: weightUnit === u ? "#fff" : colors.muted }]}>
                          {u}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>NOTES (OPTIONAL)</Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="How are you feeling today?"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Save */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving…" : "Save Check-In"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      ) : (
        /* History */
        <FlatList
          data={pastCheckIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No history yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Start checking in daily to see your history here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.historyCardTop}>
                <Text style={[styles.historyDate, { color: colors.foreground }]}>
                  {formatDate(item.date)}
                </Text>
                <Text style={styles.historyMoodEmoji}>
                  {MOOD_OPTIONS.find((m) => m.value === item.mood)?.emoji}
                </Text>
              </View>
              <View style={styles.historyStats}>
                <View style={styles.historyStatItem}>
                  <Text style={[styles.historyStatLabel, { color: colors.muted }]}>Energy</Text>
                  <View style={styles.historyEnergyBar}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.historyEnergyDot,
                          level <= item.energy
                            ? { backgroundColor: colors.accent }
                            : { backgroundColor: colors.border },
                        ]}
                      />
                    ))}
                  </View>
                </View>
                {item.weight && (
                  <View style={styles.historyStatItem}>
                    <Text style={[styles.historyStatLabel, { color: colors.muted }]}>Weight</Text>
                    <Text style={[styles.historyStatValue, { color: colors.foreground }]}>
                      {item.weight} {item.weightUnit}
                    </Text>
                  </View>
                )}
              </View>
              {item.notes && (
                <Text style={[styles.historyNotes, { color: colors.muted }]}>
                  "{item.notes}"
                </Text>
              )}
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  formCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  moodRow: {
    flexDirection: "row",
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  energyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  energyValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  energySlider: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  energyDot: {
    flex: 1,
    height: 32,
    borderRadius: 8,
  },
  energyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  energyLabelText: {
    fontSize: 11,
  },
  weightRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  unitBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
    paddingTop: 12,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  checkedInState: {
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
  },
  checkedInEmoji: {
    fontSize: 52,
  },
  checkedInTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  checkedInDate: {
    fontSize: 14,
  },
  checkedInCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  checkedInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  checkedInLabel: {
    fontSize: 14,
  },
  checkedInValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkedInDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  reCheckBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  reCheckBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  historyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 15,
    fontWeight: "700",
  },
  historyMoodEmoji: {
    fontSize: 22,
  },
  historyStats: {
    gap: 8,
  },
  historyStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: 50,
  },
  historyEnergyBar: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
  },
  historyEnergyDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyNotes: {
    fontSize: 13,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
});
