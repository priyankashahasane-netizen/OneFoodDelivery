import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/location_card_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_details_screen.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/directions_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class OrderLocationScreen extends StatefulWidget {
  final OrderModel orderModel;
  final OrderController orderController;
  final int index;
  final Function onTap;
  const OrderLocationScreen({super.key, required this.orderModel, required this.orderController, required this.index, required this.onTap});

  @override
  State<OrderLocationScreen> createState() => _OrderLocationScreenState();
}

class _OrderLocationScreenState extends State<OrderLocationScreen> {

  final MapController _mapController = MapController();
  final List<Marker> _markers = [];
  final List<Polyline> _polylines = [];
  int? _estimatedArrivalMinutes;
  final DraggableScrollableController _draggableController = DraggableScrollableController();

  // Default coordinates (fallback when location data is missing)
  static const double _defaultLat = 0.0;
  static const double _defaultLng = 0.0;

  @override
  void initState() {
    super.initState();
    _calculateEstimatedArrival();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setMarker(widget.orderModel);
    });
    // Initialize draggable sheet to start at about 40% of screen height
    _draggableController.addListener(() {
      setState(() {}); // Update UI when sheet position changes
    });
  }

  @override
  void dispose() {
    _draggableController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(OrderLocationScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update map if order status changed or location data changed
    if (widget.orderModel.orderStatus != oldWidget.orderModel.orderStatus ||
        widget.orderModel.restaurantLat != oldWidget.orderModel.restaurantLat ||
        widget.orderModel.restaurantLng != oldWidget.orderModel.restaurantLng ||
        widget.orderModel.deliveryAddress?.latitude != oldWidget.orderModel.deliveryAddress?.latitude ||
        widget.orderModel.deliveryAddress?.longitude != oldWidget.orderModel.deliveryAddress?.longitude) {
      if (kDebugMode) {
        print('🔵 OrderLocationScreen: Order data changed, refreshing map');
      }
      _setMarker(widget.orderModel);
    }
  }

  void _calculateEstimatedArrival() {
    // Calculate estimated arrival time based on order status and distance
    // This is a simplified calculation - you can enhance it with actual route data
    double restaurantLat = _parseCoordinate(widget.orderModel.restaurantLat, _defaultLat);
    double restaurantLng = _parseCoordinate(widget.orderModel.restaurantLng, _defaultLng);
    double deliveryLat = _parseCoordinate(
      widget.orderModel.deliveryAddress?.latitude,
      _defaultLat,
    );
    double deliveryLng = _parseCoordinate(
      widget.orderModel.deliveryAddress?.longitude,
      _defaultLng,
    );
    
    // Only calculate if we have valid coordinates (not default values)
    if (restaurantLat != _defaultLat && restaurantLng != _defaultLng &&
        deliveryLat != _defaultLat && deliveryLng != _defaultLng) {
      // Calculate distance using Haversine formula
      const double earthRadius = 6371; // km
      double dLat = (deliveryLat - restaurantLat) * (pi / 180);
      double dLng = (deliveryLng - restaurantLng) * (pi / 180);
      double a = sin(dLat / 2) * sin(dLat / 2) +
          cos(restaurantLat * (pi / 180)) * cos(deliveryLat * (pi / 180)) *
          sin(dLng / 2) * sin(dLng / 2);
      double c = 2 * atan2(sqrt(a), sqrt(1 - a));
      double distance = earthRadius * c;
      
      // Estimate time: assume 30 km/h average speed + 10 minutes for pickup
      int estimatedMinutes = (distance / 30 * 60).round() + 10;
      _estimatedArrivalMinutes = max(estimatedMinutes, 15); // Minimum 15 minutes
    } else {
      _estimatedArrivalMinutes = 30; // Default estimate
    }
  }

  void _navigateToOrderDetails() {
    // Navigate to order details screen with order details as argument
    // Pass UUID if available for more efficient API calls
    Get.toNamed(
      RouteHelper.getOrderDetailsRoute(widget.orderModel.id),
      arguments: OrderDetailsScreen(
        orderId: widget.orderModel.id,
        orderUuid: widget.orderModel.uuid, // Pass UUID directly if available
        isRunningOrder: true, // Orders shown in location card are active/running orders
        orderIndex: widget.index,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Safely get coordinates with fallback
    final deliveryLat = _parseCoordinate(
      widget.orderModel.deliveryAddress?.latitude,
      _defaultLat,
    );
    final deliveryLng = _parseCoordinate(
      widget.orderModel.deliveryAddress?.longitude,
      _defaultLng,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: GestureDetector(
        onVerticalDragEnd: (details) {
          // Detect swipe up gesture (negative velocity means upward movement)
          if (details.primaryVelocity != null && details.primaryVelocity! < -500) {
            _navigateToOrderDetails();
          }
        },
        child: Stack(children: [
        // Map - Full screen, will be partially covered by draggable sheet
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: ll.LatLng(deliveryLat, deliveryLng),
            initialZoom: 16,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.sixamtech.app_retain',
            ),
            PolylineLayer(polylines: _polylines),
            MarkerLayer(markers: _markers),
          ],
        ),

        // Top Bar
        SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  DateFormat('h:mm a').format(DateTime.now()),
                  style: robotoRegular.copyWith(
                    fontSize: Dimensions.fontSizeDefault,
                    color: Colors.grey[600],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.black),
                  onPressed: () => Get.back(),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
        ),

        // Draggable Bottom Card
        DraggableScrollableSheet(
          controller: _draggableController,
          initialChildSize: 0.4, // Start at 40% of screen height
          minChildSize: 0.25, // Minimum 25% (collapsed state)
          maxChildSize: 0.75, // Maximum 75% (expanded state)
          builder: (context, scrollController) {
            return LocationCardWidget(
              orderModel: widget.orderModel,
              orderController: widget.orderController,
              onTap: widget.onTap,
              index: widget.index,
              estimatedArrivalMinutes: _estimatedArrivalMinutes,
              scrollController: scrollController,
            );
          },
        ),
      ]),
      ),
    );
  }

  /// Safely parse coordinate string to double with fallback
  double _parseCoordinate(String? coordinate, double defaultValue) {
    if (coordinate == null || coordinate.isEmpty || coordinate == '0') {
      return defaultValue;
    }
    final parsed = double.tryParse(coordinate);
    if (parsed == null) {
      if (kDebugMode) {
        print('⚠️ OrderLocationScreen: Failed to parse coordinate: $coordinate');
      }
      return defaultValue;
    }
    return parsed;
  }

  void _setMarker(OrderModel orderModel) async {
    try {
      // Use safe parsing with fallbacks
      double deliveryLat = _parseCoordinate(
        orderModel.deliveryAddress?.latitude,
        _defaultLat,
      );
      double deliveryLng = _parseCoordinate(
        orderModel.deliveryAddress?.longitude,
        _defaultLng,
      );
      double restaurantLat = _parseCoordinate(
        orderModel.restaurantLat,
        deliveryLat, // Fallback to delivery location if restaurant location missing
      );
      double restaurantLng = _parseCoordinate(
        orderModel.restaurantLng,
        deliveryLng, // Fallback to delivery location if restaurant location missing
      );

      // Validate coordinates are within valid ranges
      // Latitude: -90 to 90, Longitude: -180 to 180
      if (deliveryLat < -90 || deliveryLat > 90 || deliveryLng < -180 || deliveryLng > 180) {
        if (kDebugMode) {
          print('⚠️ OrderLocationScreen: Invalid delivery coordinates: lat=$deliveryLat, lng=$deliveryLng');
        }
        setState(() {});
        return;
      }
      
      if (kDebugMode) {
        print('📍 OrderLocationScreen: Coordinates - Delivery: ($deliveryLat, $deliveryLng), Restaurant: ($restaurantLat, $restaurantLng)');
      }

      // Only proceed if we have valid delivery coordinates
      if (deliveryLat == _defaultLat && deliveryLng == _defaultLng) {
        if (kDebugMode) {
          print('Warning: No valid delivery coordinates for order ${orderModel.id}');
        }
        // Still show the map, just without markers
        setState(() {});
        return;
      }

      // Clear previous markers and polylines
      _markers.clear();
      _polylines.clear();

      // Fetch driver's latest location
      double? driverLat;
      double? driverLng;
      try {
        final apiClient = Get.find<ApiClient>();
        String? orderUuid = orderModel.uuid ?? orderModel.id?.toString();
        
        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Attempting to fetch driver location');
          print('   Order UUID: $orderUuid');
          print('   Order ID: ${orderModel.id}');
        }
        
        if (orderUuid != null) {
          final response = await apiClient.getData(
            '${AppConstants.latestTrackingUri}/$orderUuid/latest',
            handleError: false,
          );
          
          if (kDebugMode) {
            print('🔵 OrderLocationScreen: API Response status: ${response.statusCode}');
            print('   Response body: ${response.body}');
          }
          
          if (response.statusCode == 200 && response.body != null) {
            final data = response.body;
            if (data is Map) {
              if (kDebugMode) {
                print('🔵 OrderLocationScreen: Response data keys: ${data.keys.toList()}');
              }
              
              if (data['latitude'] != null && data['longitude'] != null) {
                driverLat = (data['latitude'] is num) 
                    ? data['latitude'].toDouble() 
                    : double.tryParse(data['latitude'].toString());
                driverLng = (data['longitude'] is num) 
                    ? data['longitude'].toDouble() 
                    : double.tryParse(data['longitude'].toString());
                
                if (driverLat != null && driverLng != null) {
                  if (kDebugMode) {
                    print('✅ OrderLocationScreen: Successfully fetched driver location: $driverLat, $driverLng');
                  }
                } else {
                  if (kDebugMode) {
                    print('⚠️ OrderLocationScreen: Failed to parse driver coordinates');
                  }
                }
              } else {
                if (kDebugMode) {
                  print('⚠️ OrderLocationScreen: No latitude/longitude in response');
                }
              }
            } else {
              if (kDebugMode) {
                print('⚠️ OrderLocationScreen: Response body is not a Map: ${data.runtimeType}');
              }
            }
          } else if (response.statusCode == 404) {
            if (kDebugMode) {
              print('⚠️ OrderLocationScreen: No tracking data found for order (404)');
            }
          } else {
            if (kDebugMode) {
              print('⚠️ OrderLocationScreen: Unexpected response status: ${response.statusCode}');
            }
          }
        } else {
          if (kDebugMode) {
            print('⚠️ OrderLocationScreen: No order UUID available');
          }
        }
        
        // Fallback: Try to get driver location from driver profile if tracking failed
        if (driverLat == null || driverLng == null) {
          if (kDebugMode) {
            print('🔵 OrderLocationScreen: Attempting fallback - getting driver location from profile');
          }
          try {
            // First try to get from ProfileController cache (faster)
            try {
              final profileController = Get.find<ProfileController>();
              final profileModel = profileController.profileModel;
              
              if (profileModel != null) {
                // Try current location first (latitude/longitude from driver entity)
                // Note: ProfileModel doesn't have these fields, so we'll need to fetch from API
                if (kDebugMode) {
                  print('🔵 OrderLocationScreen: ProfileModel found, but need to fetch from API for current location');
                }
              }
            } catch (e) {
              if (kDebugMode) {
                print('🔵 OrderLocationScreen: ProfileController not available, fetching from API');
              }
            }
            
            // Fetch from API
            final profileResponse = await apiClient.getData(
              AppConstants.driverProfileUri,
              handleError: false,
            );
            
            if (profileResponse.statusCode == 200 && profileResponse.body != null) {
              final profileData = profileResponse.body;
              if (profileData is Map) {
                // Try current location first (latitude/longitude from driver entity)
                if (profileData['latitude'] != null && profileData['longitude'] != null) {
                  driverLat = (profileData['latitude'] is num) 
                      ? profileData['latitude'].toDouble() 
                      : double.tryParse(profileData['latitude'].toString());
                  driverLng = (profileData['longitude'] is num) 
                      ? profileData['longitude'].toDouble() 
                      : double.tryParse(profileData['longitude'].toString());
                  if (driverLat != null && driverLng != null && kDebugMode) {
                    print('✅ OrderLocationScreen: Got driver current location from profile: $driverLat, $driverLng');
                  }
                }
                
                // Fallback to home address if current location not available
                if ((driverLat == null || driverLng == null) && 
                    profileData['home_address_latitude'] != null && 
                    profileData['home_address_longitude'] != null) {
                  driverLat = (profileData['home_address_latitude'] is num) 
                      ? profileData['home_address_latitude'].toDouble() 
                      : double.tryParse(profileData['home_address_latitude'].toString());
                  driverLng = (profileData['home_address_longitude'] is num) 
                      ? profileData['home_address_longitude'].toDouble() 
                      : double.tryParse(profileData['home_address_longitude'].toString());
                  if (driverLat != null && driverLng != null && kDebugMode) {
                    print('✅ OrderLocationScreen: Got driver home address location from profile: $driverLat, $driverLng');
                  }
                }
              }
            } else {
              if (kDebugMode) {
                print('⚠️ OrderLocationScreen: Profile API returned status ${profileResponse.statusCode}');
              }
            }
          } catch (e, stackTrace) {
            if (kDebugMode) {
              print('⚠️ OrderLocationScreen: Fallback to profile failed: $e');
              print('   Stack trace: $stackTrace');
            }
          }
        }
      } catch (e, stackTrace) {
        if (kDebugMode) {
          print('❌ OrderLocationScreen: Exception fetching driver location: $e');
          print('   Stack trace: $stackTrace');
        }
      }

      // Add driver marker if we have driver location
      if (driverLat != null && driverLng != null) {
        if (kDebugMode) {
          print('✅ OrderLocationScreen: Adding driver marker at $driverLat, $driverLng');
        }
        _markers.add(
          Marker(
            point: ll.LatLng(driverLat, driverLng),
            width: 60,
            height: 60,
            alignment: Alignment.topCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Current',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        if (kDebugMode) {
          print('⚠️ OrderLocationScreen: Driver location not available - cannot show driver marker');
          print('   driverLat: $driverLat, driverLng: $driverLng');
        }
      }

      // Only add restaurant marker if we have valid restaurant coordinates
      if (restaurantLat != _defaultLat || restaurantLng != _defaultLng) {
        _markers.add(
          Marker(
            point: ll.LatLng(restaurantLat, restaurantLng),
            width: 50,
            height: 50,
            alignment: Alignment.topCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Pickup',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }

      // Add destination marker (Home)
      _markers.add(
        Marker(
          point: ll.LatLng(deliveryLat, deliveryLng),
          width: 50,
          height: 50,
          alignment: Alignment.topCenter,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Drop',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      );

      // Always show restaurant to delivery route as BLACK LINE
      List<ll.LatLng> restaurantToDeliveryRoute = [];
      if (restaurantLat != _defaultLat && restaurantLng != _defaultLng &&
          deliveryLat != _defaultLat && deliveryLng != _defaultLng) {
        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Fetching restaurant to delivery route...');
        }
        
        restaurantToDeliveryRoute = await DirectionsHelper.getRoute(
          restaurantLat,
          restaurantLng,
          deliveryLat,
          deliveryLng,
        );
        
        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Restaurant to delivery route has ${restaurantToDeliveryRoute.length} points');
        }
        
        // Add restaurant to delivery route as BLACK LINE
        if (restaurantToDeliveryRoute.length > 2) {
          _polylines.add(
            Polyline(
              points: restaurantToDeliveryRoute,
              strokeWidth: 3.0,
              color: Colors.black,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
        } else {
          // Use straight line if route fetch failed
          _polylines.add(
            Polyline(
              points: [
                ll.LatLng(restaurantLat, restaurantLng),
                ll.LatLng(deliveryLat, deliveryLng),
              ],
              strokeWidth: 3.0,
              color: Colors.black,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
        }
      }

      // If driver location is available, also show driver route as BLUE LINE
      if (driverLat != null && driverLng != null) {
        double driverRouteEndLat = deliveryLat;
        double driverRouteEndLng = deliveryLng;
        
        // If order is not picked up, route driver to restaurant; otherwise route to delivery address
        if (orderModel.orderStatus != 'picked_up' && restaurantLat != _defaultLat && restaurantLng != _defaultLng) {
          driverRouteEndLat = restaurantLat;
          driverRouteEndLng = restaurantLng;
        }

        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Order status: ${orderModel.orderStatus}');
          print('   Driver: $driverLat, $driverLng');
          print('   Restaurant: $restaurantLat, $restaurantLng');
          print('   Delivery: $deliveryLat, $deliveryLng');
          print('   Driver route: ($driverLat, $driverLng) -> ($driverRouteEndLat, $driverRouteEndLng)');
        }

        // Fetch driver route
        if (driverRouteEndLat != _defaultLat && driverRouteEndLng != _defaultLng) {
          if (kDebugMode) {
            print('🔵 OrderLocationScreen: Fetching driver route from OSRM...');
          }
          
          List<ll.LatLng> driverRoutePoints = await DirectionsHelper.getRoute(
            driverLat,
            driverLng,
            driverRouteEndLat,
            driverRouteEndLng,
          );
          
          if (kDebugMode) {
            print('🔵 OrderLocationScreen: Driver route has ${driverRoutePoints.length} points');
          }
          
          // Add driver route as BLUE LINE
          if (driverRoutePoints.length > 2) {
            _polylines.add(
              Polyline(
                points: driverRoutePoints,
                strokeWidth: 4.0,
                color: Colors.blue,
                borderStrokeWidth: 1.0,
                borderColor: Colors.white,
              ),
            );
          } else {
            // Use straight line if route fetch failed
            _polylines.add(
              Polyline(
                points: [
                  ll.LatLng(driverLat, driverLng),
                  ll.LatLng(driverRouteEndLat, driverRouteEndLng),
                ],
                strokeWidth: 4.0,
                color: Colors.blue,
                borderStrokeWidth: 1.0,
                borderColor: Colors.white,
              ),
            );
          }
        }
      }

      // Calculate bounds including driver location if available
      List<double> lats = [];
      List<double> lngs = [];
      
      if (driverLat != null && driverLng != null) {
        lats.add(driverLat);
        lngs.add(driverLng);
      }
      if (restaurantLat != _defaultLat && restaurantLng != _defaultLng) {
        lats.add(restaurantLat);
        lngs.add(restaurantLng);
      }
      if (deliveryLat != _defaultLat && deliveryLng != _defaultLng) {
        lats.add(deliveryLat);
        lngs.add(deliveryLng);
      }
      
      if (lats.isNotEmpty && lngs.isNotEmpty) {
        LatLngBounds bounds;
        
        // Collect all route points for bounds calculation
        List<ll.LatLng> allRoutePoints = [];
        if (restaurantToDeliveryRoute.length > 2) {
          allRoutePoints.addAll(restaurantToDeliveryRoute);
        }
        
        if (allRoutePoints.length > 2) {
          // Calculate bounds from route points
          double minLat = allRoutePoints.first.latitude;
          double maxLat = allRoutePoints.first.latitude;
          double minLng = allRoutePoints.first.longitude;
          double maxLng = allRoutePoints.first.longitude;
          
          for (var point in allRoutePoints) {
            minLat = min(minLat, point.latitude);
            maxLat = max(maxLat, point.latitude);
            minLng = min(minLng, point.longitude);
            maxLng = max(maxLng, point.longitude);
          }
          
          // Also include driver location in bounds if available
          if (driverLat != null && driverLng != null) {
            minLat = min(minLat, driverLat);
            maxLat = max(maxLat, driverLat);
            minLng = min(minLng, driverLng);
            maxLng = max(maxLng, driverLng);
          }
          
          bounds = LatLngBounds(
            ll.LatLng(minLat, minLng),
            ll.LatLng(maxLat, maxLng),
          );
        } else {
          // Use all available locations for bounds
          final minLat = lats.reduce(min);
          final minLng = lngs.reduce(min);
          final maxLat = lats.reduce(max);
          final maxLng = lngs.reduce(max);

          bounds = LatLngBounds(
            ll.LatLng(minLat, minLng),
            ll.LatLng(maxLat, maxLng),
          );
        }

        // Zoom to fit bounds with padding
        _mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(80)));
      } else {
        // Just center on delivery location if we only have that
        _mapController.move(ll.LatLng(deliveryLat, deliveryLng), 16);
      }

      setState(() {});
    } catch (e) {
      if (kDebugMode) {
        print('Error setting markers: $e');
      }
      // Ensure screen still displays even if marker setup fails
      setState(() {});
    }
  }
}
