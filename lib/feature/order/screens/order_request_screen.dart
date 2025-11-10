import 'dart:async';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_requset_widget.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
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
    // Run both API calls in parallel for faster initial load
    Future.wait([
      orderController.getLatestOrders(),
      orderController.getAssignedOrders(),
    ]);
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

      appBar: CustomAppBarWidget(title: 'order_request'.tr, isBackButtonExist: false),

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
          return const Center(child: CircularProgressIndicator());
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
}