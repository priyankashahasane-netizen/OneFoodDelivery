import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/services/chat_service_interface.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/conversation_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/message_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/image_size_checker.dart';
import 'package:stackfood_multivendor_driver/helper/user_type_helper.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

class ChatController extends GetxController implements GetxService {
  final ChatServiceInterface chatServiceInterface;
  ChatController({required this.chatServiceInterface});

  List<bool>? _showDate;
  List<bool>? get showDate => _showDate;

  bool _isSendButtonActive = false;
  bool get isSendButtonActive => _isSendButtonActive;

  final bool _isSeen = false;
  bool get isSeen => _isSeen;

  final bool _isSend = true;
  bool get isSend => _isSend;

  final bool _isMe = false;
  bool get isMe => _isMe;

  bool _isLoading= false;
  bool get isLoading => _isLoading;

  List <XFile>? _chatImage = [];
  List<XFile>? get chatImage => _chatImage;

  int? _pageSize;
  int? get pageSize => _pageSize;

  int? _offset;
  int? get offset => _offset;

  ConversationsModel? _conversationModel;
  ConversationsModel? get conversationModel => _conversationModel;

  ConversationsModel? _searchConversationModel;
  ConversationsModel? get searchConversationModel => _searchConversationModel;

  MessageModel? _messageModel;
  MessageModel? get messageModel => _messageModel;

  bool _tabLoading= false;
  bool get tabLoading => _tabLoading;

  String _type = 'customer';
  String get type => _type;

  bool _clickTab = false;
  bool get clickTab => _clickTab;

  int _onMessageTimeShowID = 0;
  int get onMessageTimeShowID => _onMessageTimeShowID;

  int _onImageOrFileTimeShowID = 0;
  int get onImageOrFileTimeShowID => _onImageOrFileTimeShowID;

  bool _isClickedOnMessage = false;
  bool get isClickedOnMessage => _isClickedOnMessage;

  bool _isClickedOnImageOrFile = false;
  bool get isClickedOnImageOrFile => _isClickedOnImageOrFile;

  bool _takeImageLoading= false;
  bool get takeImageLoading => _takeImageLoading;

  List <Uint8List>_chatRawImage = [];
  List<Uint8List> get chatRawImage => _chatRawImage;

  List<XFile> objFile = [];

  bool _singleFIleCrossMaxLimit = false;
  bool get singleFIleCrossMaxLimit => _singleFIleCrossMaxLimit;

  XFile? _pickedVideoFile;
  XFile? get pickedVideoFile => _pickedVideoFile;

  Future<void> getConversationList(int offset, {String type = '', bool canUpdate = true, bool fromTab = true}) async{
    if(fromTab) {
      _tabLoading = true;
    }
    if(canUpdate) {
      update();
    }
    _searchConversationModel = null;
    ConversationsModel? conversationModel = await chatServiceInterface.getConversationList(offset, type);
    if(conversationModel != null) {
      if(offset == 1) {
        _conversationModel = conversationModel;
      }else {
        _conversationModel!.totalSize = conversationModel.totalSize;
        _conversationModel!.offset = conversationModel.offset;
        _conversationModel!.conversations!.addAll(conversationModel.conversations!);
      }
    }
    _tabLoading = false;
    update();
  }

  Future<void> searchConversation(String name) async {
    _searchConversationModel = ConversationsModel();
    update();
    ConversationsModel? searchConversationModel = await chatServiceInterface.searchConversationList(name);
    if(searchConversationModel != null) {
      _searchConversationModel = searchConversationModel;
    }
    update();
  }

  void removeSearchMode() {
    _searchConversationModel = null;
    update();
  }

  Future<void> getMessages(int offset, NotificationBodyModel notificationBody, User? user, int? conversationID, {bool firstLoad = false}) async {
    Response? response;
    if(firstLoad) {
      _messageModel = null;
    }

    if(notificationBody.customerId != null || notificationBody.type == UserType.user.name) {
      response = await chatServiceInterface.getMessages(offset, notificationBody.customerId, UserType.user, conversationID);
    }else if(notificationBody.vendorId != null || notificationBody.type == UserType.vendor.name) {
      response = await chatServiceInterface.getMessages(offset, notificationBody.vendorId, UserType.vendor, conversationID);
    }

    if (response != null && response.body['messages'] != {} && response.statusCode == 200) {
      if (offset == 1) {

        if(Get.find<ProfileController>().profileModel == null) {
          await Get.find<ProfileController>().getProfile();
        }

        _messageModel = MessageModel.fromJson(response.body);
        if(_messageModel!.conversation == null && user != null) {
          _messageModel!.conversation = Conversation(sender: User(
            id: Get.find<ProfileController>().profileModel!.id, imageFullUrl: Get.find<ProfileController>().profileModel!.imageFullUrl,
            fName: Get.find<ProfileController>().profileModel!.fName, lName: Get.find<ProfileController>().profileModel!.lName,
          ), receiver: user);
        }else if(_messageModel!.conversation != null && _messageModel!.conversation!.receiverType == 'delivery_man') {
          User? receiver = _messageModel!.conversation!.receiver;
          _messageModel!.conversation!.receiver = _messageModel!.conversation!.sender;
          _messageModel!.conversation!.sender = receiver;
        }
      }else {
        _messageModel!.totalSize = MessageModel.fromJson(response.body).totalSize;
        _messageModel!.offset = MessageModel.fromJson(response.body).offset;
        _messageModel!.messages!.addAll(MessageModel.fromJson(response.body).messages!);
      }
    }
    _isLoading = false;
    update();

  }

/*  void pickImage(bool isRemove) async {
    final ImagePicker picker = ImagePicker();
    if(isRemove) {
      _imageFiles = [];
      _chatImage = [];
    }else {
      _imageFiles = await picker.pickMultiImage(imageQuality: 30);
      if (_imageFiles != null) {
        _chatImage = imageFiles;
        _isSendButtonActive = true;
      }
    }
    update();
  }*/

  void pickImage(bool isRemove) async {
    _takeImageLoading = true;
    update();

    if(isRemove) {
      _chatImage = [];
      _chatRawImage = [];
    } else {
      List<XFile> imageFiles = await ImagePicker().pickMultiImage(imageQuality: 40);
      for(XFile xFile in imageFiles) {
        if(_chatImage!.length >= AppConstants.maxImageSend) {
          showCustomSnackBar('can_not_add_more_than_3_image'.tr);
          break;
        }else {
          objFile = [];
          _pickedVideoFile = null;
          _chatImage?.add(xFile);
          _chatRawImage.add(await xFile.readAsBytes());
        }
      }
      _isSendButtonActive = true;
    }
    _takeImageLoading = false;
    update();
  }

  void pickFile(bool isRemove, {int? index}) async {
    _takeImageLoading = true;
    update();

    _singleFIleCrossMaxLimit = false;

    if(isRemove) {
      objFile.removeAt(index!);
    } else {
      List<PlatformFile>? platformFile = (await FilePicker.platform.pickFiles(
        allowMultiple: true,
        withReadStream: true,
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc'],
      ))?.files ;

      objFile = [];
      _chatImage = [];
      _pickedVideoFile = null;

      platformFile?.forEach((element) async {
        if(_getFileSizeFromPlatformFileToDouble(element) > AppConstants.maxSizeOfASingleFile) {
          _singleFIleCrossMaxLimit = true;
        } else {
          if(objFile.length < AppConstants.maxLimitOfTotalFileSent){
            if((await _getMultipleFileSizeFromPlatformFiles(objFile) + _getFileSizeFromPlatformFileToDouble(element)) < AppConstants.maxLimitOfFileSentINConversation){
              objFile.add(element.xFile);
            }
            // objFile.add(element.xFile);
          }

        }
      });

      _isSendButtonActive = true;
    }
    _takeImageLoading = false;
    update();
  }

  void pickVideoFile(bool isRemove) async {
    _takeImageLoading = true;
    update();

    if(isRemove) {
      _pickedVideoFile = null;
    } else {
      _pickedVideoFile = await ImagePicker().pickVideo(source: ImageSource.gallery);
      if(_pickedVideoFile != null){
        double videoSize = await ImageSize.getImageSizeFromXFile(_pickedVideoFile!);
        if(videoSize > AppConstants.limitOfPickedVideoSizeInMB){
          _pickedVideoFile = null;
          showCustomSnackBar('${"video_size_greater_than".tr} ${AppConstants.limitOfPickedVideoSizeInMB}mb');
          update();
        }else{
          _chatImage = [];
          objFile = [];
        }

      }
      _isSendButtonActive = true;
    }
    _takeImageLoading = false;
    update();
  }

  void removeImage(int index,  String messageText){
    _chatImage?.removeAt(index);
    _chatRawImage.removeAt(index);
    if(_chatImage!.isEmpty && messageText.isEmpty) {
      _isSendButtonActive = false;
    }
    update();
  }

  void toggleSendButtonActivity() {
    _isSendButtonActive = !_isSendButtonActive;
    update();
  }

  Future<Response?> sendMessage({required String message, required NotificationBodyModel? notificationBody, required int? conversationId}) async {
    Response? response;
    _isLoading = true;
    update();

    List<MultipartBody> myImages = chatServiceInterface.processImages(_chatImage, objFile, _pickedVideoFile);

    if(notificationBody != null && (notificationBody.customerId != null || notificationBody.type == UserType.user.name)) {
      response = await chatServiceInterface.sendMessage(message, myImages, conversationId, notificationBody.customerId, UserType.customer);
    }else if(notificationBody != null && (notificationBody.vendorId != null || notificationBody.type == UserType.vendor.name)){
      response = await chatServiceInterface.sendMessage(message, myImages, conversationId, notificationBody.vendorId, UserType.vendor);
    }

    if (response!.statusCode == 200) {
      _chatImage = [];
      objFile = [];
      _pickedVideoFile = null;
      _chatRawImage = [];
      _isSendButtonActive = false;
      _isLoading = false;
      _messageModel = MessageModel.fromJson(response.body);
      if(_messageModel!.conversation != null && _messageModel!.conversation!.receiverType == 'delivery_man') {
        User? receiver = _messageModel!.conversation!.receiver;
        _messageModel!.conversation!.receiver = _messageModel!.conversation!.sender;
        _messageModel!.conversation!.sender = receiver;
      }
    }
    update();
    return response;
  }

  void setType(String type, {bool willUpdate = true}) {
    _type = type;
    if(willUpdate) {
      update();
    }
  }

  void setTabSelect() {
    _clickTab = !_clickTab;
  }

  String getChatTime(String todayChatTimeInUtc, String? nextChatTimeInUtc) {
    String chatTime = '';
    DateTime todayConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(todayChatTimeInUtc);
    try{
      todayConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(todayChatTimeInUtc);
    }catch(e) {
      todayConversationDateTime = DateConverter.dateTimeStringToDate(todayChatTimeInUtc);
    }

    if (kDebugMode) {
      print("Current Message DataTime: $todayConversationDateTime");
    }

    DateTime nextConversationDateTime;
    DateTime currentDate = DateTime.now();

    if(nextChatTimeInUtc == null){
      return chatTime = DateConverter.isoStringToLocalDateAndTime(todayChatTimeInUtc);
    }else{
      nextConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(nextChatTimeInUtc);
      if (kDebugMode) {
        print("Next Message DateTime: $nextConversationDateTime");
        print("The Difference between this two : ${todayConversationDateTime.difference(nextConversationDateTime)}");
        print("Today message Weekday: ${todayConversationDateTime.weekday}\n Next Message WeekDay: ${nextConversationDateTime.weekday}");
      }


      if(todayConversationDateTime.difference(nextConversationDateTime) < const Duration(minutes: 30) &&
          todayConversationDateTime.weekday == nextConversationDateTime.weekday){
        chatTime = '';
      }else if(currentDate.weekday != todayConversationDateTime.weekday
          && DateConverter.countDays(todayConversationDateTime) < 6){
        if( (currentDate.weekday -1 == 0 ? 7 : currentDate.weekday -1) == todayConversationDateTime.weekday){
          chatTime = DateConverter.convert24HourTimeTo12HourTimeWithDay(todayConversationDateTime, false);
        }else{
          chatTime = DateConverter.convertStringTimeToDateTime(todayConversationDateTime);
        }

      }else if(currentDate.weekday == todayConversationDateTime.weekday
          && DateConverter.countDays(todayConversationDateTime) < 6){
        chatTime = DateConverter.convert24HourTimeTo12HourTimeWithDay(todayConversationDateTime, true);
      }else{
        chatTime = DateConverter.isoStringToLocalDateAndTime(todayChatTimeInUtc);
      }
    }
    return chatTime;
  }

  String getChatTimeWithPrevious (Message currentChat, Message? previousChat) {
    DateTime todayConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(currentChat.createdAt ?? "");

    DateTime previousConversationDateTime;

    if(previousChat?.createdAt == null) {
      return 'Not-Same';
    } else {
      previousConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(previousChat!.createdAt!);
      if(kDebugMode) {
        print("The Difference is ${previousConversationDateTime.difference(todayConversationDateTime) < const Duration(minutes: 30)}");
      }
      if(previousConversationDateTime.difference(todayConversationDateTime) < const Duration(minutes: 30) &&
          todayConversationDateTime.weekday == previousConversationDateTime.weekday && _isSameUserWithPreviousMessage(currentChat, previousChat)) {
        return '';
      } else {
        return 'Not-Same';
      }
    }
  }

  bool _isSameUserWithPreviousMessage(Message? previousConversation, Message? currentConversation){
    if(previousConversation?.senderId == currentConversation?.senderId && previousConversation?.message != null && currentConversation?.message !=null){
      return true;
    }
    return false;
  }

  void toggleOnClickMessage(int onMessageTimeShowID, {bool recall = true}) {
    _onImageOrFileTimeShowID = 0;
    _isClickedOnImageOrFile = false;
    if(_isClickedOnMessage && _onMessageTimeShowID != onMessageTimeShowID){
      _onMessageTimeShowID = onMessageTimeShowID;
    }else if(_isClickedOnMessage && _onMessageTimeShowID == onMessageTimeShowID){
      _isClickedOnMessage = false;
      _onMessageTimeShowID = 0;
    }else{
      _isClickedOnMessage = true;
      _onMessageTimeShowID = onMessageTimeShowID;
    }
    update();
  }

  String? getOnPressChatTime(Message currentMessage) {

    if(currentMessage.id == _onMessageTimeShowID || currentMessage.id == _onImageOrFileTimeShowID){
      DateTime currentDate = DateTime.now();
      DateTime todayConversationDateTime = DateConverter.isoUtcStringToLocalTimeOnly(currentMessage.createdAt ?? "");

      if(currentDate.weekday != todayConversationDateTime.weekday && DateConverter.countDays(todayConversationDateTime) <= 7){
        return DateConverter.convertDateTimeToDate(todayConversationDateTime);
      }else if(currentDate.weekday == todayConversationDateTime.weekday
          && DateConverter.countDays(todayConversationDateTime) <= 7){
        return DateConverter.convertDateTimeToDate(todayConversationDateTime);
      }else{
        return DateConverter.isoStringToLocalDateAndTime(currentMessage.createdAt!);
      }
    }else{
      return null;
    }
  }

  void toggleOnClickImageAndFile(int onImageOrFileTimeShowID) {
    _onMessageTimeShowID = 0;
    _isClickedOnMessage = false;
    if(_isClickedOnImageOrFile && _onImageOrFileTimeShowID != onImageOrFileTimeShowID){
      _onImageOrFileTimeShowID = onImageOrFileTimeShowID;
    }else if(_isClickedOnImageOrFile && _onImageOrFileTimeShowID == onImageOrFileTimeShowID){
      _isClickedOnImageOrFile = false;
      _onImageOrFileTimeShowID = 0;
    }else{
      _isClickedOnImageOrFile = true;
      _onImageOrFileTimeShowID = onImageOrFileTimeShowID;
    }
    update();
  }

  double _getFileSizeFromPlatformFileToDouble(PlatformFile platformFile)  {
    return (platformFile.size / (1024 * 1024));
  }

  Future<double> _getMultipleFileSizeFromPlatformFiles(List<XFile> platformFiles)  async {
    double fileSize = 0.0;
    for (var element in platformFiles) {
      int sizeInKB =  await element.length();
      double sizeInMB = sizeInKB / (1024 * 1024);
      fileSize  = sizeInMB + fileSize;
    }
    return fileSize;
  }


}