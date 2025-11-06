import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/ignore_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/interface/repository_interface.dart';

abstract class OrderRepositoryInterface implements RepositoryInterface {
  Future<dynamic> getCompletedOrderList(int offset, {required String status});
  Future<dynamic> getCurrentOrders({required String status});
  Future<dynamic> getLatestOrders();
  Future<dynamic> updateOrderStatus(UpdateStatusBody updateStatusBody, List<MultipartBody> proofAttachment);
  Future<dynamic> getOrderDetails(dynamic orderID); // Accept int or String (UUID)
  Future<dynamic> acceptOrder(int? orderID);
  void setIgnoreList(List<IgnoreModel> ignoreList);
  List<IgnoreModel> getIgnoreList();
  Future<dynamic> getOrderWithId(dynamic orderId); // Accept int or String (UUID)
  Future<dynamic> getCancelReasons();
  
  // New methods for multi-order stacking
  Future<List<OrderModel>?> getAvailableOrders(String? driverId);
  Future<List<OrderModel>?> getActiveOrders(String driverId);
  Future<ResponseModel> updateOrderStatusNew(String orderId, String status);
}