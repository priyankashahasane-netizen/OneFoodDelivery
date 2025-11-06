import 'package:stackfood_multivendor_driver/feature/notification/domain/services/notification_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

class NotificationController extends GetxController implements GetxService {
  final NotificationServiceInterface notificationServiceInterface;
  NotificationController({required this.notificationServiceInterface});

  List<NotificationModel>? _notificationList;
  List<NotificationModel>? get notificationList => _notificationList;

  List<OrderModel>? _assignedOrdersList;
  List<OrderModel>? get assignedOrdersList => _assignedOrdersList;

  bool _hideNotificationButton = false;
  bool get hideNotificationButton => _hideNotificationButton;

  bool _isLoadingAssignedOrders = false;
  bool get isLoadingAssignedOrders => _isLoadingAssignedOrders;

  Future<void> getNotificationList() async {
    List<NotificationModel>? notificationList = await notificationServiceInterface.getNotificationList();
    if (notificationList != null) {
      _notificationList = [];
      _notificationList!.addAll(notificationList);
      _notificationList!.sort((a, b) {
        return DateConverter.isoStringToLocalDate(a.updatedAt!).compareTo(DateConverter.isoStringToLocalDate(b.updatedAt!));
      });
      Iterable iterable = _notificationList!.reversed;
      _notificationList = iterable.toList() as List<NotificationModel>?;
    }
    update();
  }

  Future<void> getAssignedOrders() async {
    debugPrint('🚀 NotificationController.getAssignedOrders: METHOD CALLED');
    _isLoadingAssignedOrders = true;
    update();
    try {
      debugPrint('🔄 NotificationController.getAssignedOrders: Starting to fetch assigned orders');
      debugPrint('🔄 NotificationController.getAssignedOrders: Calling notificationServiceInterface.getAssignedOrders()');
      List<OrderModel>? orders = await notificationServiceInterface.getAssignedOrders();
      debugPrint('🔄 NotificationController.getAssignedOrders: getAssignedOrders() completed');
      debugPrint('🔄 NotificationController.getAssignedOrders: orders = ${orders == null ? "null" : "not null"}, length = ${orders?.length ?? 0}');
      
      // Always set the list, even if empty
      _assignedOrdersList = orders ?? [];
      if (_assignedOrdersList != null && _assignedOrdersList!.isNotEmpty) {
        debugPrint('✅ NotificationController: Found ${_assignedOrdersList!.length} assigned orders');
      } else {
        debugPrint('⚠️ NotificationController: No assigned orders found (orders is null or empty)');
      }
    } catch (e, stackTrace) {
      debugPrint('❌ NotificationController.getAssignedOrders: Error occurred');
      debugPrint('Error: $e');
      debugPrint('Stack trace: $stackTrace');
      _assignedOrdersList = [];
    } finally {
      _isLoadingAssignedOrders = false;
      debugPrint('🔄 NotificationController.getAssignedOrders: Setting isLoadingAssignedOrders = false');
      update();
    }
  }

  Future<bool> sendDeliveredNotification(int? orderID) async {
    _hideNotificationButton = true;
    update();
    bool success = await notificationServiceInterface.sendDeliveredNotification(orderID);
    bool isSuccess;
    success ? isSuccess = true : isSuccess = false;
    _hideNotificationButton = false;
    update();
    return isSuccess;
  }

  void saveSeenNotificationCount(int count) {
    notificationServiceInterface.saveSeenNotificationCount(count);
  }

  int? getSeenNotificationCount() {
    return notificationServiceInterface.getSeenNotificationCount();
  }

  void addSeenNotificationId(int id) {
    List<int> idList = [];
    idList.addAll(notificationServiceInterface.getNotificationIdList());
    idList.add(id);
    notificationServiceInterface.addSeenNotificationIdList(idList);
    update();
  }

  List<int>? getSeenNotificationIdList() {
    return notificationServiceInterface.getNotificationIdList();
  }

}