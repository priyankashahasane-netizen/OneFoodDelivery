import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/domain/services/forgot_password_service_interface.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';

class ForgotPasswordController extends GetxController implements GetxService{
  final ForgotPasswordServiceInterface forgotPasswordServiceInterface;
  ForgotPasswordController({required this.forgotPasswordServiceInterface});

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String _verificationCode = '';
  String get verificationCode => _verificationCode;

  Future<bool> changePassword(ProfileModel updatedUserModel, String password) async {
    _isLoading = true;
    update();
    bool isSuccess;
    ResponseModel responseModel = await forgotPasswordServiceInterface.changePassword(updatedUserModel, password);
    _isLoading = false;
    if (responseModel.isSuccess) {
      Get.back();
      showCustomSnackBar(responseModel.message, isError: false);
      isSuccess = true;
    } else {
      isSuccess = false;
    }
    update();
    return isSuccess;
  }

  Future<ResponseModel> forgotPassword(String? email) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await forgotPasswordServiceInterface.forgotPassword(email);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<ResponseModel> resetPassword(String? resetToken, String phone, String password, String confirmPassword) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await forgotPasswordServiceInterface.resetPassword(resetToken, phone, password, confirmPassword);
    _isLoading = false;
    update();
    return responseModel;
  }

  Future<ResponseModel> verifyToken(String? number) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await forgotPasswordServiceInterface.verifyToken(number, _verificationCode);
    _isLoading = false;
    update();
    return responseModel;
  }

  void updateVerificationCode(String query, {bool canUpdate = true}) {
    _verificationCode = query;
    if(canUpdate) {
      update();
    }
  }

  Future<ResponseModel> verifyFirebaseOtp({required String phoneNumber, required String session, required String otp}) async {
    _isLoading = true;
    update();
    ResponseModel responseModel = await forgotPasswordServiceInterface.verifyFirebaseOtp(phoneNumber: phoneNumber, session: session, otp: otp);
    _isLoading = false;
    update();
    return responseModel;
  }

  // Firebase Auth removed - using backend OTP API instead
  // This method is kept for backward compatibility but now uses backend API
  Future<void> firebaseVerifyPhoneNumber(String phoneNumber, {bool canRoute = true}) async {
    // Use the same OTP flow as main authentication
    // For forgot password, we can reuse the sendOtp from auth controller
    _isLoading = true;
    update();
    
    try {
      // Import and use AuthController's sendOtp method
      final authController = Get.find<AuthController>();
      ResponseModel response = await authController.sendOtp(phoneNumber);
      
      _isLoading = false;
      update();
      
      if (response.isSuccess && canRoute) {
        // Navigate to verification screen (using OTP verification route)
        Get.toNamed(RouteHelper.getOtpVerificationRoute(), arguments: {
          'phone': phoneNumber,
          'isLogin': false,
          'isForgotPassword': true,
        });
      } else if (!response.isSuccess) {
        showCustomSnackBar(response.message ?? 'Failed to send OTP');
      }
    } catch (e) {
      _isLoading = false;
      update();
      showCustomSnackBar('Error: ${e.toString()}');
    }
  }

}