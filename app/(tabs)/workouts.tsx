import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFitness } from "@/lib/fitness-context";
import { WorkoutSession } from "@/lib/types";
import { formatDate } from "@/lib/storage";
import { LogWorkoutModal } from "@/components/log-workout-modal";

type FilterPeriod = "week" | "month" | "all";

function getFilteredWorkouts(workouts: WorkoutSession[], period: FilterPeriod) {
  if (period === "all") return workouts;
  const now = new Date();
  const cutoff = new Date();
  if (period === "week") cutoff.setDate(now.getDate() - 7);
  else cutoff.setMonth(now.getMonth() - 1);
  return workouts.filter((w) => new Date(w.date + "T00:00:00") >= cutoff);
}

function groupByDate(workouts: WorkoutSession[]): { date: string; sessions: WorkoutSession[] }[] {
  const map = new Map<string, WorkoutSession[]>();
  for (const w of workouts) {
    if (!map.has(w.date)) map.set(w.date, []);
    map.get(w.date)!.push(w);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] > b[0] ? -1 : 1))
    .map(([date, sessions]) => ({ date, sessions }));
}

export default function WorkoutsScreen() {
  const colors = useColors();
  const { workouts, removeWorkout } = useFitness();
  const [filter, setFilter] = useState<FilterPeriod>("week");
  const [showLogModal, setShowLogModal] = useState(false);

  const filtered = useMemo(() => getFilteredWorkouts(workouts, filter), [workouts, filter]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  async function handleDelete(id: string) {
    Alert.alert("Delete Workout", "Are you sure you want to delete this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          await removeWorkout(id);
        },
      },
    ]);
  }

  type ListItem =
    | { type: "header"; date: string; key: string }
    | { type: "session"; session: WorkoutSession; key: string };

  const listData: ListItem[] = grouped.flatMap(({ date, sessions }) => [
    { type: "header" as const, date, key: `header-${date}` },
    ...sessions.map((s) => ({ type: "session" as const, session: s, key: s.id })),
  ]);

  function renderItem({ item }: { item: ListItem }) {
    if (item.type === "header") {
      return (
        <Text style={[styles.dateHeader, { color: colors.muted }]}>
          {formatDate(item.date)}
        </Text>
      );
    }

    const { session } = item;
    const totalVolume = session.exercises.reduce(
      (s, ex) => s + ex.sets * ex.reps * ex.weight,
      0
    );

    return (
      <View style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sessionTop}>
          <View style={[styles.sessionIconWrap, { backgroundColor: colors.primary + "20" }]}>
            <IconSymbol name="dumbbell.fill" size={20} color={colors.primary} />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.sessionTitle, { color: colors.foreground }]}>
              {session.title}
            </Text>
            <Text style={[styles.sessionMeta, { color: colors.muted }]}>
              {session.durationMinutes} min · {session.exercises.length} exercise
              {session.exercises.length !== 1 ? "s" : ""}
              {totalVolume > 0 ? ` · ${Math.round(totalVolume)} kg vol` : ""}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => handleDelete(session.id)}
          >
            <IconSymbol name="trash.fill" size={18} color={colors.error} />
          </Pressable>
        </View>

        {/* Exercise List */}
        {session.exercises.map((ex, i) => (
          <View
            key={ex.id}
            style={[styles.exerciseRow, i < session.exercises.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.exerciseName, { color: colors.foreground }]}>{ex.name}</Text>
            <Text style={[styles.exerciseStats, { color: colors.muted }]}>
              {ex.sets} × {ex.reps}
              {ex.weight > 0 ? ` @ ${ex.weight}kg` : ""}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Workouts</Text>
        <View style={styles.filterRow}>
          {(["week", "month", "all"] as FilterPeriod[]).map((p) => (
            <Pressable
              key={p}
              style={({ pressed }) => [
                styles.filterChip,
                filter === p && { backgroundColor: colors.primary },
                filter !== p && { backgroundColor: colors.surface },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => setFilter(p)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filter === p ? "#fff" : colors.muted },
                ]}
              >
                {p === "week" ? "7 Days" : p === "month" ? "30 Days" : "All"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏋️</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No workouts yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Tap the + button to log your first workout!
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setShowLogModal(true);
        }}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLogModal(false)}
      >
        <LogWorkoutModal onClose={() => setShowLogModal(false)} />
      </Modal>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 6,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 4,
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  sessionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  sessionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "500",
  },
  exerciseStats: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 32,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
