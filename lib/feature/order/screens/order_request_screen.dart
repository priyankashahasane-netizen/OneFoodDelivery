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
    orderController.getLatestOrders();
    orderController.getAssignedOrders();
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      orderController.getLatestOrders();
      orderController.getAssignedOrders();
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
        final hasAvailableOrders = orderController.latestOrderList != null && orderController.latestOrderList!.isNotEmpty;
        final hasAssignedOrders = orderController.assignedOrderList != null && orderController.assignedOrderList!.isNotEmpty;
        final isLoading = orderController.latestOrderList == null || orderController.isLoadingAssignedOrders;
        final hasAnyOrders = hasAvailableOrders || hasAssignedOrders;

        if (isLoading && !hasAnyOrders) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!hasAnyOrders) {
          return Center(child: Text('no_order_request_available'.tr));
        }

        return RefreshIndicator(
          onRefresh: () async {
            await Get.find<OrderController>().getLatestOrders();
            await Get.find<OrderController>().getAssignedOrders();
          },
          child: ListView(
            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              // Assigned Orders Section
              if (hasAssignedOrders) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: Text(
                    'assigned_orders'.tr,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ...orderController.assignedOrderList!.asMap().entries.map((entry) {
                  final index = entry.key;
                  final order = entry.value;
                  return OrderRequestWidget(
                    orderModel: order,
                    index: index,
                    onTap: widget.onTap,
                    isAssigned: true,
                  );
                }).toList(),
                const SizedBox(height: Dimensions.paddingSizeLarge),
              ],

              // Available Orders Section
              if (hasAvailableOrders) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                  child: Text(
                    'available_orders'.tr,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ...orderController.latestOrderList!.asMap().entries.map((entry) {
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