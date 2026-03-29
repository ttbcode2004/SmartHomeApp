import { ScrollView, TouchableOpacity, Text } from "react-native";
import type { Category, SortOption } from "@/hooks/useProducts";

const CATEGORIES: { label: string; value: Category | "all" }[] = [
  { label: "Tất cả",        value: "all"           },
  { label: "Điều khiển",    value: "control"       },
  { label: "Đèn LED",       value: "led"           },
  { label: "Điện",          value: "electric"      },
  { label: "Rèm",           value: "curtain"       },
  { label: "Điều hòa",      value: "air-conditioner"},
  { label: "Camera",        value: "camera"        },
];

const SORTS: { label: string; value: SortOption }[] = [
  { label: "Mới nhất",    value: "newest"       },
  { label: "Bán chạy",    value: "best_selling" },
  { label: "Đánh giá",    value: "rating"       },
  { label: "Giá tăng",    value: "price_asc"    },
  { label: "Giá giảm",    value: "price_desc"   },
];

interface Props {
  selectedCategory: Category | "all";
  selectedSort: SortOption;
  onCategoryChange: (c: Category | "all") => void;
  onSortChange: (s: SortOption) => void;
  colors: any;
}

const Chip = ({
  label, active, onPress, colors,
}: {
  label: string; active: boolean; onPress: () => void; colors: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      paddingHorizontal: 14, paddingVertical: 6,
      borderRadius: 20, marginRight: 8,
      backgroundColor: active ? colors.primary : colors.surface,
      borderWidth: 1,
      borderColor: active ? colors.primary : colors.border,
    }}
  >
    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : colors.textMuted }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function ProductFilter({
  selectedCategory, selectedSort, onCategoryChange, onSortChange, colors,
}: Props) {
  return (
    <>
      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={selectedCategory === c.value}
            onPress={() => onCategoryChange(c.value)}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* Sort */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
      >
        {SORTS.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            active={selectedSort === s.value}
            onPress={() => onSortChange(s.value)}
            colors={colors}
          />
        ))}
      </ScrollView>
    </>
  );
}