import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFitness } from "@/lib/fitness-context";
import { formatDate, getTodayDate } from "@/lib/storage";
import { LogWorkoutModal } from "@/components/log-workout-modal";

const QUOTES = [
  "Every rep counts. Every step matters.",
  "Push harder than yesterday if you want a different tomorrow.",
  "The only bad workout is the one that didn't happen.",
  "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Take care of your body. It's the only place you have to live.",
  "Success is usually the culmination of controlling failure.",
  "The pain you feel today will be the strength you feel tomorrow.",
];

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export default function HomeScreen() {
  const colors = useColors();
  const { workouts, todayCheckIn, streakInfo, todayWorkouts, loading } = useFitness();
  const [showLogModal, setShowLogModal] = useState(false);

  const today = getTodayDate();
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const totalVolume = todayWorkouts.reduce((sum, session) => {
    return (
      sum +
      session.exercises.reduce(
        (s, ex) => s + ex.sets * ex.reps * ex.weight,
        0
      )
    );
  }, 0);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>
              {greeting} 👋
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              FitTrack
            </Text>
          </View>
          {/* Streak Badge */}
          <View style={[styles.streakBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakCount, { color: colors.primary }]}>
              {streakInfo.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.muted }]}>
              day{streakInfo.currentStreak !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Today's Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <Text style={styles.summaryDate}>{formatDate(today)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{todayWorkouts.length}</Text>
              <Text style={styles.summaryItemLabel}>Workouts</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {todayWorkouts.reduce((s, w) => s + w.durationMinutes, 0)}
              </Text>
              <Text style={styles.summaryItemLabel}>Minutes</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {todayCheckIn ? MOOD_EMOJIS[todayCheckIn.mood] : "—"}
              </Text>
              <Text style={styles.summaryItemLabel}>Mood</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setShowLogModal(true)}
          >
            <IconSymbol name="dumbbell.fill" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Log Workout</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtnOutline,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + "15",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => {
              // Navigate to check-in tab
            }}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>
              {todayCheckIn ? "View Check-In" : "Check In"}
            </Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="trophy.fill" size={22} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {streakInfo.longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Best Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="dumbbell.fill" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {workouts.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Sessions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="bolt.fill" size={22} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {Math.round(totalVolume)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>kg Today</Text>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activity
          </Text>
          {workouts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No workouts yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Tap "Log Workout" to get started!
              </Text>
            </View>
          ) : (
            workouts.slice(0, 3).map((session) => (
              <View
                key={session.id}
                style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.recentIconWrap, { backgroundColor: colors.primary + "20" }]}>
                  <IconSymbol name="dumbbell.fill" size={18} color={colors.primary} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentTitle, { color: colors.foreground }]}>
                    {session.title}
                  </Text>
                  <Text style={[styles.recentMeta, { color: colors.muted }]}>
                    {formatDate(session.date)} · {session.exercises.length} exercise
                    {session.exercises.length !== 1 ? "s" : ""} · {session.durationMinutes} min
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quote */}
        <View style={[styles.quoteCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
          <Text style={[styles.quoteText, { color: colors.foreground }]}>"{quote}"</Text>
        </View>
      </ScrollView>

      {/* Log Workout Modal */}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakFire: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: "800",
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
  },
  summaryTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryDate: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryItemLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 16,
    gap: 6,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  recentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
});
