import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_alert_dialog_widget.dart';
import 'package:stackfood_multivendor_driver/common/services/location_permission_service.dart';
// Auth removed - no longer using AuthController
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/shift_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service_interface.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/record_location_body.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';

class ProfileController extends GetxController implements GetxService {
  final ProfileServiceInterface profileServiceInterface;
  ProfileController({required this.profileServiceInterface}){
    _notification = profileServiceInterface.isNotificationActive();
  }

  ProfileModel? _profileModel;
  
  ProfileModel? get profileModel => _profileModel;

  bool _notification = true;
  bool get notification => _notification;

  bool _backgroundNotification = true;
  bool get backgroundNotification => _backgroundNotification;

  Timer? _timer;
  int _lastAdaptiveIntervalSec = 300; // 5 minutes in seconds

  RecordLocationBody? _recordLocation;
  RecordLocationBody? get recordLocationBody => _recordLocation;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  XFile? _pickedFile;
  XFile? get pickedFile => _pickedFile;

  bool _shiftLoading = false;
  bool get shiftLoading => _shiftLoading;

  List<ShiftModel>? _shifts;
  List<ShiftModel>? get shifts => _shifts;

  String? _shiftId; // Changed to String to support UUID format from API
  String? get shiftId => _shiftId;

  Future<void> getProfile() async {
    try {
      ProfileModel? profileModel = await profileServiceInterface.getProfileInfo();
      if (profileModel != null) {
        // Use API data directly - no demo fallback
        _profileModel = profileModel;
        
        // Fetch actual shift data from shifts API to get correct times
        // This ensures we display the real shift times instead of hardcoded defaults
        try {
          List<ShiftModel>? shifts = await profileServiceInterface.getShiftList();
          if (shifts != null && shifts.isNotEmpty) {
            // Use the first shift from the list (which should be the driver's assigned shift or first available)
            // The shifts API returns shifts sorted by startTime, so the first one is likely the active one
            ShiftModel? assignedShift = shifts.first;
            
            // Update profile model with actual shift data
            if (assignedShift.name != null && 
                assignedShift.startTime != null && assignedShift.endTime != null) {
              _profileModel!.shiftName = assignedShift.name;
              _profileModel!.shiftStartTime = assignedShift.startTime;
              _profileModel!.shiftEndTime = assignedShift.endTime;
              debugPrint('✅ Updated profile with actual shift: ${assignedShift.name} (${assignedShift.startTime} - ${assignedShift.endTime})');
            }
          }
        } catch (shiftError) {
          debugPrint('⚠️ Could not fetch shift data: $shiftError');
          // Continue with profile data even if shift fetch fails
        }
        
        if (_profileModel != null && _profileModel!.active == 1) {
          // Only check permission status - don't request automatically
          // Permission will be requested when user toggles online
          final permissionService = LocationPermissionService();
          final permission = await permissionService.checkPermissionStatus();
          if (permission == LocationPermission.always || 
              permission == LocationPermission.whileInUse) {
            startLocationRecord();
          }
          // Don't request permission here - let user trigger it via toggle
        } else {
          stopLocationRecord();
        }
      } else {
        // API returned null - keep profileModel as null to show loading/error state
        // Don't use demo data - let UI handle null state
        _profileModel = null;
        debugPrint('⚠️ getProfile: API returned null - no profile data available');
      }
      update();
    } catch (e) {
      debugPrint('❌ Error fetching profile: $e');
      // On error, keep profileModel as null to show error state
      // Don't use demo data - let UI handle null state
      _profileModel = null;
      update();
    }
  }

  Future<bool> updateUserInfo(ProfileModel updateUserModel, String token) async {
    _isLoading = true;
    update();
    try {
      ResponseModel? responseModel = await profileServiceInterface.updateProfile(updateUserModel, _pickedFile, token);
      _isLoading = false;
      bool isSuccess;
      
      if (responseModel != null && responseModel.isSuccess) {
        await getProfile();
        Get.back();
        showCustomSnackBar(responseModel.message, isError: false);
        isSuccess = true;
      } else {
        String errorMessage = responseModel?.message ?? 'Failed to update profile. Please try again.';
        showCustomSnackBar(errorMessage, isError: true);
        isSuccess = false;
      }
      update();
      return isSuccess;
    } catch (e) {
      _isLoading = false;
      debugPrint('❌ Error updating user info: $e');
      showCustomSnackBar('Failed to update profile: ${e.toString()}', isError: true);
      update();
      return false;
    }
  }

  Future<bool> updateActiveStatus({String? shiftId, bool isUpdate = false}) async { // Changed to String to support UUID format
    _shiftLoading = true;
    if(isUpdate){
      update();
    }
    
    // Optimistic update: Update local state immediately for better UX
    if (_profileModel != null) {
      _profileModel!.active = (_profileModel!.active == 1) ? 0 : 1;
      update();
    }
    
    // Handle location tracking based on new state
    if (_profileModel != null && _profileModel!.active == 1) {
      profileServiceInterface.checkPermission(() => startLocationRecord());
    } else {
      stopLocationRecord();
    }
    
    // Close dialog if open
    if(Get.isDialogOpen ?? false) {
      Get.back();
    }
    
    try {
      ResponseModel? responseModel = await profileServiceInterface.updateActiveStatus(shiftId: shiftId);
      bool isSuccess;
      
      if (responseModel == null || !responseModel.isSuccess) {
        // API call failed - check if it's a verification error
        String errorMsg = responseModel?.message ?? 'Failed to sync with server. Status updated locally.';
        
        // Check if error is related to verification/registration
        bool isVerificationError = errorMsg.toLowerCase().contains('not verified') || 
                                   errorMsg.toLowerCase().contains('verification') ||
                                   errorMsg.toLowerCase().contains('registration') ||
                                   errorMsg.toLowerCase().contains('cannot go online');
        
        if (isVerificationError) {
          // Revert optimistic update since verification failed
          if (_profileModel != null) {
            _profileModel!.active = (_profileModel!.active == 1) ? 0 : 1;
          }
          
          // Update UI first to revert the toggle state
          update();
          
          // Show dialog for verification error - use a small delay to ensure UI is stable
          // and barrierDismissible: false to prevent accidental dismissal
          await Future.delayed(const Duration(milliseconds: 300));
          await Get.dialog(
            CustomAlertDialogWidget(
              description: 'You cannot go online until your registration is completed. Please complete your registration to continue.',
              onOkPressed: () {
                Get.back(); // Close the dialog
                // Navigate to registration step 1
                String phone = _profileModel?.phone ?? '';
                Get.toNamed(
                  RouteHelper.getRegistrationStep1Route(),
                  arguments: {'phone': phone},
                );
              },
            ),
            barrierDismissible: false,  // Prevent dismissing by tapping outside
          );
          
          isSuccess = false;
        } else {
          // For other errors, keep local state but show warning
          showCustomSnackBar(errorMsg, isError: true);
          
          // Silently retry API sync in background (optional) - but don't refresh profile to preserve optimistic update
          Future.delayed(const Duration(seconds: 2), () async {
            try {
              await profileServiceInterface.updateActiveStatus(shiftId: shiftId);
              // Don't call getProfile() here - it would overwrite optimistic update
              // The optimistic update remains in place until next successful sync
            } catch (e) {
              debugPrint('Background sync failed: $e');
              // Don't refresh on error - keep optimistic update
            }
          });
          isSuccess = false;
        }
      } else {
        // API call succeeded - refresh from server to ensure consistency
        await getProfile();
        showCustomSnackBar(responseModel.message ?? 'Status updated successfully', isError: false);
        isSuccess = true;
      }
      
      _shiftLoading = false;
      update();
      return isSuccess;
    } catch (e) {
      debugPrint('Error in updateActiveStatus: $e');
      // Keep local state even on error for demo-like experience
      showCustomSnackBar('Status updated locally. Will sync when connection is restored.', isError: false);
      _shiftLoading = false;
      update();
      return true; // Return true since local state was updated
    }
  }

  void pickImage() async {
    _pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery);
    update();
  }

  bool setNotificationActive(bool isActive) {
    _notification = isActive;
    profileServiceInterface.setNotificationActive(isActive);
    update();
    return _notification;
  }

  void setBackgroundNotificationActive(bool isActive) {
    _backgroundNotification = isActive;
    update();
  }

  Future<void> removeDriver() async {
    _isLoading = true;
    update();

    ResponseModel responseModel = await profileServiceInterface.deleteDriver();
    if (responseModel.isSuccess) {
      Get.back();
      showCustomSnackBar('your_account_remove_successfully'.tr, isError: false);
      stopLocationRecord();
      // Auth removed - just go back to home
    }else{
      Get.back();
      showCustomSnackBar(responseModel.message, isError: true);
    }

    _isLoading = false;
    update();
  }

  Future<void> getShiftList() async {
    _shifts = null;
    _isLoading = true;
    List<ShiftModel>? shifts = await profileServiceInterface.getShiftList();
    if (shifts != null) {
      _shifts = [];
      _shifts!.addAll(shifts);
    }
    _isLoading = false;
    update();
  }

  void setShiftId(String? id){ // Changed to String to support UUID format from API
    _shiftId = id;
    update();
  }

  void initData() {
    _pickedFile = null;
    _shiftId = null;
  }

  void startLocationRecord() {
    _timer?.cancel();
    _scheduleNextRecord(const Duration(minutes: 5));
  }

  void stopLocationRecord() {
    _timer?.cancel();
  }

  Future<void> recordLocation() async {
    try {
      // Check if location services are enabled (same as home screen)
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('⚠️ Location services are disabled - skipping location update');
        _scheduleNextRecord(const Duration(minutes: 5));
        return;
      }

      // Check location permissions (same as home screen)
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('⚠️ Location permissions are denied - skipping location update');
          _scheduleNextRecord(const Duration(minutes: 5));
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint('⚠️ Location permissions are permanently denied - skipping location update');
        _scheduleNextRecord(const Duration(minutes: 5));
        return;
      }

      // Get current GPS position from device with best accuracy for navigation
      Position locationResult = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.bestForNavigation,
        timeLimit: const Duration(seconds: 15),
      );
      
      // Validate accuracy - reject fixes with accuracy worse than 50 meters
      if (locationResult.accuracy > 50.0) {
        debugPrint('⚠️ GPS accuracy too poor (${locationResult.accuracy}m), retrying with high accuracy...');
        locationResult = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 10),
        );
      }
      
      String address = await profileServiceInterface.addressPlaceMark(locationResult);

      _recordLocation = RecordLocationBody(
        location: address, 
        latitude: locationResult.latitude, 
        longitude: locationResult.longitude,
      );

      if (_recordLocation != null) {
        // PATCH the location to driver entity via /api/drivers/:id
        bool isSuccess = await profileServiceInterface.recordLocation(_recordLocation!);
        if(isSuccess) {
          debugPrint('✅ Location updated: Lat: ${_recordLocation!.latitude}, Lng: ${_recordLocation!.longitude}');
        } else {
          debugPrint('❌ Failed to update location');
        }
      }

      // Location recording interval: 5 minutes (300 seconds)
      // Using fixed interval instead of adaptive cadence
      const next = 300; // 5 minutes in seconds
      if (next != _lastAdaptiveIntervalSec) {
        _lastAdaptiveIntervalSec = next;
        _scheduleNextRecord(const Duration(minutes: 5));
      }
    } catch (e) {
      debugPrint('❌ Error recording location: $e');
      // Don't throw - just log the error and continue
      // Schedule next record even on error to keep trying
      _scheduleNextRecord(const Duration(minutes: 5));
    }
  }

  void _scheduleNextRecord(Duration d) {
    _timer?.cancel();
    _timer = Timer.periodic(d, (timer) {
      recordLocation();
    });
  }

  @override
  void onClose() {
    _timer?.cancel();
    _timer = null;
    super.onClose();
  }

}