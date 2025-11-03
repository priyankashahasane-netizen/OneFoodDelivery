import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_cancellation_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_details_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/repositories/order_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/ignore_model.dart';
import 'package:get/get_connect/http/src/response/response.dart';

class OrderRepository implements OrderRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  OrderRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<List<OrderModel>?> getList() async {
    List<OrderModel>? allOrderList;
    // JWT token is sent via Authorization header by ApiClient
    Response response = await apiClient.getData('${AppConstants.allOrdersUri}?offset=1&limit=100&status=all');
    if (response.statusCode == 200) {
      allOrderList = [];
      // Handle both array and paginated response formats
      if (response.body is List) {
        response.body.forEach((order) => allOrderList!.add(OrderModel.fromJson(order)));
      } else if (response.body['orders'] != null) {
        response.body['orders'].forEach((order) => allOrderList!.add(OrderModel.fromJson(order)));
      }
    }
    return allOrderList;
  }

  @override
  Future<PaginatedOrderModel?> getCompletedOrderList(int offset, {required String status}) async {
    PaginatedOrderModel? paginatedOrderModel;
    // JWT token is sent via Authorization header by ApiClient, no need for token query param
    Response response = await apiClient.getData('${AppConstants.allOrdersUri}?offset=$offset&limit=10&status=$status');
    if (response.statusCode == 200) {
      paginatedOrderModel = PaginatedOrderModel.fromJson(response.body);
    }
    return paginatedOrderModel;
  }

  @override
  Future<PaginatedOrderModel?> getCurrentOrders({required String status}) async {
    PaginatedOrderModel? paginatedOrderModel;
    // The endpoint is: GET /api/orders/driver/:driverId/active
    // We need driverId - get it from profile endpoint first
    try {
      // Get driver profile to extract driverId
      Response profileResponse = await apiClient.getData(AppConstants.driverProfileUri);
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        String? driverId = profileResponse.body['id']?.toString();
        if (driverId != null && driverId.isNotEmpty) {
          // Now get active orders using driverId
          Response response = await apiClient.getData('${AppConstants.activeOrdersUri}/$driverId/active');
          if (response.statusCode == 200 && response.body != null) {
            // Backend returns array of orders
            if (response.body is List) {
              List<OrderModel> orders = [];
              (response.body as List).forEach((order) => orders.add(OrderModel.fromJson(order)));
              // Filter by status if needed
              if (status != 'all' && status.isNotEmpty) {
                orders = orders.where((o) => o.orderStatus == status).toList();
              }
              // Create paginated model with default orderCount to avoid null errors
              paginatedOrderModel = PaginatedOrderModel(
                orders: orders,
                totalSize: orders.length,
                offset: '1',
                limit: '10',
                orderCount: OrderCount(
                  all: orders.length,
                  accepted: 0,
                  confirmed: 0,
                  processing: 0,
                  handover: 0,
                  pickedUp: 0,
                  delivered: 0,
                  canceled: 0,
                ),
              );
            } else {
              paginatedOrderModel = PaginatedOrderModel.fromJson(response.body);
            }
          }
        }
      }
    } catch (e) {
      // If we can't get profile, return null
      return null;
    }
    return paginatedOrderModel;
  }

  @override
  Future<List<OrderModel>?> getLatestOrders() async {
    // Use new endpoint for available orders (unassigned orders)
    List<OrderModel>? latestOrderList;
    Response response = await apiClient.getData(AppConstants.availableOrdersUri);
    if(response.statusCode == 200 && response.body != null) {
      latestOrderList = [];
      if (response.body is List) {
        response.body.forEach((order) => latestOrderList!.add(OrderModel.fromJson(order)));
      }
    }
    return latestOrderList;
  }

  @override
  Future<ResponseModel> updateOrderStatus(UpdateStatusBody updateStatusBody, List<MultipartBody> proofAttachment) async {
    ResponseModel responseModel;
    // Use new endpoint: PUT /api/orders/:id/status
    // Note: Multipart data for proof images may need special handling
    // For now, use the new status update endpoint
    String orderId = updateStatusBody.orderId?.toString() ?? '';
    Map<String, dynamic> body = {'status': updateStatusBody.status};
    if (updateStatusBody.reason != null && updateStatusBody.reason!.isNotEmpty) {
      body['reason'] = updateStatusBody.reason;
    }
    
    // If we have proof attachments, we may need a different endpoint or handle separately
    // For now, try PUT with status update (backend uses PUT for status updates)
    Response response = await apiClient.putData(
      '${AppConstants.updateOrderStatusUri}/$orderId/status',
      body,
      handleError: false
    );
    
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body['message'] ?? 'Status updated successfully');
    } else {
      responseModel = ResponseModel(false, response.body['message'] ?? response.statusText ?? 'Failed to update status');
    }
    return responseModel;
  }

  @override
  Future<List<OrderDetailsModel>?> getOrderDetails(int? orderID) async {
    List<OrderDetailsModel>? orderDetailsModel;
    // Use new endpoint: GET /api/orders/:id
    Response response = await apiClient.getData('${AppConstants.orderDetailsUri}/$orderID');
    if (response.statusCode == 200) {
      orderDetailsModel = [];
      // Backend returns single order object, not array
      if (response.body is List) {
        response.body.forEach((orderDetails) => orderDetailsModel!.add(OrderDetailsModel.fromJson(orderDetails)));
      } else {
        // Single order object - wrap in list for compatibility
        orderDetailsModel.add(OrderDetailsModel.fromJson(response.body));
      }
    }
    return orderDetailsModel;
  }

  @override
  Future<ResponseModel> acceptOrder(int? orderID) async {
    ResponseModel responseModel;
    // New backend endpoint expects: { orderId: string, driverId?: string }
    // driverId is optional as it can be extracted from JWT token
    Response response = await apiClient.postData(
      AppConstants.acceptOrderUri, 
      {'orderId': orderID.toString()}, 
      handleError: false
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      responseModel = ResponseModel(true, response.body['message'] ?? 'Order assigned successfully');
    } else {
      responseModel = ResponseModel(false, response.body['message'] ?? response.statusText);
    }
    return responseModel;
  }

  // New method to get available orders
  Future<List<OrderModel>?> getAvailableOrders(String? driverId) async {
    List<OrderModel>? availableOrderList;
    String uri = AppConstants.availableOrdersUri;
    if (driverId != null && driverId.isNotEmpty) {
      uri += '?driverId=$driverId';
    }
    Response response = await apiClient.getData(uri);
    if (response.statusCode == 200 && response.body != null) {
      availableOrderList = [];
      if (response.body is List) {
        response.body.forEach((order) => availableOrderList!.add(OrderModel.fromJson(order)));
      }
    }
    return availableOrderList;
  }

  // New method to get active orders for driver
  Future<List<OrderModel>?> getActiveOrders(String driverId) async {
    List<OrderModel>? activeOrderList;
    Response response = await apiClient.getData('${AppConstants.activeOrdersUri}/$driverId/active');
    if (response.statusCode == 200 && response.body != null) {
      activeOrderList = [];
      if (response.body is List) {
        response.body.forEach((order) => activeOrderList!.add(OrderModel.fromJson(order)));
      }
    }
    return activeOrderList;
  }

  // New method to update order status
  Future<ResponseModel> updateOrderStatusNew(String orderId, String status) async {
    ResponseModel responseModel;
    // Backend uses PUT for status updates
    Response response = await apiClient.putData(
      '${AppConstants.updateOrderStatusUri}/$orderId/status',
      {'status': status},
      handleError: false
    );
    if (response.statusCode == 200) {
      responseModel = ResponseModel(true, response.body['message'] ?? 'Status updated');
    } else {
      responseModel = ResponseModel(false, response.body['message'] ?? response.statusText);
    }
    return responseModel;
  }

  @override
  void setIgnoreList(List<IgnoreModel> ignoreList) {
    List<String> stringList = [];
    for (var ignore in ignoreList) {
      stringList.add(jsonEncode(ignore.toJson()));
    }
    sharedPreferences.setStringList(AppConstants.ignoreList, stringList);
  }

  @override
  List<IgnoreModel> getIgnoreList() {
    List<IgnoreModel> ignoreList = [];
    List<String> stringList = sharedPreferences.getStringList(AppConstants.ignoreList) ?? [];
    for (var ignore in stringList) {
      ignoreList.add(IgnoreModel.fromJson(jsonDecode(ignore)));
    }
    return ignoreList;
  }

  @override
  Future<OrderModel?> getOrderWithId(int? orderId) async {
    OrderModel? orderModel;
    // Use new endpoint: GET /api/orders/:id
    Response response = await apiClient.getData('${AppConstants.orderDetailsUri}/$orderId');
    if (response.statusCode == 200) {
      orderModel = OrderModel.fromJson(response.body);
    }
    return orderModel;
  }

  @override
  Future<List<CancellationData>?> getCancelReasons() async {
    List<CancellationData>? orderCancelReasons;
    Response response = await apiClient.getData('${AppConstants.orderCancellationUri}?offset=1&limit=30&type=deliveryman');
    if (response.statusCode == 200) {
      OrderCancellationBodyModel orderCancellationBody = OrderCancellationBodyModel.fromJson(response.body);
      orderCancelReasons = [];
      for (var element in orderCancellationBody.reasons!) {
        orderCancelReasons.add(element);
      }
    }
    return orderCancelReasons;
  }

  String _getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  @override
  Future add(value) {
    throw UnimplementedError();
  }

  @override
  Future delete(int id) {
    throw UnimplementedError();
  }

  @override
  Future get(int id) {
    throw UnimplementedError();
  }

  @override
  Future update(Map<String, dynamic> body) {
    throw UnimplementedError();
  }
  
}