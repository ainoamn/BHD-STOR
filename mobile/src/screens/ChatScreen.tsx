import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  products?: { id: string; name: string; price: number; image: string }[];
}

interface ChatScreenProps {
  locale?: string;
}

const quickSuggestions = [
  'Track my order',
  'Find dates products',
  'Return policy',
  'Contact support',
];

const mockResponses: Record<string, string> = {
  'Track my order':
    'I can help you track your order! Please provide your order number (e.g., ORD-123456) and I will look it up for you.',
  'Find dates products':
    'We have a wonderful selection of Omani dates! Here are some popular options:',
  'Return policy':
    'Our return policy allows returns within 14 days of delivery. Items must be unused and in original packaging. Would you like me to help you initiate a return?',
  'Contact support':
    'You can reach our support team at support@bhdoman.com or call us at +968 1234 5678. We are available Saturday to Thursday, 9 AM to 6 PM.',
};

const ChatScreen: React.FC<ChatScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hello! I am your BHD Oman AI Assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseText =
        mockResponses[messageText] ||
        'Thank you for your message. I am connecting you with the right information. For more specific help, please contact our support team at support@bhdoman.com.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
        products:
          messageText === 'Find dates products'
            ? [
                {
                  id: 'p1',
                  name: 'Premium Khalas Dates 1kg',
                  price: 5.5,
                  image: 'https://via.placeholder.com/100?text=Dates',
                },
                {
                  id: 'p2',
                  name: 'Fardh Dates Gift Box',
                  price: 8.0,
                  image: 'https://via.placeholder.com/100?text=Gift',
                },
                {
                  id: 'p3',
                  name: 'Organic Ajwa Dates',
                  price: 12.0,
                  image: 'https://via.placeholder.com/100?text=Ajwa',
                },
              ]
            : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user'
          ? styles.userMessageContainer
          : styles.aiMessageContainer,
        { flexDirection: rtl ? 'row-reverse' : 'row' },
      ]}
    >
      {item.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <Icon name="robot" size={18} color={colors.textInverse} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user'
            ? styles.userBubble
            : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === 'user'
              ? styles.userMessageText
              : styles.aiMessageText,
            { textAlign: item.sender === 'ai' && rtl ? 'right' : 'left' },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            item.sender === 'user'
              ? styles.userMessageTime
              : styles.aiMessageTime,
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {item.sender === 'user' && (
        <View style={[styles.userAvatar, { marginLeft: 8, marginRight: 0 }]}>
          <Icon name="account" size={18} color={colors.textInverse} />
        </View>
      )}

      {/* Product Recommendations */}
      {item.products && item.products.length > 0 && (
        <View style={styles.productsRow}>
          {item.products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productChip}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: product.id })
              }
            >
              <Text style={styles.productChipName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productChipPrice}>
                OMR {product.price.toFixed(3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>BHD Assistant</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Icon name="dots-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={[styles.typingContainer, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.aiAvatar}>
            <Icon name="robot" size={16} color={colors.textInverse} />
          </View>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          </View>
        </View>
      )}

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContainer}
        >
          {quickSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSend(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="paperclip" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
          placeholder="Type your message..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
        >
          <Icon
            name="send"
            size={20}
            color={inputText.trim() ? colors.textInverse : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 11,
    color: colors.success,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  aiMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: `${colors.textInverse}80`,
    textAlign: 'right',
  },
  aiMessageTime: {
    color: colors.textMuted,
  },
  // Product Recommendations
  productsRow: {
    flexDirection: 'row',
    marginLeft: 40,
    marginTop: 8,
    gap: 8,
  },
  productChip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minWidth: 120,
  },
  productChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productChipPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  // Suggestions
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
  },
});

export default ChatScreen;
