import axios from 'axios';
import { SavedAddress } from '../../../types/user';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export async function addAddress(address: Omit<SavedAddress, 'id'>) {
  const response = await api.post<{ status: string; message: string }>('/api/profile/addresses', address);
  return response.data;
}

export async function updateAddress(id: string, address: Partial<SavedAddress>) {
  const response = await api.put<{ status: string; message: string }>(`/api/profile/addresses/${id}`, address);
  return response.data;
}

export async function deleteAddress(id: string) {
  const response = await api.delete<{ status: string; message: string }>(`/api/profile/addresses/${id}`);
  return response.data;
}

export async function setDefaultAddress(id: string) {
  const response = await api.post<{ status: string; message: string }>(`/api/profile/addresses/${id}/default`);
  return response.data;
} 