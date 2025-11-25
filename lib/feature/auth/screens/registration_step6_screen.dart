import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep6Screen extends StatelessWidget {
  const RegistrationStep6Screen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 6'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          controller.setStep(6);
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 6),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Aadhaar Card'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Upload front and back of your Aadhaar card'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  // Front Image
                  _buildImageSection(
                    context,
                    'Aadhaar Front'.tr,
                    controller.registrationData.aadhaarFrontImage,
                    () => _showImagePicker(context, controller, isFront: true),
                    () => controller.removeAadhaarFront(),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeDefault),
                  // Back Image
                  _buildImageSection(
                    context,
                    'Aadhaar Back'.tr,
                    controller.registrationData.aadhaarBackImage,
                    () => _showImagePicker(context, controller, isFront: false),
                    () => controller.removeAadhaarBack(),
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
                          onPressed: controller.registrationData.aadhaarFrontImage != null &&
                                  controller.registrationData.aadhaarBackImage != null
                              ? () => Get.toNamed(RouteHelper.getRegistrationStep7Route())
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
                  controller.pickAadhaarFront(isCamera: true);
                } else {
                  controller.pickAadhaarBack(isCamera: true);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: Text('Gallery'.tr),
              onTap: () {
                Get.back();
                if (isFront) {
                  controller.pickAadhaarFront(isCamera: false);
                } else {
                  controller.pickAadhaarBack(isCamera: false);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

