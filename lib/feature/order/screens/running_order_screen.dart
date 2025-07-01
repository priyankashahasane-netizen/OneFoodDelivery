import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/status_list_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/history_order_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_list_shimmer.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class RunningOrderScreen extends StatelessWidget {
  const RunningOrderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(title: 'running_orders'.tr, isBackButtonExist: false),

      body: GetBuilder<OrderController>(builder: (orderController) {

        List<StatusListModel> statusList = StatusListModel.getRunningOrderStatusList();

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
                  );
                },
              ),
            ),
            SizedBox(height: Dimensions.paddingSizeSmall),

            Expanded(
              child: orderController.currentOrderList != null ? orderController.currentOrderList!.isNotEmpty ? RefreshIndicator(
                onRefresh: () async {
                  await orderController.getCurrentOrders(status: orderController.selectedRunningOrderStatus!);
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: _buildGroupedOrderWidgets(orderController),
                  ),
                ),
              ) : Center(child: Text('no_order_found'.tr)) : OrderListShimmer(),
            ),

          ]),
        );
      }),
    );
  }

  List<Widget> _buildGroupedOrderWidgets(OrderController controller) {
    final List<Widget> widgets = [];
    final orders = controller.currentOrderList!;
    final now = DateTime.now();

    final Map<String, List> grouped = {};

    for (var order in orders) {
      final createdDate = DateTime.tryParse(order.createdAt ?? '') ?? now;
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
          isRunning: true,
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