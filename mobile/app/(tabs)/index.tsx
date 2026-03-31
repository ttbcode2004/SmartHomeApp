import {View, Text, FlatList, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import { Feather } from "@expo/vector-icons";

import useTheme from "@/hooks/useTheme";
import useProducts from "@/hooks/useProducts";
import {Category, SortOption, Product} from "@/types"

import ProductCard from "@/components/products/ProductCard";
import ProductSearch from "@/components/products/ProductSearch";
import ProductFilter from "@/components/products/ProductFilter";

const NUM_COLUMNS = 2;
const COL_GAP = 10;

export default function ProductsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    products, isLoading, isLoadingMore,
    fetchProducts, loadMore, totalPages, page,
  } = useProducts();

  // ================= STATE =================
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [refreshing, setRefreshing] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);

  // ================= FILTER =================
  const buildFilter = useCallback(() => ({
    ...(search ? { search } : {}),
    ...(category !== "all" ? { category } : {}),
    sort,
    page: 1,
  }), [search, category, sort]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      fetchProducts(buildFilter());
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, category, sort, reloadKey]);

  // ================= REFRESH =================
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(buildFilter());
    setRefreshing(false);
  }, [fetchProducts, buildFilter]);

  // ================= ITEM =================
  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <View
        style={{
          flex: 1,
          marginLeft: index % NUM_COLUMNS === 0 ? 0 : COL_GAP / 2,
          marginRight: index % NUM_COLUMNS === 0 ? COL_GAP / 2 : 0,
        }}
      >
        <ProductCard
          product={item}
  
        />
      </View>
    ),
    []
  );

  // ================= HOME ACTION =================
  const handleHomePress = () => {
    // scroll top
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

    // reset filter
    setSearch("");
    setCategory("all");
    setSort("newest");

    // close UI
    setShowSearch(false);
    setShowFilter(false);

    // force reload
    setReloadKey((k) => k + 1);
  };

  // ================= HEADER BAR =================
  const HeaderBar = () => (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <TouchableOpacity onPress={handleHomePress}>
        <Feather name="home" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 16 }}>
        <TouchableOpacity
          onPress={() => {
            setShowFilter((p) => !p);
            setShowSearch(false);
          }}
        >
          <Feather name="sliders" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowSearch((p) => !p);
            setShowFilter(false);
          }}
        >
          <Feather name="search" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ================= HEADER =================
  const ListHeader = () => (
    <View>
      <HeaderBar />

      {showSearch && (
        <View className="px-4 pb-2">
          <ProductSearch
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            colors={colors}
          />
        </View>
      )}

      {showFilter && (
        <ProductFilter
          selectedCategory={category}
          selectedSort={sort}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          colors={colors}
        />
      )}
    </View>
  );

  // ================= UI =================
  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {isLoading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}

          ListHeaderComponent={ListHeader}
          stickyHeaderIndices={[0]}

          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          columnWrapperStyle={{ marginBottom: COL_GAP }}

          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-5 items-center">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }

          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center py-16 gap-2">
                <Text className="text-4xl">📦</Text>
                <Text className="text-sm font-semibold text-gray-400">
                  Không có sản phẩm
                </Text>
              </View>
            ) : null
          }

          onEndReached={() => {
            if (page < totalPages && !isLoadingMore) {
              loadMore({
                search,
                category: category !== "all" ? category : undefined,
                sort,
              });
            }
          }}

          onEndReachedThreshold={0.4}

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}