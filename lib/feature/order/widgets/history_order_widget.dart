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

              Text('(${orderModel.detailsCount ?? 0} ${'item'.tr})', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),

              const Expanded(child: SizedBox()),
              Container(
                padding: EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraSmall, vertical: 3),
                decoration: BoxDecoration(
                  color: _getStatusBackgroundColor(context, orderModel.orderStatus),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                ),
                child: Text(
                  _formatStatusText(orderModel.orderStatus ?? ''),
                  style: robotoMedium.copyWith(
                    fontSize: Dimensions.fontSizeSmall,
                    color: _getStatusTextColor(context, orderModel.orderStatus),
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

  /// Get background color for order status badge
  Color _getStatusBackgroundColor(BuildContext context, String? status) {
    if (status == null) return Theme.of(context).primaryColor.withValues(alpha: 0.1);
    
    switch (status.toLowerCase()) {
      case 'pending':
        return ColorResources.blue.withValues(alpha: 0.1);
      case 'accepted':
      case 'confirmed':
      case 'delivered':
        return ColorResources.green.withValues(alpha: 0.1);
      case 'canceled':
      case 'cancelled':
        return ColorResources.red.withValues(alpha: 0.1);
      case 'refund_requested':
        return ColorResources.orange.withValues(alpha: 0.1);
      case 'refunded':
        return ColorResources.yellow.withValues(alpha: 0.1);
      case 'refund_request_canceled':
        return ColorResources.blue.withValues(alpha: 0.1);
      default:
        return Theme.of(context).primaryColor.withValues(alpha: 0.1);
    }
  }

  /// Get text color for order status badge
  Color _getStatusTextColor(BuildContext context, String? status) {
    if (status == null) return Theme.of(context).primaryColor;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return ColorResources.blue;
      case 'accepted':
      case 'confirmed':
      case 'delivered':
        return ColorResources.green;
      case 'canceled':
      case 'cancelled':
        return ColorResources.red;
      case 'refund_requested':
        return ColorResources.orange;
      case 'refunded':
        return ColorResources.yellow;
      case 'refund_request_canceled':
        return ColorResources.blue;
      default:
        return Theme.of(context).primaryColor;
    }
  }

  /// Format status text for display
  String _formatStatusText(String status) {
    if (status.isEmpty) return '';
    
    // Handle both "canceled" and "cancelled" spellings
    String normalizedStatus = status.toLowerCase();
    if (normalizedStatus == 'canceled' || normalizedStatus == 'cancelled') {
      return 'Cancelled';
    }
    
    return status.toTitleCase();
  }
}