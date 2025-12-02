import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';

abstract class AuthRepositoryInterface {
  Future<Response> login(String phone, String password);
  Future<bool> saveUserToken(String token, String topic);
  Future<Response> updateToken({String notificationDeviceToken = ''});
  bool isLoggedIn();
  Future<bool> clearSharedData();
  Future<void> saveUserNumberAndPassword(String number, String password, String countryCode);
  String getUserNumber();
  String getUserCountryCode();
  String getUserPassword();
  Future<bool> clearUserNumberAndPassword();
  String getUserToken();
  Future<ResponseModel> sendOtp(String phone);
  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true, String? firstName, String? lastName, String? email});
  Future<ResponseModel> logout();
  Future<ResponseModel> searchUser(String username);
  Future<ResponseModel> registerUser(String mobile, String firstName, String lastName, String email);
  Future<ResponseModel> requestCubeOneOtp(String username);
  Future<ResponseModel> verifyCubeOneOtp(String username, String otp);
  Future<ResponseModel> loginCubeOne(String username, String otp);
  Future<bool> saveCubeOneAccessToken(String token);
  String getCubeOneAccessToken();
  Future<bool> clearCubeOneAccessToken();
  Future<ResponseModel> verifyMapper(String cubeOneAccessToken);
  void testPasswordGeneration();
}
