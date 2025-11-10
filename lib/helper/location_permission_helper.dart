import 'package:geolocator/geolocator.dart';
import 'package:stackfood_multivendor_driver/common/services/location_permission_service.dart';
import 'package:flutter/foundation.dart';

/// Helper class for location permission utilities
class LocationPermissionHelper {
  static final LocationPermissionService _permissionService = LocationPermissionService();

  /// Check current permission status
  static Future<LocationPermission> getPermissionStatus() async {
    return await _permissionService.checkPermissionStatus();
  }

  /// Request location permission
  /// Returns true if granted, false otherwise
  static Future<bool> requestPermission() async {
    final permission = await _permissionService.requestPermission();
    return permission == LocationPermission.always || 
           permission == LocationPermission.whileInUse;
  }

  /// Check if permission is granted
  static Future<bool> isPermissionGranted() async {
    final permission = await getPermissionStatus();
    return permission == LocationPermission.always || 
           permission == LocationPermission.whileInUse;
  }

  /// Open app settings to manually grant permission
  static Future<void> openSettings() async {
    await Geolocator.openAppSettings();
  }

  /// Get permission status as string (for debugging)
  static Future<String> getPermissionStatusString() async {
    final permission = await getPermissionStatus();
    switch (permission) {
      case LocationPermission.denied:
        return 'Denied';
      case LocationPermission.deniedForever:
        return 'Denied Forever';
      case LocationPermission.whileInUse:
        return 'While In Use';
      case LocationPermission.always:
        return 'Always';
      default:
        return 'Unknown';
    }
  }

  /// Request permission with callback
  static Future<void> requestPermissionWithCallback(Function callback) async {
    await _permissionService.checkPermissionWithCallback(callback);
  }
}


