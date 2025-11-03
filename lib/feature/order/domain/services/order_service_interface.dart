import 'package:image_picker/image_picker.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/ignore_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';

abstract class OrderServiceInterface{
  Future<dynamic> getAllOrders();
  Future<dynamic> getCompletedOrderList(int offset, {required String status});
  Future<dynamic> getCurrentOrders({required String status});
  Future<dynamic> getLatestOrders();
  Future<dynamic> updateOrderStatus(UpdateStatusBody updateStatusBody, List<MultipartBody> proofAttachment);
  Future<dynamic> getOrderDetails(int? orderID);
  Future<dynamic> acceptOrder(int? orderID);
  void setIgnoreList(List<IgnoreModel> ignoreList);
  List<IgnoreModel> getIgnoreList();
  Future<dynamic> getOrderWithId(int? orderId);
  Future<dynamic> getCancelReasons();
  List<OrderModel> sortDeliveredOrderList(List<OrderModel> allOrderList);
  List<OrderModel> processLatestOrders(List<OrderModel> latestOrderList, List<int?> ignoredIdList);
  List<MultipartBody> prepareOrderProofImages(List<XFile> pickedPrescriptions);
  List<int?> prepareIgnoreIdList(List<IgnoreModel> ignoredRequests);
  
  // New methods for multi-order stacking
  Future<List<OrderModel>?> getAvailableOrders(String? driverId);
  Future<List<OrderModel>?> getActiveOrders(String driverId);
  Future<ResponseModel> updateOrderStatusNew(String orderId, String status);
}