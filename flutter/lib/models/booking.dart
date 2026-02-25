class Booking {
  final String id;
  final String bookingId;
  final String pnr;
  final String status;
  final Customer customer;
  final Journey journey;
  final List<Seat> seats;
  final Pricing pricing;
  final Payment? payment;
  final DateTime createdAt;

  Booking({
    required this.id,
    required this.bookingId,
    required this.pnr,
    required this.status,
    required this.customer,
    required this.journey,
    required this.seats,
    required this.pricing,
    this.payment,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? json['_id'] ?? '',
      bookingId: json['bookingId'] ?? '',
      pnr: json['pnr'] ?? json['bookingId'] ?? '',
      status: json['status'] ?? 'pending',
      customer: Customer.fromJson(json['customer'] ?? {}),
      journey: Journey.fromJson(json['journey'] ?? {}),
      seats: (json['seats'] as List?)?.map((s) => Seat.fromJson(s)).toList() ?? [],
      pricing: Pricing.fromJson(json['pricing'] ?? {}),
      payment: json['payment'] != null ? Payment.fromJson(json['payment']) : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': bookingId,
      'pnr': pnr,
      'status': status,
      'customer': customer.toJson(),
      'journey': journey.toJson(),
      'seats': seats.map((s) => s.toJson()).toList(),
      'pricing': pricing.toJson(),
      'payment': payment?.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Customer {
  final String name;
  final String email;
  final String phone;
  final int? age;
  final String? gender;

  Customer({
    required this.name,
    required this.email,
    required this.phone,
    this.age,
    this.gender,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      age: json['age'],
      gender: json['gender'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'email': email,
      'phone': phone,
      'age': age,
      'gender': gender,
    };
  }
}

class Journey {
  final String from;
  final String to;
  final DateTime departureDate;
  final String departureTime;
  final String? arrivalTime;
  final String? boardingPoint;
  final String? droppingPoint;

  Journey({
    required this.from,
    required this.to,
    required this.departureDate,
    required this.departureTime,
    this.arrivalTime,
    this.boardingPoint,
    this.droppingPoint,
  });

  factory Journey.fromJson(Map<String, dynamic> json) {
    return Journey(
      from: json['from'] ?? '',
      to: json['to'] ?? '',
      departureDate: DateTime.parse(json['departureDate'] ?? DateTime.now().toIso8601String()),
      departureTime: json['departureTime'] ?? '',
      arrivalTime: json['arrivalTime'],
      boardingPoint: json['boardingPoint'],
      droppingPoint: json['droppingPoint'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'from': from,
      'to': to,
      'departureDate': departureDate.toIso8601String(),
      'departureTime': departureTime,
      'arrivalTime': arrivalTime,
      'boardingPoint': boardingPoint,
      'droppingPoint': droppingPoint,
    };
  }
}

class Seat {
  final String seatNumber;
  final String seatType;
  final double price;
  final String? passengerName;

  Seat({
    required this.seatNumber,
    required this.seatType,
    required this.price,
    this.passengerName,
  });

  factory Seat.fromJson(Map<String, dynamic> json) {
    return Seat(
      seatNumber: json['seatNumber'] ?? '',
      seatType: json['seatType'] ?? 'seater',
      price: (json['price'] ?? 0).toDouble(),
      passengerName: json['passengerName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'seatNumber': seatNumber,
      'seatType': seatType,
      'price': price,
      'passengerName': passengerName,
    };
  }
}

class Pricing {
  final double baseFare;
  final double totalAmount;
  final double? seatFare;
  final double? taxes;

  Pricing({
    required this.baseFare,
    required this.totalAmount,
    this.seatFare,
    this.taxes,
  });

  factory Pricing.fromJson(Map<String, dynamic> json) {
    return Pricing(
      baseFare: (json['baseFare'] ?? 0).toDouble(),
      totalAmount: (json['totalAmount'] ?? json['total'] ?? 0).toDouble(),
      seatFare: json['seatFare'] != null ? (json['seatFare']).toDouble() : null,
      taxes: json['taxes'] != null ? (json['taxes']).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'baseFare': baseFare,
      'totalAmount': totalAmount,
      'seatFare': seatFare,
      'taxes': taxes,
    };
  }
}

class Payment {
  final String paymentStatus;
  final String? transactionId;
  final DateTime? paidAt;

  Payment({
    required this.paymentStatus,
    this.transactionId,
    this.paidAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      paymentStatus: json['paymentStatus'] ?? 'pending',
      transactionId: json['transactionId'],
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'paymentStatus': paymentStatus,
      'transactionId': transactionId,
      'paidAt': paidAt?.toIso8601String(),
    };
  }
}
