import 'package:flutter/cupertino.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/camera_button_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class DialogImageWidget extends StatelessWidget {
  const DialogImageWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
      child: Column(mainAxisSize: MainAxisSize.min, children: [

        Align(
          alignment: Alignment.topRight,
          child: InkWell(
            onTap: () => Get.back(),
            child: Container(
              decoration:  BoxDecoration(
                shape: BoxShape.circle, color: Theme.of(context).disabledColor.withValues(alpha: 0.5),
              ),
              padding: const EdgeInsets.all(3),
              child: const Icon(Icons.clear, size: 16, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: Dimensions.paddingSizeSmall),

        Text(
          'take_a_picture'.tr, textAlign: TextAlign.center,
          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
        ),
        const SizedBox(height: Dimensions.paddingSizeDefault),

        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Theme.of(context).disabledColor.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          ),
          padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
          child: Column(mainAxisSize: MainAxisSize.min, children: [

            GetBuilder<OrderController>(builder: (orderController) {
              return InkWell(
                onTap: () {
                  Get.bottomSheet(const CameraButtonSheetWidget());
                },
                child: Container(
                  height: 100, width: 100, alignment: Alignment.center, decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
                ),
                  child:  Icon(CupertinoIcons.camera_fill, color: Theme.of(context).primaryColor, size: 40),
                ),
              );
            }),

          ]),
        ),

      ]),
    );
  }
}