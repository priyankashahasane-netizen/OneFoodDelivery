import 'dart:math';
import 'dart:ui';
import 'dart:collection';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/controllers/theme_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/location_card_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class OrderLocationScreen extends StatefulWidget {
  final OrderModel orderModel;
  final OrderController orderController;
  final int index;
  final Function onTap;
  const OrderLocationScreen({super.key, required this.orderModel, required this.orderController, required this.index, required this.onTap});

  @override
  State<OrderLocationScreen> createState() => _OrderLocationScreenState();
}

class _OrderLocationScreenState extends State<OrderLocationScreen> {

  final MapController _mapController = MapController();
  final List<Marker> _markers = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(title: 'order_location'.tr),

      body: Stack(children: [

        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: ll.LatLng(
              double.parse(widget.orderModel.deliveryAddress?.latitude ?? '0'),
              double.parse(widget.orderModel.deliveryAddress?.longitude ?? '0'),
            ),
            initialZoom: 16,
          ),
          children: [
            TileLayer(urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: const ['a','b','c']),
            MarkerLayer(markers: _markers),
          ],
        ),

        Positioned(
          bottom: 0, left: 0, right: 0,
          child: LocationCardWidget(
            orderModel: widget.orderModel, orderController: widget.orderController,
            onTap: widget.onTap, index: widget.index,
          ),
        ),

      ]),
    );
  }

  void _setMarker(OrderModel orderModel) async {
    try {
      Uint8List restaurantImageData = await _convertAssetToUnit8List(Images.restaurantMarker, width: 100);
      Uint8List deliveryBoyImageData = await _convertAssetToUnit8List(Images.yourMarker, width: 100);
      Uint8List destinationImageData = await _convertAssetToUnit8List(Images.customerMarker, width: 100);

      LatLngBounds? bounds;
      double deliveryLat = double.parse(orderModel.deliveryAddress?.latitude ?? '0');
      double deliveryLng = double.parse(orderModel.deliveryAddress?.longitude ?? '0');
      double restaurantLat = double.parse(orderModel.restaurantLat ?? '0');
      double restaurantLng = double.parse(orderModel.restaurantLng ?? '0');
      double deliveryManLat = Get.find<ProfileController>().recordLocationBody?.latitude ?? 0;
      double deliveryManLng = Get.find<ProfileController>().recordLocationBody?.longitude ?? 0;

      // Determine bounds based on locations
      final minLat = min(deliveryLat, min(restaurantLat, deliveryManLat));
      final minLng = min(deliveryLng, min(restaurantLng, deliveryManLng));
      final maxLat = max(deliveryLat, max(restaurantLat, deliveryManLat));
      final maxLng = max(deliveryLng, max(restaurantLng, deliveryManLng));
      
      bounds = LatLngBounds(
        ll.LatLng(minLat, minLng),
        ll.LatLng(maxLat, maxLng),
      );

      ll.LatLng centerBounds = ll.LatLng(
        (bounds.northEast.latitude + bounds.southWest.latitude) / 2,
        (bounds.northEast.longitude + bounds.southWest.longitude) / 2,
      );

      if (kDebugMode) {
        print('center bound $centerBounds');
      }

      // Zoom to fit bounds
      _mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)));

      // Clear previous markers
      _markers.clear();

      // Add destination marker (delivery address)
      if (orderModel.deliveryAddress != null) {
        _markers.add(Marker(
          point: ll.LatLng(deliveryLat, deliveryLng),
          width: 40,
          height: 40,
          child: Image.memory(destinationImageData, width: 40, height: 40),
        ));
      }

      // Add restaurant marker
      if (orderModel.restaurantLat != null && orderModel.restaurantLng != null) {
        _markers.add(Marker(
          point: ll.LatLng(restaurantLat, restaurantLng),
          width: 40,
          height: 40,
          child: Image.memory(restaurantImageData, width: 40, height: 40),
        ));
      }

      // Add delivery boy marker
      if (Get.find<ProfileController>().recordLocationBody != null) {
        _markers.add(Marker(
          point: ll.LatLng(deliveryManLat, deliveryManLng),
          width: 40,
          height: 40,
          child: Image.memory(deliveryBoyImageData, width: 40, height: 40),
        ));
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error setting markers: $e');
      }
    }
    setState(() {});
  }

  Future<Uint8List> _convertAssetToUnit8List(String imagePath, {int width = 50}) async {
    ByteData data = await rootBundle.load(imagePath);
    Codec codec = await instantiateImageCodec(data.buffer.asUint8List(), targetWidth: width);
    FrameInfo fi = await codec.getNextFrame();
    return (await fi.image.toByteData(format: ImageByteFormat.png))!.buffer.asUint8List();
  }

}