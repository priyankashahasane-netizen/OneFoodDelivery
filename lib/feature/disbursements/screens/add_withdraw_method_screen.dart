import 'package:stackfood_multivendor_driver/feature/disbursements/controllers/disbursement_controller.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/global_bottom_nav_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_form_field.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class AddWithDrawMethodScreen extends StatefulWidget {
  const AddWithDrawMethodScreen({super.key});

  @override
  State<AddWithDrawMethodScreen> createState() => _AddWithDrawMethodScreenState();
}

class _AddWithDrawMethodScreenState extends State<AddWithDrawMethodScreen> {

  @override
  void initState() {
    super.initState();

    Get.find<DisbursementController>().setMethod(isUpdate: false);
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    return  GetBuilder<DisbursementController>(builder: (disbursementController) {

      return Scaffold(

        appBar: CustomAppBarWidget(
          title: 'add_withdraw_method'.tr,
          showMenuButton: false,
          isBackButtonExist: true,
          onBackPressed: () {
            Get.offNamed(RouteHelper.getWithdrawMethodRoute(isFromDashBoard: false));
          },
        ),
        bottomNavigationBar: const GlobalBottomNavWidget(),

        body: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                  ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    itemCount: disbursementController.methodFields.length,
                    shrinkWrap: true,
                    itemBuilder: (context, index) {
                      return Column(children: [

                        Row(children: [

                          Expanded(
                            child: CustomTextFormField(
                              titleName: _capitalizeFirst(disbursementController.methodFields[index].inputName.toString().replaceAll('_', ' ')),
                              hintText: disbursementController.methodFields[index].placeholder,
                              controller: disbursementController.textControllerList[index],
                              capitalization: TextCapitalization.words,
                              inputType: disbursementController.methodFields[index].inputType == 'phone' ? TextInputType.phone : disbursementController.methodFields[index].inputType == 'number'
                                  ? TextInputType.number : disbursementController.methodFields[index].inputType == 'email' ? TextInputType.emailAddress : TextInputType.name,
                              focusNode: disbursementController.focusList[index],
                              nextFocus: index != disbursementController.methodFields.length-1 ? disbursementController.focusList[index + 1] : null,
                              isRequired: disbursementController.methodFields[index].isRequired == 1,
                            ),
                          ),

                          disbursementController.methodFields[index].inputType == 'date' ? IconButton(
                            onPressed: () async {

                              DateTime? pickedDate = await showDatePicker(
                                context: context,
                                initialDate: DateTime.now(),
                                firstDate: DateTime.now(),
                                lastDate: DateTime(2100),
                              );

                              if (pickedDate != null) {
                                String formattedDate = DateConverter.dateTimeForCoupon(pickedDate);
                                setState(() {
                                  disbursementController.textControllerList[index].text = formattedDate;
                                });
                              }

                            },
                            icon: const Icon(Icons.date_range_sharp),
                          ) : const SizedBox(),
                        ]),
                        SizedBox(height: index != disbursementController.methodFields.length-1 ? Dimensions.paddingSizeLarge : 0),

                      ]);
                    }),

                ]),
              ),
            ),
          ),

          Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [BoxShadow(color: Colors.black12, spreadRadius: 1, blurRadius: 5)],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeExtraLarge, vertical: Dimensions.paddingSizeSmall),
                child: !disbursementController.isLoading ? CustomButtonWidget(
                  buttonText: 'add_method'.tr,
                  onPressed: () {

                    bool fieldEmpty = false;

                    for (var element in disbursementController.methodFields) {
                      if(element.isRequired == 1){
                        if(disbursementController.textControllerList[disbursementController.methodFields.indexOf(element)].text.isEmpty){
                          fieldEmpty = true;
                        }
                      }
                    }

                    if(fieldEmpty){
                      showCustomSnackBar('required_fields_can_not_be_empty'.tr);
                    }else{
                      Map<String?, String> data = {};
                      int methodIndex = disbursementController.selectedMethodIndex ?? 0;
                      if (disbursementController.widthDrawMethods != null && 
                          disbursementController.widthDrawMethods!.isNotEmpty) {
                        data['withdraw_method_id'] = disbursementController.widthDrawMethods![methodIndex].id.toString();
                      }
                      for (var result in disbursementController.methodFields) {
                        data[result.inputName] = disbursementController.textControllerList[disbursementController.methodFields.indexOf(result)].text.trim();
                      }
                      disbursementController.addWithdrawMethod(data);
                    }
                  },
                ) : const Center(child: CircularProgressIndicator()),
              ),
            ),
          ),

        ]),
      );
    });
  }
}