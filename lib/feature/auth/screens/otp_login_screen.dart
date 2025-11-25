import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/helper/custom_validator.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class OtpLoginScreen extends StatelessWidget {
  OtpLoginScreen({super.key});

  final FocusNode _phoneFocus = FocusNode();
  final TextEditingController _phoneController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    // Fixed to +91 for India
    const String countryDialCode = '+91';

    return Scaffold(
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
                        Image.asset(Images.logo, width: 100),
                        const SizedBox(height: Dimensions.paddingSizeSmall),
                        Text('One Food Delivery', style: robotoBlack.copyWith(fontSize: 20)),
                        const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                        Text('LOGIN WITH OTP', style: robotoBlack.copyWith(fontSize: 30)),
                        const SizedBox(height: 10),
                        Text('Enter Your Valid Mobile Number', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall), textAlign: TextAlign.center),
                        const SizedBox(height: 50),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            color: Theme.of(context).cardColor,
                            boxShadow: [BoxShadow(color: Colors.black12, spreadRadius: 1, blurRadius: 5)],
                          ),
                          child: Row(
                            children: [
                              // Fixed +91 prefix for India
                              Container(
                                width: 60,
                                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
                                alignment: Alignment.center,
                                child: Text(
                                  '+91',
                                  style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 30,
                                color: Theme.of(context).disabledColor.withValues(alpha: 0.3),
                              ),
                              Expanded(
                                child: CustomTextFieldWidget(
                                  hintText: 'Enter Mobile Number',
                                  showLabelText: false,
                                  controller: _phoneController,
                                  focusNode: _phoneFocus,
                                  inputType: TextInputType.phone,
                                  showBorder: false,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 30),
                        CustomButtonWidget(
                          buttonText: 'SEND OTP',
                          isLoading: authController.isLoading,
                          onPressed: () => _sendOtp(authController, _phoneController, countryDialCode, context),
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

  void _sendOtp(AuthController authController, TextEditingController phoneCtlr, String countryCode, BuildContext context) async {
    String phone = phoneCtlr.text.trim();
    String numberWithCountryCode = countryCode + phone;
    PhoneValid phoneValid = await CustomValidator.isPhoneValid(numberWithCountryCode);
    numberWithCountryCode = phoneValid.phone;

    if (phone.isEmpty) {
      showCustomSnackBar('enter_phone_number'.tr);
    } else if (!phoneValid.isValid) {
      showCustomSnackBar('invalid_phone_number'.tr);
    } else {
      authController.sendOtp(numberWithCountryCode).then((status) async {
        if (status.isSuccess) {
          Get.toNamed(RouteHelper.getOtpVerificationRoute(), arguments: {
            'phone': numberWithCountryCode,
            'isLogin': true,
          });
        } else {
          showCustomSnackBar(status.message);
        }
      });
    }
  }
}

