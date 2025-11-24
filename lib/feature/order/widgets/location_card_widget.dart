import 'dart:async';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/cancellation_dialogue_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_details_screen.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

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
  Timer? _progressTimer;
  DateTime? _inTransitStartTime;

  @override
  void initState() {
    super.initState();
    _initializeInTransitTimer();
  }

  @override
  void didUpdateWidget(LocationCardWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If status changed to in_transit, reset the timer
    if (widget.orderModel.orderStatus?.toLowerCase() == 'in_transit' &&
        oldWidget.orderModel.orderStatus?.toLowerCase() != 'in_transit') {
      _initializeInTransitTimer();
    } else if (widget.orderModel.orderStatus?.toLowerCase() != 'in_transit') {
      // If status is no longer in_transit, stop the timer
      _progressTimer?.cancel();
      _inTransitStartTime = null;
    }
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    super.dispose();
  }

  void _initializeInTransitTimer() {
    String status = widget.orderModel.orderStatus?.toLowerCase() ?? '';
    if (status == 'in_transit') {
      // Set start time to now if not already set
      _inTransitStartTime ??= DateTime.now();
      
      // Cancel existing timer if any
      _progressTimer?.cancel();
      
      // Update progress every 10 seconds for smooth animation
      _progressTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
        if (mounted) {
          setState(() {
            // Trigger rebuild to update progress
          });
        } else {
          timer.cancel();
        }
      });
    }
  }

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
            // Status Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getStatusTitle(),
                    style: robotoBold.copyWith(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  
                  // Order number and details
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Order #${widget.orderModel.id}',
                        style: robotoBold.copyWith(
                          fontSize: Dimensions.fontSizeExtraLarge,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getOrderTimeAndDetails(),
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Dimensions.paddingSizeSmall),
                  
                  // Progress bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'to ${widget.orderModel.deliveryAddress?.address ?? 'Home'}',
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

            // Mark Order Picked Button (only show for handover status)
            if (widget.orderModel.orderStatus?.toLowerCase() == 'handover') ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Implement mark order picked functionality
                      widget.orderController.updateOrderStatus(
                        widget.orderModel.id,
                        'picked_up',
                      ).then((success) {
                        if (success) {
                          showCustomSnackBar('Order marked as picked', isError: false);
                        }
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                      backgroundColor: Colors.orange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                    ),
                    child: Text(
                      'Mark Order Picked',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),
            ],

            // Ready to Transit Button (only show for picked_up status)
            if (widget.orderModel.orderStatus?.toLowerCase() == 'picked_up') ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Update order status to in_transit
                      widget.orderController.updateOrderStatus(
                        widget.orderModel.id,
                        'in_transit',
                      ).then((success) {
                        if (success) {
                          showCustomSnackBar('Order ready to transit', isError: false);
                        }
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                      backgroundColor: Colors.orange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                    ),
                    child: Text(
                      'Ready to Transit',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),
            ],

            // Ready to Deliver Button (only show for in_transit status)
            if (widget.orderModel.orderStatus?.toLowerCase() == 'in_transit') ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // This button can be used for additional actions before delivery
                      // For now, it's just a placeholder
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                      backgroundColor: Colors.grey[300],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                    ),
                    child: Text(
                      'Ready to Deliver',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),
            ],

            // Deliver Button (only show for in_transit status)
            if (widget.orderModel.orderStatus?.toLowerCase() == 'in_transit') ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Update order status to delivered
                      widget.orderController.updateOrderStatus(
                        widget.orderModel.id,
                        'delivered',
                      ).then((success) {
                        if (success) {
                          showCustomSnackBar('Order delivered successfully', isError: false);
                          // Refresh the profile to update earnings
                          Get.find<ProfileController>().getProfile();
                          // Refresh the order list
                          widget.orderController.getCurrentOrders(
                            status: widget.orderController.selectedRunningOrderStatus ?? 'all'
                          );
                        } else {
                          showCustomSnackBar('Failed to deliver order', isError: true);
                        }
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeDefault),
                      backgroundColor: Colors.orange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                      ),
                    ),
                    child: Text(
                      'Deliver',
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeDefault),
            ],

            // Cancel Order Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    widget.orderController.setOrderCancelReason('');
                    Get.dialog(CancellationDialogueWidget(orderId: widget.orderModel.id));
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
                      // Navigate to order details screen with order details as argument
                      // Pass UUID if available for more efficient API calls
                      Get.toNamed(
                        RouteHelper.getOrderDetailsRoute(widget.orderModel.id),
                        arguments: OrderDetailsScreen(
                          orderId: widget.orderModel.id,
                          orderUuid: widget.orderModel.uuid, // Pass UUID directly if available
                          isRunningOrder: true, // Orders shown in location card are active/running orders
                          orderIndex: widget.index,
                        ),
                      );
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
            // Collapsed view - just show status title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeLarge, vertical: Dimensions.paddingSizeDefault),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _getStatusTitle(),
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

  String _getStatusTitle() {
    String status = widget.orderModel.orderStatus?.toLowerCase() ?? '';
    
    switch (status) {
      case 'pending':
        return 'Driver Pending';
      case 'assigned':
        return 'Driver Assigned';
      case 'accepted':
        return 'Driver Accepted';
      case 'confirmed':
        return 'Restaurant Confirmed';
      case 'processing':
        return 'Order Preparing';
      case 'handover':
        return 'Ready to pickup';
      case 'picked_up':
        return 'Order Picked';
      case 'in_transit':
        // Calculate remaining ETA dynamically
        int remainingMinutes = _getRemainingEtaMinutes();
        if (remainingMinutes == 0) {
          return 'Ready to deliver';
        }
        return 'Arriving in $remainingMinutes ${remainingMinutes == 1 ? 'min' : 'mins'}';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      case 'refund_requested':
        return 'Refund Requested';
      case 'refunded':
        return 'Refunded';
      case 'refund_request_cancelled':
        return 'Request Cancelled';
      default:
        return 'Driver Pending';
    }
  }

  // Calculate remaining ETA in minutes
  int _getRemainingEtaMinutes() {
    // Get initial estimated arrival time in minutes
    int initialEstimatedMinutes = widget.estimatedArrivalMinutes ?? 30;
    
    // If we don't have a start time, return the initial estimate
    if (_inTransitStartTime == null) {
      return initialEstimatedMinutes;
    }
    
    // Calculate elapsed time in minutes
    DateTime now = DateTime.now();
    Duration elapsed = now.difference(_inTransitStartTime!);
    int elapsedMinutes = elapsed.inMinutes; // Use whole minutes for ETA display
    
    // Calculate remaining ETA: initial estimate - elapsed time
    int remainingMinutes = initialEstimatedMinutes - elapsedMinutes;
    
    // Ensure ETA doesn't go below 0 (or 1 for better UX)
    return remainingMinutes > 0 ? remainingMinutes : 0;
  }

  double _calculateProgress() {
    // Calculate progress based on order status
    String status = widget.orderModel.orderStatus?.toLowerCase() ?? '';
    
    switch (status) {
      // Progress at 0% for these statuses
      case 'accepted':
      case 'confirmed':
      case 'processing':
      case 'handover':
      case 'picked_up':
        return 0.0;
      
      // Progress at 100% for these statuses
      case 'delivered':
      case 'cancelled':
      case 'refund_requested':
      case 'refunded':
      case 'refund_request_cancelled':
        return 1.0;
      
      // Other statuses
      case 'pending':
      case 'assigned':
        return 0.0;
      
      case 'in_transit':
        return _calculateInTransitProgress();
      
      default:
        return 0.0;
    }
  }

  double _calculateInTransitProgress() {
    // Get estimated arrival time in minutes
    int estimatedMinutes = widget.estimatedArrivalMinutes ?? 30;
    
    // If we don't have a start time, initialize it
    if (_inTransitStartTime == null) {
      _inTransitStartTime = DateTime.now();
      return 0.0;
    }
    
    // Calculate elapsed time in minutes
    DateTime now = DateTime.now();
    Duration elapsed = now.difference(_inTransitStartTime!);
    double elapsedMinutes = elapsed.inSeconds / 60.0; // Convert to minutes with decimals
    
    // Calculate progress: elapsed time / estimated time
    // Progress increases by (100 / estimatedMinutes) % per minute
    double progress = elapsedMinutes / estimatedMinutes;
    
    // Clamp progress between 0.0 and 1.0 (0% to 100%)
    if (progress < 0.0) return 0.0;
    if (progress > 1.0) return 1.0;
    
    return progress;
  }

  String _getOrderTimeAndDetails() {
    String timeStr = '';
    if (widget.orderModel.createdAt != null) {
      try {
        DateTime orderTime = DateConverter.dateTimeStringToDate(widget.orderModel.createdAt!);
        timeStr = DateFormat('h:mm a').format(orderTime);
      } catch (e) {
        timeStr = '';
      }
    }
    
    int itemCount = widget.orderModel.detailsCount ?? 1;
    String itemsText = itemCount == 1 ? '$itemCount item' : '$itemCount items';
    double orderAmount = widget.orderModel.orderAmount ?? 0;
    String priceText = PriceConverter.convertPrice(orderAmount, showCurrency: false);
    
    return '$timeStr | $itemsText, $priceText';
  }
}
