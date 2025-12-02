import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service_interface.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:get/get.dart';
import 'package:flutter/foundation.dart';

class AuthController extends GetxController implements GetxService {
  final AuthServiceInterface authServiceInterface;
  AuthController({required this.authServiceInterface});

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _showPassView = false;
  bool get showPassView => _showPassView;

  bool _isActiveRememberMe = false;
  bool get isActiveRememberMe => _isActiveRememberMe;

  void showHidePass({bool isUpdate = true}) {
    _showPassView = !_showPassView;
    if (isUpdate) {
      update();
    }
  }

  Future<ResponseModel> login(String phone, String password) async {
    _isLoading = true;
    update();

    Response response = await authServiceInterface.login(phone, password);
    ResponseModel responseModel;

    // Accept both 200 (OK) and 201 (Created) as successful login
    if (response.statusCode == 200 || response.statusCode == 201) {
      if (response.body is Map) {
        Map body = response.body as Map;
        // Check for token in response (backend may return 'token' or 'access_token')
        String? token = body['token'] ?? body['access_token'];
        if (token != null) {
          await authServiceInterface.saveUserToken(token);
          await authServiceInterface.updateToken();
          responseModel = ResponseModel(true, 'successful');
        } else {
          responseModel = ResponseModel(false, 'No token received');
        }
      } else {
        responseModel = ResponseModel(false, 'Invalid response format');
      }
    } else {
      String errorMessage = 'Login failed';
      if (response.body is Map) {
        Map body = response.body as Map;
        errorMessage = body['message'] ?? response.statusText ?? errorMessage;
      } else {
        errorMessage = response.statusText ?? errorMessage;
      }
      responseModel = ResponseModel(false, errorMessage);
    }

    _isLoading = false;
    update();
    return responseModel;
  }

  Future<void> updateToken() async {
    await authServiceInterface.updateToken();
  }

  void toggleRememberMe() {
    _isActiveRememberMe = !_isActiveRememberMe;
    update();
  }

  bool isLoggedIn() {
    return authServiceInterface.isLoggedIn();
  }

  Future<bool> clearSharedData() async {
    return await authServiceInterface.clearSharedData();
  }

  void saveUserNumberAndPassword(String number, String password, String countryCode) {
    authServiceInterface.saveUserNumberAndPassword(number, password, countryCode);
  }

  String getUserNumber() {
    return authServiceInterface.getUserNumber();
  }

  String getUserCountryCode() {
    return authServiceInterface.getUserCountryCode();
  }

  String getUserPassword() {
    return authServiceInterface.getUserPassword();
  }

  Future<bool> clearUserNumberAndPassword() async {
    return authServiceInterface.clearUserNumberAndPassword();
  }

  String getUserToken() {
    return authServiceInterface.getUserToken();
  }

  // Simple password validation for forgot password screen
  bool _lengthCheck = false;
  bool _numberCheck = false;
  bool _uppercaseCheck = false;
  bool _lowercaseCheck = false;
  bool _spatialCheck = false;

  bool get lengthCheck => _lengthCheck;
  bool get numberCheck => _numberCheck;
  bool get uppercaseCheck => _uppercaseCheck;
  bool get lowercaseCheck => _lowercaseCheck;
  bool get spatialCheck => _spatialCheck;

  void validPassCheck(String pass, {bool isUpdate = true}) {
    _lengthCheck = false;
    _numberCheck = false;
    _uppercaseCheck = false;
    _lowercaseCheck = false;
    _spatialCheck = false;

    if (pass.length > 7) {
      _lengthCheck = true;
    }
    if (pass.contains(RegExp(r'[a-z]'))) {
      _lowercaseCheck = true;
    }
    if (pass.contains(RegExp(r'[A-Z]'))) {
      _uppercaseCheck = true;
    }
    if (pass.contains(RegExp(r'[ .!@#$&*~^%]'))) {
      _spatialCheck = true;
    }
    if (pass.contains(RegExp(r'[\d+]'))) {
      _numberCheck = true;
    }
    if (isUpdate) {
      update();
    }
  }

  Future<ResponseModel> sendOtp(String phone) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.sendOtp(phone);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true, String? firstName, String? lastName, String? email}) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.verifyOtp(phone, otp, isLogin: isLogin, firstName: firstName, lastName: lastName, email: email);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<void> logout() async {
    _isLoading = true;
    update();
    
    // Call backend logout endpoint to update is_active status
    try {
      await authServiceInterface.logout();
    } catch (e) {
      // Continue with logout even if backend call fails
      debugPrint('Logout endpoint error: $e');
    }
    
    // Clear all shared data (token, user data, etc.)
    await clearSharedData();
    await clearUserNumberAndPassword();
    
    _isLoading = false;
    update();
  }

  Future<ResponseModel> searchUser(String username) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.searchUser(username);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<ResponseModel> registerUser(String mobile, String firstName, String lastName, String email) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.registerUser(mobile, firstName, lastName, email);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<ResponseModel> loginCubeOne(String username, String otp) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.loginCubeOne(username, otp);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<bool> saveCubeOneAccessToken(String token) async {
    return await authServiceInterface.saveCubeOneAccessToken(token);
  }

  String getCubeOneAccessToken() {
    return authServiceInterface.getCubeOneAccessToken();
  }

  Future<bool> clearCubeOneAccessToken() async {
    return await authServiceInterface.clearCubeOneAccessToken();
  }

  Future<ResponseModel> verifyMapper(String cubeOneAccessToken) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await authServiceInterface.verifyMapper(cubeOneAccessToken);
    _isLoading = false;
    update();
    return responseModel;
  }

  // Test method to generate 10 passwords
  void testPasswordGeneration() {
    authServiceInterface.testPasswordGeneration();
  }
}