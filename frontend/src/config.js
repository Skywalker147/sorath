// API Configuration
export const API_URL = 'http://localhost:5000/api';

// Firebase Configuration


// App Configuration
export const APP_CONFIG = {
  name: 'Sorath Masala Inventory',
  version: '1.0.0'
};

// Default headers for API requests
export const getDefaultHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API utility function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: getDefaultHeaders(),
    ...options,
    headers: {
      ...getDefaultHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_URL;