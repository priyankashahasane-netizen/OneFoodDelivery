import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/status_list_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/history_order_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_list_shimmer.dart';
import 'package:stackfood_multivendor_driver/helper/custom_print_helper.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:intl/intl.dart';

class OrderScreen extends StatefulWidget {
  final bool isActiveOrders; // true for Currently Active, false for My Orders
  const OrderScreen({super.key, this.isActiveOrders = false});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> with AutomaticKeepAliveClientMixin {

  final ScrollController scrollController = ScrollController();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  void _loadInitialData() {
    // Use WidgetsBinding to defer setState calls until after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final orderController = Get.find<OrderController>();
      
      if (widget.isActiveOrders) {
        // Initialize for Currently Active orders
        if (orderController.selectedRunningOrderStatusIndex == null) {
          orderController.setSelectedRunningOrderStatusIndex(0, 'all');
        }
        // Always refresh orders when screen opens to show all active orders
        orderController.getCurrentOrders(
          status: orderController.selectedRunningOrderStatus ?? 'all', 
          isDataClear: true
        );
      } else {
        // Initialize for My Orders (completed orders)
        if (orderController.selectedMyOrderStatusIndex == null) {
          orderController.setSelectedMyOrderStatusIndex(0, 'all');
        }
        orderController.getCompletedOrders(offset: 1, status: 'all', isUpdate: false);
      }
    });

    // Only enable pagination for completed orders (My Orders)
    if (!widget.isActiveOrders) {
      scrollController.addListener(() {
        if (scrollController.position.pixels == scrollController.position.maxScrollExtent
            && Get.find<OrderController>().completedOrderList != null 
            && !Get.find<OrderController>().paginate) {
          int pageSize = (Get.find<OrderController>().pageSize! / 10).ceil();
          if (Get.find<OrderController>().offset < pageSize) {
            Get.find<OrderController>().setOffset(Get.find<OrderController>().offset+1);
            customPrint('end of the page');
            Get.find<OrderController>().showBottomLoader();
            Get.find<OrderController>().getCompletedOrders(
              offset: Get.find<OrderController>().offset, 
              status: Get.find<OrderController>().selectedMyOrderStatus!
            );
          }
        }
      });
    }
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return Scaffold(
      appBar: CustomAppBarWidget(
        title: widget.isActiveOrders ? 'currently_active'.tr : 'my_orders'.tr, 
        isBackButtonExist: false
      ),

      body: GetBuilder<OrderController>(builder: (orderController) {
        // Get appropriate status list based on mode
        List<StatusListModel> statusList = widget.isActiveOrders
            ? StatusListModel.getRunningOrderStatusList()
            : StatusListModel.getMyOrderStatusList();

        // Get appropriate order list based on mode
        List<dynamic>? orderList = widget.isActiveOrders
            ? orderController.currentOrderList
            : orderController.completedOrderList;

        // Debug logging for active orders
        if (widget.isActiveOrders) {
          debugPrint('🔍 OrderScreen.build (Active): currentOrderList is ${orderList == null ? "null" : "not null"}');
          if (orderList != null) {
            debugPrint('🔍 OrderScreen.build (Active): currentOrderList.length = ${orderList.length}');
            if (orderList.isNotEmpty) {
              debugPrint('🔍 OrderScreen.build (Active): First order ID = ${orderList.first.id}, status = ${orderList.first.orderStatus}');
            }
          }
          debugPrint('🔍 OrderScreen.build (Active): selectedRunningOrderStatus = ${orderController.selectedRunningOrderStatus}');
        }

        return Padding(
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          child: Column(children: [

            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: statusList.length,
                itemBuilder: (context, index) {
                  return OrderButtonWidget(
                    statusListModel: statusList[index],
                    index: index,
                    orderController: orderController,
                    fromMyOrder: !widget.isActiveOrders,
                  );
                },
              ),
            ),
            SizedBox(height: Dimensions.paddingSizeSmall),

            Expanded(
              child: _buildOrderListContent(orderController, orderList),
            ),

          ]),
        );
      }),
    );
  }

  Widget _buildOrderListContent(OrderController orderController, List<dynamic>? orderList) {
    if (orderList == null) {
      return OrderListShimmer();
    }
    
    if (orderList.isEmpty) {
      return Center(child: Text('no_order_found'.tr));
    }
    
    return RefreshIndicator(
      onRefresh: () async {
        if (widget.isActiveOrders) {
          await orderController.getCurrentOrders(
            status: orderController.selectedRunningOrderStatus ?? 'all', 
            isDataClear: false
          );
        } else {
          await orderController.getCompletedOrders(
            offset: 1,
            status: Get.find<OrderController>().selectedMyOrderStatus!,
          );
        }
      },
      child: SingleChildScrollView(
        controller: widget.isActiveOrders ? null : scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ..._buildGroupedOrderWidgets(orderList),
            // Only show pagination loader for completed orders
            if (!widget.isActiveOrders && orderController.paginate)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(Dimensions.paddingSizeSmall),
                  child: CircularProgressIndicator(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildGroupedOrderWidgets(List<dynamic> orders) {
    final List<Widget> widgets = [];
    final now = DateTime.now();

    final Map<String, List> grouped = {};

    for (var order in orders) {
      // Parse date, handling both ISO 8601 and standard formats
      DateTime createdDate;
      if (order.createdAt != null && order.createdAt!.isNotEmpty) {
        try {
          if (order.createdAt!.contains('T') || order.createdAt!.contains('Z')) {
            createdDate = DateTime.parse(order.createdAt!).toLocal();
          } else {
            createdDate = DateFormat('yyyy-MM-dd HH:mm:ss').parse(order.createdAt!);
          }
        } catch (e) {
          createdDate = now;
        }
      } else {
        createdDate = now;
      }
      
      String label;

      if (_isSameDate(createdDate, now)) {
        label = 'Today';
      } else if (_isSameDate(createdDate, now.subtract(const Duration(days: 1)))) {
        label = 'Yesterday';
      } else {
        label = DateConverter.estimatedDate(createdDate);
      }

      grouped.putIfAbsent(label, () => []).add(order);
    }

    grouped.forEach((label, list) {
      widgets.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Text(label, style: robotoRegular.copyWith(color: Theme.of(Get.context!).hintColor)),
      ));

      for (int i = 0; i < list.length; i++) {
        widgets.add(HistoryOrderWidget(
          orderModel: list[i],
          isRunning: widget.isActiveOrders,
          index: i,
        ));
      }
    });

    return widgets;
  }

  bool _isSameDate(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

}
