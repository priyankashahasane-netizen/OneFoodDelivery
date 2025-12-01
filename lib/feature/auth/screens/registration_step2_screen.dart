import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';
import 'package:stackfood_multivendor_driver/data/indian_states_cities.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep2Screen extends StatefulWidget {
  const RegistrationStep2Screen({super.key});

  @override
  State<RegistrationStep2Screen> createState() => _RegistrationStep2ScreenState();
}

class _RegistrationStep2ScreenState extends State<RegistrationStep2Screen> {
  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(2);
      // Auto-fetch location and preselect state if not already set
      if (controller.registrationData.state == null) {
        _getCurrentLocationAndSetState();
      }
    });
  }

  /// Get current location and extract state/city to preselect them
  Future<void> _getCurrentLocationAndSetState() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services disabled, user can manually select
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          // Permission denied, user can manually select
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        // Permission permanently denied, user can manually select
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );

      // Reverse geocode to get address and extract state/city
      await _extractStateCityFromLocation(position.latitude, position.longitude);
    } catch (e) {
      // Silently fail - user can manually select state
      if (Get.isLogEnable) {
        debugPrint('Failed to get location for state preselection: $e');
      }
    }
  }

  /// Extract state and city from coordinates and update registration controller
  Future<void> _extractStateCityFromLocation(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _extractAndSetStateCity(place);
      }
    } catch (e) {
      // Silently fail - user can manually select
      if (Get.isLogEnable) {
        debugPrint('Failed to extract state/city from location: $e');
      }
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
        // Only update if state is not already set
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

  @override
  Widget build(BuildContext context) {
    final states = IndianStatesCities.getStates();
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 2'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          final selectedState = controller.registrationData.state;
          
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 2),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Select State'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Choose your state'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
                    ),
                    child: CustomDropdown<String>(
                      initialValue: selectedState,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                        child: Text(
                          selectedState ?? 'select_state'.tr,
                          style: robotoRegular.copyWith(
                            color: selectedState != null
                                ? Theme.of(context).textTheme.bodyLarge?.color
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                      items: states.map((state) {
                        return DropdownItem<String>(
                          value: state,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Dimensions.paddingSizeDefault,
                              vertical: Dimensions.paddingSizeSmall,
                            ),
                            child: Text(state, style: robotoRegular),
                          ),
                        );
                      }).toList(),
                      onChange: (String? value, int index) {
                        if (value != null) {
                          // Defer controller update to avoid calling update during build
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            controller.setState(value);
                          });
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
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
                          onPressed: selectedState != null
                              ? () => Get.toNamed(RouteHelper.getRegistrationStep3Route())
                              : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

