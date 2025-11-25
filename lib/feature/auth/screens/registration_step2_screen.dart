import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';
import 'package:stackfood_multivendor_driver/data/indian_states_cities.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep2Screen extends StatefulWidget {
  const RegistrationStep2Screen({super.key});

  @override
  State<RegistrationStep2Screen> createState() => _RegistrationStep2ScreenState();
}

class _RegistrationStep2ScreenState extends State<RegistrationStep2Screen> {
  String? _selectedState;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    _selectedState = controller.registrationData.state;
    controller.setStep(2);
  }

  @override
  Widget build(BuildContext context) {
    final states = IndianStatesCities.getStates();
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 2'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 2),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Select State'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Choose your state'.tr,
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
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                        child: Text(
                          _selectedState ?? 'select_state'.tr,
                          style: robotoRegular.copyWith(
                            color: _selectedState != null
                                ? Theme.of(context).textTheme.bodyLarge?.color
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                      items: states.map((state) {
                        return DropdownItem<String>(
                          value: state,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Dimensions.paddingSizeDefault,
                              vertical: Dimensions.paddingSizeSmall,
                            ),
                            child: Text(state, style: robotoRegular),
                          ),
                        );
                      }).toList(),
                      onChange: (String value, int index) {
                        setState(() {
                          _selectedState = value;
                        });
                        controller.setState(value);
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
                          onPressed: _selectedState != null
                              ? () => Get.toNamed(RouteHelper.getRegistrationStep3Route())
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

