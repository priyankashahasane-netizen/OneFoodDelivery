import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/registration_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/widgets/registration_progress_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RegistrationStep7Screen extends StatelessWidget {
  const RegistrationStep7Screen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration - Step 7'.tr),
        backgroundColor: Theme.of(context).cardColor,
      ),
      body: GetBuilder<RegistrationController>(
        builder: (controller) {
          // Defer setStep to avoid calling update during build
          WidgetsBinding.instance.addPostFrameCallback((_) {
            controller.setStep(7);
          });
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: Column(
                children: [
                  const RegistrationProgressWidget(currentStep: 7),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                  Text(
                    'Selfie Verification'.tr,
                    style: robotoBold.copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  Text(
                    'Take a selfie for verification'.tr,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraLarge),
                  Container(
                    height: 300,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      border: Border.all(color: Theme.of(context).primaryColor.withValues(alpha: 0.3)),
                    ),
                    child: controller.registrationData.selfieImage != null
                        ? Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                                child: GetPlatform.isWeb
                                    ? Image.network(
                                        controller.registrationData.selfieImage!.path,
                                        width: double.infinity,
                                        height: 300,
                                        fit: BoxFit.cover,
                                      )
                                    : Image.file(
                                        File(controller.registrationData.selfieImage!.path),
                                        width: double.infinity,
                                        height: 300,
                                        fit: BoxFit.cover,
                                      ),
                              ),
                              Positioned(
                                top: 10,
                                right: 10,
                                child: IconButton(
                                  icon: const Icon(Icons.close, color: Colors.white),
                                  onPressed: () {
                                    controller.removeSelfie();
                                  },
                                ),
                              ),
                            ],
                          )
                        : InkWell(
                            onTap: () => _showImagePicker(context, controller),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.camera_alt,
                                  size: 80,
                                  color: Theme.of(context).hintColor,
                                ),
                                const SizedBox(height: Dimensions.paddingSizeSmall),
                                Text(
                                  'Tap to take selfie'.tr,
                                  style: robotoRegular.copyWith(color: Theme.of(context).hintColor),
                                ),
                              ],
                            ),
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
                          onPressed: controller.registrationData.selfieImage != null
                              ? () => Get.toNamed(RouteHelper.getRegistrationStep8Route())
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

  void _showImagePicker(BuildContext context, RegistrationController controller) {
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
                controller.pickSelfie(isCamera: true);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: Text('Gallery'.tr),
              onTap: () {
                Get.back();
                controller.pickSelfie(isCamera: false);
              },
            ),
          ],
        ),
      ),
    );
  }
}

