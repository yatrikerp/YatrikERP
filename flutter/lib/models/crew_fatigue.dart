class CrewFatigue {
  final String id;
  final String crewId;
  final String crewType;
  final String depotId;
  final DateTime date;
  final int fatigueScore;
  final EligibilityStatus eligibilityStatus;
  final FatigueFactors fatigueFactors;

  CrewFatigue({
    required this.id,
    required this.crewId,
    required this.crewType,
    required this.depotId,
    required this.date,
    required this.fatigueScore,
    required this.eligibilityStatus,
    required this.fatigueFactors,
  });

  factory CrewFatigue.fromJson(Map<String, dynamic> json) {
    return CrewFatigue(
      id: json['_id'] ?? '',
      crewId: json['crewId'] ?? '',
      crewType: json['crewType'] ?? '',
      depotId: json['depotId'] ?? '',
      date: DateTime.parse(json['date']),
      fatigueScore: json['fatigueScore'] ?? 0,
      eligibilityStatus: EligibilityStatus.fromJson(json['eligibilityStatus'] ?? {}),
      fatigueFactors: FatigueFactors.fromJson(json['fatigueFactors'] ?? {}),
    );
  }
}

class EligibilityStatus {
  final bool isEligible;
  final String reason;

  EligibilityStatus({
    required this.isEligible,
    required this.reason,
  });

  factory EligibilityStatus.fromJson(Map<String, dynamic> json) {
    return EligibilityStatus(
      isEligible: json['isEligible'] ?? false,
      reason: json['reason'] ?? '',
    );
  }
}

class FatigueFactors {
  final int consecutiveDays;
  final double totalHoursLast7Days;
  final int tripsLast24Hours;
  final double restHoursSinceLastTrip;

  FatigueFactors({
    required this.consecutiveDays,
    required this.totalHoursLast7Days,
    required this.tripsLast24Hours,
    required this.restHoursSinceLastTrip,
  });

  factory FatigueFactors.fromJson(Map<String, dynamic> json) {
    return FatigueFactors(
      consecutiveDays: json['consecutiveDays'] ?? 0,
      totalHoursLast7Days: (json['totalHoursLast7Days'] ?? 0).toDouble(),
      tripsLast24Hours: json['tripsLast24Hours'] ?? 0,
      restHoursSinceLastTrip: (json['restHoursSinceLastTrip'] ?? 0).toDouble(),
    );
  }
}
