import apiClient from "./apiClient";

export interface PromotionDto {
  id: number;
  code: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: "Active" | "Paused" | "Expired" | "Upcoming";
  airlineId?: number | null;
  airlineName?: string | null;
  airlineLogoUrl?: string | null;
  createdAt: string;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface UpdatePromotionRequest {
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: string;
}

export const promotionService = {
  // Public - lấy ưu đãi đang hoạt động (không cần đăng nhập)
  getActive: async (): Promise<PromotionDto[]> => {
    const res = await apiClient.get<{ data: PromotionDto[] }>("/Promotion/active");
    return res.data.data;
  },

  // Manager - lấy ưu đãi của hãng mình
  getMine: async (): Promise<PromotionDto[]> => {
    const res = await apiClient.get<{ data: PromotionDto[] }>("/Promotion/my");
    return res.data.data;
  },

  create: async (data: CreatePromotionRequest): Promise<PromotionDto> => {
    const res = await apiClient.post<{ data: PromotionDto }>("/Promotion", data);
    return res.data.data;
  },

  update: async (id: number, data: UpdatePromotionRequest): Promise<PromotionDto> => {
    const res = await apiClient.put<{ data: PromotionDto }>(`/Promotion/${id}`, data);
    return res.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/Promotion/${id}`);
  },
};
