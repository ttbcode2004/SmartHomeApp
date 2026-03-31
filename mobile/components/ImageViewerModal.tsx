// components/common/ImageViewerModal.tsx
import { View, Image, Modal, TouchableOpacity, Dimensions } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  image: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ visible, image, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View className="flex-1 bg-black">
        {/* Close */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute right-4 z-10 w-10 h-10 rounded-full items-center justify-center"
          style={{
            top: insets.top + 10,
            backgroundColor: "#00000080",
          }}
        >
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Image */}
        {image && (
          <View className="flex-1 justify-center items-center">
            <Image
              source={{ uri: image }}
              style={{ width: SCREEN_WIDTH, height: "100%" }}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </Modal>
  );
}