import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';

void showCustomBottomSheet({required Widget child, double? height}) {
  showModalBottomSheet(
    isScrollControlled: true, useRootNavigator: true, context: Get.context!,
    backgroundColor: Get.isDarkMode ? Theme.of(Get.context!).scaffoldBackgroundColor : Theme.of(Get.context!).cardColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.only(
        topLeft: Radius.circular(Dimensions.radiusExtraLarge),
        topRight: Radius.circular(Dimensions.radiusExtraLarge),
      ),
    ),
    builder: (context) {
      return ConstrainedBox(
        constraints: BoxConstraints(maxHeight: height ?? MediaQuery.of(context).size.height * 0.85),
        child: child,
      );
    },
  );
}