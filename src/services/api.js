// API configuration
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use proxy in development
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Login user
  login: async (email, password, rememberMe = false) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  // Register user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } finally {
      removeAuthToken();
    }
  },

  // Get current user profile
  getProfile: async () => {
    return await apiRequest('/auth/me');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        newPassword,
      }),
    });
  },
};

// Users API
export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return await apiRequest(endpoint);
  },

  // Get user by ID
  getUser: async (userId) => {
    return await apiRequest(`/users/${userId}`);
  },

  // Create user
  createUser: async (userData) => {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  updateUser: async (userId, userData) => {
    return await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Deactivate user
  deleteUser: async (userId) => {
    return await apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Activate user
  activateUser: async (userId) => {
    return await apiRequest(`/users/${userId}/activate`, {
      method: 'PUT',
    });
  },

  // Get user statistics
  getUserStats: async () => {
    return await apiRequest('/users/stats/overview');
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/categories?${queryString}` : '/categories';
    return await apiRequest(endpoint);
  },

  // Get single category
  getCategory: async (categoryId) => {
    return await apiRequest(`/categories/${categoryId}`);
  },

  // Create category or subcategory
  createCategory: async (categoryData) => {
    return await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    return await apiRequest(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    return await apiRequest(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  // Toggle category status
  toggleCategoryStatus: async (categoryId) => {
    return await apiRequest(`/categories/${categoryId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Get subcategories of a specific category
  getSubcategories: async (categoryId) => {
    return await apiRequest(`/categories/${categoryId}/subcategories`);
  },

  // Get category hierarchy (tree structure)
  getCategoryHierarchy: async () => {
    return await apiRequest('/categories/hierarchy');
  },

  // Get category statistics
  getCategoryStats: async () => {
    return await apiRequest('/categories/stats/overview');
  },

  // Add subcategory to existing category
  addSubcategory: async (categoryId, subcategoryData) => {
    return await apiRequest(`/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(subcategoryData),
    });
  },

  // Add item to subcategory
  addItemToSubcategory: async (categoryId, subcategoryId, itemData) => {
    return await apiRequest(`/categories/${categoryId}/subcategories/${subcategoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },
};

// Items API
export const itemsAPI = {
  // Get all items
  getItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/items?${queryString}` : '/items';
    return await apiRequest(endpoint);
  },

  // Get single item
  getItem: async (itemId) => {
    return await apiRequest(`/items/${itemId}`);
  },

  // Create item
  createItem: async (itemData) => {
    return await apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Update item (using category controller for embedded items)
  updateItem: async (itemId, itemData) => {
    return await apiRequest(`/categories/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  // Delete item
  deleteItem: async (itemId) => {
    return await apiRequest(`/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Toggle item status
  toggleItemStatus: async (itemId) => {
    return await apiRequest(`/items/${itemId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Get low stock items
  getLowStockItems: async () => {
    return await apiRequest('/items/low-stock');
  },

  // Get items by subcategory
  getItemsBySubcategory: async (subcategoryId) => {
    return await apiRequest(`/items/subcategory/${subcategoryId}`);
  },

  // Get item statistics
  getItemStats: async () => {
    return await apiRequest('/items/stats/overview');
  },
};

// Bills API
export const billsAPI = {
  // Create a new bill
  createBill: async (billData) => {
    return await apiRequest('/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  },

  // Get all bills
  getBills: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bills?${queryString}` : '/bills';
    return await apiRequest(endpoint);
  },

  // Get bill by ID
  getBill: async (billId) => {
    return await apiRequest(`/bills/${billId}`);
  },

  // Get daily sales summary
  getDailySalesSummary: async (date) => {
    return await apiRequest(`/bills/summary/${date}`);
  },

  // Get low stock items
  getLowStockItems: async () => {
    return await apiRequest('/bills/low-stock');
  },

  // Get items with no movement
  getNoMovementItems: async () => {
    return await apiRequest('/bills/no-movement');
  },
};

// Health check
export const healthCheck = async () => {
  return await apiRequest('/health');
};

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };
