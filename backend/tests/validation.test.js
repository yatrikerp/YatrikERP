// Comprehensive Validation Tests
// Testing all validation rules and edge cases

const request = require('supertest');
const { userValidations, handleValidationErrors } = require('../middleware/validation');

describe('Validation System Tests', () => {
  describe('User Registration Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(5); // name, email, phone, password, role
    });

    it('should validate name format', async () => {
      const testCases = [
        { name: 'A', expectedError: 'Name must be between 2 and 50 characters' },
        { name: 'A'.repeat(51), expectedError: 'Name must be between 2 and 50 characters' },
        { name: 'John123', expectedError: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' },
        { name: 'John@Doe', expectedError: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' },
        { name: 'John Doe', expectedError: null }, // Valid
        { name: 'Mary-Jane', expectedError: null }, // Valid
        { name: "O'Connor", expectedError: null }, // Valid
        { name: 'Dr. Smith', expectedError: null } // Valid
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: testCase.name,
            email: 'test@example.com',
            phone: '9876543210',
            password: 'ValidPass123!',
            role: 'passenger'
          });

        if (testCase.expectedError) {
          expect(response.status).toBe(400);
          expect(response.body.errors.some(e => e.message === testCase.expectedError)).toBe(true);
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    });

    it('should validate email format', async () => {
      const testCases = [
        { email: 'invalid-email', expectedError: 'Please enter a valid email address' },
        { email: '@example.com', expectedError: 'Please enter a valid email address' },
        { email: 'test@', expectedError: 'Please enter a valid email address' },
        { email: 'test@example', expectedError: 'Please enter a valid email address' },
        { email: 'test@example.com', expectedError: null }, // Valid
        { email: 'user.name@domain.co.uk', expectedError: null }, // Valid
        { email: 'user+tag@example.org', expectedError: null } // Valid
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: testCase.email,
            phone: '9876543210',
            password: 'ValidPass123!',
            role: 'passenger'
          });

        if (testCase.expectedError) {
          expect(response.status).toBe(400);
          expect(response.body.errors.some(e => e.message === testCase.expectedError)).toBe(true);
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    });

    it('should validate phone number format', async () => {
      const testCases = [
        { phone: '123', expectedError: 'Phone number must be 7-15 digits, optionally starting with +' },
        { phone: '1234567890123456', expectedError: 'Phone number must be 7-15 digits, optionally starting with +' },
        { phone: 'abc123def', expectedError: 'Phone number must be 7-15 digits, optionally starting with +' },
        { phone: '9876543210', expectedError: null }, // Valid
        { phone: '+919876543210', expectedError: null }, // Valid
        { phone: '1234567', expectedError: null } // Valid
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            phone: testCase.phone,
            password: 'ValidPass123!',
            role: 'passenger'
          });

        if (testCase.expectedError) {
          expect(response.status).toBe(400);
          expect(response.body.errors.some(e => e.message === testCase.expectedError)).toBe(true);
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    });

    it('should validate password strength', async () => {
      const testCases = [
        { password: 'weak', expectedError: 'Password must be between 8 and 128 characters' },
        { password: 'A'.repeat(129), expectedError: 'Password must be between 8 and 128 characters' },
        { password: 'password123', expectedError: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { password: 'PASSWORD123', expectedError: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { password: 'Password123', expectedError: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { password: 'ValidPass123!', expectedError: null }, // Valid
        { password: 'Str0ng#Pass', expectedError: null }, // Valid
        { password: 'MyP@ssw0rd', expectedError: null } // Valid
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
            password: testCase.password,
            confirmPassword: testCase.password,
            role: 'passenger'
          });

        if (testCase.expectedError) {
          expect(response.status).toBe(400);
          expect(response.body.errors.some(e => e.message === testCase.expectedError)).toBe(true);
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    });

    it('should validate password confirmation', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '9876543210',
          password: 'ValidPass123!',
          confirmPassword: 'DifferentPass123!',
          role: 'passenger'
        })
        .expect(400);

      expect(response.body.errors.some(e => e.message === 'Passwords do not match')).toBe(true);
    });

    it('should validate role selection', async () => {
      const testCases = [
        { role: 'invalid_role', expectedError: 'Invalid role selected' },
        { role: 'ADMIN', expectedError: 'Invalid role selected' },
        { role: 'passenger', expectedError: null }, // Valid
        { role: 'conductor', expectedError: null }, // Valid
        { role: 'driver', expectedError: null }, // Valid
        { role: 'depot_manager', expectedError: null }, // Valid
        { role: 'admin', expectedError: null } // Valid
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
            role: testCase.role
          });

        if (testCase.expectedError) {
          expect(response.status).toBe(400);
          expect(response.body.errors.some(e => e.message === testCase.expectedError)).toBe(true);
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    });
  });

  describe('User Login Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(2); // email, password
    });

    it('should validate email format for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.errors.some(e => e.message === 'Please enter a valid email address')).toBe(true);
    });

    it('should validate password presence for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: ''
        })
        .expect(400);

      expect(response.body.errors.some(e => e.message === 'Password is required')).toBe(true);
    });
  });

  describe('Validation Middleware', () => {
    it('should handle validation errors correctly', () => {
      const req = {
        body: {},
        validationResult: () => ({
          isEmpty: () => false,
          array: () => [
            { path: 'name', msg: 'Name is required', value: '' },
            { path: 'email', msg: 'Email is required', value: '' }
          ]
        })
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Name is required', value: '' },
          { field: 'email', message: 'Email is required', value: '' }
        ]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when validation passes', () => {
      const req = {
        validationResult: () => ({
          isEmpty: () => true,
          array: () => []
        })
      };

      const res = {};
      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>",
        "admin'--",
        "'; UPDATE users SET role='admin' WHERE id=1; --"
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: maliciousInput,
            email: maliciousInput,
            phone: maliciousInput,
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
            role: 'passenger'
          });

        // Should fail validation, not cause server errors
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle extremely long inputs', async () => {
      const longInput = 'A'.repeat(1000);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: longInput,
          email: 'test@example.com',
          phone: '9876543210',
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          role: 'passenger'
        })
        .expect(400);

      expect(response.body.errors.some(e => e.message.includes('between 2 and 50 characters'))).toBe(true);
    });

    it('should handle special characters in inputs', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: specialChars,
          email: 'test@example.com',
          phone: '9876543210',
          password: 'ValidPass123!',
          confirmPassword: 'ValidPass123!',
          role: 'passenger'
        })
        .expect(400);

      expect(response.body.errors.some(e => e.message.includes('letters, spaces, hyphens, apostrophes, and periods'))).toBe(true);
    });
  });
});
