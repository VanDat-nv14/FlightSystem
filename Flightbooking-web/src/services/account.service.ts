import apiClient from './apiClient';

export interface UserProfile {
  userId: number;
  email: string;
  phoneNumber?: string | null;
  fullName: string;
  role: string;
  urlAvatar?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: number | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  urlAvatar?: string | null;
}

export const accountService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<{ data: UserProfile; message: string }>('/Account/profile');
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<void> => {
    await apiClient.put('/Account/profile', data);
  },
};
