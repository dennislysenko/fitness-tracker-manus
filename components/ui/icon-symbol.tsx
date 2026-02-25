// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Fitness
  "dumbbell.fill": "fitness-center",
  "figure.run": "directions-run",
  "figure.walk": "directions-walk",
  "flame.fill": "local-fire-department",
  "bolt.fill": "bolt",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  // Check-in
  "checkmark.circle.fill": "check-circle",
  "checkmark.circle": "check-circle-outline",
  "checkmark": "check",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  // Progress / Charts
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "chart.xyaxis.line": "show-chart",
  // UI
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "minus": "remove",
  "trash.fill": "delete",
  "pencil": "edit",
  "square.and.pencil": "edit",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-horiz",
  "calendar": "calendar-today",
  "calendar.badge.plus": "event",
  "clock.fill": "schedule",
  "clock": "access-time",
  "star.fill": "star",
  "star": "star-border",
  "person.fill": "person",
  "person.circle.fill": "account-circle",
  "gearshape.fill": "settings",
  "info.circle": "info",
  "exclamationmark.circle": "error-outline",
  "trophy.fill": "emoji-events",
  "medal.fill": "military-tech",
  "scalemass.fill": "monitor-weight",
  "moon.fill": "bedtime",
  "sun.max.fill": "wb-sunny",
  "note.text": "notes",
  "square.and.arrow.up": "share",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
