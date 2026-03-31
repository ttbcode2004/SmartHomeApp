import { Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  PinchGestureHandler,
  PanGestureHandler,
} from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

export default function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <PanGestureHandler
      onGestureEvent={(e) => {
        translateX.value = e.nativeEvent.translationX;
        translateY.value = e.nativeEvent.translationY;
      }}
      onEnded={() => {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }}
    >
      <Animated.View className="flex-1 justify-center items-center">
        <PinchGestureHandler
          onGestureEvent={(e) => {
            scale.value = e.nativeEvent.scale;
          }}
          onEnded={() => {
            scale.value = withTiming(1);
          }}
        >
          <Animated.Image
            source={{ uri }}
            style={[
              {
                width,
                height,
              },
              animatedStyle,
            ]}
            resizeMode="contain"
          />
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}