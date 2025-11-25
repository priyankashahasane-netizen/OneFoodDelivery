import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/record_location_body.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/shift_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/repositories/profile_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:convert';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:image_picker/image_picker.dart';

class ProfileRepository implements ProfileRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  ProfileRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<ProfileModel?> getProfileInfo() async {
    ProfileModel? profileModel;
    // Use new JWT-based endpoint
    // Use handleError: false to preserve actual status codes and error information
    Response response = await apiClient.getData(AppConstants.driverProfileUri, handleError: false);
    if (response.statusCode == 200 && response.body != null) {
      try {
        profileModel = ProfileModel.fromJson(response.body);
        debugPrint('✅ getProfileInfo: Successfully parsed profile data');
      } catch (e) {
        debugPrint('❌ getProfileInfo: Error parsing profile data: $e');
        debugPrint('Response body: ${response.body}');
      }
    } else {
      debugPrint('❌ getProfileInfo: API returned status ${response.statusCode}');
      debugPrint('Response body: ${response.body}');
      debugPrint('Response statusText: ${response.statusText}');
    }
    return profileModel;
  }

  @override
  Future<bool> recordLocation(RecordLocationBody recordLocationBody) async {
    // Update driver's last location using PATCH /api/drivers/:id
    // This updates the driver entity with current GPS coordinates from device
    try {
      // Get driver UUID
      String? driverUuid = await _getDriverUuid();
      
      if (driverUuid == null || driverUuid.isEmpty) {
        debugPrint('❌ Could not determine driver UUID for location update');
        return false;
      }
      
      // Validate that we have location data
      if (recordLocationBody.latitude == null || recordLocationBody.longitude == null) {
        debugPrint('❌ Missing latitude or longitude in location data');
        return false;
      }
      
      // Prepare body with only latitude and longitude (as per UpdateDriverDto)
      Map<String, dynamic> body = {
        'latitude': recordLocationBody.latitude,
        'longitude': recordLocationBody.longitude,
      };
      
      // Use PATCH to update driver location
      Response response = await apiClient.patchData(
        '${AppConstants.driverUpdateUri}/$driverUuid',
        body,
        handleError: false,
      );
      
      // Accept 200, 204 (successful update)
      if (response.statusCode == 200 || response.statusCode == 204) {
        debugPrint('✅ Driver location updated: Lat: ${recordLocationBody.latitude}, Lng: ${recordLocationBody.longitude}');
        return true;
      } else {
        debugPrint('❌ Failed to update driver location: Status ${response.statusCode}');
        if (response.body != null) {
          debugPrint('Response body: ${response.body}');
        }
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error updating driver location: $e');
      // Don't throw - location updates should fail gracefully
      return false;
    }
  }

  /// Get driver UUID from multiple sources (profile response, token, or hardcoded fallback)
  Future<String?> _getDriverUuid() async {
    // First, try to get UUID from profile response (if available)
    try {
      Response profileResponse = await apiClient.getData(AppConstants.driverProfileUri, handleError: false);
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        if (profileResponse.body is Map) {
          Map<String, dynamic> body = profileResponse.body as Map<String, dynamic>;
          
          // Priority 1: Check for explicit uuid field (backend now returns this)
          if (body['uuid'] != null && body['uuid'].toString().isNotEmpty) {
            String uuid = body['uuid'].toString();
            debugPrint('✅ Found UUID in profile response uuid field: $uuid');
            return uuid;
          }
          
          // Priority 2: Check if id is already a UUID (string format with dashes)
          if (body['id'] != null) {
            String id = body['id'].toString();
            // Check if it's a UUID format (contains dashes and is 36 chars)
            if (id.contains('-') && id.length == 36) {
              debugPrint('✅ Found UUID in profile response id field: $id');
              return id;
            }
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ Could not get UUID from profile: $e');
    }
    
    // Second, try to extract from JWT token (fallback)
    String? tokenUuid = _extractDriverUuidFromToken();
    if (tokenUuid != null && tokenUuid.isNotEmpty) {
      debugPrint('⚠️ Using UUID from JWT token (fallback): $tokenUuid');
      debugPrint('⚠️ Note: This UUID may not exist in database. Consider updating profile endpoint to return UUID.');
      return tokenUuid;
    }
    
    // Last resort: return null and let the update fail with a clear error
    debugPrint('❌ Could not determine driver UUID from any source');
    return null;
  }

  /// Extract UUID from JWT token's 'sub' field
  String? _extractDriverUuidFromToken() {
    try {
      String token = _getUserToken();
      if (token.isEmpty) {
        debugPrint('⚠️ Token is empty');
        return null;
      }
      
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      List<String> parts = token.split('.');
      if (parts.length < 2) {
        debugPrint('⚠️ Invalid token format: expected 3 parts separated by dots, got ${parts.length}');
        return null;
      }
      
      // Decode the payload (second part)
      String payload = parts[1];
      // Add padding if needed for base64 decoding
      while (payload.length % 4 != 0) {
        payload += '=';
      }
      
      // Decode base64
      String decodedPayload = utf8.decode(base64Url.decode(payload));
      Map<String, dynamic> payloadJson = jsonDecode(decodedPayload);
      
      // Extract 'sub' field which contains the UUID
      String? uuid = payloadJson['sub']?.toString();
      if (uuid == null || uuid.isEmpty) {
        debugPrint('⚠️ Token payload does not contain "sub" field');
        debugPrint('Token payload: $payloadJson');
      }
      return uuid;
    } catch (e) {
      debugPrint('❌ Error extracting UUID from token: $e');
      return null;
    }
  }

  @override
  Future<ResponseModel?> updateProfile(ProfileModel userInfoModel, XFile? data, String token) async {
    ResponseModel? responseModel;
    
    try {
      // Get the driver UUID - try multiple sources
      String? driverUuid = await _getDriverUuid();
      
      if (driverUuid == null || driverUuid.isEmpty) {
        debugPrint('❌ Could not determine driver UUID');
        return ResponseModel(false, 'Unable to identify driver. Please log in again.');
      }
      
      debugPrint('✅ Using driver UUID: $driverUuid');
      
      // Prepare body - only include fields that backend accepts (see UpdateDriverDto)
      // Backend accepts: name, phone, vehicleType, capacity, online, latitude, longitude, zoneId
      // Note: email is NOT in UpdateDriverDto, so we skip it
      Map<String, dynamic> body = {};
      
      // Combine first name and last name into a single "name" field for the backend
      // Handle both null and empty string cases
      String? firstName = userInfoModel.fName?.trim();
      String? lastName = userInfoModel.lName?.trim();
      
      // Only update name if at least one name field has a value
      bool hasFirstName = firstName != null && firstName.isNotEmpty;
      bool hasLastName = lastName != null && lastName.isNotEmpty;
      
      if (hasFirstName || hasLastName) {
        // Combine names, removing any extra spaces
        String fullName = '${firstName ?? ""} ${lastName ?? ""}'.trim();
        if (fullName.isNotEmpty) {
          body['name'] = fullName;
        }
      }
      
      // Phone update is supported by UpdateDriverDto
      if (userInfoModel.phone != null && userInfoModel.phone!.trim().isNotEmpty) {
        body['phone'] = userInfoModel.phone!.trim();
      }
      
      // Validate that we have at least one field to update
      if (body.isEmpty) {
        debugPrint('❌ No fields to update. Body is empty.');
        return ResponseModel(false, 'No changes to update. Please modify at least one field.');
      }
      
      debugPrint('📤 Updating profile with body: $body');
      debugPrint('📤 API Endpoint: ${AppConstants.driverUpdateUri}/$driverUuid');
      debugPrint('📤 Driver UUID: $driverUuid');
      
      // Try PATCH with UUID
      Response response = await apiClient.patchData(
        '${AppConstants.driverUpdateUri}/$driverUuid',
        body,
        handleError: false,
      );
      
      debugPrint('📥 Profile update response: ${response.statusCode}');
      debugPrint('📥 Response status text: ${response.statusText}');
      if (response.body != null) {
        debugPrint('📥 Response body: ${response.body}');
      }
      
      // Handle response - 200 and 204 are both success codes
      if (response.statusCode == 200 || response.statusCode == 204) {
        String message = 'Profile updated successfully';
        if (response.body is Map && response.body.isNotEmpty) {
          message = response.body['message'] ?? 
                    (response.body['name'] != null ? 'Profile updated successfully' : message);
        }
        responseModel = ResponseModel(true, message);
        
        // Note: Image upload is not currently supported by the new endpoint
        // You may need a separate endpoint for image uploads
        if (data != null) {
          debugPrint('⚠️ Image upload not yet supported by new endpoint. Profile updated but image not uploaded.');
        }
      } else {
        // Handle error responses
        String errorMessage = 'Failed to update profile';
        if (response.body != null) {
          if (response.body is Map) {
            // Try to extract detailed error message
            errorMessage = response.body['message'] ?? 
                          response.body['error'] ?? 
                          (response.body['errors'] != null ? response.body['errors'].toString() : errorMessage);
          } else if (response.body is String) {
            errorMessage = response.body;
          }
        }
        if (response.statusText != null && response.statusText!.isNotEmpty && errorMessage == 'Failed to update profile') {
          errorMessage = response.statusText!;
        }
        debugPrint('❌ Profile update failed: Status ${response.statusCode}, Message: $errorMessage');
        debugPrint('❌ Full response body: ${response.body}');
        responseModel = ResponseModel(false, errorMessage);
      }
    } catch (e) {
      debugPrint('❌ Error in updateProfile: $e');
      responseModel = ResponseModel(false, 'Failed to update profile: ${e.toString()}');
    }
    
    return responseModel;
  }


  @override
  Future<ResponseModel?> updateActiveStatus({String? shiftId}) async { // Changed to String to support UUID format
    ResponseModel? responseModel;
    // Get driver ID from profile first
    try {
      Response profileResponse = await apiClient.getData(AppConstants.driverProfileUri);
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        String? driverId = profileResponse.body['id']?.toString();
        if (driverId != null && driverId.isNotEmpty) {
          // Use new endpoint: PATCH /api/drivers/:id/online
          // Get current online status from profile - check both 'online' and 'active' fields
          bool currentOnline = false;
          if (profileResponse.body['online'] != null) {
            currentOnline = profileResponse.body['online'] is bool 
                ? profileResponse.body['online'] 
                : (profileResponse.body['online'] == 1 || profileResponse.body['online'] == true);
          } else if (profileResponse.body['active'] != null) {
            currentOnline = profileResponse.body['active'] == 1 || profileResponse.body['active'] == true;
          }
          
          // Toggle the online status
          bool newOnlineStatus = !currentOnline;
          
          // Build the full endpoint URL
          String endpoint = '${AppConstants.driverOnlineStatusUri}/$driverId/online';
          
          Response response = await apiClient.patchData(
            endpoint,
            {'online': newOnlineStatus}
          );
          
          if (response.statusCode == 200) {
            String message = 'Status updated successfully';
            if (response.body != null && response.body is Map) {
              message = response.body['message'] ?? message;
            }
            responseModel = ResponseModel(true, message);
          } else {
            String errorMessage = 'Failed to update status';
            if (response.body != null && response.body is Map) {
              errorMessage = response.body['message'] ?? response.body['error'] ?? errorMessage;
            }
            if (response.statusText != null && response.statusText!.isNotEmpty) {
              errorMessage = response.statusText!;
            }
            responseModel = ResponseModel(false, errorMessage);
          }
        } else {
          responseModel = ResponseModel(false, 'Driver ID not found');
        }
      } else {
        responseModel = ResponseModel(false, 'Failed to get profile');
      }
    } catch (e) {
      debugPrint('Error updating active status: $e');
      // Fallback to legacy endpoint if new one fails
      try {
        Map<String, String> body = {};
        body['token'] = _getUserToken();
        if(shiftId != null){
          body['shift_id'] = shiftId.toString();
        }
        Response response = await apiClient.postData(AppConstants.activeStatusUri, body);
        if(response.statusCode == 200) {
          String message = 'Status updated successfully';
          if (response.body != null && response.body is Map) {
            message = response.body['message'] ?? message;
          }
          responseModel = ResponseModel(true, message);
        } else {
          String errorMessage = 'Failed to update status';
          if (response.body != null && response.body is Map) {
            errorMessage = response.body['message'] ?? response.body['error'] ?? errorMessage;
          }
          if (response.statusText != null && response.statusText!.isNotEmpty) {
            errorMessage = response.statusText!;
          }
          responseModel = ResponseModel(false, errorMessage);
        }
      } catch (fallbackError) {
        responseModel = ResponseModel(false, 'Failed to update status: ${fallbackError.toString()}');
      }
    }
    return responseModel;
  }

  @override
  bool isNotificationActive() {
    return sharedPreferences.getBool(AppConstants.notification) ?? true;
  }

  @override
  void setNotificationActive(bool isActive) {
    if(isActive) {
      _updateToken();
    }else {
      if(!GetPlatform.isWeb) {
        _updateToken(notificationDeviceToken: '@');
        // Topic unsubscription removed - Firebase Messaging no longer used
      }
    }
    sharedPreferences.setBool(AppConstants.notification, isActive);
  }

  @override
  Future<ResponseModel> deleteDriver() async {
    ResponseModel responseModel;
    Response response = await apiClient.postData(AppConstants.driverRemove + _getUserToken(), {"_method": "delete"}, handleError: false);
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body['message']);
    }else {
      responseModel = ResponseModel(false, response.statusText);
    }
    return responseModel;
  }

  @override
  Future<List<ShiftModel>?> getShiftList() async {
    List<ShiftModel>? shifts;
    // Use new endpoint with JWT Bearer token (no token in query string)
    Response response = await apiClient.getData(AppConstants.shiftUri, handleError: false);
    if (response.statusCode == 200 && response.body != null) {
      shifts = [];
      // API returns either a single object or a list
      if (response.body is List) {
        (response.body as List).forEach((shift) {
          shifts!.add(ShiftModel.fromJson(shift));
        });
      } else if (response.body is Map) {
        // Single shift object returned
        shifts.add(ShiftModel.fromJson(response.body));
      }
    }
    return shifts;
  }

  Future<Response> _updateToken({String notificationDeviceToken = ''}) async {
    // Device token can be provided externally or left empty
    // Using appauth or other notification services instead of Firebase
    String? deviceToken = notificationDeviceToken.isNotEmpty ? notificationDeviceToken : '';
    return await apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": _getUserToken(), "fcm_token": deviceToken}, handleError: false);
  }

  String _getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  @override
  Future add(value) {
    throw UnimplementedError();
  }

  @override
  Future delete(int id) {
    throw UnimplementedError();
  }

  @override
  Future get(int id) {
    throw UnimplementedError();
  }

  @override
  Future getList() {
    throw UnimplementedError();
  }

  @override
  Future update(Map<String, dynamic> body) {
    throw UnimplementedError();
  }

}