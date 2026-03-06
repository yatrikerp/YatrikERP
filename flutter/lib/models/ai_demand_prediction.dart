class DemandPrediction {
  final String id;
  final String routeId;
  final DateTime predictionDate;
  final String timeSlot;
  final int predictedPassengers;
  final double confidenceScore;
  final HistoricalData historicalData;
  final ContextFactors contextFactors;
  final String demandLevel;
  final Recommendations recommendations;
  final ActualData? actualData;

  DemandPrediction({
    required this.id,
    required this.routeId,
    required this.predictionDate,
    required this.timeSlot,
    required this.predictedPassengers,
    required this.confidenceScore,
    required this.historicalData,
    required this.contextFactors,
    required this.demandLevel,
    required this.recommendations,
    this.actualData,
  });

  factory DemandPrediction.fromJson(Map<String, dynamic> json) {
    return DemandPrediction(
      id: json['_id'] ?? '',
      routeId: json['routeId'] ?? '',
      predictionDate: DateTime.parse(json['predictionDate']),
      timeSlot: json['timeSlot'] ?? '',
      predictedPassengers: json['predictedPassengers'] ?? 0,
      confidenceScore: (json['confidenceScore'] ?? 0).toDouble(),
      historicalData: HistoricalData.fromJson(json['historicalData'] ?? {}),
      contextFactors: ContextFactors.fromJson(json['contextFactors'] ?? {}),
      demandLevel: json['demandLevel'] ?? 'medium',
      recommendations: Recommendations.fromJson(json['recommendations'] ?? {}),
      actualData: json['actualData'] != null 
          ? ActualData.fromJson(json['actualData']) 
          : null,
    );
  }
}

class HistoricalData {
  final int avgPassengersLast7Days;
  final int avgPassengersLast30Days;
  final int sameWeekdayAverage;
  final double seasonalFactor;

  HistoricalData({
    required this.avgPassengersLast7Days,
    required this.avgPassengersLast30Days,
    required this.sameWeekdayAverage,
    required this.seasonalFactor,
  });

  factory HistoricalData.fromJson(Map<String, dynamic> json) {
    return HistoricalData(
      avgPassengersLast7Days: json['avgPassengersLast7Days'] ?? 0,
      avgPassengersLast30Days: json['avgPassengersLast30Days'] ?? 0,
      sameWeekdayAverage: json['sameWeekdayAverage'] ?? 0,
      seasonalFactor: (json['seasonalFactor'] ?? 1.0).toDouble(),
    );
  }
}

class ContextFactors {
  final String dayOfWeek;
  final bool isWeekend;
  final bool isHoliday;
  final bool isPeakHour;

  ContextFactors({
    required this.dayOfWeek,
    required this.isWeekend,
    required this.isHoliday,
    required this.isPeakHour,
  });

  factory ContextFactors.fromJson(Map<String, dynamic> json) {
    return ContextFactors(
      dayOfWeek: json['dayOfWeek'] ?? '',
      isWeekend: json['isWeekend'] ?? false,
      isHoliday: json['isHoliday'] ?? false,
      isPeakHour: json['isPeakHour'] ?? false,
    );
  }
}

class Recommendations {
  final int recommendedBuses;
  final String recommendedBusType;
  final int recommendedFrequency;

  Recommendations({
    required this.recommendedBuses,
    required this.recommendedBusType,
    required this.recommendedFrequency,
  });

  factory Recommendations.fromJson(Map<String, dynamic> json) {
    return Recommendations(
      recommendedBuses: json['recommendedBuses'] ?? 1,
      recommendedBusType: json['recommendedBusType'] ?? 'ordinary',
      recommendedFrequency: json['recommendedFrequency'] ?? 60,
    );
  }
}

class ActualData {
  final int actualPassengers;
  final int accuracy;
  final int error;

  ActualData({
    required this.actualPassengers,
    required this.accuracy,
    required this.error,
  });

  factory ActualData.fromJson(Map<String, dynamic> json) {
    return ActualData(
      actualPassengers: json['actualPassengers'] ?? 0,
      accuracy: json['accuracy'] ?? 0,
      error: json['error'] ?? 0,
    );
  }
}
