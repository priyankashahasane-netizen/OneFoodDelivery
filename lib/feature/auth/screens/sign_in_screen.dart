import 'package:country_code_picker/country_code_picker.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/custom_validator.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SignInViewScreen extends StatelessWidget {
  SignInViewScreen({super.key});

  final FocusNode _phoneFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {

    String? countryDialCode = Get.find<AuthController>().getUserCountryCode().isNotEmpty ? Get.find<AuthController>().getUserCountryCode()
        : CountryCode.fromCountryCode(Get.find<SplashController>().configModel!.country!).dialCode;
    _phoneController.text =  Get.find<AuthController>().getUserNumber();
    _passwordController.text = Get.find<AuthController>().getUserPassword();

    return Scaffold(
      body: SafeArea(child: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
          child: Center(
            child: SizedBox(
              width: 1170,
              child: GetBuilder<AuthController>(builder: (authController) {
                return Column(children: [

                  Image.asset(Images.logo, width: 100),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Image.asset(Images.logoName, width: 100),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),

                  Text('sign_in'.tr.toUpperCase(), style: robotoBlack.copyWith(fontSize: 30)),
                  const SizedBox(height: 50),

                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      color: Theme.of(context).cardColor,
                      boxShadow: [BoxShadow(color: Colors.black12, spreadRadius: 1, blurRadius: 5)],
                    ),
                    child: Column(children: [

                      CustomTextFieldWidget(
                        hintText: 'xxx-xxx-xxxxx'.tr,
                        showLabelText: false,
                        controller: _phoneController,
                        focusNode: _phoneFocus,
                        nextFocus: _passwordFocus,
                        inputType: TextInputType.phone,
                        isPhone: true,
                        showBorder: false,
                        divider: true,
                        onCountryChanged: (CountryCode countryCode) {
                          countryDialCode = countryCode.dialCode;
                        },
                        countryDialCode: countryDialCode != null ? CountryCode.fromCountryCode(Get.find<SplashController>().configModel!.country!).code
                            : Get.find<LocalizationController>().locale.countryCode,
                      ),

                      CustomTextFieldWidget(
                        showBorder: false,
                        hintText: 'password'.tr,
                        showLabelText: false,
                        controller: _passwordController,
                        focusNode: _passwordFocus,
                        inputAction: TextInputAction.done,
                        inputType: TextInputType.visiblePassword,
                        prefixIcon: Icons.lock,
                        isPassword: true,
                        onSubmit: (text) => GetPlatform.isWeb ? _login(authController, _phoneController, _passwordController, countryDialCode!, context) : null,
                      ),

                    ]),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),

                  Row(children: [

                    Expanded(
                      child: ListTile(
                        onTap: () => authController.toggleRememberMe(),
                        leading: Checkbox(
                          activeColor: Theme.of(context).primaryColor,
                          value: authController.isActiveRememberMe,
                          onChanged: (bool? isChecked) => authController.toggleRememberMe(),
                        ),
                        title: Text('remember_me'.tr),
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        horizontalTitleGap: 0,
                      ),
                    ),

                    // Forgot password functionality removed - simplified auth
                    // TextButton(
                    //   onPressed: () => Get.toNamed(RouteHelper.getForgotPassRoute()),
                    //   child: Text('${'forgot_password'.tr}?'),
                    // ),

                  ]),
                  const SizedBox(height: 50),

                  CustomButtonWidget(
                    buttonText: 'sign_in'.tr,
                    isLoading: authController.isLoading,
                    onPressed: () => _login(authController, _phoneController, _passwordController, countryDialCode!, context),
                  ),

                ]);
              }),
            ),
          ),
        ),
      )),
    );
  }

  void _login(AuthController authController, TextEditingController phoneCtlr, TextEditingController passCtlr, String countryCode, BuildContext context) async {
    String phone = phoneCtlr.text.trim();
    String password = passCtlr.text.trim();

    String numberWithCountryCode = countryCode+phone;
    PhoneValid phoneValid = await CustomValidator.isPhoneValid(numberWithCountryCode);
    numberWithCountryCode = phoneValid.phone;

    if (phone.isEmpty) {
      showCustomSnackBar('enter_phone_number'.tr);
    }else if (!phoneValid.isValid) {
      showCustomSnackBar('invalid_phone_number'.tr);
    }else if (password.isEmpty) {
      showCustomSnackBar('enter_password'.tr);
    }else if (password.length < 6) {
      showCustomSnackBar('password_should_be'.tr);
    }else {
      authController.login(numberWithCountryCode, password).then((status) async {
        if (status.isSuccess) {
          if (authController.isActiveRememberMe) {
            authController.saveUserNumberAndPassword(phone, password, countryCode);
          } else {
            authController.clearUserNumberAndPassword();
          }

          if (authController.getUserToken().isNotEmpty) {
            // Try to fetch profile, but don't block navigation if it fails
            try {
              await Get.find<ProfileController>().getProfile();
            } catch (e) {
              debugPrint('Profile fetch failed: $e');
              // Continue to navigation even if profile fetch fails
            }
            // Navigate to dashboard - always proceed after successful login
            Get.offAllNamed(RouteHelper.getInitialRoute());
          } else {
            showCustomSnackBar('Login failed. Please check your credentials.', isError: true);
          }
        }else {
          showCustomSnackBar(status.message);
        }
      });
    }
  }
}