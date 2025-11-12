import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/location_card_widget.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/directions_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
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
      body: Stack(children: [
        // Map
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
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Time and close button row
                Row(
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
                const SizedBox(height: Dimensions.paddingSizeSmall),
                
                // Order number
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order #${widget.orderModel.id}',
                            style: robotoBold.copyWith(
                              fontSize: Dimensions.fontSizeExtraLarge,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _getOrderTimeAndDetails(),
                            style: robotoRegular.copyWith(
                              fontSize: Dimensions.fontSizeSmall,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.more_vert, color: Colors.black),
                      onPressed: () {
                        // Show menu options
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Bottom Card
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: LocationCardWidget(
            orderModel: widget.orderModel,
            orderController: widget.orderController,
            onTap: widget.onTap,
            index: widget.index,
            estimatedArrivalMinutes: _estimatedArrivalMinutes,
          ),
        ),
      ]),
    );
  }

  String _getOrderTimeAndDetails() {
    String timeStr = '';
    if (widget.orderModel.createdAt != null) {
      try {
        DateTime orderTime = DateConverter.dateTimeStringToDate(widget.orderModel.createdAt!);
        timeStr = DateFormat('h:mm a').format(orderTime);
      } catch (e) {
        timeStr = '';
      }
    }
    
    int itemCount = widget.orderModel.detailsCount ?? 1;
    String itemsText = itemCount == 1 ? '$itemCount item' : '$itemCount items';
    double orderAmount = widget.orderModel.orderAmount ?? 0;
    String priceText = PriceConverter.convertPrice(orderAmount);
    
    return '$timeStr | $itemsText, $priceText';
  }

  /// Safely parse coordinate string to double with fallback
  double _parseCoordinate(String? coordinate, double defaultValue) {
    if (coordinate == null || coordinate.isEmpty || coordinate == '0') {
      return defaultValue;
    }
    return double.tryParse(coordinate) ?? defaultValue;
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

      // Only add restaurant marker if we have valid restaurant coordinates
      if (restaurantLat != _defaultLat || restaurantLng != _defaultLng) {
        _markers.add(
          Marker(
            point: ll.LatLng(restaurantLat, restaurantLng),
            width: 50,
            height: 50,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey[800],
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: Icon(Icons.restaurant, color: Colors.white, size: 24),
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
          child: Container(
            decoration: BoxDecoration(
              color: Colors.orange,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: Icon(Icons.home, color: Colors.white, size: 24),
          ),
        ),
      );

      // Fetch actual route for all statuses
      List<ll.LatLng> routePoints = [];

      if (kDebugMode) {
        print('🔵 OrderLocationScreen: Order status: ${orderModel.orderStatus}');
        print('   Restaurant: $restaurantLat, $restaurantLng');
        print('   Delivery: $deliveryLat, $deliveryLng');
      }

      if (restaurantLat != _defaultLat && restaurantLng != _defaultLng &&
          deliveryLat != _defaultLat && deliveryLng != _defaultLng) {
        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Fetching route from OSRM...');
        }
        
        routePoints = await DirectionsHelper.getRoute(
          restaurantLat,
          restaurantLng,
          deliveryLat,
          deliveryLng,
        );
        
        if (kDebugMode) {
          print('🔵 OrderLocationScreen: Received ${routePoints.length} route points');
        }
      } else {
        if (kDebugMode) {
          print('⚠️ OrderLocationScreen: Missing coordinates, using straight line');
        }
      }

      // Add route polyline
      if ((restaurantLat != _defaultLat || restaurantLng != _defaultLng) &&
          (deliveryLat != _defaultLat || deliveryLng != _defaultLng)) {
        if (routePoints.length > 2) {
          // Use actual route - BLACK LINE
          if (kDebugMode) {
            print('✅ OrderLocationScreen: Drawing route with ${routePoints.length} points');
          }
          _polylines.add(
            Polyline(
              points: routePoints,
              strokeWidth: 3.0,
              color: Colors.black,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
        } else {
          // Use straight line if route fetch failed
          if (kDebugMode) {
            print('⚠️ OrderLocationScreen: Drawing straight line (route fetch failed or insufficient points)');
          }
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

      // Calculate bounds
      if ((restaurantLat != _defaultLat || restaurantLng != _defaultLng) &&
          (deliveryLat != _defaultLat || deliveryLng != _defaultLng)) {
        LatLngBounds bounds;
        
        if (routePoints.length > 2) {
          // Calculate bounds from route points
          double minLat = routePoints.first.latitude;
          double maxLat = routePoints.first.latitude;
          double minLng = routePoints.first.longitude;
          double maxLng = routePoints.first.longitude;
          
          for (var point in routePoints) {
            minLat = min(minLat, point.latitude);
            maxLat = max(maxLat, point.latitude);
            minLng = min(minLng, point.longitude);
            maxLng = max(maxLng, point.longitude);
          }
          
          bounds = LatLngBounds(
            ll.LatLng(minLat, minLng),
            ll.LatLng(maxLat, maxLng),
          );
        } else {
          // Use restaurant and delivery bounds
          final minLat = min(deliveryLat, restaurantLat);
          final minLng = min(deliveryLng, restaurantLng);
          final maxLat = max(deliveryLat, restaurantLat);
          final maxLng = max(deliveryLng, restaurantLng);

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
