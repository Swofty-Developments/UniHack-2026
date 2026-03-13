import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Map MongoDB _id to id in all responses
function mapIds(data: any): any {
  if (Array.isArray(data)) {
    return data.map(mapIds);
  }
  if (data && typeof data === 'object') {
    const mapped: any = {};
    for (const key of Object.keys(data)) {
      if (key === '_id') {
        mapped['id'] = data[key];
      } else {
        mapped[key] = mapIds(data[key]);
      }
    }
    return mapped;
  }
  return data;
}

api.interceptors.response.use((response) => {
  response.data = mapIds(response.data);
  return response;
});

export default api;
