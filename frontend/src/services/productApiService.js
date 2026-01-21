import { apiFetch } from '../utils/api';

const productApiService = {
  // Product Catalog
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/products?${queryString}` : '/api/products';
    return await apiFetch(url);
  },

  async getProduct(productId) {
    return await apiFetch(`/api/products/${productId}`);
  },

  // Vendor Product Management
  async createProduct(productData) {
    return await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(productId, updates) {
    return await apiFetch(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProduct(productId) {
    return await apiFetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  },

  async getMyProducts() {
    return await apiFetch('/api/products/vendor/my-products');
  },

  // Cart Management
  async getCart() {
    return await apiFetch('/api/cart');
  },

  async addToCart(productId, quantity = 1) {
    return await apiFetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async updateCartItem(itemId, quantity) {
    return await apiFetch(`/api/cart/update/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async removeFromCart(itemId) {
    return await apiFetch(`/api/cart/remove/${itemId}`, {
      method: 'DELETE',
    });
  },

  async clearCart() {
    return await apiFetch('/api/cart/clear', {
      method: 'DELETE',
    });
  },

  async updateShippingAddress(address) {
    return await apiFetch('/api/cart/shipping', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },

  // Orders
  async createOrder() {
    return await apiFetch('/api/orders/create', {
      method: 'POST',
    });
  },

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/orders?${queryString}` : '/api/orders';
    return await apiFetch(url);
  },

  async getOrder(orderId) {
    return await apiFetch(`/api/orders/${orderId}`);
  },
};

export default productApiService;
