import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
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
  GoogleMapController? _mapController;
  LatLng? _selectedLocation;
  String? _address;
  final double _radiusKm = 10.0;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    if (controller.registrationData.latitude != null &&
        controller.registrationData.longitude != null) {
      _selectedLocation = LatLng(
        controller.registrationData.latitude!,
        controller.registrationData.longitude!,
      );
      _address = controller.registrationData.address;
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
      _selectedLocation = LatLng(position.latitude, position.longitude);
      await _getAddressFromLatLng(_selectedLocation!);
      
      if (_mapController != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(_selectedLocation!, 12),
        );
      }
    } catch (e) {
      showCustomSnackBar('failed_to_get_location'.tr);
    }
  }

  Future<void> _getAddressFromLatLng(LatLng latLng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _address = '${place.street}, ${place.locality}, ${place.administrativeArea}, ${place.postalCode}';
        setState(() {});
      }
    } catch (e) {
      _address = 'Lat: ${latLng.latitude.toStringAsFixed(6)}, Lng: ${latLng.longitude.toStringAsFixed(6)}';
      setState(() {});
    }
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
                      _selectedLocation == null
                          ? const Center(child: CircularProgressIndicator())
                          : GoogleMap(
                              initialCameraPosition: CameraPosition(
                                target: _selectedLocation!,
                                zoom: 12,
                              ),
                              onMapCreated: (GoogleMapController controller) {
                                _mapController = controller;
                              },
                              onTap: (LatLng latLng) async {
                                setState(() {
                                  _selectedLocation = latLng;
                                });
                                await _getAddressFromLatLng(latLng);
                              },
                              markers: _selectedLocation != null
                                  ? {
                                      Marker(
                                        markerId: const MarkerId('selected_location'),
                                        position: _selectedLocation!,
                                      ),
                                    }
                                  : {},
                              circles: _selectedLocation != null
                                  ? {
                                      Circle(
                                        circleId: const CircleId('radius_circle'),
                                        center: _selectedLocation!,
                                        radius: _radiusKm * 1000, // Convert km to meters
                                        fillColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                                        strokeColor: Theme.of(context).primaryColor,
                                        strokeWidth: 2,
                                      ),
                                    }
                                  : {},
                            ),
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
                              onPressed: _selectedLocation != null && _address != null
                                  ? () {
                                      controller.setLocation(
                                        _selectedLocation!.latitude,
                                        _selectedLocation!.longitude,
                                        _address!,
                                      );
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

