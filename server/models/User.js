// User model
// In a real application, this would be a database schema

class User {
  constructor(id, name, email, password) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password; // In a real app, this would be hashed
    this.createdAt = new Date();
  }

  // Static method to validate user data
  static validate(userData) {
    const { name, email, password } = userData;
    const errors = {};

    if (!name || name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Helper method to validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = User;