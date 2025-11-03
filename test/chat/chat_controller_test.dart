import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/chat/controllers/chat_controller.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/conversation_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/models/message_model.dart';
import 'package:stackfood_multivendor_driver/feature/chat/domain/services/chat_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/helper/user_type_helper.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';

import 'chat_controller_test.mocks.dart';

@GenerateMocks([ChatServiceInterface, ProfileController])
void main() {
  group('ChatController Tests', () {
    late ChatController chatController;
    late MockChatServiceInterface mockChatService;
    late MockProfileController mockProfileController;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockChatService = MockChatServiceInterface();
      mockProfileController = MockProfileController();
      chatController = ChatController(chatServiceInterface: mockChatService);

      // Register the mock ProfileController
      Get.put<ProfileController>(mockProfileController);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with null models and default values', () {
        expect(chatController.conversationModel, isNull);
        expect(chatController.messageModel, isNull);
        expect(chatController.searchConversationModel, isNull);
        expect(chatController.isLoading, false);
        expect(chatController.isSendButtonActive, false);
        expect(chatController.type, 'customer');
        expect(chatController.tabLoading, false);
      });
    });

    group('Get Conversation List', () {
      test('Should successfully get conversation list with offset 1', () async {
        // Arrange
        final mockConversations = ConversationsModel(
          totalSize: 2,
          limit: 10,
          offset: 1,
          conversations: [
            Conversation(
              id: 1,
              senderId: 1,
              receiverId: 2,
              sender: User(id: 1, fName: 'John', lName: 'Doe'),
              receiver: User(id: 2, fName: 'Jane', lName: 'Smith'),
            ),
            Conversation(
              id: 2,
              senderId: 1,
              receiverId: 3,
              sender: User(id: 1, fName: 'John', lName: 'Doe'),
              receiver: User(id: 3, fName: 'Bob', lName: 'Wilson'),
            ),
          ],
        );

        when(mockChatService.getConversationList(1, 'customer'))
            .thenAnswer((_) async => mockConversations);

        // Act
        await chatController.getConversationList(1, type: 'customer');

        // Assert
        expect(chatController.conversationModel, isNotNull);
        expect(chatController.conversationModel!.conversations!.length, 2);
        expect(chatController.conversationModel!.totalSize, 2);
        expect(chatController.tabLoading, false);
        verify(mockChatService.getConversationList(1, 'customer')).called(1);
      });

      test('Should append conversations with offset > 1', () async {
        // Arrange - First load
        final firstConversations = ConversationsModel(
          totalSize: 3,
          limit: 2,
          offset: 1,
          conversations: [
            Conversation(
              id: 1,
              senderId: 1,
              receiverId: 2,
              sender: User(id: 1, fName: 'John', lName: 'Doe'),
              receiver: User(id: 2, fName: 'Jane', lName: 'Smith'),
            ),
          ],
        );

        when(mockChatService.getConversationList(1, 'customer'))
            .thenAnswer((_) async => firstConversations);

        await chatController.getConversationList(1, type: 'customer');

        // Arrange - Second load
        final secondConversations = ConversationsModel(
          totalSize: 3,
          limit: 2,
          offset: 2,
          conversations: [
            Conversation(
              id: 2,
              senderId: 1,
              receiverId: 3,
              sender: User(id: 1, fName: 'John', lName: 'Doe'),
              receiver: User(id: 3, fName: 'Bob', lName: 'Wilson'),
            ),
          ],
        );

        when(mockChatService.getConversationList(2, 'customer'))
            .thenAnswer((_) async => secondConversations);

        // Act
        await chatController.getConversationList(2, type: 'customer');

        // Assert
        expect(chatController.conversationModel!.conversations!.length, 2);
        expect(chatController.conversationModel!.totalSize, 3);
        expect(chatController.conversationModel!.offset, 2);
      });

      test('Should handle null response from service', () async {
        // Arrange
        when(mockChatService.getConversationList(1, 'customer'))
            .thenAnswer((_) async => null);

        // Act
        await chatController.getConversationList(1, type: 'customer');

        // Assert
        expect(chatController.conversationModel, isNull);
        expect(chatController.tabLoading, false);
      });

      test('Should clear search conversation model when loading', () async {
        // Arrange - First set search conversation model via search
        final searchResults = ConversationsModel(conversations: [
          Conversation(
            id: 99,
            senderId: 1,
            receiverId: 2,
            sender: User(id: 1, fName: 'Search', lName: 'User'),
            receiver: User(id: 2, fName: 'Test', lName: 'User'),
          ),
        ]);
        when(mockChatService.searchConversationList('test'))
            .thenAnswer((_) async => searchResults);
        await chatController.searchConversation('test');

        // Verify search model is set
        expect(chatController.searchConversationModel, isNotNull);

        when(mockChatService.getConversationList(1, 'vendor'))
            .thenAnswer((_) async => ConversationsModel(conversations: []));

        // Act
        await chatController.getConversationList(1, type: 'vendor');

        // Assert
        expect(chatController.searchConversationModel, isNull);
      });
    });

    group('Search Conversation', () {
      test('Should successfully search conversations', () async {
        // Arrange
        final searchResults = ConversationsModel(
          totalSize: 1,
          conversations: [
            Conversation(
              id: 1,
              senderId: 1,
              receiverId: 2,
              sender: User(id: 1, fName: 'John', lName: 'Doe'),
              receiver: User(id: 2, fName: 'Jane', lName: 'Smith'),
            ),
          ],
        );

        when(mockChatService.searchConversationList('Jane'))
            .thenAnswer((_) async => searchResults);

        // Act
        await chatController.searchConversation('Jane');

        // Assert
        expect(chatController.searchConversationModel, isNotNull);
        expect(chatController.searchConversationModel!.conversations!.length, 1);
        verify(mockChatService.searchConversationList('Jane')).called(1);
      });

      test('Should handle null search results', () async {
        // Arrange
        when(mockChatService.searchConversationList('NonExistent'))
            .thenAnswer((_) async => null);

        // Act
        await chatController.searchConversation('NonExistent');

        // Assert
        expect(chatController.searchConversationModel, isNotNull);
        expect(chatController.searchConversationModel!.conversations, isNull);
      });
    });

    group('Remove Search Mode', () {
      test('Should clear search conversation model', () async {
        // Arrange - First set search conversation model via search
        final searchResults = ConversationsModel(conversations: [
          Conversation(
            id: 1,
            senderId: 1,
            receiverId: 2,
            sender: User(id: 1, fName: 'Test', lName: 'User'),
            receiver: User(id: 2, fName: 'Another', lName: 'User'),
          ),
        ]);
        when(mockChatService.searchConversationList('test'))
            .thenAnswer((_) async => searchResults);
        await chatController.searchConversation('test');

        // Verify it's set before removing
        expect(chatController.searchConversationModel, isNotNull);

        // Act
        chatController.removeSearchMode();

        // Assert
        expect(chatController.searchConversationModel, isNull);
      });
    });

    group('Get Messages', () {
      test('Should successfully get messages for customer', () async {
        // Arrange
        final notificationBody = NotificationBodyModel(
          customerId: 123,
          type: UserType.user.name,
          conversationId: 1,
        );

        final mockResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 1,
                'conversation_id': 1,
                'sender_id': 123,
                'message': 'Hello',
                'file_full_url': [],
                'is_seen': 0,
                'created_at': '2024-01-01T10:00:00.000Z',
                'updated_at': '2024-01-01T10:00:00.000Z',
              },
            ],
            'total_size': 1,
            'limit': 10,
            'offset': 1,
          },
        );

        final mockProfileModel = ProfileModel(
          id: 999,
          fName: 'Delivery',
          lName: 'Man',
          imageFullUrl: 'https://example.com/image.jpg',
        );

        when(mockProfileController.profileModel).thenReturn(mockProfileModel);
        when(mockProfileController.getProfile()).thenAnswer((_) async {});
        when(mockChatService.getMessages(1, 123, UserType.user, 1))
            .thenAnswer((_) async => mockResponse);

        // Act
        await chatController.getMessages(1, notificationBody, null, 1, firstLoad: false);

        // Assert
        expect(chatController.messageModel, isNotNull);
        expect(chatController.messageModel!.messages!.length, 1);
        expect(chatController.messageModel!.messages![0].message, 'Hello');
        expect(chatController.isLoading, false);
        verify(mockChatService.getMessages(1, 123, UserType.user, 1)).called(1);
      });

      test('Should successfully get messages for vendor', () async {
        // Arrange
        final notificationBody = NotificationBodyModel(
          vendorId: 456,
          type: UserType.vendor.name,
          conversationId: 2,
        );

        final mockResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 2,
                'conversation_id': 2,
                'sender_id': 456,
                'message': 'Order ready',
                'file_full_url': [],
                'is_seen': 1,
                'created_at': '2024-01-01T11:00:00.000Z',
                'updated_at': '2024-01-01T11:00:00.000Z',
              },
            ],
            'total_size': 1,
            'limit': 10,
            'offset': 1,
          },
        );

        final mockProfileModel = ProfileModel(
          id: 999,
          fName: 'Delivery',
          lName: 'Man',
          imageFullUrl: 'https://example.com/image.jpg',
        );

        when(mockProfileController.profileModel).thenReturn(mockProfileModel);
        when(mockProfileController.getProfile()).thenAnswer((_) async {});
        when(mockChatService.getMessages(1, 456, UserType.vendor, 2))
            .thenAnswer((_) async => mockResponse);

        // Act
        await chatController.getMessages(1, notificationBody, null, 2, firstLoad: false);

        // Assert
        expect(chatController.messageModel, isNotNull);
        expect(chatController.messageModel!.messages!.length, 1);
        verify(mockChatService.getMessages(1, 456, UserType.vendor, 2)).called(1);
      });

      test('Should append messages with offset > 1', () async {
        // Arrange - First load
        final notificationBody = NotificationBodyModel(
          customerId: 123,
          type: UserType.user.name,
        );

        final firstResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 1,
                'conversation_id': 1,
                'sender_id': 123,
                'message': 'First message',
                'file_full_url': [],
                'is_seen': 1,
                'created_at': '2024-01-01T10:00:00.000Z',
                'updated_at': '2024-01-01T10:00:00.000Z',
              },
            ],
            'total_size': 2,
            'limit': 1,
            'offset': 1,
          },
        );

        final mockProfileModel = ProfileModel(
          id: 999,
          fName: 'Delivery',
          lName: 'Man',
          imageFullUrl: 'https://example.com/image.jpg',
        );

        when(mockProfileController.profileModel).thenReturn(mockProfileModel);
        when(mockProfileController.getProfile()).thenAnswer((_) async {});
        when(mockChatService.getMessages(1, 123, UserType.user, null))
            .thenAnswer((_) async => firstResponse);

        await chatController.getMessages(1, notificationBody, null, null, firstLoad: false);

        // Arrange - Second load
        final secondResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 2,
                'conversation_id': 1,
                'sender_id': 123,
                'message': 'Second message',
                'file_full_url': [],
                'is_seen': 0,
                'created_at': '2024-01-01T09:00:00.000Z',
                'updated_at': '2024-01-01T09:00:00.000Z',
              },
            ],
            'total_size': 2,
            'limit': 1,
            'offset': 2,
          },
        );

        when(mockChatService.getMessages(2, 123, UserType.user, null))
            .thenAnswer((_) async => secondResponse);

        // Act
        await chatController.getMessages(2, notificationBody, null, null, firstLoad: false);

        // Assert
        expect(chatController.messageModel!.messages!.length, 2);
        expect(chatController.messageModel!.totalSize, 2);
        expect(chatController.messageModel!.offset, 2);
      });

      test('Should clear messages on first load', () async {
        // Arrange - First load some old messages
        final notificationBody = NotificationBodyModel(
          customerId: 123,
          type: UserType.user.name,
        );

        final oldMessageResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 99,
                'conversation_id': 1,
                'sender_id': 123,
                'message': 'Old message',
                'file_full_url': [],
                'is_seen': 1,
                'created_at': '2024-01-01T09:00:00.000Z',
                'updated_at': '2024-01-01T09:00:00.000Z',
              },
            ],
            'total_size': 1,
            'limit': 10,
            'offset': 1,
          },
        );

        final mockProfileModel = ProfileModel(
          id: 999,
          fName: 'Delivery',
          lName: 'Man',
          imageFullUrl: 'https://example.com/image.jpg',
        );

        when(mockProfileController.profileModel).thenReturn(mockProfileModel);
        when(mockProfileController.getProfile()).thenAnswer((_) async {});
        when(mockChatService.getMessages(1, 123, UserType.user, null))
            .thenAnswer((_) async => oldMessageResponse);

        await chatController.getMessages(1, notificationBody, null, null, firstLoad: false);

        // Verify old message is loaded
        expect(chatController.messageModel!.messages!.length, 1);
        expect(chatController.messageModel!.messages![0].id, 99);

        // Arrange - Now load new messages with firstLoad: true
        final newMessageResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 1,
                'conversation_id': 1,
                'sender_id': 123,
                'message': 'New message',
                'file_full_url': [],
                'is_seen': 0,
                'created_at': '2024-01-01T10:00:00.000Z',
                'updated_at': '2024-01-01T10:00:00.000Z',
              },
            ],
            'total_size': 1,
            'limit': 10,
            'offset': 1,
          },
        );

        when(mockChatService.getMessages(1, 123, UserType.user, null))
            .thenAnswer((_) async => newMessageResponse);

        // Act - Load with firstLoad: true should clear old messages
        await chatController.getMessages(1, notificationBody, null, null, firstLoad: true);

        // Assert - Should only have the new message
        expect(chatController.messageModel!.messages!.length, 1);
        expect(chatController.messageModel!.messages![0].id, 1);
        expect(chatController.messageModel!.messages![0].message, 'New message');
      });
    });

    group('Send Message', () {
      test('Should successfully send message to customer', () async {
        // Arrange
        final notificationBody = NotificationBodyModel(
          customerId: 123,
          type: UserType.user.name,
          conversationId: 1,
        );

        final mockResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 1,
                'conversation_id': 1,
                'sender_id': 999,
                'message': 'Test message',
                'file_full_url': [],
                'is_seen': 0,
                'created_at': '2024-01-01T10:00:00.000Z',
                'updated_at': '2024-01-01T10:00:00.000Z',
              },
            ],
            'total_size': 1,
          },
        );

        when(mockChatService.processImages(any, any, any)).thenReturn([]);
        when(mockChatService.sendMessage('Test message', [], 1, 123, UserType.customer))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await chatController.sendMessage(
          message: 'Test message',
          notificationBody: notificationBody,
          conversationId: 1,
        );

        // Assert
        expect(result, isNotNull);
        expect(result!.statusCode, 200);
        expect(chatController.isSendButtonActive, false);
        expect(chatController.isLoading, false);
        expect(chatController.chatImage, isEmpty);
        verify(mockChatService.sendMessage('Test message', [], 1, 123, UserType.customer)).called(1);
      });

      test('Should successfully send message to vendor', () async {
        // Arrange
        final notificationBody = NotificationBodyModel(
          vendorId: 456,
          type: UserType.vendor.name,
          conversationId: 2,
        );

        final mockResponse = Response(
          statusCode: 200,
          body: {
            'messages': [
              {
                'id': 2,
                'conversation_id': 2,
                'sender_id': 999,
                'message': 'Vendor message',
                'file_full_url': [],
                'is_seen': 0,
                'created_at': '2024-01-01T11:00:00.000Z',
                'updated_at': '2024-01-01T11:00:00.000Z',
              },
            ],
            'total_size': 1,
          },
        );

        when(mockChatService.processImages(any, any, any)).thenReturn([]);
        when(mockChatService.sendMessage('Vendor message', [], 2, 456, UserType.vendor))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await chatController.sendMessage(
          message: 'Vendor message',
          notificationBody: notificationBody,
          conversationId: 2,
        );

        // Assert
        expect(result, isNotNull);
        expect(result!.statusCode, 200);
        verify(mockChatService.sendMessage('Vendor message', [], 2, 456, UserType.vendor)).called(1);
      });
    });

    group('Toggle Send Button Activity', () {
      test('Should toggle send button activity', () {
        // Arrange
        expect(chatController.isSendButtonActive, false);

        // Act
        chatController.toggleSendButtonActivity();

        // Assert
        expect(chatController.isSendButtonActive, true);

        // Act again
        chatController.toggleSendButtonActivity();

        // Assert
        expect(chatController.isSendButtonActive, false);
      });
    });

    group('Set Type', () {
      test('Should set type to vendor', () {
        // Arrange
        expect(chatController.type, 'customer');

        // Act
        chatController.setType('vendor');

        // Assert
        expect(chatController.type, 'vendor');
      });

      test('Should set type without update', () {
        // Act
        chatController.setType('vendor', willUpdate: false);

        // Assert
        expect(chatController.type, 'vendor');
      });
    });

    group('Tab Select', () {
      test('Should toggle tab select', () {
        // Arrange
        expect(chatController.clickTab, false);

        // Act
        chatController.setTabSelect();

        // Assert
        expect(chatController.clickTab, true);

        // Act again
        chatController.setTabSelect();

        // Assert
        expect(chatController.clickTab, false);
      });
    });

    group('Toggle On Click Message', () {
      test('Should set message time show ID', () {
        // Arrange
        expect(chatController.isClickedOnMessage, false);
        expect(chatController.onMessageTimeShowID, 0);

        // Act
        chatController.toggleOnClickMessage(5);

        // Assert
        expect(chatController.isClickedOnMessage, true);
        expect(chatController.onMessageTimeShowID, 5);
      });

      test('Should unset message time show ID when clicked again', () {
        // Arrange
        chatController.toggleOnClickMessage(5);
        expect(chatController.isClickedOnMessage, true);

        // Act
        chatController.toggleOnClickMessage(5);

        // Assert
        expect(chatController.isClickedOnMessage, false);
        expect(chatController.onMessageTimeShowID, 0);
      });

      test('Should switch to different message ID', () {
        // Arrange
        chatController.toggleOnClickMessage(5);

        // Act
        chatController.toggleOnClickMessage(10);

        // Assert
        expect(chatController.isClickedOnMessage, true);
        expect(chatController.onMessageTimeShowID, 10);
      });

      test('Should reset image or file time show ID', () {
        // Arrange
        chatController.toggleOnClickImageAndFile(3);
        expect(chatController.onImageOrFileTimeShowID, 3);

        // Act
        chatController.toggleOnClickMessage(5);

        // Assert
        expect(chatController.onImageOrFileTimeShowID, 0);
        expect(chatController.isClickedOnImageOrFile, false);
      });
    });

    group('Toggle On Click Image And File', () {
      test('Should set image or file time show ID', () {
        // Arrange
        expect(chatController.isClickedOnImageOrFile, false);
        expect(chatController.onImageOrFileTimeShowID, 0);

        // Act
        chatController.toggleOnClickImageAndFile(7);

        // Assert
        expect(chatController.isClickedOnImageOrFile, true);
        expect(chatController.onImageOrFileTimeShowID, 7);
      });

      test('Should unset image or file time show ID when clicked again', () {
        // Arrange
        chatController.toggleOnClickImageAndFile(7);

        // Act
        chatController.toggleOnClickImageAndFile(7);

        // Assert
        expect(chatController.isClickedOnImageOrFile, false);
        expect(chatController.onImageOrFileTimeShowID, 0);
      });

      test('Should reset message time show ID', () {
        // Arrange
        chatController.toggleOnClickMessage(5);
        expect(chatController.onMessageTimeShowID, 5);

        // Act
        chatController.toggleOnClickImageAndFile(7);

        // Assert
        expect(chatController.onMessageTimeShowID, 0);
        expect(chatController.isClickedOnMessage, false);
      });
    });

    group('Get On Press Chat Time', () {
      test('Should return formatted time when message ID matches onMessageTimeShowID', () {
        // Arrange
        final message = Message(
          id: 5,
          conversationId: 1,
          senderId: 123,
          message: 'Test',
          createdAt: '2024-01-01T10:00:00.000Z',
        );
        chatController.toggleOnClickMessage(5);

        // Act
        final result = chatController.getOnPressChatTime(message);

        // Assert
        expect(result, isNotNull);
      });

      test('Should return formatted time when message ID matches onImageOrFileTimeShowID', () {
        // Arrange
        final message = Message(
          id: 7,
          conversationId: 1,
          senderId: 123,
          message: 'Test',
          createdAt: '2024-01-01T10:00:00.000Z',
        );
        chatController.toggleOnClickImageAndFile(7);

        // Act
        final result = chatController.getOnPressChatTime(message);

        // Assert
        expect(result, isNotNull);
      });

      test('Should return null when message ID does not match', () {
        // Arrange
        final message = Message(
          id: 99,
          conversationId: 1,
          senderId: 123,
          message: 'Test',
          createdAt: '2024-01-01T10:00:00.000Z',
        );

        // Act
        final result = chatController.getOnPressChatTime(message);

        // Assert
        expect(result, isNull);
      });
    });
  });
}
