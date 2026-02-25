class Trip {
  final String id;
  final String routeName;
  final String routeNumber;
  final String from;
  final String to;
  final String departureTime;
  final String arrivalTime;
  final double fare;
  final int availableSeats;
  final int totalSeats;
  final String busType;
  final String busNumber;
  final String status;
  final DateTime serviceDate;
  final String? duration;
  final int? occupancyRate;

  Trip({
    required this.id,
    required this.routeName,
    required this.routeNumber,
    required this.from,
    required this.to,
    required this.departureTime,
    required this.arrivalTime,
    required this.fare,
    required this.availableSeats,
    required this.totalSeats,
    required this.busType,
    required this.busNumber,
    required this.status,
    required this.serviceDate,
    this.duration,
    this.occupancyRate,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'] ?? json['_id'] ?? '',
      routeName: json['routeName'] ?? 'Unknown Route',
      routeNumber: json['routeNumber'] ?? 'N/A',
      from: json['from'] ?? 'Unknown',
      to: json['to'] ?? 'Unknown',
      departureTime: json['departureTime'] ?? json['startTime'] ?? 'N/A',
      arrivalTime: json['arrivalTime'] ?? json['endTime'] ?? 'N/A',
      fare: (json['fare'] ?? 0).toDouble(),
      availableSeats: json['availableSeats'] ?? 0,
      totalSeats: json['totalSeats'] ?? json['capacity'] ?? 0,
      busType: json['busType'] ?? 'Standard',
      busNumber: json['busNumber'] ?? 'N/A',
      status: json['status'] ?? 'scheduled',
      serviceDate: DateTime.parse(json['serviceDate'] ?? DateTime.now().toIso8601String()),
      duration: json['duration'],
      occupancyRate: json['occupancyRate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'routeName': routeName,
      'routeNumber': routeNumber,
      'from': from,
      'to': to,
      'departureTime': departureTime,
      'arrivalTime': arrivalTime,
      'fare': fare,
      'availableSeats': availableSeats,
      'totalSeats': totalSeats,
      'busType': busType,
      'busNumber': busNumber,
      'status': status,
      'serviceDate': serviceDate.toIso8601String(),
      'duration': duration,
      'occupancyRate': occupancyRate,
    };
  }
}
