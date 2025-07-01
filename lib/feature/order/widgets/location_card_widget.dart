import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/address_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_details_screen.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationCardWidget extends StatefulWidget {
  final OrderModel orderModel;
  final OrderController orderController;
  final int index;
  final Function onTap;
  const LocationCardWidget({super.key, required this.orderModel, required this.orderController, required this.index, required this.onTap});

  @override
  State<LocationCardWidget> createState() => _LocationCardWidgetState();
}

class _LocationCardWidgetState extends State<LocationCardWidget> {

  bool isExpanded = true;

  @override
  Widget build(BuildContext context) {

    double restaurantDistance = Get.find<AddressController>().getRestaurantDistance(
      LatLng(double.parse(widget.orderModel.restaurantLat!), double.parse(widget.orderModel.restaurantLng!)),
    );

    double restaurantToCustomerDistance = Get.find<AddressController>().getRestaurantDistance(
      LatLng(double.parse(widget.orderModel.restaurantLat!), double.parse(widget.orderModel.restaurantLng!)),
      customerLatLng: LatLng(double.parse(widget.orderModel.deliveryAddress?.latitude??'0'), double.parse(widget.orderModel.deliveryAddress?.longitude??'0')),
    );

    return InkWell(
      onTap: () {
        setState(() {
          isExpanded = !isExpanded;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(Dimensions.radiusLarge),
            topRight: Radius.circular(Dimensions.radiusLarge),
          ),
          boxShadow: [BoxShadow(color: Get.isDarkMode ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05), blurRadius: 20, spreadRadius: 0, offset: Offset(0, 5))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          Align(
            alignment: Alignment.center,
            child: Container(
              height: 5, width: 50,
              decoration: BoxDecoration(
                color: Theme.of(context).hintColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
              ),
            ),
          ),
          const SizedBox(height: Dimensions.paddingSizeDefault),

          Row(children: [

            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('amount_collect_from_customer'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
              SizedBox(height: Dimensions.paddingSizeExtraSmall - 2),

              widget.orderModel.paymentMethod == 'cash_on_delivery' ? Row(children: [

                (Get.find<SplashController>().configModel!.showDmEarning! && Get.find<ProfileController>().profileModel!.earnings == 1) ? Text(
                  PriceConverter.convertPrice(widget.orderModel.originalDeliveryCharge! + widget.orderModel.dmTips!),
                  style: robotoBold,
                ) : const SizedBox(),
                const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                Text(
                  '(${'cod'.tr})',
                  style: robotoRegular.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeLarge),
                ),

              ]) : Text('already_paid_digitally'.tr, style: robotoBold),
            ]),
            const Spacer(),

            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(
                DateConverter.getTimeDifference(widget.orderModel.createdAt!).split(' ')[0],
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, fontWeight: FontWeight.w600),
              ),

              Text(
                DateConverter.getTimeDifference(widget.orderModel.createdAt!).split(' ').sublist(1).join(' '),
                style: robotoRegular.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeSmall),
              ),
            ]),

          ]),
          SizedBox(height: isExpanded ? Dimensions.paddingSizeExtraLarge : 0),

          isExpanded ? Container(
            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
            decoration: BoxDecoration(
              color: Theme.of(context).hintColor.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
            ),
            child: SizedBox(
              height: 88,
              child: Row(children: [
                Column(children: [
                  Container(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall + 2),
                    decoration: BoxDecoration(
                      color: Theme.of(context).hintColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                    ),
                    child: Icon(Icons.my_location, color: Theme.of(context).hintColor, size: 16),
                  ),

                  Column(
                    children: List.generate(4, (index){
                      return Container(
                        margin: EdgeInsets.only(top: index == 0 ? 0 : 5),
                        color: Theme.of(context).hintColor.withValues(alpha: 0.5),
                        height: 3,
                        width: 1,
                      );
                    }),
                  ),

                  Container(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall + 2),
                    decoration: BoxDecoration(
                      color: Theme.of(context).hintColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                    ),
                    child: Transform.rotate(
                      angle: -0.9,
                      child: Icon(Icons.send_rounded, color: Theme.of(context).hintColor, size: 16),
                    ),
                  ),
                ]),
                const SizedBox(width: Dimensions.paddingSizeSmall),

                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(
                          child: Text(
                            'your_distance_from_restaurant'.tr,
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge?.color),
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                          ),
                        ),

                        Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                            border: Border.all(color: Theme.of(context).hintColor.withValues(alpha: 0.2)),
                          ),
                          padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
                          child: Text(
                            '${restaurantDistance > 1000 ? '1000+' : restaurantDistance.toStringAsFixed(2)} ${'km'.tr} ', maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                        ),
                      ]),
                    ]),
                    const SizedBox(height: 30),

                    Row(children: [
                      Expanded(
                        child: Text(
                          'restaurant_distance_to_customer'.tr,
                          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge?.color),
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeSmall),

                      Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                          border: Border.all(color: Theme.of(context).hintColor.withValues(alpha: 0.2)),
                        ),
                        padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
                        child: Text(
                          '${restaurantToCustomerDistance > 1000 ? '1000+' : restaurantToCustomerDistance.toStringAsFixed(2)} ${'km'.tr}', maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall),
                        ),
                      ),
                    ]),
                  ]),
                ),
              ]),
            ),
          ) : const SizedBox(),
          SizedBox(height: isExpanded ? 30 : 0),

          isExpanded ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: [

            Expanded(
              child: Row(children: [

                Expanded(
                  child: TextButton(
                    onPressed: () {
                      showCustomBottomSheet(
                        child: CustomConfirmationBottomSheet(
                          title: 'ignore_this_order'.tr,
                          description: 'are_you_sure_want_to_ignore_this_order'.tr,
                          confirmButtonText: 'ignore'.tr,
                          onConfirm: (){
                            widget.orderController.ignoreOrder(widget.index);
                            Get.back();
                            showCustomSnackBar('order_ignored'.tr, isError: false);
                          },
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      minimumSize: const Size(1170, 50), padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                        side: BorderSide(width: 1, color: Theme.of(context).hintColor),
                      ),
                    ),
                    child: Text('ignore'.tr, textAlign: TextAlign.center, style: robotoBold.copyWith(
                      color: Theme.of(context).textTheme.bodyLarge!.color,
                      fontSize: Dimensions.fontSizeLarge,
                    )),
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeDefault),

                Expanded(
                  child: CustomButtonWidget(
                    height: 50,
                    radius: Dimensions.radiusDefault,
                    buttonText: 'accept'.tr,
                    onPressed: (){
                      showCustomBottomSheet(
                        child: CustomConfirmationBottomSheet(
                          title: 'accept_this_order'.tr,
                          description: 'make_sure_your_availability_to_deliver_this_order_on_time_before_accept'.tr,
                          onConfirm: (){
                            widget.orderController.acceptOrder(widget.orderModel.id, widget.index, widget.orderModel).then((isSuccess) {
                              if(isSuccess) {
                                widget.onTap();
                                widget.orderModel.orderStatus = (widget.orderModel.orderStatus == 'pending' || widget.orderModel.orderStatus == 'confirmed') ? 'accepted' : widget.orderModel.orderStatus;
                                Get.back();
                                Get.toNamed(
                                  RouteHelper.getOrderDetailsRoute(widget.orderModel.id),
                                  arguments: OrderDetailsScreen(
                                    orderId: widget.orderModel.id, isRunningOrder: true, orderIndex: widget.orderController.currentOrderList!.length-1,
                                  ),
                                );
                              }else {
                                widget.orderController.getLatestOrders();
                              }
                            });
                          },
                        ),
                      );
                    },
                  ),
                ),

              ]),
            ),

          ]) : const SizedBox(),
        ]),
      ),
    );
  }
}