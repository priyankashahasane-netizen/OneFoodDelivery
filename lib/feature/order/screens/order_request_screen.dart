import 'dart:async';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_requset_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class OrderRequestScreen extends StatefulWidget {
  final Function onTap;
  const OrderRequestScreen({super.key, required this.onTap});

  @override
  OrderRequestScreenState createState() => OrderRequestScreenState();
}

class OrderRequestScreenState extends State<OrderRequestScreen> {

  Timer? _timer;

  @override
  initState() {
    super.initState();

    final orderController = Get.find<OrderController>();
    // Load both latest and assigned orders on initial load
    // This ensures the loader shows immediately for assigned orders
    Future.wait([
      orderController.getLatestOrders(),
      orderController.getAssignedOrders(),
    ]);
    
    // Start timer to fetch both latest and assigned orders every 10 seconds
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      // Run both API calls in parallel
      Future.wait([
        orderController.getLatestOrders(),
        orderController.getAssignedOrders(),
      ]);
    });
  }

  @override
  void dispose() {
    super.dispose();

    _timer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(
        title: 'order_request'.tr,
        isBackButtonExist: true,
        showMenuButton: false,
        onBackPressed: () {
          Get.offNamedUntil(
            RouteHelper.getMainRoute('home'),
            (route) => route.settings.name == '/main' || route.settings.name == '/',
          );
        },
      ),

      body: GetBuilder<OrderController>(builder: (orderController) {
        // Cache filtered lists to avoid recalculating on every rebuild
        // Filter orders to show only those with status "pending" in Available Orders section
        final latestOrderList = orderController.latestOrderList;
        final assignedOrderList = orderController.assignedOrderList;
        final pendingOrders = latestOrderList?.where((order) => order.orderStatus == 'pending').toList() ?? [];
        final hasAvailableOrders = pendingOrders.isNotEmpty;
        // Filter orders to show only those with status "assigned" in Assigned Orders section
        // Note: assignedOrderList is already filtered in getAssignedOrders(), but double-check for safety
        final assignedOrders = assignedOrderList?.where((order) => order.orderStatus == 'assigned').toList() ?? [];
        final hasAssignedOrders = assignedOrders.isNotEmpty;
        final isLoading = latestOrderList == null || orderController.isLoadingAssignedOrders;
        final hasAnyOrders = hasAvailableOrders || hasAssignedOrders;

        if (isLoading && !hasAnyOrders) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(
                  strokeWidth: 3,
                ),
                const SizedBox(height: Dimensions.paddingSizeLarge),
                Text(
                  'Loading orders...',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).hintColor,
                  ),
                ),
              ],
            ),
          );
        }

        if (!hasAnyOrders) {
          return Center(child: Text('no_order_request_available'.tr));
        }

        return RefreshIndicator(
          onRefresh: () async {
            // Run both API calls in parallel for faster refresh
            await Future.wait([
              Get.find<OrderController>().getLatestOrders(),
              Get.find<OrderController>().getAssignedOrders(),
            ]);
          },
          child: ListView(
            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              // Assigned Orders Section
              if (orderController.isLoadingAssignedOrders || hasAssignedOrders || (orderController.assignedOrderList != null && assignedOrders.isEmpty)) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'assigned_orders'.tr,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          // Accept Assigned Subscription Orders Button
                          Builder(
                            builder: (context) {
                              final assignedSubscriptionOrders = assignedOrders.where((order) => 
                                order.orderType?.toLowerCase().trim() == 'subscription'
                              ).toList();
                              
                              if (assignedSubscriptionOrders.isEmpty || orderController.isLoadingAssignedOrders) {
                                return const SizedBox.shrink();
                              }
                              
                              return Padding(
                                padding: const EdgeInsets.only(right: Dimensions.paddingSizeSmall),
                                child: SizedBox(
                                  width: 140,
                                  child: CustomButtonWidget(
                                    height: 35,
                                    radius: Dimensions.radiusSmall,
                                    buttonText: 'Accept Assigned',
                                    fontSize: Dimensions.fontSizeSmall,
                                    onPressed: () {
                                    showCustomBottomSheet(
                                      child: CustomConfirmationBottomSheet(
                                        title: 'Accept Assigned Subscription Orders',
                                        description: 'Are you sure you want to accept all ${assignedSubscriptionOrders.length} assigned subscription order(s)?',
                                        confirmButtonText: 'Accept All',
                                        onConfirm: () async {
                                          try {
                                            Get.back();
                                          } catch (_) {
                                            // Bottom sheet already closed, ignore
                                          }
                                          
                                          await _acceptAllAssignedSubscriptionOrders(orderController, assignedSubscriptionOrders);
                                        },
                                      ),
                                    );
                                  },
                                  ),
                                ),
                              );
                            },
                          ),
                          if (orderController.isLoadingAssignedOrders)
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          else if (hasAssignedOrders)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall),
                              decoration: BoxDecoration(
                                color: Theme.of(context).primaryColor,
                                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                              ),
                              child: Text(
                                '${assignedOrders.length}',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (orderController.isLoadingAssignedOrders)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(Dimensions.paddingSizeLarge),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (hasAssignedOrders)
                  ...assignedOrders.asMap().entries.map((entry) {
                    final index = entry.key;
                    final order = entry.value;
                    return OrderRequestWidget(
                      orderModel: order,
                      index: index,
                      onTap: widget.onTap,
                      isAssigned: true,
                    );
                  }).toList()
                else if (orderController.assignedOrderList != null && assignedOrders.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                    child: Center(
                      child: Text(
                        'no_assigned_orders'.tr,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).hintColor,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: Dimensions.paddingSizeLarge),
              ],

              // Available Orders Section
              if (hasAvailableOrders) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'available_orders'.tr,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          // Accept All Subscription Orders Button
                          Builder(
                            builder: (context) {
                              final subscriptionOrders = pendingOrders.where((order) => 
                                order.orderType?.toLowerCase().trim() == 'subscription'
                              ).toList();
                              
                              if (subscriptionOrders.isEmpty) {
                                return const SizedBox.shrink();
                              }
                              
                              return Padding(
                                padding: const EdgeInsets.only(right: Dimensions.paddingSizeSmall),
                                child: SizedBox(
                                  width: 160,
                                  child: CustomButtonWidget(
                                    height: 35,
                                    radius: Dimensions.radiusSmall,
                                    buttonText: 'Accept All Subscription',
                                    fontSize: Dimensions.fontSizeSmall,
                                    onPressed: () {
                                    showCustomBottomSheet(
                                      child: CustomConfirmationBottomSheet(
                                        title: 'Accept All Subscription Orders',
                                        description: 'Are you sure you want to accept all ${subscriptionOrders.length} subscription order(s)?',
                                        confirmButtonText: 'Accept All',
                                        onConfirm: () async {
                                          try {
                                            Get.back();
                                          } catch (_) {
                                            // Bottom sheet already closed, ignore
                                          }
                                          
                                          await _acceptAllSubscriptionOrders(orderController, subscriptionOrders);
                                        },
                                      ),
                                    );
                                  },
                                  ),
                                ),
                              );
                            },
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall),
                            decoration: BoxDecoration(
                              color: Theme.of(context).primaryColor,
                              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            ),
                            child: Text(
                              '${pendingOrders.length}',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                ...pendingOrders.asMap().entries.map((entry) {
                  final index = entry.key;
                  final order = entry.value;
                  return OrderRequestWidget(
                    orderModel: order,
                    index: index,
                    onTap: widget.onTap,
                    isAssigned: false,
                  );
                }).toList(),
              ],
            ],
          ),
        );
      }),
    );
  }

  Future<void> _acceptAllSubscriptionOrders(OrderController orderController, List<OrderModel> subscriptionOrders) async {
    int successCount = 0;
    int failCount = 0;
    
    // Process orders one by one, finding the index dynamically each time
    // since the list changes as orders are accepted
    for (final order in subscriptionOrders) {
      try {
        // Find the current index of this order in the latestOrderList
        // We need to find it each time because the list changes as orders are accepted
        int? orderIndex;
        if (orderController.latestOrderList != null) {
          for (int j = 0; j < orderController.latestOrderList!.length; j++) {
            if (orderController.latestOrderList![j].id == order.id) {
              orderIndex = j;
              break;
            }
          }
        }
        
        if (orderIndex != null) {
          bool isSuccess = await orderController.acceptOrder(order.id, orderIndex, order);
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          // If index not found, the order might have already been accepted or removed
          // Try to accept it anyway with index 0 as fallback
          debugPrint('Order ${order.id} not found in latestOrderList, attempting direct accept');
          bool isSuccess = await orderController.acceptOrder(order.id, 0, order);
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        }
        
        // Small delay between accepts to avoid overwhelming the API
        await Future.delayed(const Duration(milliseconds: 500));
      } catch (e) {
        failCount++;
        debugPrint('Error accepting subscription order ${order.id}: $e');
      }
    }
    
    // Show summary message
    if (successCount > 0 && failCount == 0) {
      showCustomSnackBar('Successfully accepted $successCount subscription order(s)', isError: false);
    } else if (successCount > 0 && failCount > 0) {
      showCustomSnackBar('Accepted $successCount order(s), $failCount failed', isError: false);
    } else if (failCount > 0) {
      showCustomSnackBar('Failed to accept subscription orders', isError: true);
    }
    
    // Refresh orders list
    await Future.wait([
      orderController.getLatestOrders(),
      orderController.getAssignedOrders(),
    ]);
  }

  Future<void> _acceptAllAssignedSubscriptionOrders(OrderController orderController, List<OrderModel> subscriptionOrders) async {
    int successCount = 0;
    int failCount = 0;
    
    // Process orders one by one, finding the index dynamically each time
    // since the list changes as orders are accepted
    for (final order in subscriptionOrders) {
      try {
        // Find the current index of this order in the assignedOrderList
        // We need to find it each time because the list changes as orders are accepted
        int? orderIndex;
        if (orderController.assignedOrderList != null) {
          for (int j = 0; j < orderController.assignedOrderList!.length; j++) {
            if (orderController.assignedOrderList![j].id == order.id) {
              orderIndex = j;
              break;
            }
          }
        }
        
        if (orderIndex != null) {
          // Use UUID if available, otherwise use numeric ID
          String? orderIdToUse = order.uuid ?? order.id?.toString();
          bool isSuccess = await orderController.acceptAssignedOrder(order.id, orderIndex, orderIdToUse);
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          // If index not found, the order might have already been accepted or removed
          // Try to accept it anyway with index 0 as fallback
          debugPrint('Order ${order.id} not found in assignedOrderList, attempting direct accept');
          String? orderIdToUse = order.uuid ?? order.id?.toString();
          bool isSuccess = await orderController.acceptAssignedOrder(order.id, 0, orderIdToUse);
          if (isSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        }
        
        // Small delay between accepts to avoid overwhelming the API
        await Future.delayed(const Duration(milliseconds: 500));
      } catch (e) {
        failCount++;
        debugPrint('Error accepting assigned subscription order ${order.id}: $e');
      }
    }
    
    // Show summary message
    if (successCount > 0 && failCount == 0) {
      showCustomSnackBar('Successfully accepted $successCount assigned subscription order(s)', isError: false);
    } else if (successCount > 0 && failCount > 0) {
      showCustomSnackBar('Accepted $successCount order(s), $failCount failed', isError: false);
    } else if (failCount > 0) {
      showCustomSnackBar('Failed to accept assigned subscription orders', isError: true);
    }
    
    // Refresh orders list
    await Future.wait([
      orderController.getLatestOrders(),
      orderController.getAssignedOrders(),
    ]);
  }
}