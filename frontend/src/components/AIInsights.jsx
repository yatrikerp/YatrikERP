import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, AlertCircle, Lightbulb, 
  Target, Clock, DollarSign, Shield, Zap,
  ChevronRight, Info
} from 'lucide-react';

const AIInsights = ({ insights = {} }) => {
  const { recommendations = [], predictions = [], anomalies = [] } = insights;

  const getIcon = (type) => {
    switch (type) {
      case 'optimization': return <Target className="w-5 h-5" />;
      case 'maintenance': return <Shield className="w-5 h-5" />;
      case 'cost': return <DollarSign className="w-5 h-5" />;
      case 'efficiency': return <Zap className="w-5 h-5" />;
      case 'safety': return <AlertCircle className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          AI Recommendations
        </h4>
        <div className="space-y-2">
          <AnimatePresence>
            {recommendations.slice(0, 3).map((rec, index) => (
              <motion.div
                key={rec.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                    {getIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                    {rec.impact && (
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-green-600 font-medium">
                          Impact: {rec.impact}
                        </span>
                        {rec.savings && (
                          <span className="text-blue-600">
                            Savings: ${rec.savings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Predictions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Predictive Analytics
        </h4>
        <div className="space-y-2">
          {predictions.slice(0, 2).map((pred, index) => (
            <div
              key={pred.id || index}
              className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{pred.metric}</span>
                <span className={`text-xs font-bold ${
                  pred.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pred.trend === 'up' ? '↑' : '↓'} {pred.change}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pred.confidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {pred.prediction} (Confidence: {pred.confidence}%)
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Anomaly Detection
          </h4>
          <div className="space-y-2">
            {anomalies.slice(0, 2).map((anomaly, index) => (
              <div
                key={anomaly.id || index}
                className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{anomaly.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{anomaly.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Severity: {anomaly.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(anomaly.detected).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Next Update</span>
          </div>
          <p className="text-lg font-bold text-blue-800 mt-1">5 min</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <Brain className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">AI Accuracy</span>
          </div>
          <p className="text-lg font-bold text-green-800 mt-1">94.5%</p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;

