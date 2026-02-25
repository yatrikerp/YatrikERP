const Policy = require('../models/Policy');
const PolicyOverride = require('../models/PolicyOverride');

/**
 * Policy Engine Service
 * Handles dynamic policy evaluation and enforcement
 */
class PolicyEngine {
  /**
   * Get all active policies for a given context
   */
  async getActivePolicies(context = {}) {
    const now = new Date();
    
    // Get active policies
    const policies = await Policy.find({
      isActive: true,
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ]
    })
    .sort({ priority: -1 })
    .lean();

    // Get active policy overrides
    const overrides = await PolicyOverride.find({
      isActive: true,
      status: 'active',
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
    .sort({ createdAt: -1 })
    .lean();

    return { policies, overrides };
  }

  /**
   * Evaluate fare calculation with policies
   */
  async evaluateFare(baseFare, context) {
    const { policies, overrides } = await this.getActivePolicies(context);
    
    let finalFare = baseFare;
    let appliedPolicies = [];

    // Apply policy overrides first (they have higher priority)
    for (const override of overrides) {
      if (override.policyType === 'fare_override') {
        if (this.matchesScope(override, context)) {
          const params = override.parameters.fareOverride;
          if (params.type === 'percentage') {
            finalFare = finalFare * (1 + params.value / 100);
          } else if (params.type === 'flat') {
            finalFare = finalFare + params.value;
          }
          appliedPolicies.push({
            type: 'override',
            name: override.policyName,
            effect: `${params.type}: ${params.value}`
          });
        }
      }
    }

    // Apply regular policies
    for (const policy of policies) {
      if (policy.policyType === 'fare' && this.matchesScope(policy, context)) {
        const result = this.evaluatePolicyRules(policy, context);
        if (result && result.fareAdjustment) {
          finalFare = this.applyFareAdjustment(finalFare, result.fareAdjustment);
          appliedPolicies.push({
            type: 'policy',
            name: policy.policyName,
            effect: result.fareAdjustment
          });
        }
      }
    }

    // Ensure fare is not negative
    finalFare = Math.max(0, finalFare);

    return {
      baseFare,
      finalFare: Math.round(finalFare * 100) / 100, // Round to 2 decimals
      appliedPolicies
    };
  }

  /**
   * Evaluate student concession
   */
  async evaluateStudentConcession(context) {
    const { overrides } = await this.getActivePolicies(context);
    
    // Check for student concession override
    for (const override of overrides) {
      if (override.policyType === 'student_concession') {
        if (this.matchesScope(override, context)) {
          return {
            enabled: override.parameters.studentConcession.enabled,
            percentage: override.parameters.studentConcession.percentage
          };
        }
      }
    }

    // Check regular policies
    const { policies } = await this.getActivePolicies(context);
    for (const policy of policies) {
      if (policy.policyType === 'concession' && this.matchesScope(policy, context)) {
        const result = this.evaluatePolicyRules(policy, context);
        if (result && result.concession) {
          return result.concession;
        }
      }
    }

    // Default: no concession
    return {
      enabled: false,
      percentage: 0
    };
  }

  /**
   * Check if festival free travel is enabled
   */
  async isFestivalFreeTravelEnabled(context) {
    const { overrides } = await this.getActivePolicies(context);
    
    for (const override of overrides) {
      if (override.policyType === 'festival_free_travel') {
        if (this.matchesScope(override, context)) {
          return override.parameters.festivalFreeTravel.enabled;
        }
      }
    }

    return false;
  }

  /**
   * Check if emergency override mode is active
   */
  async isEmergencyModeActive(context) {
    const { overrides } = await this.getActivePolicies(context);
    
    for (const override of overrides) {
      if (override.policyType === 'emergency_override') {
        if (this.matchesScope(override, context)) {
          return override.parameters.emergencyMode.enabled;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate booking eligibility
   */
  async evaluateBookingEligibility(context) {
    const { policies } = await this.getActivePolicies(context);
    
    for (const policy of policies) {
      if (policy.policyType === 'booking' && this.matchesScope(policy, context)) {
        const result = this.evaluatePolicyRules(policy, context);
        if (result && result.eligible === false) {
          return {
            eligible: false,
            reason: result.reason || 'Policy restriction'
          };
        }
      }
    }

    return { eligible: true };
  }

  /**
   * Check if scope matches context
   */
  matchesScope(policyOrOverride, context) {
    if (policyOrOverride.scope === 'statewide') {
      return true;
    }

    if (policyOrOverride.scope === 'route' && context.routeId) {
      return policyOrOverride.scopeIds.length === 0 || 
             policyOrOverride.scopeIds.some(id => id.toString() === context.routeId.toString());
    }

    if (policyOrOverride.scope === 'depot' && context.depotId) {
      return policyOrOverride.scopeIds.length === 0 || 
             policyOrOverride.scopeIds.some(id => id.toString() === context.depotId.toString());
    }

    if (policyOrOverride.scope === 'trip' && context.tripId) {
      return policyOrOverride.scopeIds.length === 0 || 
             policyOrOverride.scopeIds.some(id => id.toString() === context.tripId.toString());
    }

    return false;
  }

  /**
   * Evaluate policy rules against context
   */
  evaluatePolicyRules(policy, context) {
    // This is a simplified evaluation
    // In production, you'd use a proper rules engine
    
    if (!policy.rules || typeof policy.rules !== 'object') {
      return null;
    }

    // Check conditions
    if (policy.rules.condition) {
      const conditionMet = this.evaluateCondition(policy.rules.condition, context);
      if (!conditionMet) {
        return null;
      }
    }

    // Return action result
    return policy.rules.action || null;
  }

  /**
   * Evaluate a condition
   */
  evaluateCondition(condition, context) {
    if (!condition.field || !condition.operator || condition.value === undefined) {
      return true; // Invalid condition, default to true
    }

    const fieldValue = this.getNestedValue(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return true;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current && current[prop], obj);
  }

  /**
   * Apply fare adjustment
   */
  applyFareAdjustment(fare, adjustment) {
    if (typeof adjustment === 'number') {
      return fare + adjustment;
    }
    if (adjustment.type === 'percentage') {
      return fare * (1 + adjustment.value / 100);
    }
    if (adjustment.type === 'flat') {
      return fare + adjustment.value;
    }
    return fare;
  }
}

module.exports = new PolicyEngine();
