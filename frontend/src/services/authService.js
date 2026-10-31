import api from './api';

/**
 * Register a new user
 * @param {object} userData - { name, email, password, phone }
 * @returns {Promise<object>} API response containing user data & JWT token
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Authenticate existing user with credentials
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} API response containing user data & JWT token
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Log out user session
 * @returns {Promise<object>} API response
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } finally {
    try {
      localStorage.removeItem('imovies_token');
    } catch {
      // Ignore storage errors
    }
  }
};

/**
 * Fetch authenticated user profile using Bearer token
 * @returns {Promise<object>} API response containing user profile data
 */
export const getUserProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

/**
 * Update authenticated user profile
 * @param {object} updatedData - { name?, email?, phone?, password? }
 * @returns {Promise<object>} API response containing updated user profile
 */
export const updateUserProfile = async (updatedData) => {
  const response = await api.put('/auth/profile', updatedData);
  return response.data;
};
