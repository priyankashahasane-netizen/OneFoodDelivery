import 'package:stackfood_multivendor_driver/feature/order/screens/order_location_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
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
      onTap: () {
        final orderController = Get.find<OrderController>();
        Get.to(() => OrderLocationScreen(
          orderModel: orderModel,
          orderController: orderController,
          index: index,
          onTap: () {}, // Empty callback for completed orders
        ));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Header Section
            Container(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              decoration: BoxDecoration(
                color: Theme.of(context).disabledColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(Dimensions.radiusDefault),
                  topRight: Radius.circular(Dimensions.radiusDefault),
                ),
              ),
              child: Row(
                children: [
                  // Order number and item count
                  Expanded(
                    child: Row(
                      children: [
                        Text(
                          '${'order'.tr} # ',
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        Text(
                          '${orderModel.id} ',
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        Text(
                          '(${orderModel.detailsCount ?? 0} ${'item'.tr})',
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeSmall,
                            color: Theme.of(context).hintColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Dimensions.paddingSizeSmall,
                      vertical: 4,
                    ),
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
                ],
              ),
            ),

            // Restaurant and Time Section
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingSizeDefault,
                vertical: Dimensions.paddingSizeSmall,
              ),
              child: Row(
                children: [
                  // Restaurant icon and name
                  Image.asset(
                    Images.house,
                    width: 20,
                    height: 20,
                    color: Theme.of(context).hintColor,
                  ),
                  const SizedBox(width: Dimensions.paddingSizeExtraSmall),
                  Expanded(
                    child: Text(
                      orderModel.restaurantName ?? 'no_restaurant_data_found'.tr,
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Time
                  Text(
                    DateConverter.dateTimeStringToTime(orderModel.createdAt!),
                    style: robotoRegular.copyWith(
                      color: Theme.of(context).hintColor,
                      fontSize: Dimensions.fontSizeSmall,
                    ),
                  ),
                ],
              ),
            ),

            // Delivery Type Section
            Padding(
              padding: const EdgeInsets.only(
                left: Dimensions.paddingSizeDefault,
                right: Dimensions.paddingSizeDefault,
                bottom: Dimensions.paddingSizeSmall,
              ),
              child: Text(
                orderModel.orderType == 'delivery' 
                    ? 'home_delivery'.tr 
                    : orderModel.orderType?.toTitleCase() ?? '',
                style: robotoMedium.copyWith(
                  color: orderModel.orderType == 'delivery' 
                      ? ColorResources.blue 
                      : Theme.of(context).primaryColor,
                  fontSize: Dimensions.fontSizeSmall,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Get background color for order status badge (solid color for screenshot match)
  Color _getStatusBackgroundColor(BuildContext context, String? status) {
    if (status == null) return ColorResources.red;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return ColorResources.blue;
      case 'accepted':
      case 'confirmed':
      case 'delivered':
        return ColorResources.green;
      case 'cancelled':
      case 'cancelled':
        return ColorResources.red; // Red background for cancelled
      case 'refund_requested':
        return ColorResources.orange;
      case 'refunded':
        return ColorResources.yellow;
      case 'refund_request_cancelled':
        return ColorResources.blue;
      case 'processing':
      case 'handover':
      case 'picked_up':
      case 'in_transit':
        return ColorResources.green;
      default:
        return Theme.of(context).primaryColor;
    }
  }

  /// Get text color for order status badge (white text for screenshot match)
  Color _getStatusTextColor(BuildContext context, String? status) {
    // Use white text for all status badges to match screenshot
    return Colors.white;
  }

  /// Format status text for display
  String _formatStatusText(String status) {
    if (status.isEmpty) return '';
    
    // Handle both "cancelled" and "cancelled" spellings
    String normalizedStatus = status.toLowerCase();
    if (normalizedStatus == 'cancelled' || normalizedStatus == 'cancelled') {
      return 'Cancelled';
    }
    
    return status.toTitleCase();
  }
}