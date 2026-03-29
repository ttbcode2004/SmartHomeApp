const categoryMap: Record<string, string> = {
  control:         "Điều khiển",
  led:             "Đèn LED",
  electric:        "Thiết bị điện",
  curtain:         "Rèm cửa",
  "air-conditioner": "Điều hòa",
  camera:          "Camera",
};

export const getCategoryLabel = (category: string): string => {
  return categoryMap[category] ?? category;
};