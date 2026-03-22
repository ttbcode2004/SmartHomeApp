import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useProducts, { Category, Product, SortOption } from "@/hooks/useProducts";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES: { label: string; value: Category | "all" }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Điều khiển", value: "control" },
  { label: "Đèn LED", value: "led" },
  { label: "Điện", value: "electric" },
  { label: "Rèm", value: "curtain" },
  { label: "Điều hòa", value: "air-conditioner" },
  { label: "Camera", value: "camera" },
];

const SORTS: { label: string; value: SortOption }[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Bán chạy", value: "best_selling" },
  { label: "Đánh giá", value: "rating" },
  { label: "Giá ↑", value: "price_asc" },
  { label: "Giá ↓", value: "price_desc" },
];

/* ─── ProductCard ─────────────────────────────────── */
const ProductCard = ({
  item,
  colors,
  onPress,
  onLike,
}: {
  item: Product;
  colors: any;
  onPress: () => void;
  onLike: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={{
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 12,
    }}
  >
    {/* Image */}
    <View style={{ width: "100%", height: CARD_WIDTH * 0.85 }}>
      {item.images?.[0] ? (
        <Image
          source={{ uri: item.images[0] }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.border,
          }}
        >
          <Feather name="image" size={28} color={colors.textMuted} />
        </View>
      )}

      {/* Like badge */}
      <TouchableOpacity
        onPress={onLike}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: 12,
          paddingHorizontal: 7,
          paddingVertical: 4,
        }}
      >
        <Feather name="heart" size={13} color={colors.danger} />
        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>
          {item.likes?.length ?? 0}
        </Text>
      </TouchableOpacity>

      {/* Out of stock */}
      {item.stock === 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingVertical: 4,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Hết hàng</Text>
        </View>
      )}
    </View>

    {/* Body */}
    <View style={{ padding: 10 }}>
      <Text
        style={{ fontSize: 13, fontWeight: "600", lineHeight: 18, marginBottom: 2, color: colors.text }}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text
        style={{ fontSize: 11, marginBottom: 6, color: colors.textMuted }}
        numberOfLines={1}
      >
        {item.summary}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
          {item.price.toLocaleString("vi-VN")}₫
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Feather name="star" size={11} color="#f59e0b" />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {item.ratingsAverage?.toFixed(1) ?? "–"}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

/* ─── HomeScreen ──────────────────────────────────── */
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, isLoading, isLoadingMore, fetchProducts, loadMore, toggleLike } =
    useProducts();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeSort, setActiveSort] = useState<SortOption>("newest");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    (replace = true) => {
      fetchProducts(
        {
          search: search.trim() || undefined,
          category: activeCategory === "all" ? undefined : activeCategory,
          sort: activeSort,
          page: 1,
        },
        replace
      );
    },
    [search, activeCategory, activeSort, fetchProducts]
  );

  useEffect(() => {
    load();
  }, [activeCategory, activeSort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(() => {
    loadMore({
      search: search.trim() || undefined,
      category: activeCategory === "all" ? undefined : activeCategory,
      sort: activeSort,
    });
  }, [loadMore, search, activeCategory, activeSort]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        colors={colors}
        onPress={() => router.push(`/product/${item._id}` as any)}
        onLike={() => toggleLike(item._id)}
      />
    ),
    [colors, router, toggleLike]
  );

  const ListHeader = (
    <View>
      {/* Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 4,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: colors.backgrounds.input,
          borderColor: colors.border,
        }}
      >
        <Feather name="search" size={15} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 }}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(""); load(); }}>
            <Feather name="x" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.value}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        renderItem={({ item }) => {
          const active = activeCategory === item.value;
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(item.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: active ? "#fff" : colors.textMuted }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Sort chips */}
      <FlatList
        data={SORTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.value}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
        renderItem={({ item }) => {
          const active = activeSort === item.value;
          return (
            <TouchableOpacity
              onPress={() => setActiveSort(item.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                backgroundColor: active ? colors.primary + "18" : "transparent",
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: active ? colors.primary : colors.textMuted }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={{ fontSize: 16, fontWeight: "700", marginHorizontal: 16, marginTop: 4, marginBottom: 8, color: colors.text }}>
        Sản phẩm
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.5, color: colors.text }}>
          Khám phá
        </Text>
        <TouchableOpacity onPress={() => router.push("/profile" as any)}>
          <Feather name="user" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 }}>
              <Feather name="package" size={48} color={colors.border} />
              <Text style={{ fontSize: 15, color: colors.textMuted }}>Không có sản phẩm</Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}