import {
  View, Text, FlatList, StatusBar,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import useTheme from "@/hooks/useTheme";
import useProducts, { type Category, type SortOption, Product } from "@/hooks/useProducts";
import useProductActions from "@/hooks/useProductActions";
import ProductCard from "@/components/products/ProductCard";
import ProductSearch from "@/components/products/ProductSearch";
import ProductFilter from "@/components/products/ProductFilter";
import Toast from "@/components/Toast";

const NUM_COLUMNS = 2;
const COL_GAP     = 10;

export default function ProductsScreen() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();

  const {
    products, isLoading, isLoadingMore,
    fetchProducts, loadMore, totalPages, page,
  } = useProducts();

  const {
    cartLoadingId, handleAddToCart,
    wishlistLoadingId, handleToggleWishlist, isWishlisted,
    toast, opacity,
  } = useProductActions();

  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState<Category | "all">("all");
  const [sort,       setSort]       = useState<SortOption>("newest");
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildFilter = useCallback(() => ({
    ...(search             ? { search }   : {}),
    ...(category !== "all" ? { category } : {}),
    sort,
    page: 1,
  }), [search, category, sort]);

  useEffect(() => {
    searchTimer.current && clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(buildFilter()), 400);
    return () => { searchTimer.current && clearTimeout(searchTimer.current); };
  }, [search, category, sort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(buildFilter());
    setRefreshing(false);
  }, [fetchProducts, buildFilter]);

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View
      style={{
        flex: 1,
        marginLeft:  index % NUM_COLUMNS === 0 ? 0 : COL_GAP / 2,
        marginRight: index % NUM_COLUMNS === 0 ? COL_GAP / 2 : 0,
      }}
    >
      <ProductCard
        product={item}
        isWishlisted={isWishlisted(item._id)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        cartLoading={cartLoadingId === item._id}
        wishlistLoading={wishlistLoadingId === item._id}
      />
    </View>
  ), [handleAddToCart, handleToggleWishlist, cartLoadingId, wishlistLoadingId, isWishlisted]);

  const ListHeader = (
    <View className="gap-1 mb-3">
      <View className="px-4 pt-2 pb-1">
        <ProductSearch value={search} onChangeText={setSearch} onClear={() => setSearch("")} colors={colors} />
      </View>
      <ProductFilter
        selectedCategory={category} selectedSort={sort}
        onCategoryChange={setCategory} onSortChange={setSort}
        colors={colors}
      />
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {isLoading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          columnWrapperStyle={{ marginBottom: COL_GAP }}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={isLoadingMore
            ? <View className="py-5 items-center"><ActivityIndicator color={colors.primary} /></View>
            : null}
          ListEmptyComponent={!isLoading
            ? <View className="items-center py-16 gap-2">
                <Text className="text-4xl">📦</Text>
                <Text className="text-sm font-semibold text-gray-400">Không có sản phẩm</Text>
              </View>
            : null}
          onEndReached={() => {
            if (page < totalPages && !isLoadingMore)
              loadMore({ search, category: category !== "all" ? category : undefined, sort });
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      <Toast toast={toast} opacity={opacity} />
    </View>
  );
}