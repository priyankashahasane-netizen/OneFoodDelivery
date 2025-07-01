import 'package:stackfood_multivendor_driver/common/widgets/custom_asset_image_widget.dart';
import 'package:stackfood_multivendor_driver/feature/chat/controllers/chat_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/conversation_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/widgets/search_field_widget.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/helper/user_type_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_ink_well_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/paginated_list_view_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ConversationScreen extends StatefulWidget {
  const ConversationScreen({super.key});

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> with TickerProviderStateMixin{

  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Get.find<ChatController>().setType('customer', willUpdate: false);
    Get.find<ChatController>().getConversationList(1, type: Get.find<ChatController>().type);
  }

  void _decideResult(ConversationsModel? conversation){
    String? type = 'customer';
    if(conversation != null && conversation.conversations != null && conversation.conversations!.isNotEmpty) {
      if (conversation.conversations?.first.senderType == UserType.user.name
          || conversation.conversations?.first.senderType == UserType.customer.name) {
        type = conversation.conversations?.first.receiverType;
      } else {
        type = conversation.conversations?.first.senderType;
      }
    }

    if(type == 'vendor' && !_tabController.indexIsChanging) {
      _tabController.animateTo(1);
      Get.find<ChatController>().setType('vendor');
      Get.find<ChatController>().setTabSelect();
    } else if(type == 'customer' && !_tabController.indexIsChanging) {
      _tabController.animateTo(0);
      Get.find<ChatController>().setType('customer');
      Get.find<ChatController>().setTabSelect();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: CustomAppBarWidget(title: 'conversation_list'.tr),

      body: GetBuilder<ChatController>(builder: (chatController) {

        ConversationsModel? conversation0;
        if(chatController.searchConversationModel != null) {
          conversation0 = chatController.searchConversationModel;
          _decideResult(chatController.searchConversationModel);
        }else {
          conversation0 = chatController.conversationModel;
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.fontSizeLarge, vertical: Dimensions.paddingSizeDefault),
          child: Column(children: [

            (conversation0 != null && conversation0.conversations != null) ? SearchFieldWidget(
              controller: _searchController,
              hint: 'search'.tr,
              suffixIcon: chatController.searchConversationModel != null ? Icons.close : Icons.search,
              onSubmit: (String text) {
                if(_searchController.text.trim().isNotEmpty) {
                  chatController.searchConversation(_searchController.text.trim());
                }else {
                  showCustomSnackBar('write_somethings'.tr);
                }
              },
              iconPressed: () {
                if(chatController.searchConversationModel != null) {
                  _searchController.text = '';
                  chatController.removeSearchMode();
                  chatController.getConversationList(1, type: 'customer');
                }else {
                  if(_searchController.text.trim().isNotEmpty) {
                    chatController.searchConversation(_searchController.text.trim());
                  }else {
                    showCustomSnackBar('write_somethings'.tr);
                  }
                }
              },
            ) : const SizedBox(),

            Expanded(child: RefreshIndicator(
              onRefresh: () async {
                await chatController.getConversationList(1, type: chatController.type);
              },
              child: CustomScrollView(controller: _scrollController, slivers: [

                SliverPersistentHeader(
                  pinned: true,
                  delegate: SliverDelegate(child: Container(
                    alignment: Alignment.centerLeft,
                    color: Theme.of(context).colorScheme.surface,
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall),
                    child: TabBar(
                      tabAlignment: TabAlignment.start,
                      controller: _tabController,
                      isScrollable: true,
                      dividerColor: Colors.transparent,
                      labelPadding: const EdgeInsets.only(right: Dimensions.paddingSizeDefault),
                      indicatorColor: Theme.of(context).primaryColor,
                      labelColor: Theme.of(context).textTheme.bodyLarge!.color,
                      unselectedLabelColor: Theme.of(context).disabledColor,
                      indicatorSize: TabBarIndicatorSize.label,
                      overlayColor: WidgetStateProperty.all(Colors.transparent),
                      labelStyle: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault),
                      unselectedLabelStyle: robotoRegular.copyWith(fontSize: Dimensions.fontSizeDefault),
                      tabs: [
                        Tab(text: 'customer'.tr),
                        Tab(text: 'restaurant'.tr),
                      ],
                      onTap: (int index){

                        if(index == 0){
                          chatController.setType('customer');
                          chatController.setTabSelect();
                        } else {
                          chatController.setType('vendor');
                          chatController.setTabSelect();
                        }
                        if(chatController.searchConversationModel == null) {
                          chatController.getConversationList(1, type: chatController.type);
                        }
                      },
                    ),
                  )),
                ),

                SliverToBoxAdapter(
                  child: (conversation0 != null && conversation0.conversations != null) ? conversation0.conversations!.isNotEmpty  ? conversationCard(chatController, conversation0) : Padding(
                    padding: EdgeInsets.only(top: context.height * 0.25),
                    child: Center(child: Column(
                      children: [
                        const CustomAssetImageWidget(
                          image: Images.messageEmpty,
                          height: 70, width: 70,
                        ),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        Text(
                          '${'select_and_start_messaging'.tr}!',
                          style: robotoRegular.copyWith(color: Theme.of(context).disabledColor),
                        ),
                      ],
                    )),
                  ) : Padding(
                    padding: EdgeInsets.only(top: context.height * 0.25),
                    child: const Center(child: CircularProgressIndicator()),
                  ),

                ),

              ]),
            )),

          ]),
        );
      }),
    );
  }

  Widget conversationCard(ChatController chatController, ConversationsModel? conversation0) {
    return !chatController.tabLoading ? Container(
        width: Dimensions.webMaxWidth,
        padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
        child: PaginatedListViewWidget(
          scrollController: _scrollController,
          onPaginate: (int? offset) => chatController.getConversationList(offset!, type: chatController.type),
          totalSize: conversation0?.totalSize,
          offset: conversation0?.offset,
          enabledPagination: chatController.searchConversationModel == null,
          productView: ListView.builder(
            itemCount: conversation0?.conversations!.length,
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            itemBuilder: (context, index) {

              Conversation conversation = conversation0!.conversations![index];

              User? user;
              String? type;
              if(conversation.senderType == UserType.delivery_man.name) {
                user = conversation.receiver;
                type = conversation.receiverType;
              }else {
                user = conversation.sender;
                type = conversation.senderType;
              }

              String? lastMessage = _lastMessage(conversation0.conversations![index]);

              bool isUnread = conversation.unreadMessageCount! > 0 && conversation.lastMessage != null && conversation.lastMessage!.senderId == user?.id;

              String? hasFile = conversation.lastMessage != null && conversation.lastMessage!.files != null ? '${conversation.lastMessage?.files?.length} ${'attachment'.tr}' : null;

              return Container(
                margin: const EdgeInsets.symmetric(vertical: Dimensions.paddingSizeExtraSmall),
                decoration: BoxDecoration(
                  color: isUnread ? Theme.of(context).primaryColor.withValues(alpha: 0.03) : Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(7),
                  boxShadow: [BoxShadow(color: isUnread ? Theme.of(context).primaryColor.withValues(alpha: 0.02) : Colors.black.withValues(alpha: 0.07), blurRadius: 4, spreadRadius: 0)],
                ),
                child: CustomInkWellWidget(
                  onTap: () async {
                    if(user != null){
                      await Get.toNamed(RouteHelper.getChatRoute(
                        notificationBody: NotificationBodyModel(
                          type: conversation.senderType,
                          notificationType: NotificationType.message,
                          customerId: type == UserType.customer.name ? user.userId : null,
                          vendorId: type == UserType.vendor.name ? user.vendorId : null,
                        ),
                        conversationId: conversation.id,
                      ));
                      Get.find<ChatController>().getConversationList(1, type: Get.find<ChatController>().type);
                    }else{
                      showCustomSnackBar('${type!.tr} ${'deleted'.tr}');
                    }
                  },
                  highlightColor: Theme.of(context).colorScheme.surface.withValues(alpha: 0.05),
                  radius: Dimensions.radiusSmall,
                  child: Stack(children: [

                    Padding(
                      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        ClipOval(
                          child: CustomImageWidget(
                            height: 50, width: 50,fit: BoxFit.cover,
                            image: '${user != null ? user.imageFullUrl : ''}',
                          ),
                        ),
                        const SizedBox(width: Dimensions.paddingSizeSmall),

                        Expanded(child: Column(mainAxisAlignment: MainAxisAlignment.start, crossAxisAlignment: CrossAxisAlignment.start, children: [

                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [

                            user != null ? Text('${user.fName} ${user.lName}', style: robotoBold) : Text('${type!.tr} ${'deleted'.tr}', style: robotoBold),

                            isUnread ? Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(color: Theme.of(context).primaryColor, shape: BoxShape.circle),
                              child: Text(
                                conversation.unreadMessageCount.toString(),
                                style: robotoMedium.copyWith(color: Theme.of(context).cardColor, fontSize: Dimensions.fontSizeExtraSmall),
                              ),
                            ) : const SizedBox(),

                          ]),

                          user != null ? Text(
                            lastMessage ?? hasFile ?? 'start_conversion'.tr,
                            style: robotoBold.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.5), fontWeight: isUnread ? FontWeight.bold : FontWeight.normal),
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                          ) : const SizedBox(),
                          const SizedBox(height: Dimensions.paddingSizeSmall),

                          Align(
                            alignment: Alignment.centerRight,
                            child: Text(
                              DateConverter.localDateToIsoStringAM(DateConverter.dateTimeStringToDate(
                                  conversation0.conversations![index].lastMessageTime!)),
                              style: robotoRegular.copyWith(color: Theme.of(context).hintColor, fontSize: Dimensions.fontSizeExtraSmall),
                            ),
                          ),

                        ])),
                      ]),
                    ),
                  ]),
                ),
              );
            },
          ),
        )
    ) : Padding(
      padding: EdgeInsets.only(top: context.height * 0.3),
      child: const Center(child: CircularProgressIndicator()),
    );
  }

  String? _lastMessage(Conversation? conversation) {
    if(conversation != null && conversation.lastMessage != null) {
      if(conversation.lastMessage!.message != null) {
        return conversation.lastMessage!.message;
      }
    }
    return null;
  }

}

class SliverDelegate extends SliverPersistentHeaderDelegate {
  Widget child;
  double height;

  SliverDelegate({required this.child, this.height = 50});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return child;
  }

  @override
  double get maxExtent => height;

  @override
  double get minExtent => height;

  @override
  bool shouldRebuild(SliverDelegate oldDelegate) {
    return oldDelegate.maxExtent != height || oldDelegate.minExtent != height || child != oldDelegate.child;
  }
}