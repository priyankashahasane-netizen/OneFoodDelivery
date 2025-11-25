import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service_interface.dart';

class AuthService implements AuthServiceInterface {
  final AuthRepositoryInterface authRepositoryInterface;
  AuthService({required this.authRepositoryInterface});

  @override
  Future<Response> login(String phone, String password) async {
    return await authRepositoryInterface.login(phone, password);
  }

  @override
  Future<bool> saveUserToken(String token) async {
    // Use default topic for notifications
    String topic = 'all_zone_delivery_man';
    return await authRepositoryInterface.saveUserToken(token, topic);
  }

  @override
  Future<Response> updateToken({String notificationDeviceToken = ''}) async {
    return await authRepositoryInterface.updateToken(notificationDeviceToken: notificationDeviceToken);
  }

  @override
  bool isLoggedIn() {
    return authRepositoryInterface.isLoggedIn();
  }

  @override
  Future<bool> clearSharedData() async {
    return await authRepositoryInterface.clearSharedData();
  }

  @override
  Future<void> saveUserNumberAndPassword(String number, String password, String countryCode) async {
    await authRepositoryInterface.saveUserNumberAndPassword(number, password, countryCode);
  }

  @override
  String getUserNumber() {
    return authRepositoryInterface.getUserNumber();
  }

  @override
  String getUserCountryCode() {
    return authRepositoryInterface.getUserCountryCode();
  }

  @override
  String getUserPassword() {
    return authRepositoryInterface.getUserPassword();
  }

  @override
  Future<bool> clearUserNumberAndPassword() async {
    return await authRepositoryInterface.clearUserNumberAndPassword();
  }

  @override
  String getUserToken() {
    return authRepositoryInterface.getUserToken();
  }

  @override
  Future<ResponseModel> sendOtp(String phone) async {
    return await authRepositoryInterface.sendOtp(phone);
  }

  @override
  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true}) async {
    return await authRepositoryInterface.verifyOtp(phone, otp, isLogin: isLogin);
  }
}