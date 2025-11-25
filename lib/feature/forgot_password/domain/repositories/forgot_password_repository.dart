import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/domain/repositories/forgot_password_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

class ForgotPasswordRepository implements ForgotPasswordRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  ForgotPasswordRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<ResponseModel?> changePassword(ProfileModel userInfoModel, String password) async {
    ResponseModel? responseModel;
    Response response = await apiClient.postData(AppConstants.updateProfileUri, {'_method': 'put', 'f_name': userInfoModel.fName,
      'l_name': userInfoModel.lName, 'email': userInfoModel.email, 'password': password, 'token': _getUserToken()});
    if(response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body["message"]);
    }
    return responseModel;
  }

  @override
  Future<ResponseModel> forgotPassword(String? phone) async {
    ResponseModel responseModel;
    Response response = await apiClient.postData(AppConstants.forgerPasswordUri, {"phone": phone});
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body["message"]);
    } else {
      responseModel = ResponseModel(false, response.statusText);
    }
    return responseModel;
  }

  @override
  Future<ResponseModel> resetPassword(String? resetToken, String phone, String password, String confirmPassword) async {
    ResponseModel responseModel;
    Response response = await apiClient.postData(AppConstants.resetPasswordUri,
      {"_method": "put", "phone": phone, "reset_token": resetToken, "password": password, "confirm_password": confirmPassword},
    );
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body["message"]);
    } else {
      responseModel = ResponseModel(false, response.statusText);
    }
    return responseModel;
  }

  @override
  Future<ResponseModel> verifyToken(String? phone, String token) async {
    ResponseModel responseModel;
    Response response = await apiClient.postData(AppConstants.verifyTokenUri, {"phone": phone, "reset_token": token});
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body["message"]);
    } else {
      responseModel = ResponseModel(false, response.statusText);
    }
    return responseModel;
  }

  String _getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  @override
  Future<ResponseModel> verifyFirebaseOtp({required String phoneNumber, required String session, required String otp}) async {
    // Firebase removed - using backend OTP verification instead
    Response response = await apiClient.postData(
      AppConstants.verifyOtpUri,
      {
        'phone': phoneNumber,
        'otp': otp,
        'isLogin': false,
        'is_reset_token': 1,
      },
      handleError: false,
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      String message = 'OTP verified successfully';
      if (response.body is Map && response.body['message'] != null) {
        message = response.body['message'];
      }
      return ResponseModel(true, message);
    } else {
      String errorMessage = 'OTP verification failed';
      if (response.body is Map && response.body['message'] != null) {
        errorMessage = response.body['message'];
      }
      return ResponseModel(false, errorMessage);
    }
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