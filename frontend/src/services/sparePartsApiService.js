import { apiFetch } from '../utils/api';

const sparePartsApiService = {
  // Get all spare parts with filters
  async getSpareParts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/spare-parts?${queryString}` : '/api/spare-parts';
    return await apiFetch(url);
  },

  // Get single spare part by ID
  async getSparePart(sparePartId) {
    return await apiFetch(`/api/spare-parts/${sparePartId}`);
  },

  // Add spare part to cart (converts spare part to product-like item)
  async addSparePartToCart(sparePartId, quantity = 1) {
    // First get the spare part details
    const sparePartResponse = await this.getSparePart(sparePartId);
    if (!sparePartResponse.success) {
      return sparePartResponse;
    }

    const sparePart = sparePartResponse.data.sparePart;
    
    // Create a product-like object from spare part for cart
    // Note: This will require backend support to add spare parts to cart
    // For now, we'll use the product API with spare part data
    // In a real implementation, you'd want a dedicated endpoint for this
    
    // This is a workaround - in production, create a dedicated endpoint
    // POST /api/cart/add-spare-part
    return await apiFetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        sparePartId: sparePart._id,
        productId: null, // Will be handled by backend
        partName: sparePart.partName,
        partNumber: sparePart.partNumber,
        quantity,
        unitPrice: sparePart.basePrice
      }),
    });
  }
};

export default sparePartsApiService;
