import 'package:stackfood_multivendor_driver/common/widgets/details_custom_card.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_details_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/helper/string_extensions.dart';
import 'package:stackfood_multivendor_driver/util/color_resources.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class HistoryOrderWidget extends StatelessWidget {
  final OrderModel orderModel;
  final bool isRunning;
  final int index;
  const HistoryOrderWidget({super.key, required this.orderModel, required this.isRunning, required this.index});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Get.toNamed(
        RouteHelper.getOrderDetailsRoute(orderModel.id),
        arguments: OrderDetailsScreen(orderId: orderModel.id, isRunningOrder: isRunning, orderIndex: index),
      ),
      child: DetailsCustomCard(
        margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
        child: Column(children: [

          Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
            decoration: BoxDecoration(
              color: Theme.of(context).disabledColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(Dimensions.radiusDefault), topRight: Radius.circular(Dimensions.radiusDefault),
              ),
            ),
            child: Row(children: [
              Text('${'order'.tr} # ', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),

              Text('${orderModel.id} ', style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),

              Text('(${orderModel.detailsCount} ${'item'.tr})', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),

              const Expanded(child: SizedBox()),
              Container(
                padding: EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraSmall, vertical: 3),
                decoration: BoxDecoration(
                  color: orderModel.orderStatus == 'pending' ? ColorResources.blue.withValues(alpha: 0.1)
                    : (orderModel.orderStatus == 'accepted' || orderModel.orderStatus == 'confirmed' || orderModel.orderStatus == 'delivered') ? ColorResources.green.withValues(alpha: 0.1)
                    : orderModel.orderStatus == 'canceled' ? ColorResources.red.withValues(alpha: 0.1) : Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                ),
                child: Text(
                  orderModel.orderStatus!.toTitleCase(),
                  style: robotoMedium.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: orderModel.orderStatus == 'pending' ? ColorResources.blue
                      : (orderModel.orderStatus == 'accepted' || orderModel.orderStatus == 'confirmed' || orderModel.orderStatus == 'delivered') ? ColorResources.green
                      : orderModel.orderStatus == 'canceled' ? ColorResources.red : Theme.of(context).primaryColor,
                  ),
                ),
              ),
            ]),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeSmall),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.start, children: [
                Image.asset(Images.house, width: 20, height: 20),
                const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                Text(
                  orderModel.restaurantName ?? 'no_restaurant_data_found'.tr,
                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                Spacer(),

                Text(
                  DateConverter.dateTimeStringToTime(orderModel.createdAt!),
                  style: robotoRegular.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeSmall),
                ),
              ]),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              Text(
                orderModel.orderType == 'delivery' ? 'home_delivery'.tr : orderModel.orderType!.toTitleCase(),
                style: robotoMedium.copyWith(
                  color: orderModel.orderType == 'delivery' ? ColorResources.blue : Theme.of(context).primaryColor,
                  fontSize: Dimensions.fontSizeSmall,
                ),
                maxLines: 1, overflow: TextOverflow.ellipsis,
              ),
            ]),
          ),

        ]),
      ),
    );
  }
}