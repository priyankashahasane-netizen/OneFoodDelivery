import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/feature/notification/controllers/notification_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/widgets/notification_dialog_widget.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/order_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class NotificationScreen extends StatefulWidget {
  final bool fromNotification;
  const NotificationScreen({super.key, this.fromNotification = false});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {

  @override
  void initState() {
    super.initState();

    final notificationController = Get.find<NotificationController>();
    notificationController.getNotificationList();
    
    // Defer getAssignedOrders to avoid calling update() during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notificationController.getAssignedOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (widget.fromNotification) {
          Get.offAllNamed(RouteHelper.getInitialRoute());
        } else {
          Future.delayed(Duration.zero, () {
            Get.back();
          });
        }
      },
      child: Scaffold(
        appBar: CustomAppBarWidget(
          title: 'notification'.tr,
          onBackPressed: () {
            if (widget.fromNotification) {
              Get.offAllNamed(RouteHelper.getInitialRoute());
            } else {
              Get.back();
            }
          },
        ),
        body: GetBuilder<NotificationController>(builder: (notificationController) {
          if (notificationController.notificationList != null) {
            notificationController.saveSeenNotificationCount(notificationController.notificationList!.length);
          }

          List<DateTime> dateTimeList = [];

          // Combine notifications and assigned orders
          final hasNotifications = notificationController.notificationList != null && notificationController.notificationList!.isNotEmpty;
          final hasAssignedOrders = notificationController.assignedOrdersList != null && notificationController.assignedOrdersList!.isNotEmpty;
          final hasAssignedOrdersList = notificationController.assignedOrdersList != null; // True if list was loaded (even if empty)
          final hasContent = hasNotifications || hasAssignedOrders;
          final isLoading = notificationController.isLoadingAssignedOrders;
          final shouldShowContent = hasContent || isLoading || hasAssignedOrdersList;

          return RefreshIndicator(
            onRefresh: () async {
              await notificationController.getNotificationList();
              await notificationController.getAssignedOrders();
            },
            child: shouldShowContent ? ListView(
              padding: EdgeInsets.all(Dimensions.paddingSizeLarge),
              shrinkWrap: true,
              children: [
                // Assigned Orders Section
                if (isLoading || hasAssignedOrders || (notificationController.assignedOrdersList != null && notificationController.assignedOrdersList!.isEmpty)) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'assigned_orders'.tr,
                          style: robotoBold.copyWith(
                            fontSize: Dimensions.fontSizeLarge,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        if (notificationController.assignedOrdersList != null && notificationController.assignedOrdersList!.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall),
                            decoration: BoxDecoration(
                              color: Theme.of(context).primaryColor,
                              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            ),
                            child: Text(
                              '${notificationController.assignedOrdersList!.length}',
                              style: robotoBold.copyWith(
                                fontSize: Dimensions.fontSizeDefault,
                                color: Colors.white,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (isLoading)
                    const Center(child: Padding(
                      padding: EdgeInsets.all(Dimensions.paddingSizeDefault),
                      child: CircularProgressIndicator(),
                    ))
                  else if (hasAssignedOrders)
                    ...notificationController.assignedOrdersList!.asMap().entries.map((entry) {
                      final index = entry.key;
                      final order = entry.value;
                      return Padding(
                        padding: EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                        child: OrderWidget(
                          orderModel: order,
                          isRunningOrder: false,
                          orderIndex: index,
                        ),
                      );
                    }).toList()
                  else if (notificationController.assignedOrdersList != null && notificationController.assignedOrdersList!.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      child: Center(
                        child: Text(
                          'no_assigned_orders'.tr,
                          style: robotoRegular.copyWith(
                            fontSize: Dimensions.fontSizeDefault,
                            color: Theme.of(context).disabledColor,
                          ),
                        ),
                      ),
                    ),
                  SizedBox(height: Dimensions.paddingSizeLarge),
                ],
                
                // Notifications Section
                if (hasNotifications) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                    child: Text(
                      'notifications'.tr,
                      style: robotoBold.copyWith(
                        fontSize: Dimensions.fontSizeLarge,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                  ),
                  ...notificationController.notificationList!.map((notification) {

                    DateTime originalDateTime = DateConverter.dateTimeStringToDate(notification.createdAt!);
                DateTime convertedDate = DateTime(originalDateTime.year, originalDateTime.month, originalDateTime.day);
                bool addTitle = false;

                if (!dateTimeList.contains(convertedDate)) {
                  addTitle = true;
                  dateTimeList.add(convertedDate);
                }

                    bool isSeen = notificationController.getSeenNotificationIdList()!.contains(notification.id);

                return Padding(
                  padding: EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                    addTitle ? Padding(
                      padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
                      child: Text(
                            DateConverter.convertTodayYesterdayDate(notification.createdAt!),
                        style: robotoRegular.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.7)),
                      ),
                    ) : const SizedBox(),

                    InkWell(
                      onTap: () {
                            notificationController.addSeenNotificationId(notification.id!);

                        showDialog(
                          context: context,
                          builder: (BuildContext context) {
                                return NotificationDialogWidget(notificationModel: notification);
                          },
                        );
                      },
                      child: Container(
                        padding: EdgeInsets.all(Dimensions.paddingSizeDefault),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                          boxShadow: [BoxShadow(color: Colors.black12, spreadRadius: 1, blurRadius: 5)],
                        ),
                        child: Row(children: [

                              notification.data?.type == 'push_notification' ? ClipOval(
                            child: CustomImageWidget(
                                  image: '${notification.imageFullUrl}',
                              height: 60, width: 60,
                              fit: BoxFit.cover,
                            ),
                          ) : CustomAssetImageWidget(
                            image: Images.orderIcon,
                            height: 60, width: 60,
                          ),
                          SizedBox(width: Dimensions.paddingSizeDefault),

                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                              Row(children: [

                                Expanded(
                                  child: Text(
                                        notification.title ?? '',
                                    style: robotoMedium.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: isSeen ? FontWeight.w400 : FontWeight.w700),
                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                SizedBox(width: Dimensions.paddingSizeSmall),

                                Text(
                                      DateConverter.convertTimeDifferenceInMinutes(notification.createdAt!),
                                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: isSeen ? Theme.of(context).textTheme.bodyLarge?.color : Theme.of(context).primaryColor),
                                ),

                              ]),
                              SizedBox(height: Dimensions.paddingSizeSmall),

                              Padding(
                                padding: const EdgeInsets.only(right: 40),
                                child: Text(
                                      notification.description ?? '',
                                  style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: isSeen ? Theme.of(context).disabledColor : Theme.of(context).textTheme.bodyLarge?.color),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                              ),

                            ]),
                          ),

                        ]),
                      ),
                    ),

                  ]),
                );
                  }).toList(),
                ],
              ],
            ) : Center(child: Text('no_notification_found'.tr)),
          );
        }),
      ),
    );
  }
}