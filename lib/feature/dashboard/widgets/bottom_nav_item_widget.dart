import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class BottomNavItemWidget extends StatelessWidget {
  final String icon;
  final Function? onTap;
  final bool isSelected;
  final int? pageIndex;
  const BottomNavItemWidget({super.key, required this.icon, this.onTap, this.isSelected = false, this.pageIndex});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: IconButton(
        icon: Stack(
          clipBehavior: Clip.none,
          children: [
            CustomAssetImageWidget(image: icon, color: isSelected ? Theme.of(context).primaryColor : Colors.grey, height: 25, width: 25),

            pageIndex == 1 ? Positioned(
              top: -8, right: 0,
              child: Container(
                padding: EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: GetBuilder<OrderController>(builder: (orderController) {
                  return Text(
                    orderController.latestOrderList?.length.toString() ?? '0',
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall, color: Colors.white),
                  );
                }),
              ),
            ) : SizedBox(),

          ],
        ),
        onPressed: onTap as void Function()?,
      ),
    );
  }
}