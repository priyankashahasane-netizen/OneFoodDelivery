import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';

abstract class NotificationServiceInterface {
  Future<dynamic> getNotificationList();
  void saveSeenNotificationCount(int count);
  int? getSeenNotificationCount();
  Future<dynamic> sendDeliveredNotification(int? orderID);
  List<int> getNotificationIdList();
  void addSeenNotificationIdList(List<int> notificationList);
  Future<List<OrderModel>?> getAssignedOrders();
}