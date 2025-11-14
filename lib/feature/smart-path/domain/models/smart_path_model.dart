class SmartPathModel {
  final String id;
  final String driverId;
  final PickupLocation pickupLocation;
  final List<String> orderIds;
  final String? routePlanId;
  final String status;
  final DateTime targetDate;
  final RoutePlanModel? routePlan;
  final DateTime createdAt;
  final DateTime updatedAt;

  SmartPathModel({
    required this.id,
    required this.driverId,
    required this.pickupLocation,
    required this.orderIds,
    this.routePlanId,
    required this.status,
    required this.targetDate,
    this.routePlan,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SmartPathModel.fromJson(Map<String, dynamic> json) {
    return SmartPathModel(
      id: json['id']?.toString() ?? '',
      driverId: json['driverId']?.toString() ?? '',
      pickupLocation: PickupLocation.fromJson(json['pickupLocation'] ?? {}),
      orderIds: (json['orderIds'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      routePlanId: json['routePlanId']?.toString(),
      status: json['status']?.toString() ?? 'planned',
      targetDate: json['targetDate'] != null
          ? DateTime.parse(json['targetDate'])
          : DateTime.now(),
      routePlan: json['routePlan'] != null
          ? RoutePlanModel.fromJson(json['routePlan'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'driverId': driverId,
      'pickupLocation': pickupLocation.toJson(),
      'orderIds': orderIds,
      'routePlanId': routePlanId,
      'status': status,
      'targetDate': targetDate.toIso8601String(),
      'routePlan': routePlan?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class PickupLocation {
  final double lat;
  final double lng;
  final String? address;

  PickupLocation({
    required this.lat,
    required this.lng,
    this.address,
  });

  factory PickupLocation.fromJson(Map<String, dynamic> json) {
    return PickupLocation(
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? 0.0).toDouble(),
      address: json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
      'address': address,
    };
  }
}

class RoutePlanModel {
  final String id;
  final List<RouteStop> stops;
  final List<int>? sequence;
  final String? polyline;
  final double totalDistanceKm;
  final int? estimatedDurationSec;
  final List<String>? etaPerStop;

  RoutePlanModel({
    required this.id,
    required this.stops,
    this.sequence,
    this.polyline,
    required this.totalDistanceKm,
    this.estimatedDurationSec,
    this.etaPerStop,
  });

  factory RoutePlanModel.fromJson(Map<String, dynamic> json) {
    return RoutePlanModel(
      id: json['id']?.toString() ?? '',
      stops: (json['stops'] as List<dynamic>?)
          ?.map((e) => RouteStop.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      sequence: (json['sequence'] as List<dynamic>?)
          ?.map((e) => int.parse(e.toString()))
          .toList(),
      polyline: json['polyline']?.toString(),
      totalDistanceKm: (json['totalDistanceKm'] ?? 0.0).toDouble(),
      estimatedDurationSec: json['estimatedDurationSec'] != null
          ? int.parse(json['estimatedDurationSec'].toString())
          : null,
      etaPerStop: (json['etaPerStop'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'stops': stops.map((s) => s.toJson()).toList(),
      'sequence': sequence,
      'polyline': polyline,
      'totalDistanceKm': totalDistanceKm,
      'estimatedDurationSec': estimatedDurationSec,
      'etaPerStop': etaPerStop,
    };
  }
}

class RouteStop {
  final double lat;
  final double lng;
  final String? orderId;
  final String? address;

  RouteStop({
    required this.lat,
    required this.lng,
    this.orderId,
    this.address,
  });

  factory RouteStop.fromJson(Map<String, dynamic> json) {
    return RouteStop(
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? 0.0).toDouble(),
      orderId: json['orderId']?.toString(),
      address: json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
      'orderId': orderId,
      'address': address,
    };
  }
}

