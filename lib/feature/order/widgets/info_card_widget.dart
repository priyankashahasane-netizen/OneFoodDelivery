import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/details_custom_card.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher_string.dart';

class InfoCardWidget extends StatelessWidget {
  final String title;
  final String image;
  final String? name;
  final DeliveryAddress? addressModel;
  final String? phone;
  final String? latitude;
  final String? longitude;
  final bool showButton;
  final bool isDelivery;
  final OrderModel? orderModel;
  final Function? messageOnTap;
  final bool isRestaurant;
  const InfoCardWidget({super.key, required this.title, required this.image, required this.name, required this.addressModel, required this.phone,
    required this.latitude, required this.longitude, required this.showButton, this.isDelivery = false, this.orderModel, this.messageOnTap, this.isRestaurant = false});

  @override
  Widget build(BuildContext context) {
    return DetailsCustomCard(
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      borderRadius: Dimensions.radiusSmall,
      isBorder: false,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        Text(title, style: robotoBold),
        const SizedBox(height: Dimensions.paddingSizeSmall),

        (name != null && name!.isNotEmpty) ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [

          ClipOval(child: CustomImageWidget(
            image: image,
            height: 50, width: 50, fit: BoxFit.cover,
          )),
          const SizedBox(width: Dimensions.paddingSizeSmall),

          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            Text(name ?? '', style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall)),
            const SizedBox(height: Dimensions.paddingSizeExtraSmall),

            Text(
              addressModel?.address ?? 'location_n_a'.tr,
              style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor),
              maxLines: 1, overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: Dimensions.paddingSizeExtraSmall),

            isRestaurant ? Row(children: [

              Icon(Icons.star_rounded, color: Theme.of(context).primaryColor, size: 18),
              const SizedBox(width: Dimensions.paddingSizeExtraSmall),

              Text(
                '(${3.3})',
                style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor),
              ),

            ]) : const SizedBox(),

          ])),
          const SizedBox(width: Dimensions.paddingSizeSmall),


          showButton ? Row(children: [
            InkWell(
              onTap: messageOnTap as void Function()?,
              child: CustomAssetImageWidget(
                image: Images.chatIcon, height: 25, width: 25,
              ),
            ),
            SizedBox(width: Dimensions.paddingSizeLarge),

            orderModel != null ? InkWell(
              onTap: () async {
                if(await canLaunchUrlString('tel:$phone')) {
                  launchUrlString('tel:$phone', mode: LaunchMode.externalApplication);
                }else {
                  showCustomSnackBar('invalid_phone_number_found');
                }
              },
              child: CustomAssetImageWidget(
                image: Images.callIcon, height: 25, width: 25,
              ),
            ) : const SizedBox(),
            SizedBox(width: orderModel != null ? Dimensions.paddingSizeLarge : 0),

            InkWell(
              onTap: () async {
                String url ='https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude&mode=d';
                if (await canLaunchUrlString(url)) {
                  await launchUrlString(url, mode: LaunchMode.externalApplication);
                } else {
                  throw '${'could_not_launch'.tr} $url';
                }
              },
              child: Container(
                height: 25, width: 25,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xff9DA7BC),
                ),
                child: Icon(Icons.location_on, color: Theme.of(context).cardColor, size: 18),
              ),
            ),
          ]) : const SizedBox(),

        ]) : Center(child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeSmall),
          child: Text('no_restaurant_data_found'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall)),
        ),),

      ]),
    );
  }
}