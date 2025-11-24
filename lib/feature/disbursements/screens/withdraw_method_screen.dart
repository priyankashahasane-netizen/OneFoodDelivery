import 'package:stackfood_multivendor_driver/feature/disbursements/controllers/disbursement_controller.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_method_model.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/helper/disbursement_helper.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/widgets/confirm_dialog_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/global_bottom_nav_widget.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class WithdrawMethodScreen extends StatefulWidget {
  final bool isFromDashboard;
  const WithdrawMethodScreen({super.key, required this.isFromDashboard});

  @override
  State<WithdrawMethodScreen> createState() => _WithdrawMethodScreenState();
}

class _WithdrawMethodScreenState extends State<WithdrawMethodScreen> {

  DisbursementHelper disbursementHelper = DisbursementHelper();

  @override
  void initState() {
    super.initState();

    initCall();
  }

  initCall() async {
    Get.find<DisbursementController>().getBankDetails();
    disbursementHelper.enableDisbursementWarningMessage(false, canShowDialog: !widget.isFromDashboard);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(
        title: 'disbursement_methods'.tr,
        showMenuButton: false,
      ),
      bottomNavigationBar: const GlobalBottomNavWidget(),

      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.toNamed(RouteHelper.getAddWithdrawMethodRoute()),
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),

      body: GetBuilder<DisbursementController>(builder: (disbursementController) {
        if (disbursementController.disbursementMethodBody == null) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (disbursementController.disbursementMethodBody!.methods!.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.account_balance,
                  size: 80,
                  color: Theme.of(context).disabledColor.withValues(alpha: 0.5),
                ),
                const SizedBox(height: Dimensions.paddingSizeLarge),
                Text(
                  'no_method_found'.tr,
                  style: robotoMedium.copyWith(
                    fontSize: Dimensions.fontSizeLarge,
                    color: Theme.of(context).disabledColor,
                  ),
                ),
                const SizedBox(height: Dimensions.paddingSizeSmall),
                Text(
                  'please_add'.tr + ' ' + 'bank_details'.tr.toLowerCase(),
                  style: robotoRegular.copyWith(
                    fontSize: Dimensions.fontSizeDefault,
                    color: Theme.of(context).disabledColor,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: disbursementController.disbursementMethodBody!.methods!.length,
          shrinkWrap: true,
          padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
          itemBuilder: (context, index) {
            Methods method = disbursementController.disbursementMethodBody!.methods![index];
            final isDefault = method.isDefault == 1;

            return Container(
              width: context.width,
              margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeLarge),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Theme.of(context).cardColor,
                boxShadow: [
                  BoxShadow(
                    color: isDefault
                        ? Theme.of(context).primaryColor.withValues(alpha: 0.1)
                        : Colors.black.withValues(alpha: 0.05),
                    spreadRadius: 0,
                    blurRadius: 15,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with bank icon and default badge
                  Container(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                    decoration: BoxDecoration(
                      color: isDefault
                          ? Theme.of(context).primaryColor.withValues(alpha: 0.05)
                          : Theme.of(context).scaffoldBackgroundColor,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      children: [
                        // Method Name
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'payment_method'.tr,
                                style: robotoRegular.copyWith(
                                  fontSize: Dimensions.fontSizeSmall,
                                  color: Theme.of(context).disabledColor,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                method.methodName ?? '',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: robotoBold.copyWith(
                                  fontSize: Dimensions.fontSizeLarge,
                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Default Badge or Make Default Button
                        if (isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: Dimensions.paddingSizeSmall,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).primaryColor,
                                  Theme.of(context).primaryColor.withValues(alpha: 0.8),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              'Default',
                              style: robotoMedium.copyWith(
                                color: Colors.white,
                                fontSize: Dimensions.fontSizeSmall,
                              ),
                            ),
                          )
                        else
                          InkWell(
                            onTap: () {
                              disbursementController.makeDefaultMethod(
                                {'id': '${method.id}', 'is_default': '1'},
                                index,
                              );
                            },
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: Dimensions.paddingSizeSmall,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
                                  width: 1,
                                ),
                              ),
                              child: disbursementController.isLoading &&
                                      (index == disbursementController.index)
                                  ? SizedBox(
                                      height: 16,
                                      width: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Theme.of(context).primaryColor,
                                      ),
                                    )
                                  : Text(
                                      'make_default'.tr,
                                      style: robotoMedium.copyWith(
                                        color: Theme.of(context).primaryColor,
                                        fontSize: Dimensions.fontSizeSmall,
                                      ),
                                    ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Bank Details List
                  Padding(
                    padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                    child: Column(
                      children: [
                        ...method.methodFields!.asMap().entries.map((entry) {
                          final fieldIndex = entry.key;
                          final field = entry.value;
                          final fieldName = field.userInput ?? '';
                          final fieldValue = field.userData ?? '';

                          return Container(
                            margin: EdgeInsets.only(
                              bottom: fieldIndex == method.methodFields!.length - 1
                                  ? 0
                                  : Dimensions.paddingSizeDefault,
                            ),
                            padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                            decoration: BoxDecoration(
                              color: Theme.of(context).scaffoldBackgroundColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Field Name and Value
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        fieldName.replaceAll('_', ' '),
                                        style: robotoRegular.copyWith(
                                          fontSize: Dimensions.fontSizeSmall,
                                          color: Theme.of(context).disabledColor,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        fieldValue,
                                        style: robotoBold.copyWith(
                                          fontSize: Dimensions.fontSizeDefault,
                                          color: Theme.of(context).textTheme.bodyLarge!.color,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ],
                    ),
                  ),

                  // Delete Button
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Dimensions.paddingSizeDefault,
                      vertical: Dimensions.paddingSizeSmall,
                    ),
                    child: InkWell(
                      onTap: () {
                        Get.dialog(ConfirmDialogWidget(id: method.id!));
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: Dimensions.paddingSizeSmall,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              CupertinoIcons.delete,
                              color: Theme.of(context).colorScheme.error,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'delete'.tr,
                              style: robotoMedium.copyWith(
                                color: Theme.of(context).colorScheme.error,
                                fontSize: Dimensions.fontSizeDefault,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      }),
    );
  }
}