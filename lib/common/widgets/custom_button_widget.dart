import 'package:get/get_utils/get_utils.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:flutter/material.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class CustomButtonWidget extends StatelessWidget {
  final Function? onPressed;
  final String buttonText;
  final bool transparent;
  final EdgeInsets? margin;
  final double? height;
  final double? width;
  final double? fontSize;
  final Color? iconColor;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? fontColor;
  final double radius;
  final FontWeight? fontWeight;
  final bool isLoading;
  const CustomButtonWidget({super.key, this.onPressed, required this.buttonText, this.transparent = false, this.margin,
    this.width, this.height, this.fontSize, this.backgroundColor, this.icon, this.radius = Dimensions.radiusDefault, this.fontWeight,
    this.fontColor, this.iconColor, this.isLoading = false});

  @override
  Widget build(BuildContext context) {

    final ButtonStyle flatButtonStyle = TextButton.styleFrom(
      backgroundColor: onPressed == null ? Theme.of(context).disabledColor : transparent ? Colors.transparent : backgroundColor ?? Theme.of(context).primaryColor,
      minimumSize: Size(width != null ? width! : 1170, height != null ? height! : 50),
      padding: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
    );

    return Padding(
      padding: margin == null ? const EdgeInsets.all(0) : margin!,
      child: TextButton(
        onPressed: isLoading ? null : onPressed as void Function()?,
        style: flatButtonStyle,
        child: isLoading ?
        Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const SizedBox(
            height: 15, width: 15,
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              strokeWidth: 2,
            ),
          ),
          const SizedBox(width: Dimensions.paddingSizeSmall),

          Text('loading'.tr, style: robotoMedium.copyWith(color: Colors.white)),
        ]),
        ) : Row(mainAxisAlignment: MainAxisAlignment.center, children: [

          icon != null ? Icon(icon, color: transparent ? Theme.of(context).primaryColor : iconColor ?? Theme.of(context).cardColor) : const SizedBox(),
          SizedBox(width: icon != null ? Dimensions.paddingSizeSmall : 0),

          Text(buttonText, textAlign: TextAlign.center, style: robotoBold.copyWith(
            color: fontColor ?? (transparent ? Theme.of(context).primaryColor : Theme.of(context).cardColor),
            fontSize: fontSize ?? Dimensions.fontSizeLarge, fontWeight: fontWeight,
          )),

        ]),
      ),
    );
  }
}