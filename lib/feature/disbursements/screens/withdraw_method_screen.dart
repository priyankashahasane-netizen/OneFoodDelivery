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

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh bank details when screen comes into focus (e.g., after adding a method)
    // This ensures the list is up-to-date when returning from add screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        // Always refresh to ensure we have the latest data
        Get.find<DisbursementController>().getBankDetails();
      }
    });
  }

  initCall() async {
    await Get.find<DisbursementController>().getBankDetails();
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
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingSizeDefault,
            vertical: Dimensions.paddingSizeSmall,
          ),
          itemBuilder: (context, index) {
            Methods method = disbursementController.disbursementMethodBody!.methods![index];
            final isDefault = method.isDefault == 1;

            return Container(
              width: context.width,
              margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeDefault),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Theme.of(context).cardColor,
                border: isDefault
                    ? Border.all(
                        color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
                        width: 1.5,
                      )
                    : null,
                boxShadow: [
                  BoxShadow(
                    color: isDefault
                        ? Theme.of(context).primaryColor.withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.04),
                    spreadRadius: 0,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with payment method and default badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Dimensions.paddingSizeDefault,
                      vertical: Dimensions.paddingSizeSmall + 4,
                    ),
                    decoration: BoxDecoration(
                      color: isDefault
                          ? Theme.of(context).primaryColor.withValues(alpha: 0.08)
                          : Colors.transparent,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
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
                                  fontSize: Dimensions.fontSizeSmall - 1,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                method.methodName ?? '',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: robotoBold.copyWith(
                                  fontSize: Dimensions.fontSizeDefault + 2,
                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Default Badge or Make Default Button
                        if (isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).primaryColor,
                                  Theme.of(context).primaryColor.withValues(alpha: 0.85),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              'Default',
                              style: robotoMedium.copyWith(
                                color: Colors.white,
                                fontSize: Dimensions.fontSizeSmall - 1,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          )
                        else
                          InkWell(
                            onTap: () {
                              // Use bank_account_id if available, otherwise fall back to id
                              final accountId = method.bankAccountId ?? method.id?.toString();
                              if (accountId != null) {
                              disbursementController.makeDefaultMethod(
                                  {'bank_account_id': accountId, 'is_default': '1'},
                                index,
                              );
                              }
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
                                  width: 1,
                                ),
                              ),
                              child: disbursementController.isLoading &&
                                      (index == disbursementController.index)
                                  ? SizedBox(
                                      height: 14,
                                      width: 14,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Theme.of(context).primaryColor,
                                      ),
                                    )
                                  : Text(
                                      'make_default'.tr,
                                      style: robotoMedium.copyWith(
                                        color: Theme.of(context).primaryColor,
                                        fontSize: Dimensions.fontSizeSmall - 1,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Bank Details List
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      Dimensions.paddingSizeDefault,
                      Dimensions.paddingSizeSmall,
                      Dimensions.paddingSizeDefault,
                      Dimensions.paddingSizeSmall,
                    ),
                    child: Column(
                      children: [
                        // Helper function to find field by name
                        Builder(
                          builder: (context) {
                            String? getFieldValue(String fieldName) {
                              for (var field in method.methodFields!) {
                                if (field.userInput?.toLowerCase().replaceAll(' ', '_') == fieldName.toLowerCase()) {
                                  return field.userData ?? '';
                                }
                              }
                              return null;
                            }

                            // Row 1: Account holder name and Account number
                            final accountHolder = getFieldValue('account_holder_name') ?? getFieldValue('account holder name') ?? '';
                            final accountNumber = getFieldValue('account_number') ?? getFieldValue('account number') ?? '';
                            
                            // Row 2: IFSC code and Bank name
                            final ifscCode = getFieldValue('ifsc_code') ?? getFieldValue('ifsc code') ?? '';
                            final bankName = getFieldValue('bank_name') ?? getFieldValue('bank name') ?? '';
                            
                            // Row 3: Branch name and UPI ID
                            final branchName = getFieldValue('branch_name') ?? getFieldValue('branch name') ?? '';
                            final upiId = getFieldValue('upi_id') ?? getFieldValue('upi id') ?? '';

                            return Column(
                              children: [
                                // Row 1: Account holder name and Account number
                                if (accountHolder.isNotEmpty || accountNumber.isNotEmpty)
                                  Container(
                                    margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: Dimensions.paddingSizeDefault - 2,
                                      vertical: Dimensions.paddingSizeSmall + 2,
                                    ),
                            decoration: BoxDecoration(
                              color: Theme.of(context).scaffoldBackgroundColor,
                                      borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                                      children: [
                                        // Account holder name
                                        Expanded(
                                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                              Text(
                                                'Account holder name',
                                                style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                accountHolder,
                                                style: robotoBold.copyWith(
                                                  fontSize: Dimensions.fontSizeDefault,
                                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: Dimensions.paddingSizeDefault),
                                        // Account number
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                                'Account number',
                                        style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                accountNumber,
                                                style: robotoBold.copyWith(
                                                  fontSize: Dimensions.fontSizeDefault,
                                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                // Row 2: IFSC code and Bank name
                                if (ifscCode.isNotEmpty || bankName.isNotEmpty)
                                  Container(
                                    margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: Dimensions.paddingSizeDefault - 2,
                                      vertical: Dimensions.paddingSizeSmall + 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).scaffoldBackgroundColor,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        // IFSC code
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Ifsc code',
                                                style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                      Text(
                                                ifscCode,
                                        style: robotoBold.copyWith(
                                          fontSize: Dimensions.fontSizeDefault,
                                          color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: Dimensions.paddingSizeDefault),
                                        // Bank name
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Bank name',
                                                style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                bankName,
                                                style: robotoBold.copyWith(
                                                  fontSize: Dimensions.fontSizeDefault,
                                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                                  ),

                                // Row 3: Branch name and UPI ID
                                if (branchName.isNotEmpty || upiId.isNotEmpty)
                                  Container(
                                    margin: EdgeInsets.zero,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: Dimensions.paddingSizeDefault - 2,
                                      vertical: Dimensions.paddingSizeSmall + 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).scaffoldBackgroundColor,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        // Branch name
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Branch name',
                                                style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                branchName,
                                                style: robotoBold.copyWith(
                                                  fontSize: Dimensions.fontSizeDefault,
                                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: Dimensions.paddingSizeDefault),
                                        // UPI ID
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Upi id',
                                                style: robotoRegular.copyWith(
                                                  fontSize: Dimensions.fontSizeSmall - 1,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                upiId,
                                                style: robotoBold.copyWith(
                                                  fontSize: Dimensions.fontSizeDefault,
                                                  color: Theme.of(context).textTheme.bodyLarge!.color,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  // Delete Button
                  Container(
                    padding: const EdgeInsets.fromLTRB(
                      Dimensions.paddingSizeDefault,
                      0,
                      Dimensions.paddingSizeDefault,
                      Dimensions.paddingSizeSmall,
                    ),
                    child: InkWell(
                      onTap: () {
                        // Use bank_account_id if available, otherwise fall back to id
                        final accountId = method.bankAccountId ?? method.id?.toString();
                        if (accountId != null) {
                          Get.dialog(ConfirmDialogWidget(bankAccountId: accountId));
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: Dimensions.paddingSizeSmall - 2,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              CupertinoIcons.delete,
                              color: Theme.of(context).colorScheme.error,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'delete'.tr,
                              style: robotoMedium.copyWith(
                                color: Theme.of(context).colorScheme.error,
                                fontSize: Dimensions.fontSizeDefault - 1,
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