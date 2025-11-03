import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/ignore_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_cancellation_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_details_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
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
    List<CancellationData>? orderCancelReasons = await orderServiceInterface.getCancelReasons();
    if (orderCancelReasons != null) {
      _orderCancelReasons = [];
      _orderCancelReasons!.addAll(orderCancelReasons);
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
          _completedOrderCountList = [
            paginatedOrderModel.orderCount!.all ?? 0,
            paginatedOrderModel.orderCount!.delivered ?? 0,
            paginatedOrderModel.orderCount!.canceled ?? 0,
            paginatedOrderModel.orderCount!.refundRequested ?? 0,
            paginatedOrderModel.orderCount!.refunded ?? 0,
            paginatedOrderModel.orderCount!.refundRequestCanceled ?? 0,
          ];
          _pageSize = paginatedOrderModel.totalSize;
          _paginate = false;
          update();
        } else {
          // Use empty list when API returns null
          if (offset == 1) {
            _completedOrderList = [];
            _completedOrderCountList = [0, 0, 0, 0, 0, 0];
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
          _completedOrderCountList = [0, 0, 0, 0, 0, 0];
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
    }
    try {
      PaginatedOrderModel? paginatedOrderModel = await orderServiceInterface.getCurrentOrders(status: status);
      if(paginatedOrderModel != null && paginatedOrderModel.orders != null) {
        _currentOrderList = [];
        _currentOrderList!.addAll(paginatedOrderModel.orders!);
        _currentOrderCountList = [
          paginatedOrderModel.orderCount?.all ?? 0,
          paginatedOrderModel.orderCount?.accepted ?? 0,
          paginatedOrderModel.orderCount?.confirmed ?? 0,
          paginatedOrderModel.orderCount?.processing ?? 0,
          paginatedOrderModel.orderCount?.handover ?? 0,
          paginatedOrderModel.orderCount?.pickedUp ?? 0,
          paginatedOrderModel.orderCount?.delivered ?? 0,
          paginatedOrderModel.orderCount?.canceled ?? 0,
        ];
      } else {
        // Use empty list when API returns null
        _currentOrderList = [];
        _currentOrderCountList = [0, 0, 0, 0, 0, 0, 0, 0];
      }
    } catch (e) {
      debugPrint('Error fetching current orders: $e');
      // Use empty list on error
      _currentOrderList = [];
      _currentOrderCountList = [0, 0, 0, 0, 0, 0, 0, 0];
    }
    update();
  }

  Future<void> getOrderWithId(int? orderId) async {
    OrderModel? orderModel = await orderServiceInterface.getOrderWithId(orderId);
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

  Future<bool> updateOrderStatus(int? orderId, String status, {bool back = false,  String? reason}) async {
    _isLoading = true;
    update();
    List<MultipartBody> multiParts = orderServiceInterface.prepareOrderProofImages(_pickedPrescriptions);
    UpdateStatusBody updateStatusBody = UpdateStatusBody(
      orderId: orderId, status: status,
      otp: status == 'delivered' ? _otp : null, reason: reason,
    );
    ResponseModel responseModel = await orderServiceInterface.updateOrderStatus(updateStatusBody, multiParts);
    Get.back(result: responseModel.isSuccess);
    if(responseModel.isSuccess) {
      if(back) {
        Get.back();
      }
      getCurrentOrders(status: selectedRunningOrderStatus ?? 'all');
      showCustomSnackBar(responseModel.message, isError: false);
    }else {
      showCustomSnackBar(responseModel.message, isError: true);
    }
    _isLoading = false;
    update();
    return responseModel.isSuccess;
  }

  Future<void> getOrderDetails(int? orderID) async {
    _orderDetailsModel = null;
    List<OrderDetailsModel>? orderDetailsModel = await orderServiceInterface.getOrderDetails(orderID);
    if(orderDetailsModel != null) {
      _orderDetailsModel = [];
      _orderDetailsModel!.addAll(orderDetailsModel);
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
    
    ResponseModel responseModel = await orderServiceInterface.acceptOrder(orderID);
    Get.back();
    
    if(responseModel.isSuccess) {
      if (_latestOrderList != null && _latestOrderList!.isNotEmpty && index < _latestOrderList!.length) {
        _latestOrderList!.removeAt(index);
      }
      if (_currentOrderList == null) {
        _currentOrderList = [];
      }
      _currentOrderList!.add(orderModel);
      
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