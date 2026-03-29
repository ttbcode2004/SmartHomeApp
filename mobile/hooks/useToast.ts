import { useState, useRef, useCallback } from "react";
import { Animated } from "react-native";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** Main message (required) */
  message: string;
  /** Smaller subtitle below the message */
  description?: string;
  /** success | error | warning | info  (default: "success") */
  type?: ToastType;
  /** How long the toast stays visible in ms  (default: 2500) */
  duration?: number;
}

export interface ToastState extends Required<Omit<ToastOptions, "description">> {
  description?: string;
  visible: boolean;
}

/* ─────────────────────────────────────────────
   Config per type  (icon + colour token)
───────────────────────────────────────────── */
export const TOAST_CONFIG: Record<
  ToastType,
  { icon: string; bgColor: string; iconBg: string }
> = {
  success: { icon: "✓",  bgColor: "#111827", iconBg: "#22c55e" }, // gray-900 / green-500
  error:   { icon: "✕",  bgColor: "#111827", iconBg: "#ef4444" }, // gray-900 / red-500
  warning: { icon: "!",  bgColor: "#111827", iconBg: "#f59e0b" }, // gray-900 / amber-500
  info:    { icon: "i",  bgColor: "#111827", iconBg: "#3b82f6" }, // gray-900 / blue-500
};

/* ─────────────────────────────────────────────
   Hook
───────────────────────────────────────────── */
const DEFAULT_DURATION = 2500;

export default function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible:     false,
    message:     "",
    description: undefined,
    type:        "success",
    duration:    DEFAULT_DURATION,
  });

  const opacity   = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  /* ── show ── */
  const show = useCallback(
    ({
      message,
      description,
      type     = "success",
      duration = DEFAULT_DURATION,
    }: ToastOptions) => {
      // cancel any in-progress animation / timer
      animation.current?.stop();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      opacity.setValue(0);

      setToast({ visible: true, message, description, type, duration });

      const fadeIn  = Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true });
      const hold    = Animated.delay(duration - 600);          // stay visible
      const fadeOut = Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true });

      animation.current = Animated.sequence([fadeIn, hold, fadeOut]);
      animation.current.start(() =>
        setToast((prev) => ({ ...prev, visible: false }))
      );

      // safety fallback to clear visible flag
      hideTimer.current = setTimeout(
        () => setToast((prev) => ({ ...prev, visible: false })),
        duration + 100,
      );
    },
    [opacity],
  );

  /* ── convenience wrappers ── */
  const success = useCallback(
    (message: string, description?: string, duration?: number) =>
      show({ message, description, type: "success", duration }),
    [show],
  );

  const error = useCallback(
    (message: string, description?: string, duration?: number) =>
      show({ message, description, type: "error", duration }),
    [show],
  );

  const warning = useCallback(
    (message: string, description?: string, duration?: number) =>
      show({ message, description, type: "warning", duration }),
    [show],
  );

  const info = useCallback(
    (message: string, description?: string, duration?: number) =>
      show({ message, description, type: "info", duration }),
    [show],
  );

  /* ── hide manually ── */
  const hide = useCallback(() => {
    animation.current?.stop();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setToast((prev) => ({ ...prev, visible: false }))
    );
  }, [opacity]);

  return { toast, opacity, show, success, error, warning, info, hide };
}