import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message, MessageType, MessageStatus } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { SendMessageDto, TypingIndicatorDto, MarkAsReadDto } from './dto/send-message.dto';

export interface ConversationWithLastMessage extends Conversation {
  lastMessage?: Message;
  unreadCount?: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Send a message - creates conversation if needed
   */
  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const receiver = await this.userRepository.findOne({ where: { id: dto.receiverId } });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Find or create conversation
    let conversation: Conversation | null = null;

    if (dto.conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: dto.conversationId },
        relations: ['participant1', 'participant2'],
      });
    }

    if (!conversation) {
      // Try to find existing conversation between these users
      conversation = await this.conversationRepository.findOne({
        where: [
          { participant1: { id: senderId }, participant2: { id: dto.receiverId } },
          { participant1: { id: dto.receiverId }, participant2: { id: senderId } },
        ],
        relations: ['participant1', 'participant2'],
      });

      if (!conversation) {
        conversation = this.conversationRepository.create({
          participant1: sender,
          participant2: receiver,
        });

        if (dto.productId) {
          const product = await this.productRepository.findOne({
            where: { id: dto.productId },
          });
          if (product) {
            conversation.product = product;
          }
        }

        conversation = await this.conversationRepository.save(conversation);
      }
    }

    const message = this.messageRepository.create({
      conversation,
      sender,
      receiver,
      content: dto.content,
      type: dto.type || MessageType.TEXT,
      attachments: dto.attachments || [],
      status: MessageStatus.SENT,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last message
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver', 'conversation'],
    }) as Promise<Message>;
  }

  /**
   * Get user's conversations
   */
  async getConversations(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: ConversationWithLastMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: [
        { participant1: { id: userId } },
        { participant2: { id: userId } },
      ],
      relations: ['participant1', 'participant2', 'product'],
      order: { lastMessageAt: 'DESC' },
      skip,
      take: limit,
    });

    // Get last message and unread count for each conversation
    const data: ConversationWithLastMessage[] = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { conversation: { id: conv.id } },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            conversation: { id: conv.id },
            receiver: { id: userId },
            isRead: false,
          },
        });

        return {
          ...conv,
          lastMessage: lastMessage || undefined,
          unreadCount,
        };
      }),
    );

    return { data, total, page, limit };
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is a participant
    if (
      conversation.participant1.id !== userId &&
      conversation.participant2.id !== userId
    ) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Mark messages as read
    await this.markConversationAsRead(userId, conversationId);

    return {
      data: data.reverse(), // Return in chronological order
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark a message as read
   */
  async markAsRead(userId: string, messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['receiver', 'conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiver.id !== userId) {
      throw new ForbiddenException('You can only mark messages sent to you as read');
    }

    message.isRead = true;
    message.status = MessageStatus.READ;
    message.readAt = new Date();

    return this.messageRepository.save(message);
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        receiver: { id: userId },
        isRead: false,
      },
      {
        isRead: true,
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    );
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        receiver: { id: userId },
        isRead: false,
      },
    });
  }

  /**
   * Get unread count per conversation for user
   */
  async getUnreadCountsByConversation(userId: string): Promise<Record<string, number>> {
    const conversations = await this.conversationRepository.find({
      where: [
        { participant1: { id: userId } },
        { participant2: { id: userId } },
      ],
    });

    const result: Record<string, number> = {};

    for (const conv of conversations) {
      const count = await this.messageRepository.count({
        where: {
          conversation: { id: conv.id },
          receiver: { id: userId },
          isRead: false,
        },
      });
      result[conv.id] = count;
    }

    return result;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await this.messageRepository.save(message);
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participant1', 'participant2', 'product'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participant1.id !== userId &&
      conversation.participant2.id !== userId
    ) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return conversation;
  }
}
