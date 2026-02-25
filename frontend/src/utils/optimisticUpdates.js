/**
 * Optimistic Update Utilities
 * 
 * This utility provides helper functions for implementing optimistic updates
 * across the application. Optimistic updates show instant UI feedback before
 * server confirmation, providing a better user experience.
 */

/**
 * Creates an optimistic update for an item in an array
 * @param {Array} items - Current array of items
 * @param {string|number} itemId - ID of the item to update
 * @param {Object} updates - Updates to apply
 * @returns {Array} Updated array with optimistic changes
 */
export const optimisticUpdateItem = (items, itemId, updates) => {
  return items.map(item => {
    const id = item._id || item.id;
    if (id === itemId || String(id) === String(itemId)) {
      return {
        ...item,
        ...updates,
        _isUpdating: true,
        _lastUpdated: Date.now()
      };
    }
    return item;
  });
};

/**
 * Creates an optimistic delete (removes item from array)
 * @param {Array} items - Current array of items
 * @param {string|number} itemId - ID of the item to remove
 * @returns {Array} Updated array without the deleted item
 */
export const optimisticDeleteItem = (items, itemId) => {
  return items.filter(item => {
    const id = item._id || item.id;
    return id !== itemId && String(id) !== String(itemId);
  });
};

/**
 * Creates an optimistic add (adds new item to array)
 * @param {Array} items - Current array of items
 * @param {Object} newItem - New item to add
 * @returns {Array} Updated array with new item
 */
export const optimisticAddItem = (items, newItem) => {
  return [
    {
      ...newItem,
      _id: newItem._id || `temp_${Date.now()}`,
      _isUpdating: true,
      _lastUpdated: Date.now()
    },
    ...items
  ];
};

/**
 * Reverts optimistic updates by refetching data
 * @param {Function} fetchFunction - Function to refetch data
 */
export const revertOptimisticUpdate = async (fetchFunction) => {
  try {
    await fetchFunction();
  } catch (error) {
    console.error('Error reverting optimistic update:', error);
  }
};

/**
 * Wraps an async action with optimistic updates
 * @param {Object} config - Configuration object
 * @param {Function} config.optimisticUpdate - Function to perform optimistic update
 * @param {Function} config.apiCall - Async function that makes the API call
 * @param {Function} config.onSuccess - Optional success callback
 * @param {Function} config.onError - Optional error callback
 * @param {Function} config.revertFunction - Function to revert on error
 * @returns {Promise} Promise that resolves when action completes
 */
export const withOptimisticUpdate = async ({
  optimisticUpdate,
  apiCall,
  onSuccess,
  onError,
  revertFunction
}) => {
  // Perform optimistic update immediately
  if (optimisticUpdate) {
    optimisticUpdate();
  }

  try {
    const result = await apiCall();
    
    if (result && (result.ok || result.success)) {
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } else {
      // Revert on API error
      if (revertFunction) {
        await revertOptimisticUpdate(revertFunction);
      }
      if (onError) {
        onError(result);
      }
      throw new Error(result?.message || 'Action failed');
    }
  } catch (error) {
    // Revert on exception
    if (revertFunction) {
      await revertOptimisticUpdate(revertFunction);
    }
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Updates numeric field optimistically
 * @param {Array} items - Current array of items
 * @param {string|number} itemId - ID of the item to update
 * @param {string} fieldPath - Dot-separated path to the field (e.g., 'stock.quantity')
 * @param {Function} updateFn - Function to calculate new value (receives current value)
 * @returns {Array} Updated array
 */
export const optimisticUpdateNumeric = (items, itemId, fieldPath, updateFn) => {
  return items.map(item => {
    const id = item._id || item.id;
    if (id === itemId || String(id) === String(itemId)) {
      const fieldParts = fieldPath.split('.');
      const currentValue = fieldParts.reduce((obj, part) => obj?.[part], item) || 0;
      const newValue = updateFn(currentValue);
      
      const updatedItem = { ...item };
      let target = updatedItem;
      for (let i = 0; i < fieldParts.length - 1; i++) {
        target[fieldParts[i]] = { ...target[fieldParts[i]] };
        target = target[fieldParts[i]];
      }
      target[fieldParts[fieldParts.length - 1]] = newValue;
      
      return {
        ...updatedItem,
        _isUpdating: true,
        _lastUpdated: Date.now()
      };
    }
    return item;
  });
};
