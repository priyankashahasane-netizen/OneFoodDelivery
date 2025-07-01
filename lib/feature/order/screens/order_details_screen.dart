import 'dart:async';
import 'dart:io';
import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_card.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_tool_tip_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/details_custom_card.dart';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/controllers/notification_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/divider_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_details_shimmer.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/conversation_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_details_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/camera_button_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/cancellation_dialogue_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/collect_money_delivery_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/dialogue_image_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/info_card_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/order_product_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/slider_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/widgets/verify_delivery_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/responsive_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/helper/string_extensions.dart';
import 'package:stackfood_multivendor_driver/util/color_resources.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:photo_view/photo_view.dart';

class OrderDetailsScreen extends StatefulWidget {
  final int? orderId;
  final bool? isRunningOrder;
  final int? orderIndex;
  final bool fromNotification;
  final String? orderStatus;
  const OrderDetailsScreen({super.key, required this.orderId, required this.isRunningOrder, required this.orderIndex, this.fromNotification = false, this.orderStatus});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {

  Timer? _timer;
  int? orderPosition;

  void _startApiCalling(){
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      Get.find<OrderController>().getOrderWithId(Get.find<OrderController>().orderModel!.id);
    });
  }

  Future<void> _loadData() async {
    Get.find<OrderController>().pickPrescriptionImage(isRemove: true, isCamera: false);
    if(Get.find<OrderController>().showDeliveryImageField){
      Get.find<OrderController>().changeDeliveryImageStatus(isUpdate: false);
    }
    if(widget.orderIndex == null){
      await Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus!);
      for(int index=0; index<Get.find<OrderController>().currentOrderList!.length; index++) {
        if(Get.find<OrderController>().currentOrderList![index].id == widget.orderId){
          orderPosition = index;
          break;
        }
      }
    }
    Get.find<OrderController>().getOrderWithId(widget.orderId);
    Get.find<OrderController>().getOrderDetails(widget.orderId);
  }

  @override
  void initState() {
    super.initState();

    orderPosition = widget.orderIndex;

    _loadData();
    _startApiCalling();
  }

  @override
  void dispose() {
    super.dispose();
    _timer?.cancel();
  }
  @override
  Widget build(BuildContext context) {

    bool? cancelPermission = Get.find<SplashController>().configModel!.canceledByDeliveryman;
    bool selfDelivery = Get.find<ProfileController>().profileModel!.type != 'zone_wise';

    return PopScope(
      canPop: Navigator.canPop(context),
      onPopInvokedWithResult: (didPop, result) {
        if(widget.fromNotification) {
          Get.offAllNamed(RouteHelper.getInitialRoute());
        }else {
          return;
        }
      },
      child: GetBuilder<OrderController>(builder: (orderController) {
        return Scaffold(
          appBar: AppBar(
            title: Column(children: [
              Text(
                '${'order'.tr} #${widget.orderId}',
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge!.color),
              ),

              Text(
                '${'order_is'.tr} ${orderController.orderModel?.orderStatus?.tr ?? ''}',
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
              ),
            ]),
            centerTitle: true,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios),
              color: Theme.of(context).textTheme.bodyLarge!.color,
              onPressed: (){
                if(widget.fromNotification) {
                  Get.offAllNamed(RouteHelper.getInitialRoute());
                } else {
                  Get.back();
                }
              },
            ),
            backgroundColor: Theme.of(context).cardColor,
            surfaceTintColor: Theme.of(context).cardColor,
            shadowColor: Theme.of(context).hintColor.withValues(alpha: 0.5),
            elevation: 2,
          ),

          body: Padding(
            padding: const EdgeInsets.all(0),
            child: GetBuilder<OrderController>(builder: (orderController) {

              OrderModel? controllerOrderModel = orderController.orderModel;

              bool restConfModel = Get.find<SplashController>().configModel!.orderConfirmationModel != 'deliveryman';

              late bool showBottomView;
              late bool showSlider;
              bool showDeliveryConfirmImage = orderController.showDeliveryImageField && Get.find<SplashController>().configModel!.dmPictureUploadStatus!;

              double? deliveryCharge = 0;
              double itemsPrice = 0;
              double? discount = 0;
              double? couponDiscount = 0;
              double? dmTips = 0;
              double? tax = 0;
              bool? taxIncluded = false;
              double addOns = 0;
              double additionalCharge = 0;
              double extraPackagingAmount = 0;
              double referrerBonusAmount = 0;
              OrderModel? order = controllerOrderModel;

              if(order != null && orderController.orderDetailsModel != null ) {

                if(order.orderType == 'delivery') {
                  deliveryCharge = order.deliveryCharge;
                  dmTips = order.dmTips;
                }
                discount = order.restaurantDiscountAmount;
                tax = order.totalTaxAmount;
                taxIncluded = order.taxStatus;
                couponDiscount = order.couponDiscountAmount;
                additionalCharge = order.additionalCharge!;
                extraPackagingAmount = order.extraPackagingAmount!;
                referrerBonusAmount = order.referrerBonusAmount!;
                for(OrderDetailsModel orderDetails in orderController.orderDetailsModel!) {
                  for(AddOn addOn in orderDetails.addOns!) {
                    addOns = addOns + (addOn.price! * addOn.quantity!);
                  }
                  itemsPrice = itemsPrice + (orderDetails.price! * orderDetails.quantity!);
                }
              }
              //double subTotal = itemsPrice + addOns;
              double total = itemsPrice + addOns - discount! + (taxIncluded! ? 0 : tax!) + deliveryCharge! - couponDiscount! + dmTips! + additionalCharge + extraPackagingAmount - referrerBonusAmount;

              if(controllerOrderModel != null){
                showBottomView = controllerOrderModel.orderStatus == 'accepted' || controllerOrderModel.orderStatus == 'confirmed'
                    || controllerOrderModel.orderStatus == 'processing' || controllerOrderModel.orderStatus == 'handover'
                    || controllerOrderModel.orderStatus == 'picked_up' || (widget.isRunningOrder ?? true);
                showSlider = (controllerOrderModel.paymentMethod == 'cash_on_delivery' && controllerOrderModel.orderStatus == 'accepted' && !restConfModel && !selfDelivery)
                    || controllerOrderModel.orderStatus == 'handover' || controllerOrderModel.orderStatus == 'picked_up';
              }

              return (orderController.orderDetailsModel != null && controllerOrderModel != null && order != null) ? Column(children: [

                Expanded(child: SingleChildScrollView(
                  child: Column(children: [

                    DateConverter.isBeforeTime(controllerOrderModel.scheduleAt) ? (controllerOrderModel.orderStatus != 'handover' && controllerOrderModel.orderStatus != 'delivered'
                    && controllerOrderModel.orderStatus != 'failed' && controllerOrderModel.orderStatus != 'canceled' && controllerOrderModel.orderStatus != 'refund_requested' && controllerOrderModel.orderStatus != 'our_for_delivery'
                    && controllerOrderModel.orderStatus != 'refunded' && controllerOrderModel.orderStatus != 'refund_request_canceled') ? Column(children: [

                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      CustomAssetImageWidget(
                        image: Images.cooking,
                        height: 140, width: 140, fit: BoxFit.contain,
                      ),
                      const SizedBox(height: Dimensions.paddingSizeDefault),

                      Text('food_need_to_deliver_within'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault, color: Theme.of(context).hintColor)),
                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                      Center(
                        child: Row(mainAxisSize: MainAxisSize.min, children: [

                          Text(
                            DateConverter.differenceInMinute(controllerOrderModel.restaurantDeliveryTime, controllerOrderModel.createdAt, controllerOrderModel.processingTime, controllerOrderModel.scheduleAt) < 5 ? '1 - 5'
                            : '${DateConverter.differenceInMinute(controllerOrderModel.restaurantDeliveryTime, controllerOrderModel.createdAt, controllerOrderModel.processingTime, controllerOrderModel.scheduleAt)-5} '
                            '- ${DateConverter.differenceInMinute(controllerOrderModel.restaurantDeliveryTime, controllerOrderModel.createdAt, controllerOrderModel.processingTime, controllerOrderModel.scheduleAt)}',
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge),
                          ),
                          const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                          Text('min'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor)),

                        ]),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeExtraLarge),

                    ]) : const SizedBox() : const SizedBox(),

                    controllerOrderModel.bringChangeAmount != null && controllerOrderModel.bringChangeAmount! > 0 ? Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                      decoration: BoxDecoration(
                        color: const Color(0XFF009AF1).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      ),
                      child: RichText(
                        text: TextSpan(children: [
                          TextSpan(text: 'please_bring'.tr, style: robotoRegular.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color)),
                          TextSpan(text: ' ${PriceConverter.convertPrice(controllerOrderModel.bringChangeAmount)}', style: robotoMedium.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color)),
                          TextSpan(text: ' ${'in_change_for_the_customer_when_making_the_delivery'.tr}', style: robotoRegular.copyWith(color: Theme.of(context).textTheme.bodyLarge?.color)),
                        ]),
                      ),
                    ) : const SizedBox(),
                    DividerWidget(height: controllerOrderModel.bringChangeAmount != null && controllerOrderModel.bringChangeAmount! > 0 ? Dimensions.paddingSizeSmall : 0),

                    InfoCardWidget(
                      title: 'customer_contact_details'.tr, addressModel: controllerOrderModel.deliveryAddress, isDelivery: true,
                      image: controllerOrderModel.customer != null ? '${controllerOrderModel.customer!.imageFullUrl}' : '',
                      name: controllerOrderModel.deliveryAddress!.contactPersonName, phone: controllerOrderModel.deliveryAddress!.contactPersonNumber,
                      latitude: controllerOrderModel.deliveryAddress!.latitude, longitude: controllerOrderModel.deliveryAddress!.longitude,
                      showButton: (controllerOrderModel.orderStatus != 'delivered' && controllerOrderModel.orderStatus != 'failed' && controllerOrderModel.orderStatus != 'canceled'),
                      orderModel: controllerOrderModel,
                      messageOnTap: () async {
                        if(controllerOrderModel.customer != null){
                          _timer?.cancel();
                          await Get.toNamed(RouteHelper.getChatRoute(
                            notificationBody: NotificationBodyModel(
                              orderId: controllerOrderModel.id, customerId: controllerOrderModel.customer!.id,
                            ),
                            user: User(
                              id: controllerOrderModel.customer!.id, fName: controllerOrderModel.customer!.fName,
                              lName: controllerOrderModel.customer!.lName, imageFullUrl: controllerOrderModel.customer!.imageFullUrl,
                            ),
                          ));
                          _startApiCalling();
                        }else{
                          showCustomSnackBar('customer_not_found'.tr);
                        }
                      },
                    ),
                    DividerWidget(),

                    InfoCardWidget(
                      isRestaurant: true,
                      title: 'restaurant_details'.tr, addressModel: DeliveryAddress(address: controllerOrderModel.restaurantAddress),
                      image: '${controllerOrderModel.restaurantLogoFullUrl}',
                      name: controllerOrderModel.restaurantName, phone: controllerOrderModel.restaurantPhone,
                      latitude: controllerOrderModel.restaurantLat, longitude: controllerOrderModel.restaurantLng,
                      showButton: (controllerOrderModel.orderStatus != 'delivered' && controllerOrderModel.orderStatus != 'failed' && controllerOrderModel.orderStatus != 'canceled'),
                      orderModel: controllerOrderModel,
                      messageOnTap: () async {
                        if(controllerOrderModel.restaurantModel != 'commission' && controllerOrderModel.chatPermission == 0){
                          showCustomSnackBar('restaurant_have_no_chat_permission'.tr);
                        }else{
                          _timer?.cancel();
                          await Get.toNamed(RouteHelper.getChatRoute(
                            notificationBody: NotificationBodyModel(
                              orderId: controllerOrderModel.id, vendorId: controllerOrderModel.vendorId,
                            ),
                            user: User(
                              id: controllerOrderModel.vendorId, fName: controllerOrderModel.restaurantName,
                              imageFullUrl: controllerOrderModel.restaurantLogoFullUrl,
                            ),
                          ));
                          _startApiCalling();
                        }
                      },
                    ),
                    DividerWidget(),

                    DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(children: [

                        Row(children: [

                          Text('item_info'.tr,  style: robotoBold),
                          const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                          Text(
                            '(${orderController.orderDetailsModel!.length.toString()})',
                            style: robotoRegular.copyWith(color: Theme.of(context).hintColor),
                          ),

                        ]),
                        SizedBox(height: Dimensions.paddingSizeSmall),

                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: orderController.orderDetailsModel!.length,
                          itemBuilder: (context, index) {
                            return OrderProductWidgetWidget(order: controllerOrderModel, orderDetails: orderController.orderDetailsModel![index], showDivider: index != orderController.orderDetailsModel!.length - 1);
                          },
                        ),

                      ]),
                    ),
                    DividerWidget(),

                    (controllerOrderModel.cutlery != null) ? DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Row(children: [

                        Text('${'cutlery'.tr}: ', style: robotoBold),
                        const Expanded(child: SizedBox()),

                        Text(
                          controllerOrderModel.cutlery! ? 'yes'.tr : 'no'.tr,
                          style: robotoRegular,
                        ),

                      ]),
                    ) : const SizedBox(),
                    DividerWidget(height: (controllerOrderModel.cutlery != null) ? Dimensions.paddingSizeSmall : 0),

                    controllerOrderModel.unavailableItemNote != null ? DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        Text('unavailable_item_note'.tr, style: robotoBold),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraLarge),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall + 2),
                            color: Theme.of(context).hintColor.withValues(alpha: 0.1),
                          ),
                          child: Text(
                            controllerOrderModel.unavailableItemNote!.tr,
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                        ),

                      ]),
                    ): const SizedBox(),
                    DividerWidget(height: controllerOrderModel.unavailableItemNote != null ? Dimensions.paddingSizeSmall : 0),

                    controllerOrderModel.deliveryInstruction != null ? DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        Text('delivery_instruction'.tr, style: robotoBold),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraLarge),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall + 2),
                            color: Theme.of(context).hintColor.withValues(alpha: 0.1),
                          ),
                          child: Text(
                            controllerOrderModel.deliveryInstruction!.tr,
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                        ),

                      ]),
                    ): const SizedBox(),
                    DividerWidget(height: controllerOrderModel.deliveryInstruction != null ? Dimensions.paddingSizeSmall : 0),

                    (controllerOrderModel.orderNote  != null && controllerOrderModel.orderNote!.isNotEmpty) ? DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        Text('additional_note'.tr, style: robotoBold),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: Dimensions.paddingSizeExtraLarge),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(Dimensions.radiusSmall + 2),
                            color: Theme.of(context).hintColor.withValues(alpha: 0.1),
                          ),
                          child: Text(
                            controllerOrderModel.orderNote!.tr,
                            style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall),
                          ),
                        ),

                      ]),
                    ) : const SizedBox(),
                    DividerWidget(height: (controllerOrderModel.orderNote  != null && controllerOrderModel.orderNote!.isNotEmpty) ? Dimensions.paddingSizeSmall : 0),

                    (controllerOrderModel.orderStatus == 'delivered' && controllerOrderModel.orderProofFullUrl != null && controllerOrderModel.orderProofFullUrl!.isNotEmpty) ? DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        Text('order_proof'.tr, style: robotoBold),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        GridView.builder(
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            childAspectRatio: 1.5,
                            crossAxisCount: ResponsiveHelper.isTab(context) ? 5 : 3,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 5,
                          ),
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: controllerOrderModel.orderProofFullUrl!.length,
                          itemBuilder: (BuildContext context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: InkWell(
                                onTap: () => openDialog(context, controllerOrderModel.orderProofFullUrl![index]),
                                child: Center(child: ClipRRect(
                                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                                  child: CustomImageWidget(
                                    image: controllerOrderModel.orderProofFullUrl![index],
                                    width: 100, height: 100,
                                  ),
                                )),
                              ),
                            );
                          },
                        ),

                      ]),
                    ) : const SizedBox(),
                    DividerWidget(height: (controllerOrderModel.orderStatus == 'delivered' && controllerOrderModel.orderProofFullUrl != null && controllerOrderModel.orderProofFullUrl!.isNotEmpty) ? Dimensions.paddingSizeSmall : 0),

                    DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(children: [

                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('payment_method'.tr, style: robotoBold),

                          Text(
                            controllerOrderModel.paymentStatus!.toTitleCase(),
                            style: robotoRegular.copyWith(
                              color: controllerOrderModel.paymentStatus == 'paid' ? ColorResources.green : controllerOrderModel.paymentStatus == 'unpaid' ? ColorResources.red : Theme.of(context).primaryColor,
                            ),
                          ),
                        ]),
                        Divider(height: 30, color: Theme.of(context).hintColor.withValues(alpha: 0.3)),

                        controllerOrderModel.paymentMethod == 'cash_on_delivery' ? Row(children: [
                          CustomAssetImageWidget(image: Images.cashIcon, height: 25, width: 25),
                          const SizedBox(width: Dimensions.paddingSizeSmall),

                          Text('cash'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
                        ]) : (controllerOrderModel.paymentMethod == 'wallet' || order.paymentMethod == 'partial_payment') ? Row(children: [
                          CustomAssetImageWidget(image: Images.partialPayIcon, height: 25, width: 25),
                          const SizedBox(width: Dimensions.paddingSizeSmall),

                          Text(controllerOrderModel.paymentMethod == 'wallet' ? 'wallet_payment'.tr : 'partial_payment'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
                        ]) : Row(children: [
                          CustomAssetImageWidget(image: Images.cashIcon, height: 25, width: 25),
                          const SizedBox(width: Dimensions.paddingSizeSmall),

                          Text('digital_payment'.tr, style: robotoRegular),
                        ]),
                      ]),
                    ),
                    DividerWidget(),

                    DetailsCustomCard(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      borderRadius: Dimensions.radiusSmall,
                      isBorder: false,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('billing_info'.tr, style: robotoBold),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('${'subtotal'.tr} ${taxIncluded ? '(${'tax_included'.tr})' : ''}', style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
                          Text(PriceConverter.convertPrice(total - dmTips), style: robotoMedium, textDirection: TextDirection.ltr),
                        ]),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('delivery_man_tips'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
                          Text('(+) ${PriceConverter.convertPrice(dmTips)}', style: robotoMedium.copyWith(color: Theme.of(context).primaryColor), textDirection: TextDirection.ltr),
                        ]),
                        Divider(height: 25, color: Theme.of(context).hintColor.withValues(alpha: 0.3)),

                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('total_amount'.tr, style: robotoMedium.copyWith(color: order.paymentMethod == 'partial_payment' ? Theme.of(context).textTheme.bodyLarge?.color : Theme.of(context).primaryColor)),
                          Text(
                            PriceConverter.convertPrice(total), textDirection: TextDirection.ltr,
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: order.paymentMethod == 'partial_payment' ? Theme.of(context).textTheme.bodyLarge?.color : Theme.of(context).primaryColor),
                          ),
                        ]),

                        order.paymentMethod == 'partial_payment' ? Column(children: [

                          const SizedBox(height: Dimensions.paddingSizeSmall),

                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            Text('paid_amount_via_wallet'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),

                            Text(
                              PriceConverter.convertPrice(order.payments![0].amount),
                              style: robotoMedium,
                            ),
                          ]),
                          Divider(height: 25, color: Theme.of(context).hintColor.withValues(alpha: 0.3)),

                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            Text('${order.payments![1].paymentStatus == 'paid' ? 'paid_by'.tr : 'due_amount'.tr} (${order.payments?[1].paymentMethod?.toString().replaceAll('_', ' ')})', style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor)),
                            Text(
                              PriceConverter.convertPrice(order.payments![1].amount),
                              style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                            ),
                          ]),
                        ]) : const SizedBox(),
                      ]),
                    ),
                    controllerOrderModel.orderStatus != 'delivered' ? DividerWidget(height: Dimensions.paddingSizeDefault) : const SizedBox(),

                  ]),
                )),

                showDeliveryConfirmImage && controllerOrderModel.orderStatus != 'delivered' ? CustomCard(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  isBorder: false,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                    Row(children: [
                      Text('completed_after_delivery_picture'.tr, style: robotoBold),
                      const SizedBox(width: Dimensions.paddingSizeSmall),

                      CustomToolTip(
                        message: 'completed_after_delivery_picture'.tr,
                        child: const Icon(Icons.info_outline, size: 20),
                      ),
                    ]),
                    const SizedBox(height: Dimensions.paddingSizeSmall),

                    Container(
                      height: 80,
                      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                      decoration: BoxDecoration(
                        color: Theme.of(context).hintColor.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                      ),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: orderController.pickedPrescriptions.length+1,
                        itemBuilder: (context, index) {

                          XFile? file = index == orderController.pickedPrescriptions.length ? null : orderController.pickedPrescriptions[index];

                          if(index < 5 && index == orderController.pickedPrescriptions.length) {
                            return InkWell(
                              onTap: () {
                                Get.bottomSheet(const CameraButtonSheetWidget());
                              },
                              child: Container(
                                height: 60, width: 60, alignment: Alignment.center, decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                              ),
                                child:  Icon(Icons.camera_alt_sharp, color: Theme.of(context).primaryColor, size: 32),
                              ),
                            );
                          }

                          return file != null ? Container(
                            margin: const EdgeInsets.only(right: Dimensions.paddingSizeSmall),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                            ),
                            child: Stack(children: [

                              ClipRRect(
                                borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                                child: GetPlatform.isWeb ? Image.network(
                                  file.path, width: 60, height: 60, fit: BoxFit.cover,
                                ) : Image.file(
                                  File(file.path), width: 60, height: 60, fit: BoxFit.cover,
                                ),
                              ),

                            ]),
                          ) : const SizedBox();
                        },
                      ),
                    ),

                  ]),
                ) : const SizedBox(),

                SafeArea(
                  child: showDeliveryConfirmImage && controllerOrderModel.orderStatus != 'delivered' ? Container(
                    color: Theme.of(context).cardColor,
                    padding: const EdgeInsets.only(left: Dimensions.paddingSizeDefault, right: Dimensions.paddingSizeDefault, bottom: Dimensions.paddingSizeDefault),
                    child: CustomButtonWidget(
                      buttonText: 'complete_delivery'.tr,
                      onPressed: () {

                        if(Get.find<SplashController>().configModel!.orderDeliveryVerification!){
                          Get.find<NotificationController>().sendDeliveredNotification(controllerOrderModel.id);

                          Get.bottomSheet(VerifyDeliverySheetWidget(
                            orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                            orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                            cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                          ), isScrollControlled: true).then((isSuccess) {

                            if(isSuccess && controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery')){
                              Get.bottomSheet(CollectMoneyDeliverySheetWidget(
                                orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                                orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                                cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                              ), isScrollControlled: true, isDismissible: false);
                            }
                          });
                        } else{
                          Get.bottomSheet(CollectMoneyDeliverySheetWidget(
                            orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                            orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                            cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                          ), isScrollControlled: true);
                        }

                      },
                    ),
                  ) : showBottomView ? ((controllerOrderModel.orderStatus == 'accepted' && (controllerOrderModel.paymentMethod != 'cash_on_delivery' || restConfModel || selfDelivery))
                      || controllerOrderModel.orderStatus == 'processing' || controllerOrderModel.orderStatus == 'confirmed') ? Container(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeExtraLarge),
                    width: MediaQuery.of(context).size.width,
                    color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                    alignment: Alignment.center,
                    child: Column(children: [
                      Text(
                        controllerOrderModel.orderStatus == 'processing' ? 'food_is_preparing'.tr : 'food_waiting_for_cook'.tr,
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),

                      Text(
                        controllerOrderModel.orderStatus == 'processing' ? 'when_it_is_ready_you_will_be_notified'.tr : 'when_it_is_ready_for_cooking_you_will_be_notified'.tr,
                        style: robotoRegular.copyWith(color: Theme.of(context).hintColor),
                      ),
                    ]),
                  ) : showSlider ? (controllerOrderModel.paymentMethod == 'cash_on_delivery' && controllerOrderModel.orderStatus == 'accepted' && !restConfModel && cancelPermission! && !selfDelivery) ? Row(children: [
                    Expanded(child: TextButton(
                      onPressed: (){
                        orderController.setOrderCancelReason('');
                        Get.dialog(CancellationDialogueWidget(orderId: widget.orderId));
                      },
                      style: TextButton.styleFrom(
                        minimumSize: const Size(1170, 40), padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                          side: BorderSide(width: 1, color: Theme.of(context).textTheme.bodyLarge!.color!),
                        ),
                      ),
                      child: Text('cancel'.tr, textAlign: TextAlign.center, style: robotoRegular.copyWith(
                        color: Theme.of(context).textTheme.titleSmall!.color,
                        fontSize: Dimensions.fontSizeLarge,
                      )),
                    )),
                    const SizedBox(width: Dimensions.paddingSizeSmall),
                    Expanded(child: CustomButtonWidget(
                      buttonText: 'confirm'.tr, height: 40,
                      onPressed: () {
                        showCustomBottomSheet(
                          child: CustomConfirmationBottomSheet(
                            title: 'are_you_sure_to_confirm'.tr,
                            description: 'you_want_to_confirm_this_order'.tr,
                            onConfirm: () {
                              orderController.updateOrderStatus(controllerOrderModel.id, 'confirmed', back: true).then((success) {
                                if(success) {
                                  Get.find<ProfileController>().getProfile();
                                  Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus!);
                                }
                              });
                            },
                          ),
                        );
                      },
                    )),
                  ]) : CustomCard(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                    isBorder: false,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                      Row(children: [
                        CustomAssetImageWidget(image: Images.amountIcon, height: 20, width: 20),
                        const SizedBox(width: 5),

                       Text('amount_collect_from_customer'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
                        Spacer(),


                        Text(
                          PriceConverter.convertPrice(order.paymentMethod == 'partial_payment' && order.payments?[1].paymentMethod == 'cash_on_delivery' ? order.payments![1].amount : order.paymentMethod == 'cash_on_delivery' ? total : 0),
                          style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                        ),

                      ]),

                      order.paymentMethod == 'cash_on_delivery' ? SizedBox() : order.paymentMethod == 'partial_payment' && order.payments?[1].paymentMethod != 'cash_on_delivery' ? Padding(
                        padding: const EdgeInsets.only(left: 23),
                        child: Text('already_paid'.tr, style: robotoBold.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeSmall)),
                      ) : const SizedBox(),
                      SizedBox(height: Dimensions.paddingSizeSmall),

                      SliderButtonWidget(
                        action: () {
                          if(controllerOrderModel.paymentMethod == 'cash_on_delivery' && controllerOrderModel.orderStatus == 'accepted' && !restConfModel && !selfDelivery) {
                            showCustomBottomSheet(
                              child: CustomConfirmationBottomSheet(
                                title: 'are_you_sure_to_confirm'.tr,
                                description: 'you_want_to_confirm_this_order'.tr,
                                onConfirm: () {
                                  orderController.updateOrderStatus(controllerOrderModel.id, 'confirmed', back: true).then((success) {
                                    if(success) {
                                      Get.find<ProfileController>().getProfile();
                                      Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus!);
                                    }
                                  });
                                },
                              ),
                            );
                          }else if(controllerOrderModel.orderStatus == 'picked_up') {
                            if(Get.find<SplashController>().configModel!.orderDeliveryVerification! || controllerOrderModel.paymentMethod == 'cash_on_delivery') {
                              orderController.changeDeliveryImageStatus();
                              if(Get.find<SplashController>().configModel!.dmPictureUploadStatus!) {
                                showCustomBottomSheet(child: DialogImageWidget());
                              } else {
                                if(Get.find<SplashController>().configModel!.orderDeliveryVerification!){
                                  Get.find<NotificationController>().sendDeliveredNotification(controllerOrderModel.id);

                                  Get.bottomSheet(VerifyDeliverySheetWidget(
                                    orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                                    orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                                    cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                                  ), isScrollControlled: true).then((isSuccess) {


                                    if(isSuccess && controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery')){
                                      Get.bottomSheet(CollectMoneyDeliverySheetWidget(
                                        orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                                        orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                                        cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                                      ), isScrollControlled: true, isDismissible: false);
                                    }
                                  });
                                } else {
                                  Get.bottomSheet(CollectMoneyDeliverySheetWidget(
                                    orderID: controllerOrderModel.id, verify: Get.find<SplashController>().configModel!.orderDeliveryVerification,
                                    orderAmount: order.paymentMethod == 'partial_payment' ? order.payments![1].amount!.toDouble() : controllerOrderModel.orderAmount,
                                    cod: controllerOrderModel.paymentMethod == 'cash_on_delivery' || (order.paymentMethod == 'partial_payment' && order.payments![1].paymentMethod == 'cash_on_delivery'),
                                  ), isScrollControlled: true);
                                }
                              }

                            }else {
                              Get.find<OrderController>().updateOrderStatus(controllerOrderModel.id, 'delivered').then((success) {
                                if(success) {
                                  Get.find<ProfileController>().getProfile();
                                  Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus!);
                                }
                              });
                            }
                          }else if(controllerOrderModel.orderStatus == 'handover') {
                            if(Get.find<ProfileController>().profileModel!.active == 1) {
                              Get.find<OrderController>().updateOrderStatus(controllerOrderModel.id, 'picked_up').then((success) {
                                if(success) {
                                  Get.find<ProfileController>().getProfile();
                                  Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus!);
                                }
                              });
                            }else {
                              showCustomSnackBar('make_yourself_online_first'.tr);
                            }
                          }
                        },
                        label: Text(
                          (controllerOrderModel.paymentMethod == 'cash_on_delivery' && controllerOrderModel.orderStatus == 'accepted' && !restConfModel && !selfDelivery)
                              ? 'swipe_to_confirm_order'.tr : controllerOrderModel.orderStatus == 'picked_up' ? 'swipe_to_deliver_order'.tr
                              : controllerOrderModel.orderStatus == 'handover' ? 'swipe_to_pick_up_order'.tr : '',
                          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                        ),
                        dismissThresholds: 0.5, dismissible: false, shimmer: true,
                        width: 1170, height: 50, buttonSize: 50, radius: 10,
                        icon: Center(child: Icon(
                          Get.find<LocalizationController>().isLtr ? Icons.double_arrow_sharp : Icons.keyboard_arrow_left,
                          color: ColorResources.white, size: 20.0,
                        )),
                        isLtr: Get.find<LocalizationController>().isLtr,
                        boxShadow: const BoxShadow(blurRadius: 0),
                        buttonColor: Theme.of(context).primaryColor,
                        backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                        baseColor: Theme.of(context).primaryColor,
                      ),
                    ]),
                  ) : const SizedBox() : const SizedBox(),
                ),

              ]) : OrderDetailsShimmer();
            }),
          ),
        );
      }),
    );
  }

  void openDialog(BuildContext context, String imageUrl) => showDialog(
    context: context,
    builder: (BuildContext context) {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLarge)),
        child: Stack(children: [

          ClipRRect(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
            child: PhotoView(
              tightMode: true,
              imageProvider: NetworkImage(imageUrl),
              heroAttributes: PhotoViewHeroAttributes(tag: imageUrl),
            ),
          ),

          Positioned(top: 0, right: 0, child: IconButton(
            splashRadius: 5,
            onPressed: () => Get.back(),
            icon: Icon(Icons.cancel, color: Theme.of(context).colorScheme.error),
          )),

        ]),
      );
    },
  );
}