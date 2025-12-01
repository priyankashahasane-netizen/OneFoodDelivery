import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/data/indian_states_cities.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep4Screen extends StatefulWidget {
  const RegistrationStep4Screen({super.key});

  @override
  State<RegistrationStep4Screen> createState() => _RegistrationStep4ScreenState();
}

class _RegistrationStep4ScreenState extends State<RegistrationStep4Screen> {
  gmaps.GoogleMapController? _googleMapController;
  MapController? _flutterMapController;
  gmaps.LatLng? _selectedLocationGoogle;
  ll.LatLng? _selectedLocationFlutter;
  String? _address;
  final double _radiusKm = 10.0;
  double _currentZoom = 12.0;
  
  bool get _useFlutterMap => GetPlatform.isWeb || GetPlatform.isDesktop;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    if (controller.registrationData.latitude != null &&
        controller.registrationData.longitude != null) {
      if (_useFlutterMap) {
        _selectedLocationFlutter = ll.LatLng(
          controller.registrationData.latitude!,
          controller.registrationData.longitude!,
        );
      } else {
        _selectedLocationGoogle = gmaps.LatLng(
          controller.registrationData.latitude!,
          controller.registrationData.longitude!,
        );
      }
      _address = controller.registrationData.address;
    }
    if (_useFlutterMap) {
      _flutterMapController = MapController();
    }
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(4);
    });
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        showCustomSnackBar('location_services_disabled'.tr);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          showCustomSnackBar('location_permission_denied'.tr);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        showCustomSnackBar('location_permission_denied_permanently'.tr);
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      if (_useFlutterMap) {
        _selectedLocationFlutter = ll.LatLng(position.latitude, position.longitude);
        await _getAddressFromLatLngFlutter(_selectedLocationFlutter!);
        if (_flutterMapController != null) {
          _currentZoom = 12.0;
          _flutterMapController!.move(_selectedLocationFlutter!, _currentZoom);
        }
      } else {
        _selectedLocationGoogle = gmaps.LatLng(position.latitude, position.longitude);
        await _getAddressFromLatLng(_selectedLocationGoogle!);
        if (_googleMapController != null) {
          _googleMapController!.animateCamera(
            gmaps.CameraUpdate.newLatLngZoom(_selectedLocationGoogle!, 12),
          );
        }
      }
    } catch (e) {
      showCustomSnackBar('failed_to_get_location'.tr);
    }
  }

  Future<void> _getAddressFromLatLng(gmaps.LatLng latLng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _address = '${place.street}, ${place.locality}, ${place.administrativeArea}, ${place.postalCode}';
        
        // Extract and set state and city from location
        _extractAndSetStateCity(place);
        
        setState(() {});
      }
    } catch (e) {
      _address = 'Lat: ${latLng.latitude.toStringAsFixed(6)}, Lng: ${latLng.longitude.toStringAsFixed(6)}';
      setState(() {});
    }
  }

  Future<void> _getAddressFromLatLngFlutter(ll.LatLng latLng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _address = '${place.street}, ${place.locality}, ${place.administrativeArea}, ${place.postalCode}';
        
        // Extract and set state and city from location
        _extractAndSetStateCity(place);
        
        setState(() {});
      }
    } catch (e) {
      _address = 'Lat: ${latLng.latitude.toStringAsFixed(6)}, Lng: ${latLng.longitude.toStringAsFixed(6)}';
      setState(() {});
    }
  }

  /// Extract state and city from Placemark and update registration controller
  void _extractAndSetStateCity(Placemark place) {
    final controller = Get.find<RegistrationController>();
    
    // Try to get state from administrativeArea or subAdministrativeArea
    String? stateName = place.administrativeArea ?? place.subAdministrativeArea;
    
    if (stateName != null && stateName.isNotEmpty) {
      // Match state name with our states list (case-insensitive, handle variations)
      final allStates = IndianStatesCities.getStates();
      String? matchedState = _findMatchingState(stateName, allStates);
      
      if (matchedState != null) {
        // Only update if state is not already set or if it's different
        if (controller.registrationData.state != matchedState) {
          controller.setState(matchedState);
        }
        
        // Try to get city from locality or subLocality
        String? cityName = place.locality ?? place.subLocality ?? place.name;
        
        if (cityName != null && cityName.isNotEmpty) {
          // Get cities for the matched state
          final cities = IndianStatesCities.getCitiesByState(matchedState);
          String? matchedCity = _findMatchingCity(cityName, cities);
          
          if (matchedCity != null && controller.registrationData.city != matchedCity) {
            controller.setCity(matchedCity);
          }
        }
      }
    }
  }

  /// Find matching state from the states list (case-insensitive, handles common variations)
  String? _findMatchingState(String stateName, List<String> allStates) {
    // Direct match (case-insensitive)
    for (String state in allStates) {
      if (state.toLowerCase() == stateName.toLowerCase()) {
        return state;
      }
    }
    
    // Partial match (handles cases like "Maharashtra" vs "Maharashtra State")
    String normalizedInput = stateName.toLowerCase().replaceAll(RegExp(r'\s+state\s*$'), '').trim();
    for (String state in allStates) {
      String normalizedState = state.toLowerCase();
      if (normalizedState == normalizedInput || 
          normalizedState.contains(normalizedInput) ||
          normalizedInput.contains(normalizedState)) {
        return state;
      }
    }
    
    return null;
  }

  /// Find matching city from the cities list (case-insensitive)
  String? _findMatchingCity(String cityName, List<String> cities) {
    // Direct match (case-insensitive)
    for (String city in cities) {
      if (city.toLowerCase() == cityName.toLowerCase()) {
        return city;
      }
    }
    
    // Partial match
    String normalizedInput = cityName.toLowerCase().trim();
    for (String city in cities) {
      String normalizedCity = city.toLowerCase();
      if (normalizedCity.contains(normalizedInput) || 
          normalizedInput.contains(normalizedCity)) {
        return city;
      }
    }
    
    return null;
  }

  /// Generate points for a circle polygon based on geographic coordinates
  /// This creates a proper geographic circle that scales with zoom automatically
  /// Uses the destination point formula to calculate points at a fixed distance
  /// Formula verified: creates a circle with exact radius in meters
  List<ll.LatLng> _generateCirclePoints(ll.LatLng center, double radiusMeters) {
    const int points = 64; // Number of points to create a smooth circle
    final List<ll.LatLng> circlePoints = [];
    
    // Earth's radius in kilometers (standard value: 6371 km)
    const double earthRadiusKm = 6371.0;
    
    // Convert radius from meters to kilometers for calculation
    // Example: 10000 meters = 10.0 km
    final double radiusKm = radiusMeters / 1000.0;
    
    // Convert center coordinates to radians
    final double latRad = center.latitude * math.pi / 180.0;
    final double lonRad = center.longitude * math.pi / 180.0;
    
    // Angular distance in radians (distance / earth radius)
    // This represents the angle subtended by the radius at Earth's center
    final double angularDistance = radiusKm / earthRadiusKm;
    
    // Generate points around the circle
    for (int i = 0; i <= points; i++) {
      // Bearing in radians (direction from center to point on circle)
      // 0 = North, π/2 = East, π = South, 3π/2 = West
      final double bearing = 2 * math.pi * i / points;
      
      // Calculate destination point using spherical trigonometry
      // This gives us a point exactly 'radiusKm' kilometers away from center
      final double latPoint = math.asin(
        math.sin(latRad) * math.cos(angularDistance) +
        math.cos(latRad) * math.sin(angularDistance) * math.cos(bearing)
      );
      
      final double lonPoint = lonRad + math.atan2(
        math.sin(bearing) * math.sin(angularDistance) * math.cos(latRad),
        math.cos(angularDistance) - math.sin(latRad) * math.sin(latPoint)
      );
      
      // Convert back to degrees and add to circle points
      circlePoints.add(ll.LatLng(
        latPoint * 180.0 / math.pi,
        lonPoint * 180.0 / math.pi,
      ));
    }
    
    return circlePoints;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 4'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 4),
                  Expanded(
                    child: Stack(
                      children: [
                        _useFlutterMap
                            ? (_selectedLocationFlutter == null
                                ? const Center(child: CircularProgressIndicator())
                                : FlutterMap(
                                    mapController: _flutterMapController,
                                    options: MapOptions(
                                      initialCenter: _selectedLocationFlutter!,
                                      initialZoom: 12.0,
                                      interactionOptions: const InteractionOptions(
                                        flags: InteractiveFlag.all,
                                      ),
                                      onTap: (tapPosition, point) async {
                                        setState(() {
                                          _selectedLocationFlutter = point;
                                        });
                                        await _getAddressFromLatLngFlutter(point);
                                        if (_flutterMapController != null) {
                                          _flutterMapController!.move(point, _currentZoom);
                                        }
                                      },
                                      onMapReady: () {
                                        // Ensure circle is redrawn when map is ready
                                        setState(() {});
                                      },
                                      onMapEvent: (MapEvent event) {
                                        // Update zoom level when map is moved/zoomed
                                        if (event is MapEventMove || event is MapEventScrollWheelZoom || event is MapEventFlingAnimation) {
                                          final newZoom = _flutterMapController?.camera.zoom ?? _currentZoom;
                                          if ((newZoom - _currentZoom).abs() > 0.1) {
                                            setState(() {
                                              _currentZoom = newZoom;
                                            });
                                          }
                                        }
                                      },
                                    ),
                                    children: [
                                      TileLayer(
                                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                        userAgentPackageName: 'com.sixamtech.app_retain',
                                        maxZoom: 19,
                                        minZoom: 3,
                                      ),
                                      if (_selectedLocationFlutter != null) ...[
                                        MarkerLayer(
                                          markers: [
                                            Marker(
                                              point: _selectedLocationFlutter!,
                                              width: 40,
                                              height: 40,
                                              child: Icon(
                                                Icons.location_on,
                                                color: Theme.of(context).primaryColor,
                                                size: 40,
                                              ),
                                            ),
                                          ],
                                        ),
                                        PolygonLayer(
                                          polygons: [
                                            Polygon(
                                              points: _generateCirclePoints(_selectedLocationFlutter!, _radiusKm * 1000),
                                              color: Theme.of(context).primaryColor.withValues(alpha: 0.15),
                                              borderColor: Theme.of(context).primaryColor,
                                              borderStrokeWidth: 3,
                                              isFilled: true,
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ))
                            : (_selectedLocationGoogle == null
                                ? const Center(child: CircularProgressIndicator())
                                : gmaps.GoogleMap(
                                    initialCameraPosition: gmaps.CameraPosition(
                                      target: _selectedLocationGoogle!,
                                      zoom: 12,
                                    ),
                                    onMapCreated: (gmaps.GoogleMapController controller) {
                                      _googleMapController = controller;
                                    },
                                    onTap: (gmaps.LatLng latLng) async {
                                      setState(() {
                                        _selectedLocationGoogle = latLng;
                                      });
                                      await _getAddressFromLatLng(latLng);
                                    },
                                    markers: _selectedLocationGoogle != null
                                        ? {
                                            gmaps.Marker(
                                              markerId: const gmaps.MarkerId('selected_location'),
                                              position: _selectedLocationGoogle!,
                                            ),
                                          }
                                        : {},
                                    circles: _selectedLocationGoogle != null
                                        ? {
                                            gmaps.Circle(
                                              circleId: const gmaps.CircleId('radius_circle'),
                                              center: _selectedLocationGoogle!,
                                              radius: _radiusKm * 1000, // Convert km to meters
                                              fillColor: Theme.of(context).primaryColor.withValues(alpha: 0.15),
                                              strokeColor: Theme.of(context).primaryColor,
                                              strokeWidth: 3,
                                            ),
                                          }
                                        : {},
                                  )),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: FloatingActionButton(
                            mini: true,
                            onPressed: _getCurrentLocation,
                            child: const Icon(Icons.my_location),
                          ),
                        ),
                      ],
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withValues(alpha: 0.3),
                        spreadRadius: 1,
                        blurRadius: 5,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      if (_address != null) ...[
                        Text(
                          'Selected Location'.tr,
                          style: robotoBold.copyWith(fontSize: 16),
                        ),
                        const SizedBox(height: Dimensions.paddingSizeSmall),
                        Text(
                          _address!,
                          style: robotoRegular,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: Dimensions.paddingSizeDefault),
                        Text(
                          '10 km radius'.tr,
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: Theme.of(context).hintColor,
                          ),
                        ),
                      ] else
                        Text(
                          'Tap on map to select location'.tr,
                          style: robotoRegular,
                        ),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      Row(
                        children: [
                          Expanded(
                            child: CustomButtonWidget(
                              buttonText: 'previous'.tr,
                              isLoading: false,
                              onPressed: () => Get.back(),
                            ),
                          ),
                          const SizedBox(width: Dimensions.paddingSizeDefault),
                          Expanded(
                            child: CustomButtonWidget(
                              buttonText: 'next'.tr,
                              isLoading: false,
                              onPressed: ((_useFlutterMap ? _selectedLocationFlutter != null : _selectedLocationGoogle != null) && _address != null)
                                  ? () {
                                      if (_useFlutterMap && _selectedLocationFlutter != null) {
                                        controller.setLocation(
                                          _selectedLocationFlutter!.latitude,
                                          _selectedLocationFlutter!.longitude,
                                          _address!,
                                        );
                                      } else if (!_useFlutterMap && _selectedLocationGoogle != null) {
                                        controller.setLocation(
                                          _selectedLocationGoogle!.latitude,
                                          _selectedLocationGoogle!.longitude,
                                          _address!,
                                        );
                                      }
                                      Get.toNamed(RouteHelper.getRegistrationStep5Route());
                                    }
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

