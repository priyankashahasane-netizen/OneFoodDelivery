import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class LocationCardWidget extends StatefulWidget {
  final OrderModel orderModel;
  final OrderController orderController;
  final int index;
  final Function onTap;
  final int? estimatedArrivalMinutes;
  const LocationCardWidget({
    super.key,
    required this.orderModel,
    required this.orderController,
    required this.index,
    required this.onTap,
    this.estimatedArrivalMinutes,
  });

  @override
  State<LocationCardWidget> createState() => _LocationCardWidgetState();
}

class _LocationCardWidgetState extends State<LocationCardWidget> {
  bool isExpanded = true;

  @override
  Widget build(BuildContext context) {
    // Calculate progress (0.0 to 1.0) based on order status
    double progress = _calculateProgress();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            spreadRadius: 0,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          GestureDetector(
            onTap: () {
              setState(() {
                isExpanded = !isExpanded;
              });
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
              child: Container(
                height: 5,
                width: 50,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                ),
              ),
            ),
          ),

          if (isExpanded) ...[
            // Estimated Arrival Time
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Arriving in ${widget.estimatedArrivalMinutes ?? 30} mins',
                    style: robotoBold.copyWith(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  
                  // Progress bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'to ${widget.orderModel.deliveryAddress?.address?.split(',').first ?? 'Home'} -',
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Dimensions.paddingSizeLarge),
                ],
              ),
            ),

            // Order Received Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  // Food image placeholder
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                    ),
                    child: Icon(Icons.fastfood, color: Colors.grey[600], size: 30),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeDefault),
                  
                  // Restaurant info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Order received from ${widget.orderModel.restaurantName ?? 'Restaurant'}',
                          style: robotoMedium.copyWith(
                            fontSize: Dimensions.fontSizeDefault,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (widget.orderModel.restaurantAddress != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            widget.orderModel.restaurantAddress!,
                            style: robotoRegular.copyWith(
                              fontSize: Dimensions.fontSizeSmall,
                              color: Colors.grey[600],
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Phone icon
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.phone, color: Colors.white, size: 20),
                    ),
                    onPressed: () {
                      // Call restaurant
                      if (widget.orderModel.restaurantPhone != null) {
                        // Implement phone call functionality
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeLarge),

            // Address Check Section
            Container(
              margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
              ),
              child: Row(
                children: [
                  Icon(Icons.person, color: Colors.blue[700], size: 20),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  Expanded(
                    child: Text(
                      'To ensure the rider locates you with ease, double check your address and edit if needed',
                      style: robotoRegular.copyWith(
                        fontSize: Dimensions.fontSizeSmall,
                        color: Colors.blue[900],
                      ),
                    ),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  TextButton(
                    onPressed: () {
                      // Edit address functionality
                    },
                    child: Text(
                      'Edit',
                      style: robotoBold.copyWith(
                        color: Colors.blue[700],
                        fontSize: Dimensions.fontSizeDefault,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeLarge),

            // Cancel Order Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    showCustomBottomSheet(
                      child: CustomConfirmationBottomSheet(
                        title: 'cancel_order'.tr,
                        description: 'are_you_sure_want_to_cancel_this_order'.tr,
                        confirmButtonText: 'cancel_order'.tr,
                        onConfirm: () {
                          Get.back();
                          // Implement cancel order functionality
                          showCustomSnackBar('Order cancellation requested', isError: false);
                        },
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                    ),
                  ),
                  child: Text(
                    'Cancel Order',
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeLarge,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeLarge),

            // Bottom section - "While you wait..."
            Container(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              child: Column(
                children: [
                  Text(
                    'While you wait for your order...',
                    style: robotoRegular.copyWith(
                      fontSize: Dimensions.fontSizeDefault,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  TextButton(
                    onPressed: () {
                      // Show more content
                    },
                    child: Text(
                      '↓ View More',
                      style: robotoMedium.copyWith(
                        color: Colors.orange,
                        fontSize: Dimensions.fontSizeDefault,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Dimensions.paddingSizeDefault),
          ] else ...[
            // Collapsed view - just show arrival time
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge, vertical: Dimensions.paddingSizeDefault),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Arriving in ${widget.estimatedArrivalMinutes ?? 30} mins',
                    style: robotoBold.copyWith(
                      fontSize: Dimensions.fontSizeLarge,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Icon(Icons.keyboard_arrow_up, color: Colors.grey[600]),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  double _calculateProgress() {
    // Calculate progress based on order status
    String status = widget.orderModel.orderStatus?.toLowerCase() ?? '';
    
    switch (status) {
      case 'pending':
      case 'assigned':
        return 0.1;
      case 'accepted':
        return 0.2;
      case 'confirmed':
        return 0.3;
      case 'processing':
        return 0.4;
      case 'handover':
        return 0.5;
      case 'picked_up':
        return 0.7;
      case 'in_transit':
        return 0.9;
      case 'delivered':
        return 1.0;
      default:
        return 0.1;
    }
  }
}
