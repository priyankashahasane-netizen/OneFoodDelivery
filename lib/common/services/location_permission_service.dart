import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_alert_dialog_widget.dart';

/// Centralized service to serialize all location permission requests
/// Ensures only one requestPermission() call runs at a time
class LocationPermissionService {
  static final LocationPermissionService _instance = LocationPermissionService._internal();
  factory LocationPermissionService() => _instance;
  LocationPermissionService._internal();

  bool _isRequestingPermission = false;
  
  /// Check if a permission request is currently in progress
  bool get isRequestingPermission => _isRequestingPermission;
  
  /// Get current permission status without requesting
  Future<LocationPermission> checkPermissionStatus() async {
    return await Geolocator.checkPermission();
  }
  
  /// Request location permission (serialized - only one at a time)
  /// Returns the permission status after request
  Future<LocationPermission> requestPermission() async {
    if (_isRequestingPermission) {
      debugPrint('Location permission request already in progress, waiting...');
      // Wait a bit and check status instead
      await Future.delayed(const Duration(milliseconds: 100));
      return await Geolocator.checkPermission();
    }
    
    _isRequestingPermission = true;
    
    try {
      // Check current status first
      LocationPermission permission = await Geolocator.checkPermission();
      
      // Only request if not already granted
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        try {
          permission = await Geolocator.requestPermission();
        } catch (e) {
          debugPrint('Error requesting location permission: $e');
          // If request fails, check status again
          permission = await Geolocator.checkPermission();
        }
      }
      
      return permission;
    } finally {
      _isRequestingPermission = false;
    }
  }
  
  /// Check permission and request if needed, then execute callback
  /// Handles dialog display for denied permissions
  Future<void> checkPermissionWithCallback(Function callback) async {
    if (_isRequestingPermission) {
      debugPrint('Location permission request already in progress, checking status...');
      // If already requesting, just check status
      LocationPermission currentPermission = await Geolocator.checkPermission();
      if (currentPermission == LocationPermission.always || 
          currentPermission == LocationPermission.whileInUse) {
        callback();
      }
      return;
    }
    
    try {
      _isRequestingPermission = true;
      
      LocationPermission permission = await requestPermission();
      
      while(Get.isDialogOpen ?? false) {
        Get.back();
      }

      if(permission == LocationPermission.denied) {
        Get.dialog(CustomAlertDialogWidget(
          description: 'you_denied'.tr, 
          onOkPressed: () async {
            Get.back();
            if (!_isRequestingPermission) {
              await _handleDeniedPermission(callback);
            }
          }
        ));
      } else if(permission == LocationPermission.deniedForever || 
                (!GetPlatform.isIOS && permission == LocationPermission.whileInUse)) {
        Get.dialog(CustomAlertDialogWidget(
          description: permission == LocationPermission.whileInUse 
              ? 'you_denied'.tr 
              : 'you_denied_forever'.tr, 
          onOkPressed: () async {
            Get.back();
            await Geolocator.openAppSettings();
            Future.delayed(const Duration(seconds: 3), () {
              if(GetPlatform.isAndroid && !_isRequestingPermission) {
                checkPermissionWithCallback(callback);
              }
            });
          }
        ));
      } else {
        callback();
      }
    } finally {
      _isRequestingPermission = false;
    }
  }
  
  /// Handle denied permission - check again and request if needed
  Future<void> _handleDeniedPermission(Function callback) async {
    if (_isRequestingPermission) return;
    
    try {
      _isRequestingPermission = true;
      final perm = await Geolocator.checkPermission();
      
      if(perm == LocationPermission.deniedForever) {
        await Geolocator.openAppSettings();
      } else if(perm == LocationPermission.denied) {
        try {
          await Geolocator.requestPermission();
        } catch (e) {
          debugPrint('Error in dialog permission request: $e');
        }
        final updatedPerm = await Geolocator.checkPermission();
        if(GetPlatform.isAndroid && updatedPerm == LocationPermission.denied) {
          // Retry for Android
          checkPermissionWithCallback(callback);
        } else if(updatedPerm == LocationPermission.always || 
                  updatedPerm == LocationPermission.whileInUse) {
          callback();
        }
      } else if(perm == LocationPermission.always || 
                perm == LocationPermission.whileInUse) {
        callback();
      }
    } finally {
      _isRequestingPermission = false;
    }
  }
}

