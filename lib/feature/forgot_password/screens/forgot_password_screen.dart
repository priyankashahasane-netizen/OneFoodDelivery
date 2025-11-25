import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/controllers/forgot_password_controller.dart';
import 'package:stackfood_multivendor_driver/helper/custom_validator.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  
  final TextEditingController _numberController = TextEditingController();
  final FocusNode _numberFocus = FocusNode();
  // Fixed to +91 for India
  static const String _countryDialCode = '+91';

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      FocusScope.of(context).requestFocus(_numberFocus);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(title: 'forgot_password'.tr),

      body: SafeArea(child: Center(child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
        child: Center(child: SizedBox(width: 1170, child: Column(children: [

          Image.asset(Images.forgot, height: 220),

          Padding(
            padding: const EdgeInsets.all(30),
            child: Text('please_enter_mobile'.tr, style: robotoRegular, textAlign: TextAlign.center),
          ),

          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
              color: Theme.of(context).cardColor,
            ),
            child: Row(children: [
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
              Expanded(child: CustomTextFieldWidget(
                controller: _numberController,
                inputType: TextInputType.phone,
                inputAction: TextInputAction.done,
                focusNode: _numberFocus,
                labelText: 'phone'.tr,
                hintText: 'enter_mobile_number'.tr,
                onSubmit: (text) => GetPlatform.isWeb ? _forgetPass(_countryDialCode) : null,
              )),

            ]),
          ),
          const SizedBox(height: Dimensions.paddingSizeLarge),

          GetBuilder<ForgotPasswordController>(builder: (forgotPasswordController) {
            return !forgotPasswordController.isLoading ? CustomButtonWidget(
              buttonText: 'next'.tr,
              onPressed: () => _forgetPass(_countryDialCode),
            ) : const Center(child: CircularProgressIndicator());
          }),

        ]))),
      ))),

    );
  }


  void _forgetPass(String countryCode) async {
    String phone = _numberController.text.trim();

    String numberWithCountryCode = countryCode+phone;
    PhoneValid phoneValid = await CustomValidator.isPhoneValid(numberWithCountryCode);
    numberWithCountryCode = phoneValid.phone;

    if (phone.isEmpty) {
      showCustomSnackBar('enter_phone_number'.tr);
    }else if (!phoneValid.isValid) {
      showCustomSnackBar('invalid_phone_number'.tr);
    }else {
      Get.find<ForgotPasswordController>().forgotPassword(numberWithCountryCode).then((status) async {
        if (status.isSuccess) {
          // Navigate to verification screen
          Get.toNamed(RouteHelper.getForgotPasswordVerificationRoute(numberWithCountryCode));
        }else {
          showCustomSnackBar(status.message);
        }
      });
    }
  }
  
}