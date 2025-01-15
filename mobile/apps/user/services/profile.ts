import api from './api';
import type { SavedAddress, User, SavedCard } from '../app/types/user';
import { Address } from 'react-native-maps';

interface APIResponse<T> {
  status: 'success' | 'error';
  data: T;
}

export const ProfileAPI = {
  async getProfile(): Promise<User> {
    const response = await api.get<APIResponse<User>>('/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<APIResponse<User>>('/profile', data);
    return response.data.data;
  },

  async getAddresses(): Promise<SavedAddress[]> {
    const response = await api.get<APIResponse<SavedAddress[]>>('/profile/addresses');
    return response.data.data;
  },

  async addAddress(address: Omit<SavedAddress, '_id'>): Promise<SavedAddress> {
    const response = await api.post<APIResponse<SavedAddress>>('/profile/addresses', address);
    return response.data.data;
  },

  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    const response = await api.patch<APIResponse<Address>>(`/profile/addresses/${id}`, address);
    return response.data.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete<APIResponse<void>>(`/profile/addresses/${id}`);
  },

  async getCards(): Promise<SavedCard[]> {
    const response = await api.get<APIResponse<SavedCard[]>>('/profile/cards');
    return response.data.data;
  },

  async deleteCard(id: string): Promise<void> {
    await api.delete<APIResponse<void>>(`/profile/cards/${id}`);
  }
}; 