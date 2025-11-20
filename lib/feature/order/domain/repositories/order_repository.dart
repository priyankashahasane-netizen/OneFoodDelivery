import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_cancellation_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_details_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/status_list_model.dart';
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
    // Use handleError: false to preserve actual status codes and error information
    final uri = '${AppConstants.allOrdersUri}?offset=$offset&limit=10&status=$status';
    debugPrint('====> getCompletedOrderList: Requesting orders with status="$status" from $uri');
    Response response = await apiClient.getData(uri, handleError: false);
    if (response.statusCode == 200 && response.body != null) {
      try {
        paginatedOrderModel = PaginatedOrderModel.fromJson(response.body);
        debugPrint('✅ getCompletedOrderList: Successfully loaded ${paginatedOrderModel.orders?.length ?? 0} completed orders');
      } catch (e) {
        debugPrint('❌ getCompletedOrderList: Error parsing completed orders: $e');
        debugPrint('Response body: ${response.body}');
      }
    } else {
      debugPrint('❌ getCompletedOrderList: API returned status ${response.statusCode}');
      debugPrint('Response body: ${response.body}');
      debugPrint('Response statusText: ${response.statusText}');
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
      // Use handleError: false to get actual error status codes
      Response profileResponse = await apiClient.getData(
        AppConstants.driverProfileUri,
        handleError: false,
      );
      
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        String? driverId = profileResponse.body['id']?.toString();
        if (driverId != null && driverId.isNotEmpty) {
          debugPrint('✅ getCurrentOrders: Extracted driverId: $driverId');
          // Now get active orders using driverId
          // Use handleError: false to get actual error status codes
          Response response = await apiClient.getData(
            '${AppConstants.activeOrdersUri}/$driverId/active',
            handleError: false,
          );
          
          if (response.statusCode == 200 && response.body != null) {
            // Backend returns array of orders
            if (response.body is List) {
              List<OrderModel> orders = [];
              int parseFailures = 0;
              
              try {
                (response.body as List).forEach((order) {
                  try {
                    final orderModel = OrderModel.fromJson(order);
                    orders.add(orderModel);
                    debugPrint('✅ Parsed order: id=${orderModel.id}, status=${orderModel.orderStatus}');
                  } catch (e, stackTrace) {
                    parseFailures++;
                    debugPrint('❌ Error parsing order: $e');
                    debugPrint('Order data: $order');
                    debugPrint('Stack trace: $stackTrace');
                  }
                });
                
                // Log all order statuses received
                if (orders.isNotEmpty) {
                  final statuses = orders.map((o) => o.orderStatus ?? 'null').join(', ');
                  debugPrint('📋 getCurrentOrders: Received orders with statuses: $statuses');
                }
                
                // Log warning if all orders failed to parse
                if (parseFailures > 0) {
                  debugPrint('⚠️ getCurrentOrders: Failed to parse $parseFailures out of ${(response.body as List).length} orders');
                  if (parseFailures == (response.body as List).length) {
                    debugPrint('❌ getCurrentOrders: ALL orders failed to parse - this is a critical error');
                    return null; // Return null to indicate error, not empty list
                  }
                }
              } catch (e, stackTrace) {
                debugPrint('❌ Error processing orders list: $e');
                debugPrint('Stack trace: $stackTrace');
                return null;
              }
              
              // Keep a copy of all orders before filtering for count calculation
              final allOrdersForCounting = List<OrderModel>.from(orders);

              // ============================================================================
              // DEBUG: Log all received orders and their statuses
              // ============================================================================
              debugPrint('');
              debugPrint('═══════════════════════════════════════════════════════════');
              debugPrint('🔍 getCurrentOrders: REQUEST - Fetching orders with status filter: "$status"');
              debugPrint('🔍 getCurrentOrders: RESPONSE - Received ${orders.length} orders from backend API');

              if (orders.isNotEmpty) {
                // Count orders by status
                final statusMap = <String, int>{};
                for (var order in orders) {
                  final status = order.orderStatus?.toLowerCase().trim() ?? 'null';
                  statusMap[status] = (statusMap[status] ?? 0) + 1;
                }
                debugPrint('🔍 getCurrentOrders: Status breakdown of received orders:');
                statusMap.forEach((status, count) {
                  debugPrint('   - $status: $count order(s)');
                });

                // List first few order IDs with their statuses for debugging
                final sampleOrders = orders.take(5).map((o) => 'ID:${o.id}(${o.orderStatus})').join(', ');
                debugPrint('🔍 getCurrentOrders: Sample orders: $sampleOrders');
              } else {
                debugPrint('⚠️ getCurrentOrders: No orders received from backend!');
              }
              debugPrint('═══════════════════════════════════════════════════════════');
              debugPrint('');

              // If status is 'all', show ALL orders returned by backend (backend already filters out completed statuses)
              // Otherwise, filter by the specific status
              if (status == 'all' || status.isEmpty) {
                // Don't filter - show all orders returned by backend
                // Backend already excludes completed statuses (delivered, cancelled, etc.)
                debugPrint('🔍 getCurrentOrders: Showing ALL orders from backend (${orders.length} orders) for "all" status');
              } else {
                // FILTER: Filter by specific status for individual tab views
                final statusLower = status.toLowerCase().trim();
                final statusNormalized = statusLower.replaceAll('-', '_').replaceAll(' ', '_');
                final beforeStatusFilterCount = orders.length;

                debugPrint('🔍 getCurrentOrders: Filtering by specific status: "$status" (normalized: "$statusNormalized")');
                debugPrint('🔍 getCurrentOrders: Have $beforeStatusFilterCount orders to filter');

                orders = orders.where((o) {
                  final orderStatus = o.orderStatus?.toLowerCase().trim();
                  if (orderStatus == null) {
                    debugPrint('⚠️ getCurrentOrders: Order ${o.id} has null status - excluding from filter');
                    return false;
                  }
                  final orderStatusNormalized = orderStatus.replaceAll('-', '_').replaceAll(' ', '_');

                  // Match exact or normalized
                  final matches = orderStatus == statusLower ||
                                 orderStatus == statusNormalized ||
                                 orderStatusNormalized == statusLower ||
                                 orderStatusNormalized == statusNormalized;

                  if (matches) {
                    debugPrint('✅ getCurrentOrders: Order ${o.id} matches status filter: "$orderStatus" = "$status"');
                  } else {
                    debugPrint('⚠️ getCurrentOrders: Order ${o.id} status "$orderStatus" does not match "$status"');
                  }

                  return matches;
                }).toList();

                debugPrint('🔍 getCurrentOrders: After specific status filter "$status": ${orders.length} orders (was $beforeStatusFilterCount)');

                if (orders.isEmpty && beforeStatusFilterCount > 0) {
                  debugPrint('⚠️ getCurrentOrders: Status filter "$status" filtered out all $beforeStatusFilterCount orders');
                  final statuses = allOrdersForCounting.map((o) => o.orderStatus ?? 'unknown').toSet().join(", ");
                  debugPrint('⚠️ Available statuses in orders: $statuses');
                  debugPrint('⚠️ MISMATCH: You requested status "$status" but available statuses are: $statuses');
                }
              }
              
              // For counting, use all orders for 'all' count, but filter for individual status counts
              // Calculate counts for each status
              paginatedOrderModel = PaginatedOrderModel(
                orders: orders,
                totalSize: orders.length, // Use actual orders count
                offset: '1', // Backend returns array, not paginated, so use default
                limit: orders.length.toString(), // Use actual count instead of hardcoded '10'
                orderCount: OrderCount(
                  all: allOrdersForCounting.length, // Count of ALL orders from backend
                  created: _countOrdersByStatus(allOrdersForCounting, 'created'),
                  pending: _countOrdersByStatus(allOrdersForCounting, 'pending'),
                  assigned: _countOrdersByStatus(allOrdersForCounting, 'assigned'),
                  accepted: _countOrdersByStatus(allOrdersForCounting, 'accepted'),
                  confirmed: _countOrdersByStatus(allOrdersForCounting, 'confirmed'),
                  processing: _countOrdersByStatus(allOrdersForCounting, 'processing'),
                  handover: _countOrdersByStatus(allOrdersForCounting, 'handover'),
                  pickedUp: _countOrdersByStatus(allOrdersForCounting, 'picked_up'),
                  inTransit: _countOrdersByStatus(allOrdersForCounting, 'in_transit'),
                  delivered: 0,  // Not applicable for active orders
                  cancelled: 0,  // Not applicable for active orders
                ),
              );
              debugPrint('✅ getCurrentOrders: Found ${orders.length} orders to display');
            } else {
              try {
                paginatedOrderModel = PaginatedOrderModel.fromJson(response.body);
                debugPrint('✅ getCurrentOrders: Parsed paginated response with ${paginatedOrderModel.orders?.length ?? 0} orders');
              } catch (e) {
                debugPrint('❌ Error parsing paginated response: $e');
                debugPrint('Response body: ${response.body}');
              }
            }
          } else {
            // API returned error - log actual status code and error details
            debugPrint('❌ getCurrentOrders: Active Orders API returned status ${response.statusCode}');
            debugPrint('Response body: ${response.body}');
            debugPrint('Response statusText: ${response.statusText}');
            
            // If it's a 401/403, it's likely an auth issue
            if (response.statusCode == 401 || response.statusCode == 403) {
              debugPrint('⚠️ getCurrentOrders: Authentication error - check JWT token');
            }
            // Return null to indicate error (distinct from empty orders)
            return null;
          }
        } else {
          debugPrint('❌ getCurrentOrders: Driver ID is null or empty');
          debugPrint('Profile response: ${profileResponse.body}');
          return null;
        }
      } else {
        // Profile API returned error - log actual status code
        debugPrint('❌ getCurrentOrders: Profile API returned status ${profileResponse.statusCode}');
        debugPrint('Profile response body: ${profileResponse.body}');
        debugPrint('Profile response statusText: ${profileResponse.statusText}');
        
        // If it's a 401/403, it's likely an auth issue
        if (profileResponse.statusCode == 401 || profileResponse.statusCode == 403) {
          debugPrint('⚠️ getCurrentOrders: Authentication error - check JWT token');
        }
        return null;
      }
    } catch (e, stackTrace) {
      // Log the error for debugging
      debugPrint('❌ getCurrentOrders: Exception occurred');
      debugPrint('Error: $e');
      debugPrint('Stack trace: $stackTrace');
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
  Future<ResponseModel> updateOrderStatus(UpdateStatusBody updateStatusBody, List<MultipartBody> proofAttachment, {String? orderUuid}) async {
    ResponseModel responseModel;
    // Use new endpoint: PUT /api/orders/:id/status
    // Use UUID if available, otherwise fall back to numeric ID
    String orderId = orderUuid ?? updateStatusBody.orderId?.toString() ?? '';
    
    // Normalize status: backend accepts both 'cancelled' and 'cancelled', but we'll use 'cancelled'
    String status = updateStatusBody.status ?? '';
    if (status.toLowerCase() == 'cancelled') {
      status = 'cancelled';
    }
    
    Map<String, dynamic> body = {'status': status};
    if (updateStatusBody.reason != null && updateStatusBody.reason!.isNotEmpty) {
      body['reason'] = updateStatusBody.reason;
      // Also set cancellationSource for cancelled orders
      if (status.toLowerCase() == 'cancelled') {
        body['cancellationSource'] = 'deliveryman';
      }
    }
    
    // If we have proof attachments, we may need a different endpoint or handle separately
    // For now, try PUT with status update (backend uses PUT for status updates)
    Response response = await apiClient.putData(
      '${AppConstants.updateOrderStatusUri}/$orderId/status',
      body,
      handleError: false
    );
    
    debugPrint('====> updateOrderStatus Response: [${response.statusCode}] ${response.body}');
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      String message = 'Status updated successfully';
      if (response.body != null) {
        if (response.body is Map) {
          message = response.body['message'] ?? message;
        } else if (response.body is String) {
          try {
            final parsed = jsonDecode(response.body);
            if (parsed is Map) {
              message = parsed['message'] ?? message;
            }
          } catch (e) {
            message = response.body;
          }
        }
      }
      responseModel = ResponseModel(true, message);
    } else {
      String errorMessage = 'Failed to update status';
      if (response.body != null) {
        if (response.body is Map) {
          errorMessage = response.body['message'] ?? response.body['error'] ?? response.statusText ?? errorMessage;
        } else if (response.body is String) {
          errorMessage = response.body;
        }
      } else {
        errorMessage = response.statusText ?? errorMessage;
      }
      responseModel = ResponseModel(false, errorMessage);
      debugPrint('====> updateOrderStatus Error: $errorMessage');
    }
    return responseModel;
  }

  @override
  Future<List<OrderDetailsModel>?> getOrderDetails(dynamic orderID) async {
    List<OrderDetailsModel>? orderDetailsModel;
    // Convert orderID to string - if it's already a string (UUID), use it; otherwise convert int to string
    String orderIdStr = orderID is String ? orderID : orderID.toString();
    // Use new driver endpoint: GET /api/v1/delivery-man/order/:orderId
    Response response = await apiClient.getData('${AppConstants.orderDetailsUri}/$orderIdStr', handleError: false);
    if (response.statusCode == 200) {
      orderDetailsModel = [];
      // Backend returns order object with order_details array
      if (response.body != null) {
        debugPrint('🔍 getOrderDetails: Parsing response for order $orderID');
        debugPrint('Response body keys: ${response.body.keys.toList()}');
        
        // Check for order_details array (most common case)
        if (response.body['order_details'] != null && response.body['order_details'] is List) {
          debugPrint('✅ Found order_details array with ${(response.body['order_details'] as List).length} items');
          (response.body['order_details'] as List).forEach((orderDetails) {
            try {
              orderDetailsModel!.add(OrderDetailsModel.fromJson(orderDetails));
            } catch (e, stackTrace) {
              debugPrint('❌ Error parsing order detail: $e');
              debugPrint('Stack trace: $stackTrace');
              debugPrint('Order detail data: $orderDetails');
            }
          });
        } else if (response.body is List) {
          // If response is directly a list
          debugPrint('✅ Response is directly a list');
          (response.body as List).forEach((orderDetails) {
            try {
              orderDetailsModel!.add(OrderDetailsModel.fromJson(orderDetails));
            } catch (e, stackTrace) {
              debugPrint('❌ Error parsing order detail: $e');
              debugPrint('Stack trace: $stackTrace');
            }
          });
        } else if (response.body is Map) {
          // Single order object - try to extract order_details or use items
          if (response.body['order_details'] != null) {
            debugPrint('✅ Found order_details in map');
            if (response.body['order_details'] is List) {
              (response.body['order_details'] as List).forEach((orderDetails) {
                try {
                  orderDetailsModel!.add(OrderDetailsModel.fromJson(orderDetails));
                } catch (e, stackTrace) {
                  debugPrint('❌ Error parsing order detail: $e');
                  debugPrint('Stack trace: $stackTrace');
                }
              });
            }
          } else if (response.body['items'] != null && response.body['items'] is List) {
            // Fallback: create order details from items
            debugPrint('✅ Found items array, creating order details');
            (response.body['items'] as List).asMap().forEach((index, item) {
              try {
                orderDetailsModel!.add(OrderDetailsModel.fromJson({
                  'id': index + 1,
                  'food_id': item['food_id'] ?? null,
                  'order_id': response.body['id'] ?? orderID,
                  'price': item['price'] ?? 0.0,
                  'food_details': {
                    'id': item['food_id'] ?? null,
                    'name': item['name'] ?? 'Item',
                    'price': item['price'] ?? 0.0,
                  },
                  'add_ons': item['add_ons'] ?? [],
                  'quantity': item['quantity'] ?? 1,
                  'tax_amount': item['tax_amount'] ?? 0.0,
                }));
              } catch (e, stackTrace) {
                debugPrint('❌ Error creating order detail from item: $e');
                debugPrint('Stack trace: $stackTrace');
              }
            });
          } else {
            debugPrint('⚠️ getOrderDetails: No order_details or items found in response');
            debugPrint('Available keys: ${response.body.keys.toList()}');
          }
        }
        
        debugPrint('✅ getOrderDetails: Successfully parsed ${orderDetailsModel.length} order details');
      } else {
        debugPrint('⚠️ getOrderDetails: Response body is null');
      }
    } else if (response.statusCode == 403 || response.statusCode == 404) {
      debugPrint('⚠️ getOrderDetails: Order ${orderID} not accessible (${response.statusCode})');
      debugPrint('Response: ${response.body}');
      // Return empty list instead of null to allow UI to show error state
      return [];
    } else {
      debugPrint('❌ getOrderDetails: API returned status ${response.statusCode}');
      debugPrint('Response: ${response.body}');
    }
    return orderDetailsModel;
  }

  @override
  Future<ResponseModel> acceptOrder(int? orderID, {String? orderUuid}) async {
    ResponseModel responseModel;
    // New backend endpoint expects: { orderId: string (UUID), driverId?: string }
    // driverId is optional as it can be extracted from JWT token
    // Use UUID if provided, otherwise fall back to numeric ID (backend will handle conversion)
    String orderIdToSend = orderUuid ?? orderID.toString();
    Response response = await apiClient.postData(
      AppConstants.acceptOrderUri, 
      {'orderId': orderIdToSend}, 
      handleError: false
    );
    
    debugPrint('====> acceptOrder Response: [${response.statusCode}] ${response.body}');
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      // Parse response body safely
      String message = 'Order assigned successfully';
      if (response.body != null) {
        if (response.body is Map) {
          message = response.body['message'] ?? response.body['status'] ?? message;
        } else if (response.body is String) {
          try {
            final parsed = jsonDecode(response.body);
            if (parsed is Map) {
              message = parsed['message'] ?? message;
            }
          } catch (e) {
            message = response.body;
          }
        }
      }
      responseModel = ResponseModel(true, message);
    } else {
      // Handle error response
      String errorMessage = 'Failed to accept order';
      if (response.body != null) {
        if (response.body is Map) {
          errorMessage = response.body['message'] ?? response.body['error'] ?? response.statusText ?? errorMessage;
          // Handle array of messages (validation errors)
          if (response.body['message'] is List) {
            errorMessage = (response.body['message'] as List).join(', ');
          }
        } else if (response.body is String) {
          errorMessage = response.body;
        }
      } else {
        errorMessage = response.statusText ?? errorMessage;
      }
      responseModel = ResponseModel(false, errorMessage);
      debugPrint('====> acceptOrder Error: $errorMessage');
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
    
    debugPrint('====> updateOrderStatusNew Response: [${response.statusCode}] ${response.body}');
    
    // Handle both 200 and 201 status codes
    if (response.statusCode == 200 || response.statusCode == 201) {
      // Parse response body safely
      String message = 'Status updated';
      if (response.body != null) {
        if (response.body is Map) {
          message = response.body['message'] ?? response.body['status'] ?? message;
        } else if (response.body is String) {
          try {
            final parsed = jsonDecode(response.body);
            if (parsed is Map) {
              message = parsed['message'] ?? message;
            }
          } catch (e) {
            message = response.body;
          }
        }
      }
      responseModel = ResponseModel(true, message);
    } else {
      // Handle error response
      String errorMessage = 'Failed to update status';
      if (response.body != null) {
        if (response.body is Map) {
          errorMessage = response.body['message'] ?? response.body['error'] ?? response.statusText ?? errorMessage;
        } else if (response.body is String) {
          errorMessage = response.body;
        }
      } else {
        errorMessage = response.statusText ?? errorMessage;
      }
      responseModel = ResponseModel(false, errorMessage);
      debugPrint('====> updateOrderStatusNew Error: $errorMessage');
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

  // Helper function to count orders by status with normalization
  int _countOrdersByStatus(List<OrderModel> orders, String targetStatus) {
    final targetLower = targetStatus.toLowerCase().trim();
    final targetNormalized = targetLower.replaceAll('-', '_').replaceAll(' ', '_');
    
    return orders.where((o) {
      final orderStatus = o.orderStatus?.toLowerCase().trim();
      if (orderStatus == null) return false;
      final orderStatusNormalized = orderStatus.replaceAll('-', '_').replaceAll(' ', '_');
      
      return orderStatus == targetLower || 
             orderStatus == targetNormalized ||
             orderStatusNormalized == targetLower ||
             orderStatusNormalized == targetNormalized;
    }).length;
  }

  @override
  Future<OrderModel?> getOrderWithId(dynamic orderId) async {
    OrderModel? orderModel;
    // Convert orderId to string - if it's already a string (UUID), use it; otherwise convert int to string
    String orderIdStr = orderId is String ? orderId : orderId.toString();
    // Use new driver endpoint: GET /api/v1/delivery-man/order/:orderId
    Response response = await apiClient.getData('${AppConstants.orderDetailsUri}/$orderIdStr', handleError: false);
    if (response.statusCode == 200) {
      try {
        orderModel = OrderModel.fromJson(response.body);
      } catch (e) {
        debugPrint('❌ getOrderWithId: Error parsing order: $e');
        debugPrint('Response body: ${response.body}');
      }
    } else if (response.statusCode == 403 || response.statusCode == 404) {
      debugPrint('⚠️ getOrderWithId: Order ${orderId} not accessible (${response.statusCode})');
      debugPrint('Response: ${response.body}');
    } else {
      debugPrint('❌ getOrderWithId: API returned status ${response.statusCode}');
      debugPrint('Response: ${response.body}');
    }
    return orderModel;
  }

  @override
  Future<List<CancellationData>?> getCancelReasons() async {
    List<CancellationData>? orderCancelReasons;
    
    // Try to fetch from API, but use defaults if it fails quickly
    try {
      Response response = await apiClient.getData('${AppConstants.orderCancellationUri}?offset=1&limit=30&type=deliveryman', handleError: false);
      debugPrint('====> getCancelReasons Response: [${response.statusCode}]');
      
      if (response.statusCode == 200 && response.body != null) {
        try {
          OrderCancellationBodyModel orderCancellationBody = OrderCancellationBodyModel.fromJson(response.body);
          orderCancelReasons = [];
          if (orderCancellationBody.reasons != null && orderCancellationBody.reasons!.isNotEmpty) {
            for (var element in orderCancellationBody.reasons!) {
              orderCancelReasons.add(element);
            }
            debugPrint('====> getCancelReasons: Successfully loaded ${orderCancelReasons.length} reasons from API');
            return orderCancelReasons;
          } else {
            debugPrint('====> getCancelReasons: API returned empty reasons list, using defaults');
          }
        } catch (e) {
          debugPrint('====> getCancelReasons: Error parsing response: $e, using defaults');
        }
      } else {
        // API endpoint doesn't exist or returned error - use defaults
        debugPrint('====> getCancelReasons: API returned status ${response.statusCode}, using defaults');
        if (response.statusText != null) {
          debugPrint('====> getCancelReasons: Response: ${response.statusText}');
        }
      }
    } catch (e) {
      debugPrint('====> getCancelReasons: Exception occurred: $e, using defaults');
    }
    
    // Always return default cancellation reasons if API failed or returned empty
    debugPrint('====> getCancelReasons: Returning default cancellation reasons');
    return _getDefaultCancellationReasons();
  }

  // Default cancellation reasons if API is unavailable
  List<CancellationData> _getDefaultCancellationReasons() {
    return [
      CancellationData(
        id: 1,
        reason: 'Customer not available',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 2,
        reason: 'Wrong address provided',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 3,
        reason: 'Customer refused to accept order',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 4,
        reason: 'Restaurant closed',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 5,
        reason: 'Unable to locate customer',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 6,
        reason: 'Order damaged during delivery',
        userType: 'deliveryman',
        status: 1,
      ),
      CancellationData(
        id: 7,
        reason: 'Other',
        userType: 'deliveryman',
        status: 1,
      ),
    ];
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