import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:flutter/foundation.dart' show debugPrint;

class RegistrationStep8Screen extends StatefulWidget {
  const RegistrationStep8Screen({super.key});

  @override
  State<RegistrationStep8Screen> createState() => _RegistrationStep8ScreenState();
}

class _RegistrationStep8ScreenState extends State<RegistrationStep8Screen> {
  final TextEditingController _walletBalanceController = TextEditingController();
  final FocusNode _walletBalanceFocus = FocusNode();
  bool _isWalletBalanceFocused = false;
  final double _minBalance = 999.0; // Minimum wallet balance

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    
    if (controller.registrationData.walletBalance != null) {
      _walletBalanceController.text = controller.registrationData.walletBalance!.toStringAsFixed(2);
    } else {
      // Pre-fill with minimum balance
      _walletBalanceController.text = _minBalance.toStringAsFixed(2);
    }
    
    // Add listener to focus node to update border color
    _walletBalanceFocus.addListener(() {
      setState(() {
        _isWalletBalanceFocused = _walletBalanceFocus.hasFocus;
      });
    });
    
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(8);
    });
  }

  @override
  void dispose() {
    _walletBalanceController.dispose();
    _walletBalanceFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 8'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 8),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Wallet Setup'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Add minimum balance to your wallet'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Container(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Minimum Balance Required: ₹$_minBalance'.tr,
                          style: robotoMedium.copyWith(fontSize: 16),
                        ),
                        const SizedBox(height: Dimensions.paddingSizeDefault),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                            border: Border.all(
                              color: _isWalletBalanceFocused 
                                  ? Theme.of(context).primaryColor
                                  : Theme.of(context).primaryColor.withValues(alpha: 0.5),
                              width: _isWalletBalanceFocused ? 2 : 1,
                            ),
                          ),
                          child: CustomTextFieldWidget(
                            titleText: 'wallet_balance'.tr,
                            hintText: 'enter_amount'.tr,
                            controller: _walletBalanceController,
                            focusNode: _walletBalanceFocus,
                            inputType: const TextInputType.numberWithOptions(decimal: true),
                            showBorder: false, // We're using container border instead
                            isRequired: true,
                            isAmount: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Row(
                    children: [
                      Expanded(
                        child: CustomButtonWidget(
                          buttonText: 'previous'.tr,
                          isLoading: false,
                          onPressed: () => Get.back(),
                        ),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeDefault),
                      Expanded(
                        child: CustomButtonWidget(
                          buttonText: 'submit'.tr,
                          isLoading: controller.isLoading,
                          onPressed: () => _validateAndSubmit(controller),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _validateAndSubmit(RegistrationController controller) async {
    String balanceText = _walletBalanceController.text.trim();
    
    if (balanceText.isEmpty) {
      showCustomSnackBar('please_enter_wallet_balance'.tr);
      _walletBalanceFocus.requestFocus();
      return;
    }

    double? amountToAdd = double.tryParse(balanceText);
    if (amountToAdd == null) {
      showCustomSnackBar('please_enter_valid_amount'.tr);
      _walletBalanceFocus.requestFocus();
      return;
    }

    if (amountToAdd < _minBalance) {
      showCustomSnackBar('minimum_balance_required'.tr + ' ₹$_minBalance');
      _walletBalanceFocus.requestFocus();
      return;
    }

    // Get existing wallet balance from profile
    final profileController = Get.find<ProfileController>();
    double existingBalance = 0.0;
    // Use balance or payableBalance from profile (whichever is available)
    if (profileController.profileModel?.balance != null) {
      existingBalance = profileController.profileModel!.balance!;
    } else if (profileController.profileModel?.payableBalance != null) {
      existingBalance = profileController.profileModel!.payableBalance!;
    }
    
    // Calculate total wallet balance (existing + amount to add)
    double totalBalance = existingBalance + amountToAdd;
    
    // Set the total balance in registration data
    controller.setWalletBalance(totalBalance);

    ResponseModel response = await controller.submitRegistration();

    if (response.isSuccess) {
      showCustomSnackBar(response.message, isError: false);
      
      // Fetch profile after successful registration
      try {
        await Get.find<ProfileController>().getProfile();
      } catch (e) {
        debugPrint('Profile fetch failed: $e');
      }
      
      // Navigate to dashboard
      Get.offAllNamed(RouteHelper.getInitialRoute());
    } else {
      showCustomSnackBar(response.message, isError: true);
    }
  }
}

