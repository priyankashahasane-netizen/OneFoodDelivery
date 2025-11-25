import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

class AuthRepository implements AuthRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  AuthRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<Response> login(String phone, String password) async {
    return await apiClient.postData(AppConstants.loginUri, {"phone": phone, "password": password}, handleError: false);
  }

  @override
  Future<bool> saveUserToken(String token, String topic) async {
    apiClient.token = token;
    apiClient.updateHeader(token, sharedPreferences.getString(AppConstants.languageCode));
    sharedPreferences.setString(AppConstants.zoneTopic, topic);
    return await sharedPreferences.setString(AppConstants.token, token);
  }

  @override
  Future<Response> updateToken({String notificationDeviceToken = ''}) async {
    // Device token can be provided externally or left empty
    // Using appauth or other notification services instead of Firebase
    String? deviceToken = notificationDeviceToken.isNotEmpty ? notificationDeviceToken : '';
    return await apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": getUserToken(), "fcm_token": deviceToken}, handleError: false);
  }

  @override
  bool isLoggedIn() {
    return sharedPreferences.containsKey(AppConstants.token);
  }

  @override
  Future<bool> clearSharedData() async {
    if(!GetPlatform.isWeb) {
      // Unsubscribe from topics if using notification service
      apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": getUserToken()}, handleError: false);
    }
    await sharedPreferences.remove(AppConstants.token);
    await sharedPreferences.setStringList(AppConstants.ignoreList, []);
    await sharedPreferences.remove(AppConstants.userAddress);
    apiClient.updateHeader(null, null);
    return true;
  }

  @override
  Future<void> saveUserNumberAndPassword(String number, String password, String countryCode) async {
    try {
      await sharedPreferences.setString(AppConstants.userPassword, password);
      await sharedPreferences.setString(AppConstants.userNumber, number);
      await sharedPreferences.setString(AppConstants.userCountryCode, countryCode);
    } catch (e) {
      rethrow;
    }
  }

  @override
  String getUserNumber() {
    return sharedPreferences.getString(AppConstants.userNumber) ?? "";
  }

  @override
  String getUserCountryCode() {
    return sharedPreferences.getString(AppConstants.userCountryCode) ?? "";
  }

  @override
  String getUserPassword() {
    return sharedPreferences.getString(AppConstants.userPassword) ?? "";
  }

  @override
  Future<bool> clearUserNumberAndPassword() async {
    await sharedPreferences.remove(AppConstants.userPassword);
    await sharedPreferences.remove(AppConstants.userCountryCode);
    return await sharedPreferences.remove(AppConstants.userNumber);
  }

  @override
  String getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  // Device token handling removed - using appauth or other services instead

  @override
  Future<ResponseModel> sendOtp(String phone) async {
    // Demo account: 9975008124 - always return success
    if (phone.contains('9975008124') || phone.endsWith('9975008124')) {
      return ResponseModel(true, 'OTP sent successfully');
    }
    
    Response response = await apiClient.postData(
      AppConstants.sendOtpUri,
      {"phone": phone},
      handleError: false,
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return ResponseModel(true, response.body['message'] ?? 'OTP sent successfully');
    } else {
      String errorMessage = 'Failed to send OTP';
      if (response.body is Map) {
        errorMessage = response.body['message'] ?? response.statusText ?? errorMessage;
      }
      return ResponseModel(false, errorMessage);
    }
  }

  @override
  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true}) async {
    // Demo account: 9975008124 / OTP: 1234
    if ((phone.contains('9975008124') || phone.endsWith('9975008124')) && otp == '1234') {
      // For demo account, create a mock token
      String demoToken = 'demo_token_${DateTime.now().millisecondsSinceEpoch}';
      await saveUserToken(demoToken, AppConstants.topic);
      await updateToken();
      return ResponseModel(true, 'OTP verified successfully');
    }
    
    Response response = await apiClient.postData(
      AppConstants.verifyOtpUri,
      {
        "phone": phone,
        "otp": otp,
        "isLogin": isLogin,
      },
      handleError: false,
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      if (response.body is Map) {
        Map body = response.body as Map;
        String? token = body['token'] ?? body['access_token'];
        bool isNewUser = body['isNewUser'] ?? false;
        
        if (token != null) {
          await saveUserToken(token, AppConstants.topic);
          await updateToken();
          return ResponseModel(true, 'OTP verified successfully', {'isNewUser': isNewUser});
        } else {
          return ResponseModel(false, 'No token received');
        }
      } else {
        return ResponseModel(false, 'Invalid response format');
      }
    } else {
      String errorMessage = 'OTP verification failed';
      if (response.body is Map) {
        errorMessage = response.body['message'] ?? response.statusText ?? errorMessage;
      }
      return ResponseModel(false, errorMessage);
    }
  }
}