import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/record_location_body.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/shift_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/repositories/profile_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
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
    Response response = await apiClient.getData(AppConstants.driverProfileUri);
    if (response.statusCode == 200) {
      profileModel = ProfileModel.fromJson(response.body);
    }
    return profileModel;
  }

  @override
  Future<bool> recordLocation(RecordLocationBody recordLocationBody) async {
    // The tracking endpoint expects: POST /api/track/:orderId with body { driverId, lat, lng, speed?, heading? }
    // Since we don't have an orderId here, we'll skip tracking for now
    // Location updates without an active order are not critical
    // The backend tracking endpoint requires an orderId, so we'll handle 404 gracefully
    try {
      Response response = await apiClient.postData(AppConstants.recordLocationUri, recordLocationBody.toJson());
      // Accept 200, 201, or even 404 (since endpoint might not exist without orderId)
      return (response.statusCode == 200 || response.statusCode == 201);
    } catch (e) {
      // Silently fail for location tracking - it's not critical if it fails
      // Location is tracked when driver has an active order
      return false;
    }
  }

  @override
  Future<ResponseModel?> updateProfile(ProfileModel userInfoModel, XFile? data, String token) async {
    ResponseModel? responseModel;
    // Get driver ID from profile first
    try {
      Response profileResponse = await apiClient.getData(AppConstants.driverProfileUri);
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        String? driverId = profileResponse.body['id']?.toString();
        if (driverId != null && driverId.isNotEmpty) {
          // Use new endpoint: PATCH /api/drivers/:id
          // For multipart data with image, we may need a different approach
          // Backend may support PATCH with multipart, or we may need to update in two steps
          
          // Prepare body
          Map<String, dynamic> body = {};
          if (userInfoModel.fName != null) body['name'] = '${userInfoModel.fName} ${userInfoModel.lName ?? ""}'.trim();
          if (userInfoModel.email != null) body['email'] = userInfoModel.email;
          
          // Try PATCH first (without image)
          Response response = await apiClient.patchData(
            '${AppConstants.driverUpdateUri}/$driverId',
            body
          );
          
          // If image provided and PATCH doesn't support multipart, use legacy endpoint
          if (data != null && response.statusCode != 200) {
            // Fallback to legacy multipart endpoint
            Map<String, String> fields = {};
            fields.addAll(<String, String>{
              '_method': 'put', 'f_name': userInfoModel.fName!, 'l_name': userInfoModel.lName!,
              'email': userInfoModel.email!, 'token': _getUserToken()
            });
            response = await apiClient.postMultipartData(AppConstants.updateProfileUri, fields, [MultipartBody('image', data)], []);
          }
          
          if(response.statusCode == 200) {
            responseModel = ResponseModel(true, response.body['message'] ?? 'Profile updated');
          }
        }
      }
    } catch (e) {
      // Fallback to legacy endpoint
      Map<String, String> fields = {};
      fields.addAll(<String, String>{
        '_method': 'put', 'f_name': userInfoModel.fName!, 'l_name': userInfoModel.lName!,
        'email': userInfoModel.email!, 'token': _getUserToken()
      });
      Response response = await apiClient.postMultipartData(AppConstants.updateProfileUri, fields, [MultipartBody('image', data)], []);
      if(response.statusCode == 200) {
        responseModel = ResponseModel(true, response.body['message']);
      }
    }
    return responseModel;
  }

  @override
  Future<ResponseModel?> updateActiveStatus({int? shiftId}) async {
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
        FirebaseMessaging.instance.unsubscribeFromTopic(AppConstants.topic);
        FirebaseMessaging.instance.unsubscribeFromTopic(sharedPreferences.getString(AppConstants.zoneTopic)!);
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
    Response response = await apiClient.getData('${AppConstants.shiftUri}${_getUserToken()}');
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
    String? deviceToken;
    if(notificationDeviceToken.isEmpty){
      if (GetPlatform.isIOS) {
        FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
        NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
          alert: true, announcement: false, badge: true, carPlay: false,
          criticalAlert: false, provisional: false, sound: true,
        );
        if(settings.authorizationStatus == AuthorizationStatus.authorized) {
          deviceToken = await _saveDeviceToken();
        }
      }else {
        deviceToken = await _saveDeviceToken();
      }
      if(!GetPlatform.isWeb) {
        FirebaseMessaging.instance.subscribeToTopic(AppConstants.topic);
        FirebaseMessaging.instance.subscribeToTopic(sharedPreferences.getString(AppConstants.zoneTopic)!);

        FirebaseMessaging.instance.subscribeToTopic(AppConstants.maintenanceModeTopic);
      }
    }
    return await apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": _getUserToken(), "fcm_token": notificationDeviceToken.isNotEmpty ? notificationDeviceToken : deviceToken}, handleError: false);
  }

  Future<String?> _saveDeviceToken() async {
    String? deviceToken = '';
    if(!GetPlatform.isWeb) {
      deviceToken = (await FirebaseMessaging.instance.getToken())!;
    }
    return deviceToken;
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