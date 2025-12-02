import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/controllers/route_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/helper/directions_helper.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:get/get_connect/http/src/response/response.dart';

class SubscriptionRouteMapScreen extends StatefulWidget {
  const SubscriptionRouteMapScreen({super.key});

  @override
  State<SubscriptionRouteMapScreen> createState() => _SubscriptionRouteMapScreenState();
}

class _SubscriptionRouteMapScreenState extends State<SubscriptionRouteMapScreen> {
  final MapController _mapController = MapController();
  final List<Marker> _markers = [];
  final List<Polyline> _polylines = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSubscriptionRoute();
  }

  Future<void> _loadSubscriptionRoute() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Get driver ID from profile controller first (avoids extra API call)
      String? driverId;
      try {
        final profileController = Get.find<ProfileController>();
        final profileModel = profileController.profileModel;
        
        if (profileModel != null) {
          // Try to get UUID from profileModel's id if it's a UUID format
          if (profileModel.id != null) {
            String idStr = profileModel.id.toString();
            if (idStr.contains('-') && idStr.length == 36) {
              driverId = idStr;
            }
          }
        }
      } catch (e) {
        if (kDebugMode) {
          print('Could not get driver ID from ProfileController: $e');
        }
      }
      
      // Fallback: Get driver UUID from profile API only if not found in cache
      if (driverId == null || driverId.isEmpty) {
        try {
          final apiClient = Get.find<ApiClient>();
          Response profileResponse = await apiClient.getData(
            '/api/drivers/me',
            handleError: false,
          );
          
          if (profileResponse.statusCode == 200 && profileResponse.body != null) {
            Map<String, dynamic>? body = profileResponse.body is Map ? profileResponse.body as Map<String, dynamic> : null;
            if (body != null) {
              // Priority 1: Use uuid field if available
              if (body['uuid'] != null && body['uuid'].toString().isNotEmpty) {
                driverId = body['uuid'].toString();
              } 
              // Priority 2: Check if id is a UUID (contains dashes)
              else if (body['id'] != null) {
                String idStr = body['id'].toString();
                if (idStr.contains('-') && idStr.length == 36) {
                  driverId = idStr;
                }
              }
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('Error fetching driver ID from API: $e');
          }
        }
      }

      if (driverId == null || driverId.isEmpty) {
        setState(() {
          _errorMessage = 'Driver ID not found. Please login again.';
          _isLoading = false;
        });
        return;
      }

      // Get route controller
      final routeController = Get.find<RouteController>();
      
      // Try to get latest subscription route, or optimize if not found
      RoutePlanModel? route = await routeController.getLatestSubscriptionRoute(driverId);
      
      if (route == null) {
        // If no route found, optimize one
        route = await routeController.optimizeSubscriptionRoute(driverId);
      }

      if (route != null && route.stops != null && route.stops!.isNotEmpty) {
        await _displayRoute(route);
      } else {
        setState(() {
          _errorMessage = 'No subscription orders found for route optimization.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error loading subscription route: $e');
      }
      setState(() {
        _errorMessage = 'Failed to load subscription route: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _displayRoute(RoutePlanModel route) async {
    _markers.clear();
    _polylines.clear();

    if (route.stops == null || route.stops!.isEmpty) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    // Sort stops by sequence if available
    List<RouteStop> sortedStops = List.from(route.stops!);
    if (route.sequence != null && route.sequence!.isNotEmpty) {
      // Reorder stops based on sequence array (which contains indices in the correct order)
      sortedStops = route.sequence!
          .map((idx) {
            if (idx >= 0 && idx < route.stops!.length) {
              return route.stops![idx];
            }
            return null;
          })
          .whereType<RouteStop>()
          .toList();
      
      if (kDebugMode) {
        print('Route stops reordered using sequence. Total stops: ${sortedStops.length}');
        print('First 5 stops sequence: ${sortedStops.take(5).map((s) => '${s.sequence ?? "?"}(${s.type})').join(" → ")}');
      }
    } else if (sortedStops.any((s) => s.sequence != null)) {
      // If no sequence array but stops have sequence numbers, sort by sequence
      sortedStops.sort((a, b) {
        if (a.sequence != null && b.sequence != null) {
          return a.sequence!.compareTo(b.sequence!);
        }
        return 0;
      });
      
      if (kDebugMode) {
        print('Route stops sorted by sequence field. Total stops: ${sortedStops.length}');
      }
    }

    // Add markers for each stop with sequence numbers
    for (int i = 0; i < sortedStops.length; i++) {
      final stop = sortedStops[i];
      final isPickup = stop.type == 'pickup';
      final sequenceNumber = stop.sequence ?? (i + 1);
      
      _markers.add(
        Marker(
          point: ll.LatLng(stop.lat, stop.lng),
          width: 50,
          height: 50,
          child: Container(
            decoration: BoxDecoration(
              color: isPickup ? Colors.green : Colors.red,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: Center(
              child: Text(
                '$sequenceNumber',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ),
      );
    }

    // If polyline is available, use it; otherwise, create route between stops
    if (route.polyline != null && route.polyline!.isNotEmpty) {
      // Parse polyline (assuming it's in format "lat1,lng1;lat2,lng2;...")
      try {
        final points = route.polyline!.split(';').map((pointStr) {
          final coords = pointStr.split(',');
          if (coords.length == 2) {
            return ll.LatLng(
              double.parse(coords[0].trim()),
              double.parse(coords[1].trim()),
            );
          }
          return null;
        }).whereType<ll.LatLng>().toList();

        if (points.isNotEmpty) {
          if (kDebugMode) {
            print('✅ Using polyline from backend with ${points.length} points');
            print('   First point: ${points.first.latitude}, ${points.first.longitude}');
            print('   Last point: ${points.last.latitude}, ${points.last.longitude}');
          }
          // Create a single continuous polyline connecting all points in sequence
          _polylines.add(
            Polyline(
              points: points,
              strokeWidth: 4.0,
              color: Colors.blue,
              borderStrokeWidth: 1.0,
              borderColor: Colors.white,
            ),
          );
        } else {
          // If polyline parsing failed, fall through to create route from stops
          if (kDebugMode) {
            print('⚠️ Polyline parsed but resulted in empty points');
          }
        }
      } catch (e) {
        if (kDebugMode) {
          print('❌ Error parsing polyline: $e');
        }
        // Fall through to create route from stops
      }
    } else {
      if (kDebugMode) {
        print('⚠️ No polyline available from backend, will create route from stops');
      }
    }

    // If no polyline or parsing failed, create route from stops using DirectionsHelper
    // This creates ONE continuous route connecting all stops in sequence
    if (_polylines.isEmpty && sortedStops.length > 1) {
      await _createRouteFromStops(sortedStops);
    } else if (sortedStops.length == 1) {
      // Single stop - just show marker
      _polylines.clear();
    }

    // Calculate bounds to fit all markers
    if (sortedStops.isNotEmpty) {
      final lats = sortedStops.map((s) => s.lat).toList();
      final lngs = sortedStops.map((s) => s.lng).toList();
      
      final minLat = lats.reduce(min);
      final maxLat = lats.reduce(max);
      final minLng = lngs.reduce(min);
      final maxLng = lngs.reduce(max);

      // Center the map on the route
      final centerLat = (minLat + maxLat) / 2;
      final centerLng = (minLng + maxLng) / 2;

      // Calculate zoom level to fit all markers
      final latDiff = maxLat - minLat;
      final lngDiff = maxLng - minLng;
      final maxDiff = max(latDiff, lngDiff);
      
      double zoom = 12.0;
      if (maxDiff > 0.1) {
        zoom = 10.0;
      } else if (maxDiff > 0.05) {
        zoom = 11.0;
      } else if (maxDiff > 0.01) {
        zoom = 13.0;
      } else {
        zoom = 14.0;
      }

      // Move map to center and zoom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(ll.LatLng(centerLat, centerLng), zoom);
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _createRouteFromStops(List<RouteStop> stops) async {
    if (stops.length < 2) return;

    try {
      // Create ONE continuous route by connecting consecutive stops sequentially
      // This ensures the route flows from stop 1 → 2 → 3 → 4, etc.
      List<ll.LatLng> allRoutePoints = [];
      
      for (int i = 0; i < stops.length - 1; i++) {
        final from = stops[i];
        final to = stops[i + 1];

        try {
          final routePoints = await DirectionsHelper.getRoute(
            from.lat,
            from.lng,
            to.lat,
            to.lng,
          );

          if (routePoints.length > 2) {
            // Add route points, but skip the first point if it's the same as the last point
            // (to avoid duplicate points at junctions)
            if (allRoutePoints.isNotEmpty) {
              final lastPoint = allRoutePoints.last;
              final firstNewPoint = routePoints.first;
              
              // If the first point of new route is very close to last point, skip it
              final distance = _calculateDistance(
                lastPoint.latitude, lastPoint.longitude,
                firstNewPoint.latitude, firstNewPoint.longitude
              );
              
              if (distance < 0.001) { // Less than ~100 meters
                // Skip first point, add rest
                allRoutePoints.addAll(routePoints.skip(1));
              } else {
                // Add all points
                allRoutePoints.addAll(routePoints);
              }
            } else {
              // First segment - add all points
              allRoutePoints.addAll(routePoints);
            }
          } else {
            // Fallback to straight line - add both points
            if (allRoutePoints.isEmpty || 
                _calculateDistance(
                  allRoutePoints.last.latitude, allRoutePoints.last.longitude,
                  from.lat, from.lng
                ) > 0.001) {
              allRoutePoints.add(ll.LatLng(from.lat, from.lng));
            }
            allRoutePoints.add(ll.LatLng(to.lat, to.lng));
          }
        } catch (e) {
          if (kDebugMode) {
            print('Error fetching route between stops $i and ${i + 1}: $e');
          }
          // Add straight line as fallback
          if (allRoutePoints.isEmpty || 
              _calculateDistance(
                allRoutePoints.last.latitude, allRoutePoints.last.longitude,
                from.lat, from.lng
              ) > 0.001) {
            allRoutePoints.add(ll.LatLng(from.lat, from.lng));
          }
          allRoutePoints.add(ll.LatLng(to.lat, to.lng));
        }
      }
      
      // Create a single continuous polyline for the entire route
      if (allRoutePoints.isNotEmpty) {
        _polylines.add(
          Polyline(
            points: allRoutePoints,
            strokeWidth: 4.0,
            color: Colors.blue,
            borderStrokeWidth: 1.0,
            borderColor: Colors.white,
          ),
        );
        
        if (kDebugMode) {
          print('Created continuous route with ${allRoutePoints.length} points connecting ${stops.length} stops');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error creating route from stops: $e');
      }
    }
  }

  // Helper method to calculate distance between two points (in degrees, approximate)
  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    return (lat2 - lat1) * (lat2 - lat1) + (lng2 - lng1) * (lng2 - lng1);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription Orders Route'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSubscriptionRoute,
            tooltip: 'Refresh Route',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red[300],
                      ),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      Padding(
                        padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                        child: Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeLarge,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      ElevatedButton(
                        onPressed: _loadSubscriptionRoute,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : Stack(
                  children: [
                    FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: ll.LatLng(0, 0),
                        initialZoom: 10,
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
                    // Route info card
                    GetBuilder<RouteController>(
                      builder: (routeController) {
                        final route = routeController.subscriptionRoute;
                        if (route == null) return const SizedBox.shrink();

                        return Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 10,
                                  offset: const Offset(0, -2),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Route Information',
                                  style: robotoBold.copyWith(
                                    fontSize: Dimensions.fontSizeLarge,
                                  ),
                                ),
                                const SizedBox(height: Dimensions.paddingSizeSmall),
                                if (route.totalDistanceKm != null)
                                  Text(
                                    'Total Distance: ${route.totalDistanceKm!.toStringAsFixed(2)} km',
                                    style: robotoRegular,
                                  ),
                                if (route.estimatedDurationSec != null)
                                  Text(
                                    'Estimated Duration: ${_formatDuration(route.estimatedDurationSec!)}',
                                    style: robotoRegular,
                                  ),
                                Text(
                                  'Stops: ${route.stops?.length ?? 0}',
                                  style: robotoRegular,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
    );
  }

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    
    if (hours > 0) {
      return '$hours h ${minutes} m';
    } else {
      return '$minutes m';
    }
  }
}

