import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_field_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep5Screen extends StatefulWidget {
  const RegistrationStep5Screen({super.key});

  @override
  State<RegistrationStep5Screen> createState() => _RegistrationStep5ScreenState();
}

class _RegistrationStep5ScreenState extends State<RegistrationStep5Screen> {
  final TextEditingController _vehicleNumberController = TextEditingController();
  final FocusNode _vehicleNumberFocus = FocusNode();
  String? _selectedVehicleType;

  final List<String> _vehicleTypes = [
    'Bike',
    'Car',
    'Auto',
    'Scooter',
    'Motorcycle',
    'Van',
    'Truck',
  ];

  @override
  void initState() {
    super.initState();
    final controller = Get.find<RegistrationController>();
    _selectedVehicleType = controller.registrationData.vehicleType;
    if (controller.registrationData.vehicleNumber != null) {
      _vehicleNumberController.text = controller.registrationData.vehicleNumber!;
    }
    controller.setStep(5);
  }

  @override
  void dispose() {
    _vehicleNumberController.dispose();
    _vehicleNumberFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 5'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 5),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Vehicle Information'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Enter your vehicle details'.tr,
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
                          _selectedVehicleType ?? 'select_vehicle_type'.tr,
                          style: robotoRegular.copyWith(
                            color: _selectedVehicleType != null
                                ? Theme.of(context).textTheme.bodyLarge?.color
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                      items: _vehicleTypes.map((type) {
                        return DropdownItem<String>(
                          value: type,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Dimensions.paddingSizeDefault,
                              vertical: Dimensions.paddingSizeSmall,
                            ),
                            child: Text(type, style: robotoRegular),
                          ),
                        );
                      }).toList(),
                      onChange: (String value, int index) {
                        setState(() {
                          _selectedVehicleType = value;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  CustomTextFieldWidget(
                    titleText: 'vehicle_number'.tr,
                    hintText: 'enter_vehicle_number'.tr,
                    controller: _vehicleNumberController,
                    focusNode: _vehicleNumberFocus,
                    inputType: TextInputType.text,
                    showBorder: true,
                    isRequired: true,
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
                          onPressed: _selectedVehicleType != null &&
                                  _vehicleNumberController.text.trim().isNotEmpty
                              ? () {
                                  controller.setVehicle(
                                    _selectedVehicleType!,
                                    _vehicleNumberController.text.trim(),
                                  );
                                  Get.toNamed(RouteHelper.getRegistrationStep6Route());
                                }
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

