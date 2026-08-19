const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'An error occurred.');
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me/'),

  // Common Dropdowns
  getWarehouses: () => request('/common/warehouses/'),
  getProducts: () => request('/common/products/'),

  // Super Admin - Branches CRUD
  getAdminStats: () => request('/admin/stats/'),
  getAdminBranches: (page = 1, pageSize = 10) => request(`/admin/branches/?page=${page}&page_size=${pageSize}`),
  createBranch: (data) => request('/admin/branches/', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id, data) => request(`/admin/branches/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id) => request(`/admin/branches/${id}/`, { method: 'DELETE' }),

  // Super Admin - Users CRUD
  getAdminUsers: (page = 1, pageSize = 10) => request(`/admin/users/?page=${page}&page_size=${pageSize}`),
  createUser: (data) => request('/admin/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/admin/users/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/admin/users/${id}/`, { method: 'DELETE' }),

  // Super Admin - Products CRUD
  getAdminProducts: (page = 1, pageSize = 10) => request(`/admin/products/?page=${page}&page_size=${pageSize}`),
  createProduct: (data) => request('/admin/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/admin/products/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/admin/products/${id}/`, { method: 'DELETE' }),

  getAdminStock: (page = 1, pageSize = 10) => request(`/admin/stock/?page=${page}&page_size=${pageSize}`),
  getAdminLedger: (page = 1, pageSize = 10) => request(`/admin/ledger/?page=${page}&page_size=${pageSize}`),
  getAdminTransfers: (page = 1, pageSize = 10) => request(`/admin/transfers/?page=${page}&page_size=${pageSize}`),

  // Warehouse Manager
  getWarehouseStock: (page = 1, pageSize = 10) => request(`/warehouse/stock/?page=${page}&page_size=${pageSize}`),
  getWarehouseTransfers: (page = 1, pageSize = 10) => request(`/warehouse/transfers/?page=${page}&page_size=${pageSize}`),
  dispatchTransfer: (id) => request(`/warehouse/transfers/${id}/dispatch/`, { method: 'POST' }),
  adjustWarehouseStock: (productId, newQuantity, reason) => request('/warehouse/adjust-stock/', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, new_quantity: newQuantity, reason })
  }),
  getWarehouseLedger: (page = 1, pageSize = 10) => request(`/warehouse/ledger/?page=${page}&page_size=${pageSize}`),

  // Branch Manager
  getBranchStock: (page = 1, pageSize = 10) => request(`/branch/stock/?page=${page}&page_size=${pageSize}`),
  getBranchTransfers: (page = 1, pageSize = 10) => request(`/branch/transfers/?page=${page}&page_size=${pageSize}`),
  createTransferRequest: (fromBranchId, items) => request('/branch/transfers/', {
    method: 'POST',
    body: JSON.stringify({ from_branch: fromBranchId, items })
  }),
  receiveTransfer: (id) => request(`/branch/transfers/${id}/receive/`, { method: 'POST' }),
  getBranchLedger: (page = 1, pageSize = 10) => request(`/branch/ledger/?page=${page}&page_size=${pageSize}`),
};
