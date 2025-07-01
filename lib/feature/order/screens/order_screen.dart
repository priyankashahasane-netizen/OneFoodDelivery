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

class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {

  final ScrollController scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Get.find<OrderController>().getCompletedOrders(offset: 1, status: 'all', isUpdate: false);

    scrollController.addListener(() {
      if (scrollController.position.pixels == scrollController.position.maxScrollExtent
          && Get.find<OrderController>().completedOrderList != null && !Get.find<OrderController>().paginate) {
        int pageSize = (Get.find<OrderController>().pageSize! / 10).ceil();
        if (Get.find<OrderController>().offset < pageSize) {
          Get.find<OrderController>().setOffset(Get.find<OrderController>().offset+1);
          customPrint('end of the page');
          Get.find<OrderController>().showBottomLoader();
          Get.find<OrderController>().getCompletedOrders(offset: Get.find<OrderController>().offset, status: Get.find<OrderController>().selectedMyOrderStatus!);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBarWidget(title: 'my_orders'.tr, isBackButtonExist: false),

      body: GetBuilder<OrderController>(builder: (orderController) {

        List<StatusListModel> statusList = StatusListModel.getMyOrderStatusList();

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
                    fromMyOrder: true,
                  );
                },
              ),
            ),
            SizedBox(height: Dimensions.paddingSizeSmall),

            Expanded(
              child: orderController.completedOrderList != null ? orderController.completedOrderList!.isNotEmpty ? RefreshIndicator(
                onRefresh: () async {
                  await orderController.getCompletedOrders(
                    offset: 1,
                    status: Get.find<OrderController>().selectedMyOrderStatus!,
                  );
                },
                child: SingleChildScrollView(
                  controller: scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    ..._buildGroupedOrderWidgets(orderController.completedOrderList!),
                    if (orderController.paginate)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(Dimensions.paddingSizeSmall),
                          child: CircularProgressIndicator(),
                        ),
                      ),
                  ]),
                ),
              ) : Center(child: Text('no_order_found'.tr)) : OrderListShimmer(),
            ),

          ]),
        );
      }),
    );
  }

  List<Widget> _buildGroupedOrderWidgets(List orders) {
    final List<Widget> widgets = [];
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
          isRunning: false,
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