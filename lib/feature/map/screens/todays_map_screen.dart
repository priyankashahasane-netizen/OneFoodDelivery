import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'dart:math' as math;
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/data/repositories/smart_path_repository.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/data/services/smart_path_service.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/domain/models/smart_path_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/controllers/route_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart' as routes;
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'dart:async';

class TodaysMapScreen extends StatefulWidget {
  const TodaysMapScreen({super.key});

  @override
  State<TodaysMapScreen> createState() => _TodaysMapScreenState();
}

class _TodaysMapScreenState extends State<TodaysMapScreen> {
  final MapController _mapController = MapController();
  ll.LatLng? _currentLocation;
  bool _isLoadingLocation = false;
  StreamSubscription<Position>? _locationStreamSubscription;
  
  // Smart Path data
  List<SmartPathModel> _smartPaths = [];
  // Active orders route data
  routes.RoutePlanModel? _activeOrdersRoute;
  List<Polyline> _routePolylines = [];
  List<Marker> _routeMarkers = [];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _startLocationTracking();
    _loadSmartPath();
    _loadActiveOrdersRoute();
  }

  Future<void> _getCurrentLocation() async {
    try {
      setState(() {
        _isLoadingLocation = true;
      });

      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;

      // Check if driver is offline - if so, use home address coordinates
      if (profileModel != null) {
        final isOffline = (profileModel.active ?? 0) == 0;

        if (isOffline && profileModel.homeAddressLatitude != null && profileModel.homeAddressLongitude != null) {
          setState(() {
            _currentLocation = ll.LatLng(
              profileModel.homeAddressLatitude!,
              profileModel.homeAddressLongitude!,
            );
            _isLoadingLocation = false;
          });
          _mapController.move(_currentLocation!, 15.0);
          return;
        }
      }

      // Get current GPS location
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isLoadingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isLoadingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isLoadingLocation = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentLocation = ll.LatLng(position.latitude, position.longitude);
        _isLoadingLocation = false;
      });

      _mapController.move(_currentLocation!, 15.0);
    } catch (e) {
      setState(() {
        _isLoadingLocation = false;
      });
    }
  }

  void _startLocationTracking() {
    _locationStreamSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      if (mounted) {
        setState(() {
          _currentLocation = ll.LatLng(position.latitude, position.longitude);
        });
        _mapController.move(_currentLocation!, _mapController.camera.zoom);
      }
    });
  }

  Future<void> _loadSmartPath() async {
    try {
      print('🗺️ Today\'s Map: Loading Smart Path...');
      
      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;
      
      if (profileModel?.id == null) {
        print('⚠️ Today\'s Map: No profile model or driver ID');
        return;
      }

      final driverId = profileModel!.id.toString();
      print('🗺️ Today\'s Map: Driver ID: $driverId');

      final apiClient = Get.find<ApiClient>();
      final repository = SmartPathRepository(apiClient: apiClient);
      final service = SmartPathService(smartPathRepository: repository);
      
      // First, try to get existing Smart Paths
      var smartPaths = await service.getSmartPath(driverId);
      print('📦 Today\'s Map: Found ${smartPaths?.length ?? 0} existing Smart Paths');
      
      // If no Smart Paths exist, generate new ones
      if (smartPaths == null || smartPaths.isEmpty) {
        print('🔄 Today\'s Map: No existing Smart Paths found, generating new ones...');
        smartPaths = await service.generateSmartPath(driverId);
        print('✅ Today\'s Map: Generated ${smartPaths?.length ?? 0} Smart Paths');
      }
      
      if (smartPaths != null && smartPaths.isNotEmpty) {
        print('✅ Today\'s Map: Loading ${smartPaths.length} Smart Paths onto map');
        setState(() {
          _smartPaths = smartPaths!;
          _buildRoutePolylinesAndMarkers();
          _adjustMapBounds();
        });
      } else {
        print('⚠️ Today\'s Map: No Smart Paths available (no subscription orders for today)');
      }
    } catch (e, stackTrace) {
      print('❌ Today\'s Map: Error loading Smart Path: $e');
      print('Stack trace: $stackTrace');
    }
  }

  Future<void> _loadActiveOrdersRoute() async {
    try {
      print('🗺️ Today\'s Map: Loading active orders route...');
      
      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;
      
      if (profileModel?.id == null) {
        print('⚠️ Today\'s Map: No profile model or driver ID');
        return;
      }

      final driverId = profileModel!.id.toString();
      print('🗺️ Today\'s Map: Driver ID: $driverId');

      // Try to get latest route plan first (might have cached route)
      final routeController = Get.find<RouteController>();
      await routeController.refreshLatestRoute(driverId);
      var routePlan = routeController.currentRoute;
      
      if (routePlan != null) {
        print('✅ Today\'s Map: Found cached route plan with ${routePlan.stops?.length ?? 0} stops');
        setState(() {
          _activeOrdersRoute = routePlan;
          _buildRoutePolylinesAndMarkers();
          _adjustMapBounds();
        });
      }

      // Get active orders directly from service
      final orderController = Get.find<OrderController>();
      List<dynamic>? activeOrders;
      
      try {
        // Use getActiveOrders which directly calls the API
        activeOrders = await orderController.orderServiceInterface.getActiveOrders(driverId);
        print('📦 Today\'s Map: Fetched ${activeOrders?.length ?? 0} active orders');
      } catch (e) {
        print('⚠️ Today\'s Map: Error fetching active orders: $e');
        // Fallback to currentOrderList
        activeOrders = orderController.currentOrderList;
        print('📦 Today\'s Map: Using currentOrderList: ${activeOrders?.length ?? 0} orders');
      }
      
      if (activeOrders == null || activeOrders.isEmpty) {
        print('⚠️ Today\'s Map: No active orders found');
        return;
      }

      // Build stops from active orders
      final stops = <routes.OptimizeStop>[];
      
      for (var order in activeOrders) {
        // Handle both OrderModel and Map types
        String? restaurantLat, restaurantLng;
        String? deliveryLat, deliveryLng;
        String? orderId;
        
        if (order is Map) {
          restaurantLat = order['restaurant_lat']?.toString() ?? order['restaurantLat']?.toString();
          restaurantLng = order['restaurant_lng']?.toString() ?? order['restaurantLng']?.toString();
          deliveryLat = order['delivery_address']?['latitude']?.toString() ?? 
                       order['deliveryAddress']?['latitude']?.toString();
          deliveryLng = order['delivery_address']?['longitude']?.toString() ?? 
                       order['deliveryAddress']?['longitude']?.toString();
          orderId = order['id']?.toString() ?? order['uuid']?.toString();
        } else {
          // Assume OrderModel
          restaurantLat = order.restaurantLat;
          restaurantLng = order.restaurantLng;
          deliveryLat = order.deliveryAddress?.latitude;
          deliveryLng = order.deliveryAddress?.longitude;
          orderId = order.id?.toString() ?? order.uuid;
        }
        
        if (restaurantLat != null && restaurantLng != null) {
          try {
            stops.add(routes.OptimizeStop(
              lat: double.parse(restaurantLat),
              lng: double.parse(restaurantLng),
              orderId: orderId ?? '',
            ));
            print('📍 Today\'s Map: Added pickup stop: $restaurantLat, $restaurantLng');
          } catch (e) {
            print('⚠️ Today\'s Map: Error parsing restaurant coordinates: $e');
          }
        }
        
        if (deliveryLat != null && deliveryLng != null) {
          try {
            stops.add(routes.OptimizeStop(
              lat: double.parse(deliveryLat),
              lng: double.parse(deliveryLng),
              orderId: orderId ?? '',
            ));
            print('📍 Today\'s Map: Added delivery stop: $deliveryLat, $deliveryLng');
          } catch (e) {
            print('⚠️ Today\'s Map: Error parsing delivery coordinates: $e');
          }
        }
      }
      
      print('🗺️ Today\'s Map: Built ${stops.length} stops from ${activeOrders.length} orders');
      
      if (stops.isNotEmpty) {
        print('🗺️ Today\'s Map: Optimizing route...');
        routePlan = await routeController.optimizeRoute(driverId, stops);
        
        if (routePlan != null) {
          print('✅ Today\'s Map: Route optimized successfully with ${routePlan.stops?.length ?? 0} stops');
          setState(() {
            _activeOrdersRoute = routePlan;
            _buildRoutePolylinesAndMarkers();
            _adjustMapBounds();
          });
          print('✅ Today\'s Map: Polylines: ${_routePolylines.length}, Markers: ${_routeMarkers.length}');
        } else {
          print('⚠️ Today\'s Map: Route optimization returned null');
        }
      } else {
        print('⚠️ Today\'s Map: No valid stops to optimize');
      }
    } catch (e, stackTrace) {
      print('❌ Today\'s Map: Error loading active orders route: $e');
      print('Stack trace: $stackTrace');
    }
  }

  void _buildRoutePolylinesAndMarkers() {
    print('🗺️ Today\'s Map: Building route polylines and markers...');
    _routePolylines.clear();
    _routeMarkers.clear();

    // Add Smart Path routes (subscription orders)
    for (final smartPath in _smartPaths) {
      if (smartPath.routePlan == null) continue;

      final routePlan = smartPath.routePlan!;
      
      // Build polyline from route stops
      if (routePlan.stops.isNotEmpty) {
        final routePoints = routePlan.stops
            .map((stop) => ll.LatLng(stop.lat, stop.lng))
            .toList();
        
        if (routePoints.length > 1) {
          _routePolylines.add(
            Polyline(
              points: routePoints,
              strokeWidth: 4.0,
              color: Colors.blue,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
        }
      }

      // Add pickup location marker
      _routeMarkers.add(
        Marker(
          point: ll.LatLng(
            smartPath.pickupLocation.lat,
            smartPath.pickupLocation.lng,
          ),
          width: 40,
          height: 40,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Icon(
              Icons.restaurant,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      );

      // Add dropoff location markers
      for (final stop in routePlan.stops) {
        // Skip pickup location (already added)
        if (stop.lat == smartPath.pickupLocation.lat &&
            stop.lng == smartPath.pickupLocation.lng) {
          continue;
        }

        _routeMarkers.add(
          Marker(
            point: ll.LatLng(stop.lat, stop.lng),
            width: 30,
            height: 30,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Icon(
                Icons.location_on,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        );
      }
    }

    // Add active orders route (all orders)
    if (_activeOrdersRoute != null && _activeOrdersRoute!.stops != null) {
      final stops = _activeOrdersRoute!.stops!;
      print('🗺️ Today\'s Map: Processing ${stops.length} stops from active orders route');
      
      if (stops.isNotEmpty) {
        final routePoints = stops
            .map((stop) => ll.LatLng(stop.lat, stop.lng))
            .toList();
        
        print('🗺️ Today\'s Map: Created ${routePoints.length} route points');
        
        if (routePoints.length > 1) {
          _routePolylines.add(
            Polyline(
              points: routePoints,
              strokeWidth: 4.0,
              color: Colors.orange,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
          print('✅ Today\'s Map: Added orange polyline with ${routePoints.length} points');
        } else {
          print('⚠️ Today\'s Map: Not enough points for polyline (${routePoints.length})');
        }

        // Add markers for all stops
        // Track which orderIds we've seen to determine pickup vs delivery
        final seenOrderIds = <String>{};
        
        for (final stop in stops) {
          // Determine if it's a pickup or delivery
          // If type is explicitly set, use it; otherwise, first occurrence of orderId is pickup
          bool isPickup = false;
          if (stop.type == 'pickup') {
            isPickup = true;
          } else if (stop.type == 'delivery') {
            isPickup = false;
          } else if (stop.orderId != null) {
            // If type not set, first occurrence of orderId is pickup
            isPickup = !seenOrderIds.contains(stop.orderId);
            if (isPickup) {
              seenOrderIds.add(stop.orderId!);
            }
          }
          
          _routeMarkers.add(
            Marker(
              point: ll.LatLng(stop.lat, stop.lng),
              width: isPickup ? 40 : 30,
              height: isPickup ? 40 : 30,
              child: Container(
                decoration: BoxDecoration(
                  color: isPickup ? Colors.green : Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: Icon(
                  isPickup ? Icons.restaurant : Icons.location_on,
                  color: Colors.white,
                  size: isPickup ? 24 : 20,
                ),
              ),
            ),
          );
        }
      }
    }
    
    print('✅ Today\'s Map: Route building complete - Polylines: ${_routePolylines.length}, Markers: ${_routeMarkers.length}');
  }

  void _adjustMapBounds() {
    if (_routeMarkers.isEmpty && _currentLocation == null) {
      return;
    }

    final List<double> lats = [];
    final List<double> lngs = [];

    // Add current location
    if (_currentLocation != null) {
      lats.add(_currentLocation!.latitude);
      lngs.add(_currentLocation!.longitude);
    }

    // Add all marker locations
    for (final marker in _routeMarkers) {
      lats.add(marker.point.latitude);
      lngs.add(marker.point.longitude);
    }

    // Add all polyline points
    for (final polyline in _routePolylines) {
      for (final point in polyline.points) {
        lats.add(point.latitude);
        lngs.add(point.longitude);
      }
    }

    if (lats.isNotEmpty && lngs.isNotEmpty) {
      final minLat = lats.reduce(math.min);
      final maxLat = lats.reduce(math.max);
      final minLng = lngs.reduce(math.min);
      final maxLng = lngs.reduce(math.max);

      final bounds = LatLngBounds(
        ll.LatLng(minLat, minLng),
        ll.LatLng(maxLat, maxLng),
      );

      // Add padding and fit camera to bounds
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.all(50),
        ),
      );
    }
  }

  @override
  void dispose() {
    _locationStreamSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Get.find<ProfileController>();
    final profileModel = profileController.profileModel;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Today's Map",
          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
        ),
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _loadActiveOrdersRoute();
              _loadSmartPath();
            },
            tooltip: 'Refresh routes',
          ),
        ],
      ),
      body: _isLoadingLocation
          ? Center(
              child: CircularProgressIndicator(
                color: Theme.of(context).primaryColor,
              ),
            )
          : FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _currentLocation ?? const ll.LatLng(0.0, 0.0),
                initialZoom: 15.0,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.sixamtech.app_retain',
                ),
                // Smart Path route polylines
                if (_routePolylines.isNotEmpty)
                  PolylineLayer(polylines: _routePolylines),
                // Smart Path markers (pickup and dropoff)
                if (_routeMarkers.isNotEmpty)
                  MarkerLayer(markers: _routeMarkers),
                // Driver current location marker
                if (_currentLocation != null &&
                    _currentLocation!.latitude != 0.0 &&
                    _currentLocation!.longitude != 0.0)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _currentLocation!,
                        width: 60,
                        height: 60,
                        child: Image.asset(
                          (profileModel != null && (profileModel.active ?? 0) == 0)
                              ? Images.happyManIcon
                              : Images.deliveryBikeIcon,
                          width: 60,
                          height: 60,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            if (profileModel != null && (profileModel.active ?? 0) == 0) {
                              return Icon(
                                Icons.home,
                                color: Theme.of(context).primaryColor,
                                size: 40,
                              );
                            } else {
                              return Icon(
                                Icons.directions_bike,
                                color: Theme.of(context).primaryColor,
                                size: 40,
                              );
                            }
                          },
                        ),
                      ),
                    ],
                  ),
              ],
            ),
    );
  }
}

