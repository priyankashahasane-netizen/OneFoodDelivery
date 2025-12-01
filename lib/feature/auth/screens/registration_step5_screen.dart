import 'dart:io';
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
  bool _isVehicleNumberFocused = false;

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
    if (controller.registrationData.vehicleNumber != null) {
      _vehicleNumberController.text = controller.registrationData.vehicleNumber!;
    }
    // Add listener to focus node to update border color
    _vehicleNumberFocus.addListener(() {
      setState(() {
        _isVehicleNumberFocused = _vehicleNumberFocus.hasFocus;
      });
    });
    // Defer setStep to avoid calling update during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.setStep(5);
    });
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
          final selectedVehicleType = controller.registrationData.vehicleType;
          
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
                      initialValue: selectedVehicleType,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                        child: Text(
                          selectedVehicleType ?? 'select_vehicle_type'.tr,
                          style: robotoRegular.copyWith(
                            color: selectedVehicleType != null
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
                      onChange: (String? value, int index) {
                        if (value != null) {
                          // Defer controller update to avoid calling update during build
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            // Update vehicle type immediately, even if vehicle number is empty
                            // This ensures the Next button becomes enabled when both are filled
                            final currentVehicleNumber = controller.registrationData.vehicleNumber ?? 
                                                         _vehicleNumberController.text.trim();
                            if (currentVehicleNumber.isNotEmpty) {
                              controller.setVehicle(value, currentVehicleNumber);
                            } else {
                              // Just update the vehicle type in the data model
                              controller.registrationData.vehicleType = value;
                              controller.update();
                            }
                          });
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      border: Border.all(
                        color: _isVehicleNumberFocused 
                            ? Theme.of(context).primaryColor
                            : Theme.of(context).primaryColor.withValues(alpha: 0.5),
                        width: _isVehicleNumberFocused ? 2 : 1,
                      ),
                    ),
                    child: CustomTextFieldWidget(
                      titleText: 'vehicle_number'.tr,
                      hintText: 'enter_vehicle_number'.tr,
                      controller: _vehicleNumberController,
                      focusNode: _vehicleNumberFocus,
                      inputType: TextInputType.text,
                      showBorder: false, // We're using container border instead
                      isRequired: true,
                      onChanged: (text) {
                        // Update controller when text changes to enable Next button
                        setState(() {});
                        final controller = Get.find<RegistrationController>();
                        final vehicleType = controller.registrationData.vehicleType;
                        if (vehicleType != null && text.trim().isNotEmpty) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            controller.setVehicle(vehicleType, text.trim());
                          });
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Text(
                    'Driver License'.tr,
                    style: robotoBold.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Upload front and back of your driver license'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  // Driver License Front Image
                  _buildImageSection(
                    context,
                    controller,
                    'Driver License Front'.tr,
                    controller.registrationData.driverLicenseFrontImage,
                    () => _showImagePicker(context, controller, isFront: true),
                    () => controller.removeDriverLicenseFront(),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  // Driver License Back Image
                  _buildImageSection(
                    context,
                    controller,
                    'Driver License Back'.tr,
                    controller.registrationData.driverLicenseBackImage,
                    () => _showImagePicker(context, controller, isFront: false),
                    () => controller.removeDriverLicenseBack(),
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
                          onPressed: (selectedVehicleType != null &&
                                  _vehicleNumberController.text.trim().isNotEmpty &&
                                  controller.registrationData.driverLicenseFrontImage != null &&
                                  controller.registrationData.driverLicenseBackImage != null)
                              ? () {
                                  // selectedVehicleType is guaranteed to be non-null here due to the condition
                                  final vehicleType = selectedVehicleType;
                                  final vehicleNumber = _vehicleNumberController.text.trim();
                                  controller.setVehicle(vehicleType, vehicleNumber);
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

  Widget _buildImageSection(
    BuildContext context,
    RegistrationController controller,
    String title,
    dynamic imageFile,
    VoidCallback onPick,
    VoidCallback onRemove,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: robotoMedium.copyWith(fontSize: 16)),
        const SizedBox(height: Dimensions.paddingSizeSmall),
        Container(
          height: 200,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
            border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
          ),
          child: imageFile != null
              ? Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      child: GetPlatform.isWeb
                          ? Image.network(
                              imageFile.path,
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.cover,
                            )
                          : Image.file(
                              File(imageFile.path),
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.cover,
                            ),
                    ),
                    Positioned(
                      top: 5,
                      right: 5,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: onRemove,
                      ),
                    ),
                  ],
                )
              : InkWell(
                  onTap: onPick,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.add_photo_alternate,
                        size: 50,
                        color: Theme.of(context).hintColor,
                      ),
                      const SizedBox(height: Dimensions.paddingSizeSmall),
                      Text(
                        'Tap to upload'.tr,
                        style: robotoRegular.copyWith(color: Theme.of(context).hintColor),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  void _showImagePicker(BuildContext context, RegistrationController controller, {required bool isFront}) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: Text('Camera'.tr),
              onTap: () {
                Get.back();
                if (isFront) {
                  controller.pickDriverLicenseFront(isCamera: true);
                } else {
                  controller.pickDriverLicenseBack(isCamera: true);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: Text('Gallery'.tr),
              onTap: () {
                Get.back();
                if (isFront) {
                  controller.pickDriverLicenseFront(isCamera: false);
                } else {
                  controller.pickDriverLicenseBack(isCamera: false);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

