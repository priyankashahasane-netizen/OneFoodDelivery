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
  bool _isFirstOtp = false;

  @override
  void initState() {
    super.initState();
    final arguments = Get.arguments as Map<String, dynamic>?;
    _phone = arguments?['phone'] as String?;
    _isLogin = arguments?['isLogin'] as bool? ?? true;
    _isFirstOtp = arguments?['isFirstOtp'] as bool? ?? false;
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
                          Text(
                            _isFirstOtp 
                              ? 'Enter OTP Sent To Your Number' 
                              : 'Enter OTP for Login',
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)
                          ),
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

    // Get driver info from arguments if available (for new signups)
    final arguments = Get.arguments as Map<String, dynamic>?;
    String? firstName = arguments?['firstName'] as String?;
    String? lastName = arguments?['lastName'] as String?;
    String? email = arguments?['email'] as String?;
    bool isFirstOtp = arguments?['isFirstOtp'] as bool? ?? false;

    // Format phone for CubeOne API (91<mobile>)
    String formattedPhone = _phone!;
    if (_phone!.startsWith('+91')) {
      formattedPhone = _phone!.substring(1); // Remove +
    } else if (!_phone!.startsWith('91')) {
      formattedPhone = '91${_phone!}';
    }

    if (isFirstOtp) {
      // First OTP: Verify registration OTP
      await authController.verifyOtp(_phone!, otp, isLogin: false, firstName: firstName, lastName: lastName, email: email).then((status) async {
        if (status.isSuccess) {
          // After successful first OTP verification, redirect to login screen with the same mobile number
          showCustomSnackBar('Registration successful! Please login with OTP.', isError: false);
          Get.offAllNamed(RouteHelper.getOtpLoginRoute(), arguments: {
            'phone': _phone!,
          });
        } else {
          showCustomSnackBar(status.message);
        }
      });
    } else {
      // Second OTP: Login with CubeOne, then create/update driver in our DB
      await authController.loginCubeOne(formattedPhone, otp).then((loginStatus) async {
        if (loginStatus.isSuccess) {
          // After successful CubeOne login, verify with our backend to create/update driver
          await authController.verifyOtp(_phone!, otp, isLogin: false, firstName: firstName, lastName: lastName, email: email).then((status) async {
            if (status.isSuccess) {
              if (authController.getUserToken().isNotEmpty) {
                // Get CubeOne access_token for mapper verification
                String cubeOneAccessToken = authController.getCubeOneAccessToken();
                
                if (cubeOneAccessToken.isNotEmpty) {
                  // Verify mapper entry exists before fetching profile
                  await authController.verifyMapper(cubeOneAccessToken).then((mapperStatus) async {
                    if (mapperStatus.isSuccess) {
                      // Mapper verified - now fetch profile and redirect to home screen
                      try {
                        await Get.find<ProfileController>().getProfile();
                      } catch (e) {
                        debugPrint('Profile fetch failed: $e');
                      }
                      // Redirect to home screen (dashboard with pageIndex 0)
                      Get.offAllNamed(RouteHelper.getInitialRoute());
                    } else {
                      showCustomSnackBar('Mapper verification failed: ${mapperStatus.message}', isError: true);
                    }
                  });
                } else {
                  // No access_token - skip mapper verification for demo or proceed anyway
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
        } else {
          showCustomSnackBar(loginStatus.message, isError: true);
        }
      });
    }
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

