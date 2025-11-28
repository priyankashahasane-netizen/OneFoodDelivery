import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep1Screen extends StatefulWidget {
  final String phone;
  const RegistrationStep1Screen({super.key, required this.phone});

  @override
  State<RegistrationStep1Screen> createState() => _RegistrationStep1ScreenState();
}

class _RegistrationStep1ScreenState extends State<RegistrationStep1Screen> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final FocusNode _firstNameFocus = FocusNode();
  final FocusNode _lastNameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    // Auto-fill from registration data (which may have been auto-filled from profile)
    if (controller.registrationData.firstName != null) {
      _firstNameController.text = controller.registrationData.firstName!;
    }
    if (controller.registrationData.lastName != null) {
      _lastNameController.text = controller.registrationData.lastName!;
    }
    if (controller.registrationData.email != null) {
      _emailController.text = controller.registrationData.email!;
    }
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(1);
    });
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 1'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 1),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Personal Information'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Enter your personal details'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  CustomTextFieldWidget(
                    titleText: 'first_name'.tr,
                    hintText: 'enter_first_name'.tr,
                    controller: _firstNameController,
                    focusNode: _firstNameFocus,
                    nextFocus: _lastNameFocus,
                    inputType: TextInputType.name,
                    showBorder: true,
                    isRequired: true,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  CustomTextFieldWidget(
                    titleText: 'last_name'.tr,
                    hintText: 'enter_last_name'.tr,
                    controller: _lastNameController,
                    focusNode: _lastNameFocus,
                    nextFocus: _emailFocus,
                    inputType: TextInputType.name,
                    showBorder: true,
                    isRequired: true,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  CustomTextFieldWidget(
                    titleText: 'email'.tr,
                    hintText: 'enter_email'.tr,
                    controller: _emailController,
                    focusNode: _emailFocus,
                    inputType: TextInputType.emailAddress,
                    showBorder: true,
                    isRequired: true,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  CustomTextFieldWidget(
                    titleText: 'phone_number'.tr,
                    hintText: widget.phone,
                    controller: TextEditingController(text: widget.phone),
                    inputType: TextInputType.phone,
                    showBorder: true,
                    isEnabled: false,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  CustomButtonWidget(
                    buttonText: 'next'.tr,
                    isLoading: false,
                    onPressed: () => _validateAndProceed(controller),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _validateAndProceed(RegistrationController controller) {
    String firstName = _firstNameController.text.trim();
    String lastName = _lastNameController.text.trim();
    String email = _emailController.text.trim();

    if (firstName.isEmpty) {
      showCustomSnackBar('please_enter_first_name'.tr);
      _firstNameFocus.requestFocus();
      return;
    }

    if (lastName.isEmpty) {
      showCustomSnackBar('please_enter_last_name'.tr);
      _lastNameFocus.requestFocus();
      return;
    }

    if (email.isEmpty) {
      showCustomSnackBar('please_enter_email'.tr);
      _emailFocus.requestFocus();
      return;
    }

    if (!GetUtils.isEmail(email)) {
      showCustomSnackBar('please_enter_valid_email'.tr);
      _emailFocus.requestFocus();
      return;
    }

    controller.setPersonalInfo(firstName, lastName, email, widget.phone);
    Get.toNamed(RouteHelper.getRegistrationStep2Route());
  }
}

