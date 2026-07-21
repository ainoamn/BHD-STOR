import { useQuery, UseQueryResult } from "@tanstack/react-query";

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount?: number;
}

const demoCategories: Category[] = [
  { id: "1", name: "Electronics", nameAr: "إلكترونيات", slug: "electronics", productCount: 1250 },
  { id: "2", name: "Fashion", nameAr: "أزياء", slug: "fashion", productCount: 890 },
  { id: "3", name: "Home", nameAr: "منزل وأثاث", slug: "home", productCount: 640 },
  { id: "4", name: "Beauty", nameAr: "جمال وعناية", slug: "beauty", productCount: 420 },
  { id: "5", name: "Food", nameAr: "مواد غذائية", slug: "food", productCount: 310 },
  { id: "6", name: "Handicrafts", nameAr: "حرف عمانية", slug: "handicrafts", productCount: 180 },
];

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => demoCategories,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
