import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class CustomConfirmationBottomSheet extends StatelessWidget {
  final String? image;
  final String title;
  final String? description;
  final String? confirmButtonText;
  final String? cancelButtonText;
  final Function onConfirm;
  const CustomConfirmationBottomSheet({super.key, this.image, required this.title, this.description, this.confirmButtonText, this.cancelButtonText, required this.onConfirm});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrderController>(builder: (orderController) {
      return GetBuilder<ProfileController>(builder: (profileController) {
        return GetBuilder<AuthController>(builder: (authController) {
          return Container(
            width: context.width,
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            decoration: BoxDecoration(
              color: Get.isDarkMode ? Theme.of(context).scaffoldBackgroundColor : Theme.of(context).cardColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(Dimensions.radiusExtraLarge), topRight: Radius.circular(Dimensions.radiusExtraLarge),
              ),
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [

              Align(
                alignment: Alignment.topRight,
                child: InkWell(
                  onTap: () {
                    Get.back();
                  },
                  child: Container(
                    height: 30, width: 30,
                    padding: EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: Theme.of(context).disabledColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close, color: Colors.white),
                  ),
                ),
              ),

              Image.asset(
                image ?? Images.warning, height: 60, width: 60,
              ),
              const SizedBox(height: Dimensions.paddingSizeLarge),

              Text(title, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge), textAlign: TextAlign.center),
              const SizedBox(height: Dimensions.paddingSizeDefault),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 35),
                child: Text(
                  description ?? '',
                  style: robotoRegular.copyWith(color: Theme.of(context).hintColor), textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 30),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeLarge),
                child: Row(children: [

                  Expanded(
                    child: CustomButtonWidget(
                      onPressed: () {
                        Get.back();
                      },
                      buttonText: cancelButtonText ?? 'cancel'.tr,
                      backgroundColor: Theme.of(context).disabledColor,
                      fontColor: Theme.of(context).textTheme.bodyLarge!.color,
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeDefault),

                  Expanded(
                    child: CustomButtonWidget(
                      onPressed: () => onConfirm(),
                      isLoading: orderController.isLoading || authController.isLoading || profileController.isLoading || profileController.shiftLoading,
                      buttonText: confirmButtonText ?? 'accept'.tr,
                      backgroundColor: Theme.of(context).primaryColor,
                    ),
                  ),

                ]),
              ),

            ]),

          );
        });
      });
    });
  }
}
