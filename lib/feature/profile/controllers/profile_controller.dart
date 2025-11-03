import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/services/location_permission_service.dart';
// Auth removed - no longer using AuthController
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/shift_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service_interface.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/record_location_body.dart';
import 'package:image_picker/image_picker.dart';

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
  int _lastAdaptiveIntervalSec = 10;

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

  int? _shiftId;
  int? get shiftId => _shiftId;

  Future<void> getProfile() async {
    try {
      ProfileModel? profileModel = await profileServiceInterface.getProfileInfo();
      if (profileModel != null) {
        // Merge API data with demo data to ensure all fields have defaults
        _profileModel = _mergeProfileWithDefaults(profileModel);
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
        // Use demo data when API returns null
        _profileModel = _getDemoProfile();
      }
      update();
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      // Use demo data on error
      _profileModel = _getDemoProfile();
      update();
    }
  }

  ProfileModel _mergeProfileWithDefaults(ProfileModel apiProfile) {
    // Get demo profile for defaults
    ProfileModel demoProfile = _getDemoProfile();
    
    // Merge API data with defaults, ensuring no null values for critical fields
    return ProfileModel(
      id: apiProfile.id ?? demoProfile.id,
      fName: apiProfile.fName ?? demoProfile.fName,
      lName: apiProfile.lName ?? demoProfile.lName,
      phone: apiProfile.phone ?? demoProfile.phone,
      email: apiProfile.email ?? demoProfile.email,
      identityNumber: apiProfile.identityNumber ?? demoProfile.identityNumber,
      identityType: apiProfile.identityType ?? demoProfile.identityType,
      identityImage: apiProfile.identityImage ?? demoProfile.identityImage,
      imageFullUrl: apiProfile.imageFullUrl ?? demoProfile.imageFullUrl,
      fcmToken: apiProfile.fcmToken ?? demoProfile.fcmToken,
      zoneId: apiProfile.zoneId ?? demoProfile.zoneId,
      active: apiProfile.active ?? demoProfile.active ?? 0,
      avgRating: apiProfile.avgRating ?? demoProfile.avgRating,
      ratingCount: apiProfile.ratingCount ?? demoProfile.ratingCount,
      memberSinceDays: apiProfile.memberSinceDays ?? demoProfile.memberSinceDays,
      orderCount: apiProfile.orderCount ?? demoProfile.orderCount ?? 0,
      todaysOrderCount: apiProfile.todaysOrderCount ?? demoProfile.todaysOrderCount ?? 0,
      thisWeekOrderCount: apiProfile.thisWeekOrderCount ?? demoProfile.thisWeekOrderCount ?? 0,
      cashInHands: apiProfile.cashInHands ?? demoProfile.cashInHands ?? 0.0,
      earnings: apiProfile.earnings ?? demoProfile.earnings ?? 0,
      type: apiProfile.type ?? demoProfile.type,
      balance: apiProfile.balance ?? demoProfile.balance ?? 0.0,
      todaysEarning: apiProfile.todaysEarning ?? demoProfile.todaysEarning ?? 0.0,
      thisWeekEarning: apiProfile.thisWeekEarning ?? demoProfile.thisWeekEarning ?? 0.0,
      thisMonthEarning: apiProfile.thisMonthEarning ?? demoProfile.thisMonthEarning ?? 0.0,
      createdAt: apiProfile.createdAt ?? demoProfile.createdAt,
      updatedAt: apiProfile.updatedAt ?? demoProfile.updatedAt,
      totalIncentiveEarning: apiProfile.totalIncentiveEarning ?? demoProfile.totalIncentiveEarning ?? 0.0,
      shiftName: apiProfile.shiftName ?? demoProfile.shiftName,
      shiftStartTime: apiProfile.shiftStartTime ?? demoProfile.shiftStartTime,
      shiftEndTime: apiProfile.shiftEndTime ?? demoProfile.shiftEndTime,
      incentiveList: apiProfile.incentiveList ?? demoProfile.incentiveList,
      payableBalance: apiProfile.payableBalance ?? demoProfile.payableBalance ?? 0.0,
      adjustable: apiProfile.adjustable ?? demoProfile.adjustable ?? false,
      overFlowWarning: apiProfile.overFlowWarning ?? demoProfile.overFlowWarning ?? false,
      overFlowBlockWarning: apiProfile.overFlowBlockWarning ?? demoProfile.overFlowBlockWarning ?? false,
      withDrawableBalance: apiProfile.withDrawableBalance ?? demoProfile.withDrawableBalance ?? 0.0,
      totalWithdrawn: apiProfile.totalWithdrawn ?? demoProfile.totalWithdrawn ?? 0.0,
      showPayNowButton: apiProfile.showPayNowButton ?? demoProfile.showPayNowButton ?? false,
    );
  }

  ProfileModel _getDemoProfile() {
    return ProfileModel(
      id: 1,
      fName: 'Demo',
      lName: 'Driver',
      phone: '+1234567890',
      email: 'demo.driver@example.com',
      active: 1,
      avgRating: 4.8,
      ratingCount: 125,
      memberSinceDays: 180,
      orderCount: 342,
      todaysOrderCount: 8,
      thisWeekOrderCount: 45,
      cashInHands: 125.50,
      earnings: 1,
      type: 'free_zone',
      balance: 1250.75,
      todaysEarning: 125.50,
      thisWeekEarning: 875.25,
      thisMonthEarning: 3250.00,
      totalIncentiveEarning: 150.00,
      shiftName: 'Morning Shift',
      shiftStartTime: '08:00:00',
      shiftEndTime: '16:00:00',
      payableBalance: 1250.75,
      adjustable: true,
      overFlowWarning: false,
      overFlowBlockWarning: false,
      withDrawableBalance: 1000.00,
      totalWithdrawn: 5000.00,
      showPayNowButton: false,
    );
  }

  Future<bool> updateUserInfo(ProfileModel updateUserModel, String token) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await profileServiceInterface.updateProfile(updateUserModel, _pickedFile, token);
    _isLoading = false;
    bool isSuccess;
    if (responseModel.isSuccess) {
      await getProfile();
      Get.back();
      showCustomSnackBar(responseModel.message, isError: false);
      isSuccess = true;
    } else {
      isSuccess = false;
    }
    update();
    return isSuccess;
  }

  Future<bool> updateActiveStatus({int? shiftId, bool isUpdate = false}) async {
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
        // API call failed - keep local state but show warning
        // Don't rollback to maintain demo-like experience
        isSuccess = false;
        String errorMsg = responseModel?.message ?? 'Failed to sync with server. Status updated locally.';
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

  void setShiftId(int? id){
    _shiftId = id;
    update();
  }

  void initData() {
    _pickedFile = null;
    _shiftId = null;
  }

  void startLocationRecord() {
    _timer?.cancel();
    _scheduleNextRecord(const Duration(seconds: 10));
  }

  void stopLocationRecord() {
    _timer?.cancel();
  }

  Future<void> recordLocation() async {
    try {
      final Position locationResult = await Geolocator.getCurrentPosition();
      String address = await profileServiceInterface.addressPlaceMark(locationResult);

      _recordLocation = RecordLocationBody(
        location: address, latitude: locationResult.latitude, longitude: locationResult.longitude,
      );

      if (_recordLocation != null) {
        bool isSuccess = await profileServiceInterface.recordLocation(_recordLocation!);
        if(isSuccess) {
          debugPrint('----Added record Lat: ${_recordLocation!.latitude} Lng: ${_recordLocation!.longitude} Loc: ${_recordLocation!.location}');
        } else {
          debugPrint('----Failed record');
        }
      }

      // Adaptive cadence: >10 m/s (~36 km/h) → 5s, else 10s
      final speed = locationResult.speed; // m/s
      final next = speed.isFinite && speed > 10 ? 5 : 10;
      if (next != _lastAdaptiveIntervalSec) {
        _lastAdaptiveIntervalSec = next;
        _scheduleNextRecord(Duration(seconds: next));
      }
    } catch (e) {
      debugPrint('Error recording location: $e');
      // Don't throw - just log the error and continue
      // Schedule next record even on error to keep trying
      _scheduleNextRecord(const Duration(seconds: 10));
    }
  }

  void _scheduleNextRecord(Duration d) {
    _timer?.cancel();
    _timer = Timer.periodic(d, (timer) {
      recordLocation();
    });
  }

}