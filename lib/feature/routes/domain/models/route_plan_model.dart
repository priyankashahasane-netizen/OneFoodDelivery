class RoutePlanModel {
  String? id;
  String? driverId;
  List<RouteStop>? stops;
  double? totalDistanceKm;
  Map<String, int>? etaPerStop; // orderId -> seconds
  String? provider;
  DateTime? createdAt;
  Map<String, dynamic>? rawResponse;
  String? polyline;
  int? estimatedDurationSec;
  List<int>? sequence;

  RoutePlanModel({
    this.id,
    this.driverId,
    this.stops,
    this.totalDistanceKm,
    this.etaPerStop,
    this.provider,
    this.createdAt,
    this.rawResponse,
    this.polyline,
    this.estimatedDurationSec,
    this.sequence,
  });

  RoutePlanModel.fromJson(Map<String, dynamic> json) {
    id = json['id']?.toString();
    driverId = json['driverId']?.toString();
    totalDistanceKm = json['totalDistanceKm']?.toDouble();
    provider = json['provider'];
    polyline = json['polyline']?.toString();
    estimatedDurationSec = json['estimatedDurationSec'] != null 
        ? (json['estimatedDurationSec'] is int 
            ? json['estimatedDurationSec'] as int 
            : int.tryParse(json['estimatedDurationSec'].toString()))
        : null;
    if (json['createdAt'] != null) {
      createdAt = DateTime.parse(json['createdAt']);
    }
    rawResponse = json['rawResponse'];
    
    if (json['stops'] != null) {
      stops = (json['stops'] as List).map((v) => RouteStop.fromJson(v)).toList();
    }
    
    if (json['etaPerStop'] != null) {
      etaPerStop = Map<String, int>.from(json['etaPerStop'].map((k, v) => MapEntry(k.toString(), v as int)));
    }

    if (json['sequence'] != null) {
      sequence = (json['sequence'] as List).map((v) => v as int).toList();
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['driverId'] = driverId;
    data['totalDistanceKm'] = totalDistanceKm;
    data['provider'] = provider;
    data['polyline'] = polyline;
    data['estimatedDurationSec'] = estimatedDurationSec;
    data['createdAt'] = createdAt?.toIso8601String();
    data['rawResponse'] = rawResponse;
    if (stops != null) {
      data['stops'] = stops!.map((v) => v.toJson()).toList();
    }
    if (etaPerStop != null) {
      data['etaPerStop'] = etaPerStop;
    }
    if (sequence != null) {
      data['sequence'] = sequence;
    }
    return data;
  }
}

class RouteStop {
  double lat;
  double lng;
  String? orderId;
  String? type; // 'pickup' or 'delivery'
  int? sequence;
  double? distanceKm;
  int? etaSeconds;

  RouteStop({
    required this.lat,
    required this.lng,
    this.orderId,
    this.type,
    this.sequence,
    this.distanceKm,
    this.etaSeconds,
  });

  RouteStop.fromJson(Map<String, dynamic> json)
      : lat = json['lat'].toDouble(),
        lng = json['lng'].toDouble(),
        orderId = json['orderId']?.toString(),
        type = json['type'],
        sequence = json['sequence'],
        distanceKm = json['distanceKm']?.toDouble(),
        etaSeconds = json['etaSeconds'];

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['lat'] = lat;
    data['lng'] = lng;
    data['orderId'] = orderId;
    data['type'] = type;
    data['sequence'] = sequence;
    data['distanceKm'] = distanceKm;
    data['etaSeconds'] = etaSeconds;
    return data;
  }
}

class OptimizeRouteRequest {
  String driverId;
  List<OptimizeStop> stops;

  OptimizeRouteRequest({
    required this.driverId,
    required this.stops,
  });

  Map<String, dynamic> toJson() {
    return {
      'driverId': driverId,
      'stops': stops.map((s) => s.toJson()).toList(),
    };
  }
}

class OptimizeStop {
  double lat;
  double lng;
  String orderId;

  OptimizeStop({
    required this.lat,
    required this.lng,
    required this.orderId,
  });

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
      'orderId': orderId,
    };
  }
}


