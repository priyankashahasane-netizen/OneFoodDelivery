import 'dart:async';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final TextEditingController _otpController = TextEditingController();
  Timer? _timer;
  int _seconds = 60;
  bool _canResend = false;
  String? _phone;
  bool _isLogin = true;

  @override
  void initState() {
    super.initState();
    final arguments = Get.arguments as Map<String, dynamic>?;
    _phone = arguments?['phone'] as String?;
    _isLogin = arguments?['isLogin'] as bool? ?? true;
    _startTimer();
  }

  void _startTimer() {
    _canResend = false;
    _seconds = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_seconds > 0) {
        setState(() {
          _seconds--;
        });
      } else {
        setState(() {
          _canResend = true;
        });
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('otp_verification'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            child: Center(
              child: SizedBox(
                width: 1170,
                child: GetBuilder<AuthController>(
                  builder: (authController) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                      child: Column(
                        children: [
                          const SizedBox(height: 50),
                          Text('OTP Verification', style: robotoBold.copyWith(fontSize: 24)),
                          const SizedBox(height: 10),
                          Text('Enter OTP Sent To Your Number', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                          const SizedBox(height: 5),
                          Text(_phone ?? '', style: robotoMedium.copyWith(fontSize: 22)),
                        const SizedBox(height: 50),
                        PinCodeTextField(
                          appContext: context,
                          length: 4,
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          animationType: AnimationType.slide,
                          pinTheme: PinTheme(
                            shape: PinCodeFieldShape.box,
                            fieldHeight: 60,
                            fieldWidth: 45,
                            borderWidth: 1,
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            selectedColor: Theme.of(context).primaryColor,
                            selectedFillColor: Colors.white,
                            inactiveFillColor: Theme.of(context).cardColor,
                            inactiveColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                            activeColor: Theme.of(context).primaryColor.withValues(alpha: 0.7),
                            activeFillColor: Theme.of(context).cardColor,
                          ),
                          animationDuration: const Duration(milliseconds: 300),
                          backgroundColor: Colors.transparent,
                          enableActiveFill: true,
                          textStyle: const TextStyle(fontSize: 20),
                          onChanged: (String text) {},
                          beforeTextPaste: (text) => true,
                        ),
                        const SizedBox(height: 30),
                        CustomButtonWidget(
                          buttonText: 'VERIFY OTP',
                          isLoading: authController.isLoading,
                          onPressed: () => _verifyOtp(authController, context),
                        ),
                        const SizedBox(height: 30),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Did not recive OTP', style: robotoRegular),
                            const SizedBox(width: 5),
                            _canResend
                                ? TextButton(
                                    onPressed: () => _resendOtp(authController),
                                    child: Text('resend'.tr, style: robotoMedium.copyWith(color: Theme.of(context).primaryColor)),
                                  )
                                : Text('resend_in'.tr + ' $_seconds' + 's', style: robotoRegular.copyWith(color: Theme.of(context).disabledColor)),
                          ],
                        ),
                      ],
                    ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _verifyOtp(AuthController authController, BuildContext context) async {
    String otp = _otpController.text.trim();

    if (otp.isEmpty || otp.length != 4) {
      showCustomSnackBar('please_enter_otp'.tr);
      return;
    }

    if (_phone == null) {
      showCustomSnackBar('phone_number_not_found'.tr);
      return;
    }

    // Verify OTP (demo account logic is handled in the repository)
    await authController.verifyOtp(_phone!, otp, isLogin: _isLogin).then((status) async {
      if (status.isSuccess) {
        if (authController.getUserToken().isNotEmpty) {
          // Check if user is new (for sign up flow)
          bool isNewUser = false;
          if (status.data != null && status.data is Map) {
            isNewUser = status.data['isNewUser'] ?? false;
          }
          
          // If it's sign up and user is new, navigate to registration
          if (!_isLogin && isNewUser) {
            Get.offAllNamed(RouteHelper.getRegistrationStep1Route(), arguments: {'phone': _phone!});
          } else {
            // Existing user or login - fetch profile and go to dashboard
            try {
              await Get.find<ProfileController>().getProfile();
            } catch (e) {
              debugPrint('Profile fetch failed: $e');
            }
            Get.offAllNamed(RouteHelper.getInitialRoute());
          }
        } else {
          showCustomSnackBar('Verification failed. Please try again.', isError: true);
        }
      } else {
        showCustomSnackBar(status.message);
      }
    });
  }

  void _resendOtp(AuthController authController) {
    if (_phone != null) {
      authController.sendOtp(_phone!).then((status) {
        if (status.isSuccess) {
          showCustomSnackBar('otp_resent_successfully'.tr);
          _startTimer();
        } else {
          showCustomSnackBar(status.message);
        }
      });
    }
  }
}

