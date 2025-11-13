import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
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

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _startLocationTracking();
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

