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
  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true});
}
