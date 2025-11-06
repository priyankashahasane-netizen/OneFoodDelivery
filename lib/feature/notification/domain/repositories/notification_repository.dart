import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_model.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/repositories/notification_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationRepository implements NotificationRepositoryInterface{
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  NotificationRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<List<NotificationModel>?> getList() async {
    List<NotificationModel>? notificationList;
    Response response = await apiClient.getData('${AppConstants.notificationUri}${_getUserToken()}');
    if(response.statusCode == 200 && response.body != null){
      notificationList = [];
      // API returns {notifications: [], ...}
      List<dynamic>? notifications;
      if (response.body is Map && response.body['notifications'] != null) {
        notifications = response.body['notifications'];
      } else if (response.body is List) {
        notifications = response.body;
      }
      
      if (notifications != null) {
        notifications.forEach((notify) {
          try {
            NotificationModel notification = NotificationModel.fromJson(notify);
            if (notify is Map) {
              if (notify['data'] != null && notify['data'] is Map) {
                notification.title = notify['data']['title'];
                notification.description = notify['data']['description'];
              }
              notification.imageFullUrl = notify['image_full_url'];
            }
            notificationList!.add(notification);
          } catch (e) {
            debugPrint('Error parsing notification: $e');
          }
        });
      }
    }
    return notificationList;
  }

  @override
  Future<bool> sendDeliveredNotification(int? orderID) async {
    Response response = await apiClient.postData(AppConstants.deliveredOrderNotificationUri, {"_method": "put", 'token': _getUserToken(), 'order_id': orderID});
    return (response.statusCode == 200);
  }

  @override
  void saveSeenNotificationCount(int count) {
    sharedPreferences.setInt(AppConstants.notificationCount, count);
  }

  @override
  int? getSeenNotificationCount() {
    return sharedPreferences.getInt(AppConstants.notificationCount);
  }

  String _getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  @override
  List<int> getNotificationIdList() {
    List<String>? list = [];
    if(sharedPreferences.containsKey(AppConstants.notificationIdList)) {
      list = sharedPreferences.getStringList(AppConstants.notificationIdList);
    }
    List<int> notificationIdList = [];
    for (var id in list!) {
      notificationIdList.add(jsonDecode(id));
    }
    return notificationIdList;
  }

  @override
  void addSeenNotificationIdList(List<int> notificationList) {
    List<String> list = [];
    for (int id in notificationList) {
      list.add(jsonEncode(id));
    }
    sharedPreferences.setStringList(AppConstants.notificationIdList, list);
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

  @override
  Future<List<OrderModel>?> getAssignedOrders() async {
    debugPrint('🚀 NotificationRepository.getAssignedOrders: METHOD CALLED');
    List<OrderModel> assignedOrdersList = [];
    try {
      // Get driver UUID from profile API response (backend returns uuid field)
      String? driverId;
      try {
        // Get fresh profile response to ensure we have the uuid field
        Response profileResponse = await apiClient.getData(
          AppConstants.driverProfileUri,
          handleError: false,
        );
        
        if (profileResponse.statusCode == 200 && profileResponse.body != null) {
          Map<String, dynamic>? body = profileResponse.body is Map ? profileResponse.body as Map<String, dynamic> : null;
          if (body != null) {
            // Priority 1: Use uuid field if available (this is the correct UUID)
            if (body['uuid'] != null && body['uuid'].toString().isNotEmpty) {
              driverId = body['uuid'].toString();
              debugPrint('✅ NotificationRepository.getAssignedOrders: Using UUID from profile API: $driverId');
            }
            // Priority 2: Check if id is a UUID (contains dashes)
            else if (body['id'] != null) {
              String idStr = body['id'].toString();
              if (idStr.contains('-') && idStr.length == 36) {
                driverId = idStr;
                debugPrint('✅ NotificationRepository.getAssignedOrders: Using UUID from id field: $driverId');
              } else {
                debugPrint('⚠️ NotificationRepository.getAssignedOrders: Profile API returned numeric ID: $idStr, but we need UUID');
                debugPrint('   Backend should return uuid field. Falling back to numeric ID (may not work).');
                driverId = idStr;
              }
            }
          }
        }
        
        if (driverId == null || driverId.isEmpty) {
          debugPrint('❌ NotificationRepository.getAssignedOrders: Could not extract driver UUID from profile API');
          debugPrint('Profile response status: ${profileResponse.statusCode}');
          debugPrint('Profile response body: ${profileResponse.body}');
          return [];
        }
      } catch (e) {
        debugPrint('❌ NotificationRepository.getAssignedOrders: Could not get driver UUID: $e');
        return [];
      }
      
      // Get active orders from /api/orders/driver/{driverId}/active
      debugPrint('🔄 NotificationRepository.getAssignedOrders: Calling /api/orders/driver/$driverId/active');
      Response ordersResponse = await apiClient.getData(
        '${AppConstants.activeOrdersUri}/$driverId/active',
        handleError: false,
      );
      
      debugPrint('📡 NotificationRepository.getAssignedOrders: API Response Status: ${ordersResponse.statusCode}');
      debugPrint('📡 NotificationRepository.getAssignedOrders: Response body type: ${ordersResponse.body.runtimeType}');
      
      if (ordersResponse.statusCode == 200 && ordersResponse.body != null) {
        debugPrint('✅ NotificationRepository.getAssignedOrders: Received orders response');
        
        // Parse orders from response
        List<OrderModel> allOrders = [];
        if (ordersResponse.body is List) {
          debugPrint('📦 NotificationRepository.getAssignedOrders: Response is a List with ${(ordersResponse.body as List).length} items');
          try {
            (ordersResponse.body as List).forEach((orderJson) {
              try {
                // Debug: Print raw order data before parsing
                debugPrint('📦 Raw order JSON: $orderJson');
                debugPrint('📦 Order status in JSON: ${orderJson['order_status'] ?? orderJson['status'] ?? 'NOT FOUND'}');
                
                OrderModel order = OrderModel.fromJson(orderJson);
                allOrders.add(order);
                debugPrint('✅ Parsed order: ID=${order.id}, Status=${order.orderStatus}, UUID=${order.uuid}');
              } catch (e) {
                debugPrint('❌ Error parsing order: $e');
                debugPrint('Order data: $orderJson');
              }
            });
          } catch (e) {
            debugPrint('❌ Error processing orders list: $e');
          }
        } else {
          debugPrint('⚠️ NotificationRepository.getAssignedOrders: Response is not a List. Type: ${ordersResponse.body.runtimeType}');
          debugPrint('Response body: ${ordersResponse.body}');
        }
        
        debugPrint('🔄 NotificationRepository.getAssignedOrders: Parsed ${allOrders.length} total orders');
        
        // Debug: Print ALL orders and their statuses BEFORE filtering
        debugPrint('📊 ALL ORDERS RECEIVED:');
        for (var order in allOrders) {
          debugPrint('  - Order ID: ${order.id}, Status: "${order.orderStatus}", UUID: ${order.uuid}');
        }
        
        // Filter for orders with status "assigned"
        assignedOrdersList = allOrders.where((order) {
          final status = order.orderStatus?.toLowerCase().trim();
          final isAssigned = status == 'assigned';
          if (!isAssigned) {
            debugPrint('  ⚠️ Order ${order.id} filtered out - status is "$status" (expected "assigned")');
          }
          return isAssigned;
        }).toList();
        
        debugPrint('✅ NotificationRepository.getAssignedOrders: Found ${assignedOrdersList.length} assigned orders after filtering');
        
        // Debug: Print assigned order IDs and statuses
        for (var order in assignedOrdersList) {
          debugPrint('  ✅ Assigned Order ID: ${order.id}, Status: ${order.orderStatus}, UUID: ${order.uuid}');
        }
        
        // If no assigned orders, log available statuses for debugging
        if (assignedOrdersList.isEmpty && allOrders.isNotEmpty) {
          final statuses = allOrders.map((o) => o.orderStatus ?? 'null').toSet().join(", ");
          debugPrint('⚠️ NotificationRepository.getAssignedOrders: No assigned orders found. Available statuses: $statuses');
          debugPrint('💡 TIP: Check if orders in DB have status exactly "assigned" (case-sensitive)');
        }
      } else {
        debugPrint('❌ NotificationRepository.getAssignedOrders: Active Orders API returned status ${ordersResponse.statusCode}');
        debugPrint('Response body: ${ordersResponse.body}');
        debugPrint('Response statusText: ${ordersResponse.statusText}');
      }
    } catch (e, stackTrace) {
      debugPrint('❌ NotificationRepository.getAssignedOrders: Exception occurred');
      debugPrint('Error: $e');
      debugPrint('Stack trace: $stackTrace');
      assignedOrdersList = [];
    }
    return assignedOrdersList;
  }

}