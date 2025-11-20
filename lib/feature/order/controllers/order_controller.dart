import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:get/get_connect/http/src/response/response.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/ignore_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_cancellation_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_details_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/status_list_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/routes/controllers/route_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

class OrderController extends GetxController implements GetxService {
  final OrderServiceInterface orderServiceInterface;
  OrderController({required this.orderServiceInterface});

  List<OrderModel>? _allOrderList;
  List<OrderModel>? get allOrderList => _allOrderList;

  List<OrderModel>? _currentOrderList;
  List<OrderModel>? get currentOrderList => _currentOrderList;

  List<int>? _currentOrderCountList;
  List<int>? get currentOrderCountList => _currentOrderCountList;

  List<OrderModel>? _deliveredOrderList;
  List<OrderModel>? get deliveredOrderList => _deliveredOrderList;

  List<OrderModel>? _completedOrderList;
  List<OrderModel>? get completedOrderList => _completedOrderList;

  List<int>? _completedOrderCountList;
  List<int>? get completedOrderCountList => _completedOrderCountList;

  List<OrderModel>? _latestOrderList;
  List<OrderModel>? get latestOrderList => _latestOrderList;

  List<OrderModel>? _assignedOrderList;
  List<OrderModel>? get assignedOrderList => _assignedOrderList;

  bool _isLoadingAssignedOrders = false;
  bool get isLoadingAssignedOrders => _isLoadingAssignedOrders;

  List<OrderDetailsModel>? _orderDetailsModel;
  List<OrderDetailsModel>? get orderDetailsModel => _orderDetailsModel;

  List<IgnoreModel> _ignoredRequests = [];

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Position _position = Position(longitude: 0, latitude: 0, timestamp: DateTime.now(), accuracy: 1, altitude: 1, heading: 1, speed: 1, speedAccuracy: 1, altitudeAccuracy: 1, headingAccuracy: 1);
  Position get position => _position;

  Placemark _placeMark = const Placemark(name: 'Unknown', subAdministrativeArea: 'Location', isoCountryCode: 'Found');
  Placemark get placeMark => _placeMark;

  String _otp = '';
  String get otp => _otp;

  String get address => '${_placeMark.name} ${_placeMark.subAdministrativeArea} ${_placeMark.isoCountryCode}';

  bool _paginate = false;
  bool get paginate => _paginate;

  int? _pageSize;
  int? get pageSize => _pageSize;

  List<int> _offsetList = [];
  int _offset = 1;
  int get offset => _offset;

  OrderModel? _orderModel;
  OrderModel? get orderModel => _orderModel;

  List<CancellationData>? _orderCancelReasons;
  List<CancellationData>? get orderCancelReasons => _orderCancelReasons;

  String? _cancelReason = '';
  String? get cancelReason => _cancelReason;

  bool _showDeliveryImageField = false;
  bool get showDeliveryImageField => _showDeliveryImageField;

  List<XFile> _pickedPrescriptions = [];
  List<XFile> get pickedPrescriptions => _pickedPrescriptions;

  int? _selectedRunningOrderStatusIndex;
  int? get selectedRunningOrderStatusIndex => _selectedRunningOrderStatusIndex;

  String? _selectedRunningOrderStatus = 'all';
  String? get selectedRunningOrderStatus => _selectedRunningOrderStatus;

  int? _selectedMyOrderStatusIndex;
  int? get selectedMyOrderStatusIndex => _selectedMyOrderStatusIndex;

  String? _selectedMyOrderStatus = 'all';
  String? get selectedMyOrderStatus => _selectedMyOrderStatus;

  void setSelectedRunningOrderStatusIndex(int? index, String? status) {
    _selectedRunningOrderStatusIndex = index;
    _selectedRunningOrderStatus = status;
    update();
  }

  void setSelectedMyOrderStatusIndex(int? index, String? status) {
    _selectedMyOrderStatusIndex = index;
    _selectedMyOrderStatus = status;
    update();
  }

  void changeDeliveryImageStatus({bool isUpdate = true}){
    _showDeliveryImageField = !_showDeliveryImageField;
    if(isUpdate) {
      update();
    }
  }

  void pickPrescriptionImage({required bool isRemove, required bool isCamera}) async {
    if(isRemove) {
      _pickedPrescriptions = [];
    }else {
      XFile? xFile = await ImagePicker().pickImage(source: isCamera ? ImageSource.camera : ImageSource.gallery, imageQuality: 50);
      if(xFile != null) {
        _pickedPrescriptions.add(xFile);
        if(Get.isDialogOpen ?? false){
          Get.back();
        }
      }
      update();
    }
  }

  void removePrescriptionImage(int index) {
    _pickedPrescriptions.removeAt(index);
    update();
  }

  void setOrderCancelReason(String? reason){
    _cancelReason = reason;
    update();
  }

  Future<void> getOrderCancelReasons()async {
    try {
      List<CancellationData>? orderCancelReasons = await orderServiceInterface.getCancelReasons();
      if (orderCancelReasons != null && orderCancelReasons.isNotEmpty) {
        _orderCancelReasons = [];
        _orderCancelReasons!.addAll(orderCancelReasons);
      } else {
        // If null or empty, initialize with empty list to show "no reasons" message
        _orderCancelReasons = [];
      }
    } catch (e) {
      debugPrint('Error getting cancellation reasons: $e');
      // On error, set to empty list so UI can show appropriate message
      _orderCancelReasons = [];
    }
    update();
  }

  Future<void> getAllOrders() async {
    List<OrderModel>? allOrderList = await orderServiceInterface.getAllOrders();
    if(allOrderList != null) {
      _allOrderList = [];
      _allOrderList!.addAll(allOrderList);
      _deliveredOrderList = orderServiceInterface.sortDeliveredOrderList(_allOrderList!);
    }
    update();
  }

  Future<void> getCompletedOrders({required int offset, bool isUpdate = true, required String status}) async {
    if(offset == 1) {
      _offsetList = [];
      _offset = 1;
      _completedOrderList = null;
      if(isUpdate) {
        update();
      }
    }
    if (!_offsetList.contains(offset)) {
      _offsetList.add(offset);
      try {
        PaginatedOrderModel? paginatedOrderModel = await orderServiceInterface.getCompletedOrderList(offset, status: status);
        if (paginatedOrderModel != null) {
          if (offset == 1) {
            _completedOrderList = [];
          }
          _completedOrderList!.addAll(paginatedOrderModel.orders!);
          // Map counts to match status list order: all, accepted, confirmed, processing, handover, picked_up, in_transit, delivered, cancelled, refund_requested, refunded, refund_request_cancelled
          _completedOrderCountList = [
            paginatedOrderModel.orderCount!.all ?? 0,
            paginatedOrderModel.orderCount!.accepted ?? 0,
            paginatedOrderModel.orderCount!.confirmed ?? 0,
            paginatedOrderModel.orderCount!.processing ?? 0,
            paginatedOrderModel.orderCount!.handover ?? 0,
            paginatedOrderModel.orderCount!.pickedUp ?? 0,
            paginatedOrderModel.orderCount!.inTransit ?? 0,
            paginatedOrderModel.orderCount!.delivered ?? 0,
            paginatedOrderModel.orderCount!.cancelled ?? 0,
            paginatedOrderModel.orderCount!.refundRequested ?? 0,
            paginatedOrderModel.orderCount!.refunded ?? 0,
            paginatedOrderModel.orderCount!.refundRequestcancelled ?? 0,
          ];
          _pageSize = paginatedOrderModel.totalSize;
          _paginate = false;
          update();
        } else {
          // Use empty list when API returns null
          if (offset == 1) {
            _completedOrderList = [];
            // Initialize with 12 zeros to match the 12 status buttons: all, accepted, confirmed, processing, handover, picked_up, in_transit, delivered, cancelled, refund_requested, refunded, refund_request_cancelled
            _completedOrderCountList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            _pageSize = 0;
          }
          _paginate = false;
          update();
        }
      } catch (e) {
        debugPrint('Error fetching completed orders: $e');
        // Use empty list on error
        if (offset == 1) {
          _completedOrderList = [];
          // Initialize with 12 zeros to match the 12 status buttons: all, accepted, confirmed, processing, handover, picked_up, in_transit, delivered, cancelled, refund_requested, refunded, refund_request_cancelled
          _completedOrderCountList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          _pageSize = 0;
        }
        _paginate = false;
        update();
      }
    } else {
      if(_paginate) {
        _paginate = false;
        update();
      }
    }
  }

  void showBottomLoader() {
    _paginate = true;
    update();
  }

  void setOffset(int offset) {
    _offset = offset;
  }

  Future<void> getCurrentOrders({required String status, bool isDataClear = true}) async {
    if(isDataClear){
      _currentOrderList = null;
      update(); // Show loading state
    }
    try {
      debugPrint('🔄 OrderController.getCurrentOrders: Fetching orders with status="$status", isDataClear=$isDataClear');
      PaginatedOrderModel? paginatedOrderModel = await orderServiceInterface.getCurrentOrders(status: status);
      if(paginatedOrderModel != null && paginatedOrderModel.orders != null) {
        _currentOrderList = [];
        _currentOrderList!.addAll(paginatedOrderModel.orders!);
        // Map counts to match status list order: all, accepted, confirmed, processing, handover, picked_up, in_transit
        // Note: When 'all' is selected, it shows all active orders, but individual tabs only show these 6 statuses
        _currentOrderCountList = [
          paginatedOrderModel.orderCount?.all ?? 0,
          paginatedOrderModel.orderCount?.accepted ?? 0,
          paginatedOrderModel.orderCount?.confirmed ?? 0,
          paginatedOrderModel.orderCount?.processing ?? 0,
          paginatedOrderModel.orderCount?.handover ?? 0,
          paginatedOrderModel.orderCount?.pickedUp ?? 0,
          paginatedOrderModel.orderCount?.inTransit ?? 0,
        ];
        debugPrint('✅ OrderController.getCurrentOrders: Successfully loaded ${_currentOrderList!.length} orders');
      } else {
        // API returned null - could be error or no orders
        debugPrint('⚠️ OrderController.getCurrentOrders: API returned null (could be error or no orders)');
        // Check if this is likely an error vs genuinely no orders
        // If we had data before and now we don't, it might be an error
        // For now, set to empty list to show "no orders" state
        // But we should distinguish between error and no orders in the future
        _currentOrderList = [];
        // Initialize with 7 zeros to match the 7 status buttons: all, accepted, confirmed, processing, handover, picked_up, in_transit
        _currentOrderCountList = [0, 0, 0, 0, 0, 0, 0];
        debugPrint('⚠️ OrderController.getCurrentOrders: Set empty list - check repository logs for actual error');
      }
    } catch (e, stackTrace) {
      debugPrint('❌ OrderController.getCurrentOrders: Exception occurred');
      debugPrint('Error: $e');
      debugPrint('Stack trace: $stackTrace');
      // On error, keep as null to distinguish from "no orders" state
      // This allows UI to show loading state or error state
      _currentOrderList = null;
      _currentOrderCountList = null;
    }
    update();
  }

  Future<void> getOrderWithId(dynamic orderId) async {
    // Try to find UUID from existing orderModel or currentOrderList
    String? orderUuid;
    if (orderId != null) {
      // If orderId is already a string (UUID), use it
      if (orderId is String) {
        orderUuid = orderId;
      } 
      // Otherwise, try to find UUID from existing data
      else if (orderId is int) {
        // First check _orderModel
        if (_orderModel != null && _orderModel!.id == orderId && _orderModel!.uuid != null) {
          orderUuid = _orderModel!.uuid;
        } 
        // If not found, check currentOrderList
        else if (_currentOrderList != null) {
          for (var order in _currentOrderList!) {
            if (order.id == orderId && order.uuid != null) {
              orderUuid = order.uuid;
              break;
            }
          }
        }
      }
    }
    // Use UUID if available, otherwise use the original orderId (backend will handle fallback)
    OrderModel? orderModel = await orderServiceInterface.getOrderWithId(orderUuid ?? orderId);
    if(orderModel != null) {
      _orderModel = orderModel;
    }
    update();
  }

  Future<void> getLatestOrders() async {
    try {
      List<OrderModel>? latestOrderList = await orderServiceInterface.getLatestOrders();
      if(latestOrderList != null) {
        _latestOrderList = [];
        List<int?> ignoredIdList = orderServiceInterface.prepareIgnoreIdList(_ignoredRequests);
        _latestOrderList!.addAll(orderServiceInterface.processLatestOrders(latestOrderList, ignoredIdList));
      } else {
        // Use empty list when API returns null
        _latestOrderList = [];
      }
    } catch (e) {
      debugPrint('Error fetching latest orders: $e');
      // Use empty list on error
      _latestOrderList = [];
    }
    update();
  }

  Future<void> getAssignedOrders() async {
    _isLoadingAssignedOrders = true;
    update();
    try {
      // Get driver UUID from cached ProfileController first (avoids extra API call)
      String? driverId;
      try {
        final profileController = Get.find<ProfileController>();
        final profileModel = profileController.profileModel;
        
        if (profileModel != null) {
          // Try to get UUID from profileModel's id if it's a UUID format
          if (profileModel.id != null) {
            String idStr = profileModel.id.toString();
            if (idStr.contains('-') && idStr.length == 36) {
              driverId = idStr;
            }
          }
        }
      } catch (e) {
        debugPrint('Could not get driver ID from ProfileController: $e');
      }
      
      // Fallback: Get driver UUID from profile API only if not found in cache
      if (driverId == null || driverId.isEmpty) {
        final apiClient = Get.find<ApiClient>();
        Response profileResponse = await apiClient.getData(
          '/api/drivers/me',
          handleError: false,
        );
        
        if (profileResponse.statusCode == 200 && profileResponse.body != null) {
          Map<String, dynamic>? body = profileResponse.body is Map ? profileResponse.body as Map<String, dynamic> : null;
          if (body != null) {
            if (body['uuid'] != null && body['uuid'].toString().isNotEmpty) {
              driverId = body['uuid'].toString();
            } else if (body['id'] != null) {
              String idStr = body['id'].toString();
              if (idStr.contains('-') && idStr.length == 36) {
                driverId = idStr;
              }
            }
          }
        }
      }
      
      if (driverId != null && driverId.isNotEmpty) {
        // Get active orders and filter for assigned status only (accepted orders should appear in Running Orders)
        List<OrderModel>? activeOrders = await orderServiceInterface.getActiveOrders(driverId);
        if (activeOrders != null) {
          _assignedOrderList = activeOrders.where((order) {
            final status = order.orderStatus?.toLowerCase().trim();
            return status == 'assigned';
          }).toList();
        } else {
          _assignedOrderList = [];
        }
      } else {
        _assignedOrderList = [];
      }
    } catch (e) {
      debugPrint('Error fetching assigned orders: $e');
      _assignedOrderList = [];
    } finally {
      _isLoadingAssignedOrders = false;
      update();
    }
  }

  Future<bool> rejectOrder(int? orderID, int index) async {
    _isLoading = true;
    update();
    
    try {
      // Get order UUID if available
      String? orderUuid;
      if (_assignedOrderList != null && index < _assignedOrderList!.length) {
        orderUuid = _assignedOrderList![index].uuid;
      }
      
      // Use status update to change order back to pending (effectively unassigns it)
      String orderId = orderUuid ?? orderID.toString();
      debugPrint('====> Rejecting order with ID: $orderId (UUID: ${orderUuid != null}, numeric: ${orderID?.toString()})');
      ResponseModel responseModel = await orderServiceInterface.updateOrderStatusNew(orderId, 'pending');
      
      debugPrint('====> Reject order response: success=${responseModel.isSuccess}, message=${responseModel.message}');
      
      if(responseModel.isSuccess) {
        // Remove from assigned orders list
        if (_assignedOrderList != null && index < _assignedOrderList!.length) {
          _assignedOrderList!.removeAt(index);
        }
        // Refresh assigned orders list to get updated data
        await getAssignedOrders();
        // Refresh completed orders to reflect status changes in My Orders page
        await getCompletedOrders(offset: 1, status: selectedMyOrderStatus ?? 'all', isUpdate: true);
        showCustomSnackBar('Order rejected successfully', isError: false);
      } else {
        debugPrint('====> Failed to reject order: ${responseModel.message}');
        showCustomSnackBar(responseModel.message, isError: true);
      }
      
      _isLoading = false;
      update();
      return responseModel.isSuccess;
    } catch (e) {
      debugPrint('====> Exception rejecting order: $e');
      _isLoading = false;
      update();
      showCustomSnackBar('Failed to reject order: ${e.toString()}', isError: true);
      return false;
    }
  }

  Future<bool> updateOrderStatus(int? orderId, String status, {bool back = false,  String? reason}) async {
    _isLoading = true;
    update();
    
    // Try to get UUID from orderModel or currentOrderList
    String? orderUuid;
    if (orderId != null) {
      // First check _orderModel
      if (_orderModel != null && _orderModel!.id == orderId && _orderModel!.uuid != null) {
        orderUuid = _orderModel!.uuid;
      } 
      // If not found, check currentOrderList
      else if (_currentOrderList != null) {
        for (var order in _currentOrderList!) {
          if (order.id == orderId && order.uuid != null) {
            orderUuid = order.uuid;
            break;
          }
        }
      }
    }
    
    List<MultipartBody> multiParts = orderServiceInterface.prepareOrderProofImages(_pickedPrescriptions);
    UpdateStatusBody updateStatusBody = UpdateStatusBody(
      orderId: orderId, status: status,
      otp: status == 'delivered' ? _otp : null, reason: reason,
    );
    ResponseModel responseModel = await orderServiceInterface.updateOrderStatus(updateStatusBody, multiParts, orderUuid: orderUuid);
    Get.back(result: responseModel.isSuccess);
    if(responseModel.isSuccess) {
      if(back) {
        Get.back();
      }
      // Refresh both current orders and completed orders after status update
      getCurrentOrders(status: selectedRunningOrderStatus ?? 'all');
      getCompletedOrders(offset: 1, status: selectedMyOrderStatus ?? 'all', isUpdate: true);
      showCustomSnackBar(responseModel.message, isError: false);
    }else {
      showCustomSnackBar(responseModel.message, isError: true);
    }
    _isLoading = false;
    update();
    return responseModel.isSuccess;
  }

  /// Accept an assigned order by updating its status to "accepted"
  Future<bool> acceptAssignedOrder(int? orderId, int index, [String? orderIdStr]) async {
    _isLoading = true;
    update();
    
    try {
      // Use provided orderIdStr if available, otherwise try to get UUID from list
      String? orderUuid = orderIdStr;
      if (orderUuid == null && _assignedOrderList != null && index < _assignedOrderList!.length) {
        orderUuid = _assignedOrderList![index].uuid;
      }
      
      // Use UUID if available, otherwise fall back to numeric ID
      String finalOrderId = orderUuid ?? orderId.toString();
      
      // Use updateOrderStatusNew which accepts string (UUID or numeric ID)
      debugPrint('====> Accepting order with ID: $finalOrderId (UUID: ${orderUuid != null}, numeric: ${orderId?.toString()})');
      ResponseModel responseModel = await orderServiceInterface.updateOrderStatusNew(finalOrderId, 'accepted');
      
      debugPrint('====> Accept order response: success=${responseModel.isSuccess}, message=${responseModel.message}');
      
      if(responseModel.isSuccess) {
        // Remove from assigned orders list
        if (_assignedOrderList != null && index < _assignedOrderList!.length) {
          _assignedOrderList!.removeAt(index);
        }
        // Refresh assigned orders list to get updated data
        await getAssignedOrders();
        // Refresh running orders to show the accepted order in Running Order page
        await getCurrentOrders(status: selectedRunningOrderStatus ?? 'all');
        // Refresh completed orders to reflect status changes in My Orders page
        await getCompletedOrders(offset: 1, status: selectedMyOrderStatus ?? 'all', isUpdate: true);
        showCustomSnackBar(responseModel.message, isError: false);
      } else {
        debugPrint('====> Failed to accept order: ${responseModel.message}');
        showCustomSnackBar(responseModel.message, isError: true);
      }
      _isLoading = false;
      update();
      return responseModel.isSuccess;
    } catch (e) {
      debugPrint('====> Exception accepting assigned order: $e');
      _isLoading = false;
      update();
      showCustomSnackBar('Failed to accept order: ${e.toString()}', isError: true);
      return false;
    }
  }

  Future<void> getOrderDetails(dynamic orderID) async {
    _orderDetailsModel = null;
    update(); // Show loading state
    
    // Try to find UUID from existing orderModel or currentOrderList
    String? orderUuid;
    if (orderID != null) {
      // If orderID is already a string (UUID), use it
      if (orderID is String) {
        orderUuid = orderID;
      } 
      // Otherwise, try to find UUID from existing data
      else if (orderID is int) {
        // First check _orderModel
        if (_orderModel != null && _orderModel!.id == orderID && _orderModel!.uuid != null) {
          orderUuid = _orderModel!.uuid;
        } 
        // If not found, check currentOrderList
        else if (_currentOrderList != null) {
          for (var order in _currentOrderList!) {
            if (order.id == orderID && order.uuid != null) {
              orderUuid = order.uuid;
              break;
            }
          }
        }
      }
    }
    
    // Use UUID if available, otherwise use the original orderID
    List<OrderDetailsModel>? orderDetailsModel = await orderServiceInterface.getOrderDetails(orderUuid ?? orderID);
    if(orderDetailsModel != null && orderDetailsModel.isNotEmpty) {
      _orderDetailsModel = [];
      _orderDetailsModel!.addAll(orderDetailsModel);
    } else if (orderDetailsModel != null && orderDetailsModel.isEmpty) {
      // Empty list means 403/404 error - keep as null to show error state
      _orderDetailsModel = null;
    }
    update();
  }

  Future<bool> acceptOrder(int? orderID, int index, OrderModel orderModel) async {
    _isLoading = true;
    update();
    
    // Get driver profile to check capacity
    try {
      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;
      
      if (profileModel != null) {
        // Get current active orders count
        String? driverId = profileModel.id?.toString();
        if (driverId != null) {
          List<OrderModel>? activeOrders = await orderServiceInterface.getActiveOrders(driverId);
          int currentActiveCount = activeOrders?.length ?? (_currentOrderList?.length ?? 0);
          // Get capacity from profile - may need to add this field to ProfileModel
          // For now, check if there's a capacity property or use default
          int driverCapacity = 1; // Default capacity
          // TODO: Add capacity field to ProfileModel when backend supports it
          
          // Check capacity
          if (currentActiveCount >= driverCapacity) {
            _isLoading = false;
            update();
            showCustomSnackBar('You have reached your maximum order capacity ($driverCapacity). Complete current orders before accepting new ones.', isError: true);
            return false;
          }
        }
      }
    } catch (e) {
      // If we can't get profile, continue anyway (capacity check is best effort)
      print('Could not check capacity: $e');
    }
    
    // Get order UUID before calling acceptOrder
    String? orderUuid = orderModel.uuid;
    
    // If UUID not available, try to find it from the latestOrderList
    if (orderUuid == null || orderUuid.isEmpty) {
      if (_latestOrderList != null && index < _latestOrderList!.length) {
        final orderFromList = _latestOrderList![index];
        orderUuid = orderFromList.uuid;
        debugPrint('====> Got UUID from latestOrderList before acceptOrder: $orderUuid');
      }
    }
    
    // Call acceptOrder with UUID if available
    debugPrint('====> Calling acceptOrder with orderID: $orderID, UUID: $orderUuid');
    ResponseModel responseModel = await orderServiceInterface.acceptOrder(orderID, orderUuid: orderUuid);
    
    if(responseModel.isSuccess) {
      // Update status to "accepted" after assignment
      // Use UUID if we have it, otherwise the backend will handle numeric ID
      if (orderUuid != null && orderUuid.isNotEmpty) {
        debugPrint('====> Updating order status to accepted: $orderUuid');
        ResponseModel statusResponse = await orderServiceInterface.updateOrderStatusNew(orderUuid, 'accepted');
        if (statusResponse.isSuccess) {
          debugPrint('====> Order status updated to accepted successfully');
          // Update the order model status locally
          orderModel.orderStatus = 'accepted';
        } else {
          debugPrint('====> Failed to update order status to accepted: ${statusResponse.message}');
          // Still update locally since assignment was successful
          orderModel.orderStatus = 'accepted';
        }
      } else {
        debugPrint('====> UUID not available, trying to update status with numeric ID: $orderID');
        // Try with numeric ID as fallback (backend should handle it)
        ResponseModel statusResponse = await orderServiceInterface.updateOrderStatusNew(orderID.toString(), 'accepted');
        if (statusResponse.isSuccess) {
          debugPrint('====> Order status updated to accepted successfully (using numeric ID)');
          orderModel.orderStatus = 'accepted';
        } else {
          debugPrint('====> Failed to update order status: ${statusResponse.message}');
          // Still update locally since assignment was successful
          orderModel.orderStatus = 'accepted';
        }
      }
      
      if (_latestOrderList != null && _latestOrderList!.isNotEmpty && index < _latestOrderList!.length) {
        _latestOrderList!.removeAt(index);
      }
      if (_currentOrderList == null) {
        _currentOrderList = [];
      }
      // Only add if order has valid running order status
      final validStatuses = StatusListModel.getValidRunningOrderStatuses();
      if (orderModel.orderStatus != null && validStatuses.contains(orderModel.orderStatus)) {
        _currentOrderList!.add(orderModel);
      } else {
        debugPrint('⚠️ acceptOrder: Order ${orderModel.id} has invalid status "${orderModel.orderStatus}" for running orders');
      }
      
      // Refresh assigned orders list to include the newly accepted order
      await getAssignedOrders();
      
      // Refresh completed orders to reflect status changes in My Orders page
      await getCompletedOrders(offset: 1, status: selectedMyOrderStatus ?? 'all', isUpdate: true);
      
      // Trigger route optimization after accepting order
      _optimizeRouteForActiveOrders();
      
      showCustomSnackBar('Order accepted successfully', isError: false);
    } else {
      showCustomSnackBar(responseModel.message, isError: true);
    }
    
    _isLoading = false;
    update();
    return responseModel.isSuccess;
  }

  // Optimize route for all active orders
  Future<void> _optimizeRouteForActiveOrders() async {
    try {
      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;
      
      if (profileModel != null && _currentOrderList != null && _currentOrderList!.isNotEmpty) {
        String? driverId = profileModel.id?.toString();
        if (driverId != null) {
          // Build stops from active orders (pickup + delivery for each)
          List<OptimizeStop> stops = [];
          for (var order in _currentOrderList!) {
            if (order.restaurantLat != null && order.restaurantLng != null) {
              stops.add(OptimizeStop(
                lat: double.parse(order.restaurantLat!),
                lng: double.parse(order.restaurantLng!),
                orderId: order.id.toString(),
              ));
            }
            if (order.deliveryAddress?.latitude != null && order.deliveryAddress?.longitude != null) {
              stops.add(OptimizeStop(
                lat: double.parse(order.deliveryAddress!.latitude!),
                lng: double.parse(order.deliveryAddress!.longitude!),
                orderId: order.id.toString(),
              ));
            }
          }
          
          if (stops.isNotEmpty) {
            // Import RouteController and optimize
            final routeController = Get.find<RouteController>();
            await routeController.optimizeRoute(driverId, stops);
          }
        }
      }
    } catch (e) {
      // Route optimization is non-critical, log and continue
      print('Could not optimize route: $e');
    }
  }

  void getIgnoreList() {
    _ignoredRequests = [];
    _ignoredRequests.addAll(orderServiceInterface.getIgnoreList());
  }

  void ignoreOrder(int index) {
    if (_latestOrderList != null && _latestOrderList!.isNotEmpty && index < _latestOrderList!.length) {
      _ignoredRequests.add(IgnoreModel(id: _latestOrderList![index].id, time: DateTime.now()));
      _latestOrderList!.removeAt(index);
    }
    orderServiceInterface.setIgnoreList(_ignoredRequests);
    update();
  }

  void removeFromIgnoreList() {
    List<IgnoreModel> tempList = [];
    tempList.addAll(_ignoredRequests);
    for(int index=0; index<tempList.length; index++) {
      if(Get.find<SplashController>().currentTime.difference(tempList[index].time!).inMinutes > 10) {
        tempList.removeAt(index);
      }
    }
    _ignoredRequests = [];
    _ignoredRequests.addAll(tempList);
    orderServiceInterface.setIgnoreList(_ignoredRequests);
  }

  Future<void> getCurrentLocation() async {
    Position currentPosition = await Geolocator.getCurrentPosition();
    if(!GetPlatform.isWeb) {
      try {
        List<Placemark> placeMarks = await placemarkFromCoordinates(currentPosition.latitude, currentPosition.longitude);
        _placeMark = placeMarks.first;
      }catch(_) {}
    }
    _position = currentPosition;
    update();
  }

  void setOtp(String otp) {
    _otp = otp;
    if(otp != '') {
      update();
    }
  }

}