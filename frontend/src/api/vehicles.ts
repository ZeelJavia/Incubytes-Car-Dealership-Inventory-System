import api from './client';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const searchVehicles = async (params: Record<string, string | number>): Promise<Vehicle[]> => {
  const response = await api.get('/vehicles/search', { params });
  return response.data;
};

export const purchaseVehicle = async (id: string): Promise<Vehicle> => {
  const response = await api.post(`/vehicles/${id}/purchase`);
  return response.data;
};

export const restockVehicle = async (id: string, amount: number): Promise<Vehicle> => {
  const response = await api.post(`/vehicles/${id}/restock`, { amount });
  return response.data;
};

export const createVehicle = async (data: Partial<Vehicle>): Promise<Vehicle> => {
  const response = await api.post('/vehicles', data);
  return response.data;
};

export const updateVehicle = async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
  const response = await api.put(`/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};
