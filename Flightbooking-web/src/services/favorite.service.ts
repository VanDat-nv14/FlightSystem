import apiClient from "./apiClient";

export type FavoriteItemType = "Airport" | "Flight";

export interface CustomerFavorite {
  id: number;
  itemType: FavoriteItemType;
  itemId: number;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface ToggleFavoriteResponse {
  isFavorited: boolean;
  favorite?: CustomerFavorite | null;
}

export const favoriteService = {
  getMyFavorites: async (itemType?: FavoriteItemType): Promise<CustomerFavorite[]> => {
    const response = await apiClient.get<{ data: CustomerFavorite[]; message: string }>("/CustomerFavorites", {
      params: itemType ? { itemType } : undefined,
    });
    return response.data.data;
  },

  check: async (itemType: FavoriteItemType, itemId: number): Promise<boolean> => {
    const response = await apiClient.get<{ data: boolean; message: string }>("/CustomerFavorites/check", {
      params: { itemType, itemId },
    });
    return response.data.data;
  },

  toggle: async (itemType: FavoriteItemType, itemId: number): Promise<ToggleFavoriteResponse> => {
    const response = await apiClient.post<{ data: ToggleFavoriteResponse; message: string }>("/CustomerFavorites/toggle", {
      itemType,
      itemId,
    });
    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/CustomerFavorites/${id}`);
  },
};
