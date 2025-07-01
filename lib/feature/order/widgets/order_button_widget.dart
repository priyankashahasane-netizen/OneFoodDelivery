import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/status_list_model.dart';
import 'package:flutter/material.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class OrderButtonWidget extends StatelessWidget {
  final StatusListModel statusListModel;
  final int index;
  final OrderController orderController;
  final bool fromMyOrder;
  const OrderButtonWidget({super.key, required this.statusListModel, required this.index, required this.orderController, this.fromMyOrder = false});

  @override
  Widget build(BuildContext context) {
    int selectedIndex = fromMyOrder ? (orderController.selectedMyOrderStatusIndex ?? 0) : (orderController.selectedRunningOrderStatusIndex ?? 0);
    bool isSelected = selectedIndex == index;

    return InkWell(
      onTap: () {
        if(fromMyOrder){
          orderController.setSelectedMyOrderStatusIndex(index, statusListModel.status);
          orderController.getCompletedOrders(offset: 1, status: statusListModel.status);
        }else {
          orderController.setSelectedRunningOrderStatusIndex(index, statusListModel.status);
          orderController.getCurrentOrders(status: statusListModel.status);
        }
      },
      child: Row(children: [

        Container(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
            color: isSelected ? Theme.of(context).primaryColor : Theme.of(context).disabledColor.withValues(alpha: 0.5),
          ),
          alignment: Alignment.center,
          child: Row(
            children: [
              Text(
                statusListModel.statusTitle.tr,
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: robotoBold.copyWith(
                  fontSize: Dimensions.fontSizeSmall,
                  color: isSelected ? Theme.of(context).cardColor : Theme.of(context).hintColor,
                ),
              ),

              Container(
                margin: const EdgeInsets.only(left: Dimensions.paddingSizeExtraSmall),
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraSmall, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                  color: isSelected ? Theme.of(context).cardColor.withValues(alpha: 0.4) : Theme.of(context).cardColor,
                ),
                child: Text(
                  fromMyOrder ? orderController.completedOrderCountList![index].toString() : orderController.currentOrderCountList![index].toString(),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: robotoMedium.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: isSelected ? Theme.of(context).cardColor : Theme.of(context).hintColor,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(width: Dimensions.paddingSizeSmall),

      ]),
    );
  }
}