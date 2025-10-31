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
      const error = new Error(data.message || 'API request failed');
      error.response = { data };
      error.status = response.status;
      throw error;
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

  // Get selected store for current user
  getSelectedStore: async () => {
    return await apiRequest('/users/selected-store');
  },

  // Set selected store for current user
  setSelectedStore: async (storeId) => {
    return await apiRequest('/users/selected-store', {
      method: 'PUT',
      body: JSON.stringify({ storeId }),
    });
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

  // Get stock with batches
  getStockWithBatches: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/items/stock-with-batches?${queryString}` : '/items/stock-with-batches';
    return await apiRequest(endpoint);
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

// Suppliers API
export const suppliersAPI = {
  // Get all suppliers
  getSuppliers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return await apiRequest(endpoint);
  },

  // Get single supplier
  getSupplier: async (supplierId) => {
    return await apiRequest(`/suppliers/${supplierId}`);
  },

  // Create supplier
  createSupplier: async (supplierData) => {
    return await apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  // Update supplier
  updateSupplier: async (supplierId, supplierData) => {
    return await apiRequest(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  // Delete supplier
  deleteSupplier: async (supplierId) => {
    return await apiRequest(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    });
  },

  // Toggle supplier status
  toggleSupplierStatus: async (supplierId) => {
    return await apiRequest(`/suppliers/${supplierId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Add store to supplier
  addStoreToSupplier: async (supplierId, storeId) => {
    return await apiRequest(`/suppliers/${supplierId}/stores`, {
      method: 'POST',
      body: JSON.stringify({ storeId }),
    });
  },

  // Remove store from supplier
  removeStoreFromSupplier: async (supplierId, storeId) => {
    return await apiRequest(`/suppliers/${supplierId}/stores/${storeId}`, {
      method: 'DELETE',
    });
  },

  // Get all stores
  getStores: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/suppliers/stores?${queryString}` : '/suppliers/stores';
    return await apiRequest(endpoint);
  },

  // Create store
  createStore: async (storeData) => {
    return await apiRequest('/suppliers/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  },

  // Update store
  updateStore: async (storeId, storeData) => {
    return await apiRequest(`/suppliers/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  },

  // Delete store
  deleteStore: async (storeId) => {
    return await apiRequest(`/suppliers/stores/${storeId}`, {
      method: 'DELETE',
    });
  },
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  // Get all purchase orders
  getPurchaseOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/purchase-orders?${queryString}` : '/purchase-orders';
    return await apiRequest(endpoint);
  },

  // Get single purchase order
  getPurchaseOrder: async (poId) => {
    return await apiRequest(`/purchase-orders/${poId}`);
  },

  // Create purchase order
  createPurchaseOrder: async (poData) => {
    return await apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  // Update purchase order
  updatePurchaseOrder: async (poId, poData) => {
    return await apiRequest(`/purchase-orders/${poId}`, {
      method: 'PUT',
      body: JSON.stringify(poData),
    });
  },

  // Delete purchase order
  deletePurchaseOrder: async (poId) => {
    return await apiRequest(`/purchase-orders/${poId}`, {
      method: 'DELETE',
    });
  },

  // Receive purchase order (update stock)
  receivePurchaseOrder: async (poId, receivedItems = []) => {
    return await apiRequest(`/purchase-orders/${poId}/receive`, {
      method: 'PATCH',
      body: JSON.stringify({ receivedItems }),
    });
  },

  // Get barcodes for a purchase order
  getPurchaseOrderBarcodes: async (poId) => {
    return await apiRequest(`/purchase-orders/${poId}/barcodes`);
  },

  // Regenerate barcodes for a purchase order
  regeneratePurchaseOrderBarcodes: async (poId) => {
    return await apiRequest(`/purchase-orders/${poId}/regenerate-barcodes`, {
      method: 'POST',
    });
  },
};

// Barcodes API
export const barcodesAPI = {
  // Get item by barcode
  getItemByBarcode: async (barcode) => {
    return await apiRequest(`/barcodes/${barcode}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get dashboard statistics for selected store
  getDashboardStats: async () => {
    return await apiRequest('/dashboard/stats');
  },
};

// Health check
export const healthCheck = async () => {
  return await apiRequest('/health');
};

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };
