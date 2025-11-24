import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/controllers/bottom_nav_controller.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/bottom_nav_item_widget.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';

class GlobalBottomNavWidget extends StatelessWidget {
  const GlobalBottomNavWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Get.isDarkMode
                ? Colors.white.withValues(alpha: 0.05)
                : Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            spreadRadius: 0,
            offset: const Offset(0, 0),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
        child: GetBuilder<BottomNavController>(
          builder: (controller) => Row(
            children: [
              BottomNavItemWidget(
                icon: Images.homeIcon,
                isSelected: controller.isSelected(0),
                onTap: () => controller.navigateToPage(0),
              ),
              BottomNavItemWidget(
                icon: Images.orderRequestIcon,
                isSelected: controller.isSelected(1),
                pageIndex: 1,
                onTap: () => controller.navigateToPage(1),
              ),
              BottomNavItemWidget(
                icon: Images.myOrderIcon,
                isSelected: controller.isSelected(2),
                onTap: () => controller.navigateToPage(2),
              ),
              BottomNavItemWidget(
                iconData: Icons.map_outlined,
                isSelected: controller.isSelected(3),
                onTap: () => controller.navigateToPage(3),
                iconSize: 22,
              ),
              BottomNavItemWidget(
                icon: Images.personIcon,
                isSelected: controller.isSelected(4),
                onTap: () => controller.navigateToPage(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

