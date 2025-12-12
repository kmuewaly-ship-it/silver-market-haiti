import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StoreProfile {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  rating: number;
  reviews: number;
  followers: number;
  joinDate: string;
  responseTime: string;
  shippingTime: string;
  returnPolicy: string;
}

export const useStore = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();

      if (error) throw new Error(error.message);
      return data as StoreProfile;
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const useStoreProducts = (storeId: string | undefined, page = 0, limit = 12) => {
  return useQuery({
    queryKey: ["store", storeId, "products", page],
    queryFn: async () => {
      if (!storeId) return { products: [], total: 0 };

      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("seller_id", storeId)
        .range(page * limit, (page + 1) * limit - 1)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return { products: data, total: count || 0 };
    },
    enabled: !!storeId,
  });
};
