import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/data/indian_states_cities.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep3Screen extends StatefulWidget {
  const RegistrationStep3Screen({super.key});

  @override
  State<RegistrationStep3Screen> createState() => _RegistrationStep3ScreenState();
}

class _RegistrationStep3ScreenState extends State<RegistrationStep3Screen> {
  String? _selectedCity;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    _selectedCity = controller.registrationData.city;
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(3);
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<RegistrationController>();
    final selectedState = controller.registrationData.state;
    
    if (selectedState == null || selectedState.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showCustomSnackBar('please_select_state_first'.tr);
        Get.back();
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final cities = IndianStatesCities.getCitiesByState(selectedState);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 3'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 3),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Select City'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Choose your city in ${controller.registrationData.state}'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
                    ),
                    child: CustomDropdown<String>(
                      initialValue: _selectedCity,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                        child: Text(
                          _selectedCity ?? 'select_city'.tr,
                          style: robotoRegular.copyWith(
                            color: _selectedCity != null
                                ? Theme.of(context).textTheme.bodyLarge?.color
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                      items: cities.map((city) {
                        return DropdownItem<String>(
                          value: city,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Dimensions.paddingSizeDefault,
                              vertical: Dimensions.paddingSizeSmall,
                            ),
                            child: Text(city, style: robotoRegular),
                          ),
                        );
                      }).toList(),
                      onChange: (String value, int index) {
                        // Update local state immediately so button becomes enabled
                        setState(() {
                          _selectedCity = value;
                        });
                        // Defer controller update to avoid calling update during build
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          controller.setCity(value);
                        });
                      },
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
                          buttonText: 'next'.tr,
                          isLoading: false,
                          onPressed: _selectedCity != null
                              ? () => Get.toNamed(RouteHelper.getRegistrationStep4Route())
                              : null,
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
}

