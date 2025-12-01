import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class DriverInfoScreen extends StatelessWidget {
  DriverInfoScreen({super.key});

  final FocusNode _firstNameFocus = FocusNode();
  final FocusNode _lastNameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final arguments = Get.arguments as Map<String, dynamic>?;
    final String phone = arguments?['phone'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text('Driver Information'),
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
                          const SizedBox(height: 30),
                          Image.asset(Images.logo, width: 100),
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          Text('One Food Delivery', style: robotoBlack.copyWith(fontSize: 20)),
                          const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                          Text('SIGN UP', style: robotoBlack.copyWith(fontSize: 30)),
                          const SizedBox(height: 10),
                          Text('Enter Your Information', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall), textAlign: TextAlign.center),
                          const SizedBox(height: 30),
                          Text('Mobile: $phone', style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge)),
                          const SizedBox(height: 30),
                          CustomTextFieldWidget(
                            hintText: 'First Name',
                            controller: _firstNameController,
                            focusNode: _firstNameFocus,
                            inputType: TextInputType.name,
                            capitalization: TextCapitalization.words,
                          ),
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          CustomTextFieldWidget(
                            hintText: 'Last Name',
                            controller: _lastNameController,
                            focusNode: _lastNameFocus,
                            inputType: TextInputType.name,
                            capitalization: TextCapitalization.words,
                          ),
                          const SizedBox(height: Dimensions.paddingSizeSmall),
                          CustomTextFieldWidget(
                            hintText: 'Email',
                            controller: _emailController,
                            focusNode: _emailFocus,
                            inputType: TextInputType.emailAddress,
                          ),
                          const SizedBox(height: 30),
                          CustomButtonWidget(
                            buttonText: 'REGISTER & SEND OTP',
                            isLoading: authController.isLoading,
                            onPressed: () => _registerAndSendOtp(authController, phone, context),
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

  void _registerAndSendOtp(AuthController authController, String phone, BuildContext context) async {
    String firstName = _firstNameController.text.trim();
    String lastName = _lastNameController.text.trim();
    String email = _emailController.text.trim();

    if (firstName.isEmpty) {
      showCustomSnackBar('Please enter first name', isError: true);
      return;
    }

    if (lastName.isEmpty) {
      showCustomSnackBar('Please enter last name', isError: true);
      return;
    }

    if (email.isEmpty) {
      showCustomSnackBar('Please enter email', isError: true);
      return;
    }

    if (!GetUtils.isEmail(email)) {
      showCustomSnackBar('Please enter a valid email', isError: true);
      return;
    }

    // Format phone number for CubeOne API (should be 91<mobile>)
    String formattedPhone = phone;
    if (phone.startsWith('+91')) {
      formattedPhone = phone.substring(1); // Remove +
    } else if (!phone.startsWith('91')) {
      formattedPhone = '91$phone';
    }

    // Register user with CubeOne
    await authController.registerUser(formattedPhone, firstName, lastName, email).then((status) async {
      if (status.isSuccess) {
        // After successful registration, automatically request OTP via CubeOne
        await authController.sendOtp(phone).then((otpStatus) {
          if (otpStatus.isSuccess) {
            // Navigate to OTP screen for first OTP (after registration)
            Get.toNamed(RouteHelper.getOtpVerificationRoute(), arguments: {
              'phone': phone,
              'isLogin': false,
              'isFirstOtp': true, // Mark as first OTP (after registration)
              'firstName': firstName,
              'lastName': lastName,
              'email': email,
            });
          } else {
            showCustomSnackBar(otpStatus.message, isError: true);
          }
        });
      } else {
        showCustomSnackBar(status.message, isError: true);
      }
    });
  }
}

