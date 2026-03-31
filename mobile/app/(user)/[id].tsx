import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import  { Product, PublicUser } from "@/types";
import { useSocialActions } from "@/hooks/useSocialActions";
import useProducts from "@/hooks/useProducts";
import ProductCard from "@/components/products/ProductCard";
import ImageViewerModal from "@/components/ImageViewerModal";


export default function UserProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dbUser, getUserById } = useCurrentUser();
  const {fetchProductsByUser} = useProducts()

  const {
    isFollowing,
    isFriend,
    actionLoading,
    handleToggleFollow,
    handleFriendAction,
    getFriendBtnConfig,
  } = useSocialActions(id);

  const friendBtn = getFriendBtnConfig(colors);

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const isFollower = dbUser?.followers?.some((f: any) => (f._id ?? f) === id) ?? false;

  const openViewer = (image?: string) => {
    if (!image) return;
    setViewerImage(image);
    setShowViewer(true);
  };

  useEffect(() => {
    if (!id) return;

    const loadProducts = async () => {
      const data = await fetchProductsByUser(id);
      setProducts(data);
    };

    loadProducts();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    if (dbUser?._id === id) {
      router.replace("/(tabs)/profile");
      return;
    }

    getUserById(id).then((data) => {
      setProfile(data);
      setFollowersCount(data?.followers?.length ?? 0);
      setIsLoading(false);
    });
  }, [id, dbUser?._id]);

  /* ───────── STATES ───────── */
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3"
        style={{ backgroundColor: colors.bg }}
      >
        <Feather name="user-x" size={48} color={colors.border} />
        <Text style={{ color: colors.textMuted }}>
          Không tìm thấy người dùng
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() || profile.username;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute left-4 z-10 w-9 h-9 rounded-full items-center justify-center"
        style={{
          top: insets.top + 12,
          backgroundColor: "#00000060",
        }}
      >
        <Feather name="arrow-left" size={18} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ───── Banner ───── */}
        <View className="h-44">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openViewer(profile.bannerImage)}
          >
            {profile.bannerImage ? (
              <Image
                source={{ uri: profile.bannerImage }}
                className="w-full h-full"
              />
            ) : (
              <LinearGradient
                colors={colors.gradients.primary}
                className="w-full h-full"
              />
            )}
          </TouchableOpacity>

          <LinearGradient
            pointerEvents="none"
            colors={["transparent", colors.bg + "dd"]}
            className="absolute inset-0"
          />
        </View>

        {/* ───── Avatar + Actions ───── */}
        <View className="px-4 -mt-11">
          <View className="flex-row items-end justify-between">
            {/* Avatar */}
            <TouchableOpacity
              onPress={() => openViewer(profile.profilePicture)}
            >
              <View
                className="rounded-full border-4"
                style={{ borderColor: colors.bg }}
              >
                {profile.profilePicture ? (
                  <Image
                    source={{ uri: profile.profilePicture }}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <Feather name="user" size={34} color={colors.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Actions */}
            <View className="flex-row gap-2 mt-10">
              {/* Follow */}
              <TouchableOpacity
                onPress={handleToggleFollow}
                disabled={actionLoading}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: isFollowing
                    ? colors.surface
                    : colors.primary,
                  borderWidth: isFollowing ? 1 : 0,
                  borderColor: colors.border,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                <Feather
                  name={isFollowing ? "user-check" : "user-plus"}
                  size={13}
                  color={isFollowing ? colors.text : "#fff"}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: isFollowing ? colors.text : "#fff",
                  }}
                >
                  {isFollowing ? "Đang theo" : "Theo dõi"}
                </Text>
              </TouchableOpacity>

              {/* Friend */}
              <TouchableOpacity
                onPress={handleFriendAction}
                disabled={friendBtn.disabled || actionLoading}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: friendBtn.bgColor,
                  borderColor: friendBtn.color,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                <Feather
                  name={friendBtn.icon as any}
                  size={13}
                  color={friendBtn.color}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: friendBtn.color }}
                >
                  {friendBtn.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ───── Name ───── */}
          <Text
            className="text-xl font-bold mt-3"
            style={{ color: colors.text }}
          >
            {fullName}
          </Text>

          <Text
            className="text-sm mt-1"
            style={{ color: colors.primary }}
          >
            @{profile.username}
          </Text>

          {/* Badge */}
          {isFollower && !isFriend && (
            <View
              className="self-start mt-2 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: colors.textMuted + "18" }}
            >
              <Text
                className="text-xs"
                style={{ color: colors.textMuted }}
              >
                Đang theo dõi bạn
              </Text>
            </View>
          )}

          {/* Bio */}
          {!!profile.bio && (
            <Text
              className="text-sm mt-3 leading-5"
              style={{ color: colors.textMuted }}
            >
              {profile.bio}
            </Text>
          )}
        </View>

        {/* ───── Stats ───── */}
        <View
          className="mx-4 mt-5 rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row py-3">
            {[
              { label: "Bạn bè", value: profile.friends?.length ?? 0 },
              { label: "Đang theo", value: profile.following?.length ?? 0 },
              { label: "Người theo", value: followersCount },
            ].map((stat, i, arr) => (
              <View key={stat.label} className="flex-1 flex-row">
                <View className="flex-1 items-center">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: colors.textMuted }}
                  >
                    {stat.label}
                  </Text>
                </View>

                {i < arr.length - 1 && (
                  <View
                    className="w-px h-8 self-center"
                    style={{ backgroundColor: colors.border }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* product */}
        <View className="px-4 mt-6">
          <Text
            className="text-lg font-bold mb-3"
            style={{ color: colors.text }}
          >
            Sản phẩm
          </Text>

          {products.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>
              Chưa có sản phẩm
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {products.map((item) => (
                <ProductCard key={item._id} product={item}/>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ImageViewerModal visible={showViewer} image={viewerImage} onClose={() => setShowViewer(false)} />
    </View>
  );
}