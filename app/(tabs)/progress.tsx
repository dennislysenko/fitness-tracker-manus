import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { Rect, Line, Circle, Path, Text as SvgText } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFitness } from "@/lib/fitness-context";
import { WorkoutSession, CheckIn } from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 20, right: 16, bottom: 40, left: 40 };

type ProgressTab = "workouts" | "body";

// ─── Bar Chart (Workouts per week) ───────────────────────────────────────────

function getWeeklyData(workouts: WorkoutSession[]) {
  const weeks: { label: string; count: number; volume: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekWorkouts = workouts.filter((w) => {
      const d = new Date(w.date + "T00:00:00");
      return d >= weekStart && d <= weekEnd;
    });

    const volume = weekWorkouts.reduce(
      (sum, w) =>
        sum + w.exercises.reduce((s, ex) => s + ex.sets * ex.reps * ex.weight, 0),
      0
    );

    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks.push({ label, count: weekWorkouts.length, volume: Math.round(volume) });
  }
  return weeks.slice(-6); // Last 6 weeks
}

function BarChart({
  data,
  color,
  valueKey,
  unit,
}: {
  data: { label: string; count: number; volume: number }[];
  color: string;
  valueKey: "count" | "volume";
  unit: string;
}) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  const innerW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const barWidth = (innerW / data.length) * 0.55;
  const gap = innerW / data.length;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = CHART_PADDING.top + innerH * (1 - frac);
        const val = Math.round(maxVal * frac);
        return (
          <React.Fragment key={frac}>
            <Line
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + innerW}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            {frac > 0 && (
              <SvgText
                x={CHART_PADDING.left - 6}
                y={y + 4}
                fontSize={9}
                fill={colors.muted}
                textAnchor="end"
              >
                {val}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const val = d[valueKey];
        const barH = (val / maxVal) * innerH;
        const x = CHART_PADDING.left + i * gap + gap / 2 - barWidth / 2;
        const y = CHART_PADDING.top + innerH - barH;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 2)}
              rx={4}
              fill={val > 0 ? color : colors.border}
              opacity={val > 0 ? 1 : 0.4}
            />
            <SvgText
              x={x + barWidth / 2}
              y={CHART_PADDING.top + innerH + 14}
              fontSize={9}
              fill={colors.muted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Line Chart (Weight over time) ───────────────────────────────────────────

function getWeightData(checkIns: CheckIn[]) {
  return checkIns
    .filter((c) => c.weight != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-12)
    .map((c) => ({
      date: c.date,
      weight: c.weightUnit === "lbs" ? c.weight! / 2.205 : c.weight!,
      label: new Date(c.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
}

function LineChart({ data, color }: { data: { label: string; weight: number }[]; color: string }) {
  const colors = useColors();
  if (data.length < 2) return null;

  const minW = Math.min(...data.map((d) => d.weight));
  const maxW = Math.max(...data.map((d) => d.weight));
  const range = maxW - minW || 1;
  const innerW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const points = data.map((d, i) => ({
    x: CHART_PADDING.left + (i / (data.length - 1)) * innerW,
    y: CHART_PADDING.top + innerH - ((d.weight - minW) / range) * innerH,
    label: d.label,
    weight: d.weight,
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Gridlines */}
      {[0, 0.5, 1].map((frac) => {
        const y = CHART_PADDING.top + innerH * (1 - frac);
        const val = (minW + range * frac).toFixed(1);
        return (
          <React.Fragment key={frac}>
            <Line
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + innerW}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={CHART_PADDING.left - 6}
              y={y + 4}
              fontSize={9}
              fill={colors.muted}
              textAnchor="end"
            >
              {val}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={color} />
          <Circle cx={p.x} cy={p.y} r={2} fill="#fff" />
        </React.Fragment>
      ))}

      {/* X labels (first, middle, last) */}
      {[0, Math.floor(points.length / 2), points.length - 1]
        .filter((i, idx, arr) => arr.indexOf(i) === idx)
        .map((i) => (
          <SvgText
            key={i}
            x={points[i].x}
            y={CHART_PADDING.top + innerH + 14}
            fontSize={9}
            fill={colors.muted}
            textAnchor="middle"
          >
            {points[i].label}
          </SvgText>
        ))}
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const colors = useColors();
  const { workouts, checkIns, streakInfo } = useFitness();
  const [tab, setTab] = useState<ProgressTab>("workouts");

  const weeklyData = useMemo(() => getWeeklyData(workouts), [workouts]);
  const weightData = useMemo(() => getWeightData(checkIns), [checkIns]);

  const totalVolume = workouts.reduce(
    (sum, w) =>
      sum + w.exercises.reduce((s, ex) => s + ex.sets * ex.reps * ex.weight, 0),
    0
  );

  const totalDuration = workouts.reduce((s, w) => s + w.durationMinutes, 0);

  const avgMood =
    checkIns.length > 0
      ? (checkIns.reduce((s, c) => s + c.mood, 0) / checkIns.length).toFixed(1)
      : "—";

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Progress</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <IconSymbol name="dumbbell.fill" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{workouts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Sessions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}>
            <IconSymbol name="flame.fill" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{streakInfo.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Current Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "30" }]}>
            <IconSymbol name="trophy.fill" size={20} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{streakInfo.longestStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Best Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
            <IconSymbol name="clock.fill" size={20} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalDuration}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Minutes</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.surface }]}>
          {(["workouts", "body"] as ProgressTab[]).map((t) => (
            <Pressable
              key={t}
              style={({ pressed }) => [
                styles.tabOption,
                tab === t && { backgroundColor: colors.primary },
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabOptionText, { color: tab === t ? "#fff" : colors.muted }]}>
                {t === "workouts" ? "Workouts" : "Body"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "workouts" ? (
          <>
            {/* Weekly Sessions Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>
                Sessions per Week
              </Text>
              {workouts.length === 0 ? (
                <View style={styles.chartEmpty}>
                  <Text style={[styles.chartEmptyText, { color: colors.muted }]}>
                    Log workouts to see your weekly chart
                  </Text>
                </View>
              ) : (
                <BarChart data={weeklyData} color={colors.primary} valueKey="count" unit="sessions" />
              )}
            </View>

            {/* Weekly Volume Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>
                Weekly Volume (kg)
              </Text>
              {workouts.length === 0 ? (
                <View style={styles.chartEmpty}>
                  <Text style={[styles.chartEmptyText, { color: colors.muted }]}>
                    Log workouts with weights to see volume
                  </Text>
                </View>
              ) : (
                <BarChart data={weeklyData} color={colors.accent} valueKey="volume" unit="kg" />
              )}
            </View>

            {/* Workout Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {Math.round(totalVolume).toLocaleString()}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Volume (kg)</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {totalDuration}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Minutes</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Weight Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>
                Weight Trend (kg)
              </Text>
              {weightData.length < 2 ? (
                <View style={styles.chartEmpty}>
                  <Text style={[styles.chartEmptyText, { color: colors.muted }]}>
                    Log at least 2 check-ins with weight to see the trend
                  </Text>
                </View>
              ) : (
                <LineChart data={weightData} color={colors.primary} />
              )}
            </View>

            {/* Mood & Energy Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Check-In Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {checkIns.length}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Check-Ins</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {avgMood}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Avg Mood</Text>
                </View>
              </View>
            </View>

            {/* Recent Check-Ins */}
            {checkIns.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Recent Check-Ins
                </Text>
                {checkIns.slice(0, 5).map((c) => (
                  <View
                    key={c.id}
                    style={[styles.checkInRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View>
                      <Text style={[styles.checkInDate, { color: colors.foreground }]}>
                        {new Date(c.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      {c.weight && (
                        <Text style={[styles.checkInWeight, { color: colors.muted }]}>
                          {c.weight} {c.weightUnit}
                        </Text>
                      )}
                    </View>
                    <View style={styles.checkInRight}>
                      <Text style={styles.checkInMoodEmoji}>
                        {["😞", "😕", "😐", "🙂", "😄"][c.mood - 1]}
                      </Text>
                      <View style={styles.checkInEnergyBar}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.energyDot,
                              level <= c.energy
                                ? { backgroundColor: colors.accent }
                                : { backgroundColor: colors.border },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: (SCREEN_WIDTH - 40 - 10) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  tabSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabOptionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  chartEmpty: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  checkInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkInDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  checkInWeight: {
    fontSize: 12,
    marginTop: 2,
  },
  checkInRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkInMoodEmoji: {
    fontSize: 20,
  },
  checkInEnergyBar: {
    flexDirection: "row",
    gap: 2,
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
