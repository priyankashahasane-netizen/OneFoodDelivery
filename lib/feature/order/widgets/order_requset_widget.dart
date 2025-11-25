import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/address_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_location_screen.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/string_extensions.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class OrderRequestWidget extends StatefulWidget {
  final OrderModel orderModel;
  final int index;
  final bool fromDetailsPage;
  final Function onTap;
  final bool isAssigned;
  const OrderRequestWidget({super.key, required this.orderModel, required this.index, required this.onTap, this.fromDetailsPage = false, this.isAssigned = false});

  @override
  State<OrderRequestWidget> createState() => _OrderRequestWidgetState();
}

class _OrderRequestWidgetState extends State<OrderRequestWidget> {
  // Cache distance calculation to avoid recalculating on every rebuild
  double? _cachedDistance;

  double get _distance {
    if (_cachedDistance == null) {
      _cachedDistance = Get.find<AddressController>().getRestaurantDistance(
        LatLng(double.parse(widget.orderModel.restaurantLat!), double.parse(widget.orderModel.restaurantLng!)),
      );
    }
    return _cachedDistance!;
  }

  @override
  Widget build(BuildContext context) {

    double distance = _distance;

    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
        border: widget.orderModel.orderType?.toLowerCase() == 'subscription'
            ? Border.all(color: Colors.orange, width: 2.0)
            : Border.all(color: Theme.of(context).hintColor.withValues(alpha: 0.2), width: 1.5),
      ),
      child: GetBuilder<OrderController>(builder: (orderController) {
        return Column(children: [

          Padding(
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            child: Column(children: [

              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [

                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).hintColor.withValues(alpha: 0.2), width: 1.5),
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: CustomImageWidget(
                      image: widget.orderModel.restaurantLogoFullUrl ?? '',
                      height: 45, width: 45, fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeSmall),

                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                  Text(
                    widget.orderModel.restaurantName ?? 'no_restaurant_data_found'.tr, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                  Text(
                    '${widget.orderModel.detailsCount} ${widget.orderModel.detailsCount! > 1 ? 'items'.tr : 'item'.tr}',
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).primaryColor),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                  Text(
                    widget.orderModel.restaurantAddress ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor),
                  ),

                ])),

                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [

                  Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(
                      DateConverter.getTimeDifference(widget.orderModel.createdAt!).split(' ')[0],
                      style: robotoMedium.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                    Text(
                      DateConverter.getTimeDifference(widget.orderModel.createdAt!).split(' ').sublist(1).join(' '),
                      style: robotoRegular.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeSmall),
                    ),
                  ]),
                  const SizedBox(height: Dimensions.paddingSizeSmall),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall + 2),
                    decoration: BoxDecoration(
                      color: Theme.of(context).hintColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                    ),
                    child: Row(children: [

                      (Get.find<SplashController>().configModel!.showDmEarning! && Get.find<ProfileController>().profileModel!.earnings == 1) ? Text(
                        PriceConverter.convertPrice(widget.orderModel.originalDeliveryCharge! + widget.orderModel.dmTips!),
                        style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                      ) : const SizedBox(),
                      const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                      Text(
                        widget.orderModel.paymentMethod == 'cash_on_delivery' ? 'cod'.tr : 'digitally_paid'.tr,
                        style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                      ),

                    ]),
                  ),
                  // Order type display
                  const SizedBox(height: 4),
                  Text(
                    (widget.orderModel.orderType?.toLowerCase().trim() == 'subscription')
                        ? 'Subscription'
                        : (widget.orderModel.orderType?.toLowerCase().trim() == 'regular')
                            ? 'Regular'
                            : widget.orderModel.orderType?.toTitleCase() ?? 'Regular',
                    style: robotoRegular.copyWith(
                      fontSize: 10,
                      color: (widget.orderModel.orderType?.toLowerCase().trim() == 'subscription')
                          ? Colors.orange
                          : Theme.of(context).hintColor,
                    ),
                  ),
                ]),
              ]),

              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 1,
                  margin: const EdgeInsets.only(left: Dimensions.paddingSizeLarge + 4),
                  child: ListView.builder(
                    itemCount: 4,
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    itemBuilder: (context, index) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeExtraSmall),
                        height: 5, width: 1, color: Theme.of(context).hintColor.withValues(alpha: 0.5),
                      );
                    },
                  ),
                ),
              ),

              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [

                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).hintColor.withValues(alpha: 0.2), width: 1.5),
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: CustomImageWidget(
                      image: widget.orderModel.customer?.imageFullUrl ?? '',
                      height: 45, width: 45, fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: Dimensions.paddingSizeSmall),

                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                  Text(
                    'deliver_to'.tr, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                  ),
                  const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                  Text(
                    widget.orderModel.deliveryAddress?.address ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor),
                  ),

                ])),

                InkWell(
                  onTap: () => Get.to(()=> OrderLocationScreen(orderModel: widget.orderModel, orderController: orderController, index: widget.index, onTap: widget.onTap,)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraSmall),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      border: Border.all(color: Theme.of(context).primaryColor, width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CustomAssetImageWidget(
                          image: Images.locationIcon, height: 14, width: 14,
                          fit: BoxFit.contain,
                          color: Theme.of(context).primaryColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'view_map'.tr,
                          style: robotoMedium.copyWith(
                            color: Theme.of(context).primaryColor, 
                            fontSize: Dimensions.fontSizeSmall,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),

            ]),
          ),
          const SizedBox(height: Dimensions.paddingSizeSmall),

          Container(
            height: 80,
            decoration: BoxDecoration(
              color: Theme.of(context).disabledColor.withValues(alpha: 0.15),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(Dimensions.radiusDefault))
            ),
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            margin: const EdgeInsets.all(0.2),
            child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [

                  Expanded(
                    flex: 2,
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [

                      Text(
                        'restaurant_is'.tr, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                      Text(
                       '${distance > 1000 ? '1000+' : distance.toStringAsFixed(2)} ${'km_away_from_you'.tr}', maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall),
                      ),

                    ]),
                  ),
                  const SizedBox(width: Dimensions.paddingSizeSmall),

                  Expanded(
                    flex: 3,
                    child: Row(children: [
                      // For assigned orders, show Reject button; for available orders, show Ignore button
                      Expanded(
                        child: widget.isAssigned ? TextButton(
                      onPressed: () {
                        showCustomBottomSheet(
                          child: CustomConfirmationBottomSheet(
                            title: 'reject_this_order'.tr,
                            description: 'are_you_sure_want_to_reject_this_order'.tr,
                            confirmButtonText: 'reject'.tr,
                            onConfirm: (){
                              // Close the bottom sheet immediately when user confirms
                              try {
                                Get.back();
                              } catch (_) {
                                // Bottom sheet already closed, ignore
                              }
                              
                              orderController.rejectOrder(widget.orderModel.id, widget.index).then((isSuccess) {
                                if(isSuccess) {
                                  // Refresh assigned orders list
                                  orderController.getAssignedOrders();
                                }
                              });
                            },
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        minimumSize: const Size(1170, 45), padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          side: BorderSide(width: 1, color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                      child: Text('reject'.tr, textAlign: TextAlign.center, style: robotoBold.copyWith(
                        color: Theme.of(context).colorScheme.error,
                        fontSize: Dimensions.fontSizeLarge,
                      )),
                    ) : TextButton(
                      onPressed: () {
                        showCustomBottomSheet(
                          child: CustomConfirmationBottomSheet(
                            title: 'ignore_this_order'.tr,
                            description: 'are_you_sure_want_to_ignore_this_order'.tr,
                            confirmButtonText: 'ignore'.tr,
                            onConfirm: (){
                              // Close the bottom sheet immediately when user confirms
                              try {
                                Get.back();
                              } catch (_) {
                                // Bottom sheet already closed, ignore
                              }
                              
                              orderController.ignoreOrder(widget.index);
                              showCustomSnackBar('order_ignored'.tr, isError: false);
                            },
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        minimumSize: const Size(1170, 45), padding: EdgeInsets.zero,
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
                  const SizedBox(width: Dimensions.paddingSizeSmall + 2),

                  Expanded(
                    child: CustomButtonWidget(
                      height: 45,
                      radius: Dimensions.radiusDefault,
                      buttonText: 'accept'.tr,
                      onPressed: (){
                        showCustomBottomSheet(
                          child: CustomConfirmationBottomSheet(
                            title: 'accept_this_order'.tr,
                            description: 'make_sure_your_availability_to_deliver_this_order_on_time_before_accept'.tr,
                            onConfirm: () async {
                              // Close the bottom sheet immediately when user confirms
                              try {
                                Get.back();
                              } catch (_) {
                                // Bottom sheet already closed, ignore
                              }
                              
                              if (widget.isAssigned) {
                                // For assigned orders, update status to "accepted"
                                try {
                                  // Use UUID if available, otherwise use numeric ID
                                  String? orderIdToUse = widget.orderModel.uuid ?? widget.orderModel.id?.toString();
                                  bool isSuccess = await orderController.acceptAssignedOrder(widget.orderModel.id, widget.index, orderIdToUse);
                                  if(isSuccess) {
                                    widget.onTap();
                                    // Update order status locally
                                    widget.orderModel.orderStatus = 'accepted';
                                    // Navigate to order map page
                                    Get.to(() => OrderLocationScreen(
                                      orderModel: widget.orderModel,
                                      orderController: orderController,
                                      index: orderController.currentOrderList?.length ?? 0,
                                      onTap: widget.onTap,
                                    ));
                                  }
                                } catch (e) {
                                  debugPrint('Error accepting assigned order: $e');
                                }
                              } else {
                                // For available orders, use existing flow
                                try {
                                  bool isSuccess = await orderController.acceptOrder(widget.orderModel.id, widget.index, widget.orderModel);
                                  if(isSuccess) {
                                    widget.onTap();
                                    widget.orderModel.orderStatus = (widget.orderModel.orderStatus == 'pending' || widget.orderModel.orderStatus == 'confirmed') ? 'accepted' : widget.orderModel.orderStatus;
                                    // Navigate to order map page
                                    Get.to(() => OrderLocationScreen(
                                      orderModel: widget.orderModel,
                                      orderController: orderController,
                                      index: orderController.currentOrderList?.length ?? 0,
                                      onTap: widget.onTap,
                                    ));
                                  } else {
                                    orderController.getLatestOrders();
                                  }
                                } catch (e) {
                                  debugPrint('Error accepting order: $e');
                                }
                              }
                            },
                          ),
                        );
                      },
                    ),
                  ),

                ]),
              ),

            ]),
          ),

        ]);
      }),
    );
  }
}