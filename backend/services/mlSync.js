const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * ML Analytics Service
 * Communicates with Flask ML microservice
 */

class MLService {
  constructor() {
    this.baseURL = ML_SERVICE_URL;
    this.timeout = 300000; // 5 minutes for model training
  }

  /**
   * Check ML service health
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      throw new Error(`ML service health check failed: ${error.message}`);
    }
  }

  /**
   * Run all ML models
   */
  async runAllModels() {
    try {
      const response = await axios.post(`${this.baseURL}/run_all`, {}, {
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to run all models: ${error.message}`);
    }
  }

  /**
   * Run specific ML model
   */
  async runModel(modelName) {
    try {
      const response = await axios.post(`${this.baseURL}/run/${modelName}`, {}, {
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to run model ${modelName}: ${error.message}`);
    }
  }

  /**
   * Get metrics for specific model
   */
  async getModelMetrics(modelName) {
    try {
      const response = await axios.get(`${this.baseURL}/metrics/${modelName}`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get metrics for ${modelName}: ${error.message}`);
    }
  }

  /**
   * Get all model metrics
   */
  async getAllMetrics() {
    try {
      const response = await axios.get(`${this.baseURL}/metrics/all`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get all metrics: ${error.message}`);
    }
  }

  /**
   * Get model comparison
   */
  async getComparison() {
    try {
      const response = await axios.get(`${this.baseURL}/comparison`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get model comparison: ${error.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }
}

module.exports = new MLService();
