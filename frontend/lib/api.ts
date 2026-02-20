import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getMonthlySummary = async (year: number, month: number) => {
  try {
    // Ajouter un timeout de 10 secondes pour éviter que l'application ne se bloque
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await api.get(`/monthly-summary/${year}/${month}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    // Si l'erreur est due à un timeout, retourner des données vides plutôt que de bloquer l'interface
    if (axios.isCancel(error)) {
      console.warn('Request was cancelled due to timeout');
      return [];
    }
    throw error;
  }
};

export const getProduits = async () => {
  try {
    // Ajouter un timeout de 10 secondes pour éviter que l'application ne se bloque
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await api.get('/menu/produits/', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    console.error('Error fetching produits:', error);
    // Si l'erreur est due à un timeout, retourner des données vides plutôt que de bloquer l'interface
    if (axios.isCancel(error)) {
      console.warn('Request was cancelled due to timeout');
      return [];
    }
    throw error;
  }
};

// Ajoutez d'autres fonctions d'appel à l'API ici