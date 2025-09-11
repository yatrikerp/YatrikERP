import { z } from 'zod';

export const routeSchema = z.object({
  routeNumber: z
    .string()
    .min(1, 'Route number is required')
    .max(20, 'Route number must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Route number must contain only uppercase letters and numbers'),
  
  routeName: z
    .string()
    .min(1, 'Route name is required')
    .max(100, 'Route name must be less than 100 characters'),
  
  startingPoint: z
    .string()
    .min(1, 'Starting point is required')
    .max(50, 'Starting point must be less than 50 characters'),
  
  endingPoint: z
    .string()
    .min(1, 'Ending point is required')
    .max(50, 'Ending point must be less than 50 characters'),
  
  distance: z
    .number()
    .min(1, 'Distance must be at least 1 km')
    .max(10000, 'Distance must be less than 10,000 km'),
  
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration must be less than 24 hours'),
  
  baseFare: z
    .number()
    .min(1, 'Base fare must be at least ₹1')
    .max(10000, 'Base fare must be less than ₹10,000'),
  
  type: z
    .enum(['deluxe', 'semi-deluxe', 'ordinary'], {
      errorMap: () => ({ message: 'Please select a valid route type' }),
    }),
  
  status: z
    .enum(['active', 'inactive', 'maintenance'], {
      errorMap: () => ({ message: 'Please select a valid status' }),
    }),
  
  features: z
    .array(z.string())
    .optional()
    .default([]),
  
  stops: z
    .array(
      z.object({
        name: z.string().min(1, 'Stop name is required'),
        distance: z.number().min(0, 'Distance cannot be negative'),
        fare: z.number().min(0, 'Fare cannot be negative'),
      })
    )
    .optional()
    .default([]),
  
  schedule: z
    .object({
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      frequency: z.number().min(1, 'Frequency must be at least 1'),
      days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    })
    .optional(),
});

export const bulkUpdateSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'maintenance', 'delete']),
  routes: z.array(z.string()).min(1, 'At least one route must be selected'),
});

export const searchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'maintenance']).optional(),
  type: z.enum(['all', 'deluxe', 'semi-deluxe', 'ordinary']).optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
});

// Helper functions
export const validateRoute = (data) => {
  try {
    return { success: true, data: routeSchema.parse(data) };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      }, {}),
    };
  }
};

export const validateBulkUpdate = (data) => {
  try {
    return { success: true, data: bulkUpdateSchema.parse(data) };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      }, {}),
    };
  }
};
