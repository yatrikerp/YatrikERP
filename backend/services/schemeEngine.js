/**
 * Scheme Engine Service
 * Handles bulk pricing, discounts, and offers for cart items
 */

class SchemeEngine {
  /**
   * Calculate bulk price based on quantity slabs
   * @param {Number} basePrice - Base unit price
   * @param {Number} quantity - Quantity ordered
   * @param {Array} priceSlabs - Price slabs [{minQty, price}]
   * @returns {Number} - Best applicable price
   */
  static calculateBulkPrice(basePrice, quantity, priceSlabs = []) {
    if (!priceSlabs || priceSlabs.length === 0) {
      return basePrice;
    }

    // Sort slabs by minQty descending
    const sortedSlabs = [...priceSlabs].sort((a, b) => b.minQty - a.minQty);

    // Find applicable slab
    for (const slab of sortedSlabs) {
      if (quantity >= slab.minQty) {
        return slab.price;
      }
    }

    return basePrice;
  }

  /**
   * Apply Buy X Get Y Free scheme
   * @param {Number} quantity - Quantity ordered
   * @param {Number} buyX - Buy X items
   * @param {Number} getY - Get Y free
   * @returns {Object} - {effectiveQuantity, freeQuantity, discountAmount}
   */
  static applyBuyXGetY(quantity, buyX, getY) {
    if (!buyX || !getY || buyX <= 0 || getY <= 0) {
      return { effectiveQuantity: quantity, freeQuantity: 0, discountAmount: 0 };
    }

    const sets = Math.floor(quantity / (buyX + getY));
    const freeQuantity = sets * getY;
    const effectiveQuantity = quantity - freeQuantity;

    return {
      effectiveQuantity,
      freeQuantity,
      discountAmount: freeQuantity
    };
  }

  /**
   * Apply quantity-based discount
   * @param {Number} subtotal - Subtotal amount
   * @param {Number} quantity - Quantity ordered
   * @param {Array} discountSlabs - Discount slabs [{minQty, discountPercent}]
   * @returns {Object} - {discountPercent, discountAmount, finalAmount}
   */
  static applyQuantityDiscount(subtotal, quantity, discountSlabs = []) {
    if (!discountSlabs || discountSlabs.length === 0) {
      return { discountPercent: 0, discountAmount: 0, finalAmount: subtotal };
    }

    // Sort slabs by minQty descending
    const sortedSlabs = [...discountSlabs].sort((a, b) => b.minQty - a.minQty);

    // Find applicable discount
    for (const slab of sortedSlabs) {
      if (quantity >= slab.minQty) {
        const discountAmount = (subtotal * slab.discountPercent) / 100;
        return {
          discountPercent: slab.discountPercent,
          discountAmount,
          finalAmount: subtotal - discountAmount
        };
      }
    }

    return { discountPercent: 0, discountAmount: 0, finalAmount: subtotal };
  }

  /**
   * Calculate GST (Goods and Services Tax)
   * @param {Number} amount - Taxable amount
   * @param {Number} taxRate - GST rate (e.g., 18 for 18%)
   * @returns {Object} - {cgst, sgst, igst, totalTax}
   */
  static calculateGST(amount, taxRate = 18, state = null, shippingState = null) {
    // If same state, apply CGST + SGST, else IGST
    const isInterState = state && shippingState && state !== shippingState;
    
    const totalTax = (amount * taxRate) / 100;
    
    if (isInterState) {
      // Inter-state: IGST
      return {
        cgst: 0,
        sgst: 0,
        igst: totalTax,
        totalTax
      };
    } else {
      // Intra-state: CGST + SGST
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      return {
        cgst,
        sgst,
        igst: 0,
        totalTax
      };
    }
  }

  /**
   * Apply scheme to cart item
   * @param {Object} item - Cart item
   * @param {Object} product - Product details
   * @param {Object} vendor - Vendor details
   * @returns {Object} - Enhanced item with scheme applied
   */
  static applyScheme(item, product = {}, vendor = {}) {
    const quantity = item.quantity || 1;
    let unitPrice = item.unitPrice || product.finalPrice || product.basePrice || 0;
    let subtotal = unitPrice * quantity;
    let schemeDiscount = 0;
    let schemeInfo = null;

    // Apply bulk pricing if available
    if (product.bulkPricing && product.bulkPricing.priceSlabs) {
      const bulkPrice = this.calculateBulkPrice(unitPrice, quantity, product.bulkPricing.priceSlabs);
      unitPrice = bulkPrice;
      subtotal = bulkPrice * quantity;
      schemeInfo = {
        type: 'bulk_pricing',
        appliedSlab: product.bulkPricing.priceSlabs.find(s => quantity >= s.minQty)
      };
    }

    // Apply Buy X Get Y Free if available
    if (product.schemes && product.schemes.buyXGetY) {
      const { buyX, getY } = product.schemes.buyXGetY;
      const buyXGetYResult = this.applyBuyXGetY(quantity, buyX, getY);
      if (buyXGetYResult.freeQuantity > 0) {
        schemeDiscount = buyXGetYResult.freeQuantity * unitPrice;
        schemeInfo = {
          type: 'buy_x_get_y',
          buyX,
          getY,
          freeQuantity: buyXGetYResult.freeQuantity,
          message: `Buy ${buyX} Get ${getY} Free`
        };
      }
    }

    // Apply quantity discount if available
    if (product.schemes && product.schemes.quantityDiscount) {
      const discountResult = this.applyQuantityDiscount(
        subtotal - schemeDiscount,
        quantity,
        product.schemes.quantityDiscount.slabs
      );
      if (discountResult.discountAmount > 0) {
        schemeDiscount += discountResult.discountAmount;
        if (!schemeInfo) {
          schemeInfo = {
            type: 'quantity_discount',
            discountPercent: discountResult.discountPercent
          };
        }
      }
    }

    const finalSubtotal = subtotal - schemeDiscount;
    const taxRate = item.taxRate || product.taxRate || 18;
    
    // Calculate GST
    const gst = this.calculateGST(finalSubtotal, taxRate);
    
    const taxAmount = gst.totalTax;
    const total = finalSubtotal + taxAmount;

    return {
      ...item,
      unitPrice,
      subtotal: finalSubtotal,
      originalSubtotal: subtotal,
      schemeDiscount,
      schemeInfo,
      taxRate,
      taxAmount,
      gst,
      total
    };
  }
}

module.exports = SchemeEngine;
