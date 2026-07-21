// =============================================================================
// BHD Oman Marketplace - WhatsApp Service
// =============================================================================

import { api, buildQueryString } from './api';
import { WhatsAppTemplate, Conversation } from '../types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface SendMessageOptions {
  templateName?: string;
  templateLanguage?: string;
  templateParams?: Record<string, string>;
  mediaUrl?: string; // URL of media to send
  mediaType?: 'image' | 'document' | 'video';
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'template' | 'image' | 'document' | 'video';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  mediaUrl?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'business';
  content: string;
  type: 'text' | 'image' | 'document' | 'template';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface SendTemplateData {
  phone: string;
  templateName: string;
  language: string;
  params?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// WhatsApp Endpoints
// ---------------------------------------------------------------------------

/**
 * Send a WhatsApp message to a customer.
 * Supports plain text messages and templated messages.
 * @param phone - Recipient phone number (with country code, e.g., +968XXXXXXX)
 * @param message - Message text content
 * @param options - Optional template/media settings
 */
export async function sendMessage(
  phone: string,
  message: string,
  options?: SendMessageOptions
): Promise<{ messageId: string; status: string }> {
  const response = await api.post<{
    success: boolean;
    data: { messageId: string; status: string };
  }>('/whatsapp/messages', {
    phone,
    message,
    ...options,
  });
  return response.data.data;
}

/**
 * Send a pre-approved WhatsApp template message.
 * @param data - Template send data (phone, templateName, language, params)
 * @returns Message send result
 */
export async function sendTemplate(
  data: SendTemplateData
): Promise<{ messageId: string; status: string }> {
  const response = await api.post<{
    success: boolean;
    data: { messageId: string; status: string };
  }>('/whatsapp/messages/template', data);
  return response.data.data;
}

/**
 * Get all available WhatsApp message templates.
 * @returns List of approved templates
 */
export async function getTemplates(): Promise<WhatsAppTemplate[]> {
  const response = await api.get<{ success: boolean; data: WhatsAppTemplate[] }>(
    '/whatsapp/templates'
  );
  return response.data.data;
}

/**
 * Get all WhatsApp conversations.
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 20)
 * @param status - Filter by conversation status
 * @returns List of conversations
 */
export async function getConversations(
  page = 1,
  perPage = 20,
  status?: 'active' | 'archived'
): Promise<Conversation[]> {
  const query = buildQueryString({ page, perPage, status } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: Conversation[] }>(
    `/whatsapp/conversations${query}`
  );
  return response.data.data;
}

/**
 * Get messages in a specific conversation.
 * @param conversationId - Conversation UUID
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 30)
 * @returns List of messages in the conversation
 */
export async function getConversationMessages(
  conversationId: string,
  page = 1,
  perPage = 30
): Promise<ChatMessage[]> {
  const response = await api.get<{ success: boolean; data: ChatMessage[] }>(
    `/whatsapp/conversations/${conversationId}/messages`,
    { params: { page, perPage } }
  );
  return response.data.data;
}

/**
 * Mark a conversation as read.
 * @param conversationId - Conversation UUID
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  await api.patch(`/whatsapp/conversations/${conversationId}/read`);
}

/**
 * Archive a conversation.
 * @param conversationId - Conversation UUID
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  await api.patch(`/whatsapp/conversations/${conversationId}/archive`);
}

/**
 * Get WhatsApp account status (connection health, phone number, etc.).
 * @returns WhatsApp business account status
 */
export async function getAccountStatus(): Promise<{
  connected: boolean;
  phoneNumber: string;
  displayName: string;
  qualityRating: string;
  messageLimit: number;
  messagesSentToday: number;
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      connected: boolean;
      phoneNumber: string;
      displayName: string;
      qualityRating: string;
      messageLimit: number;
      messagesSentToday: number;
    };
  }>('/whatsapp/account/status');
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Order-related WhatsApp notifications
// ---------------------------------------------------------------------------

/**
 * Send order confirmation via WhatsApp.
 * @param orderId - Order UUID
 * @param phone - Customer phone number
 */
export async function sendOrderConfirmation(
  orderId: string,
  phone: string
): Promise<void> {
  await api.post('/whatsapp/notifications/order-confirmation', {
    orderId,
    phone,
  });
}

/**
 * Send shipping notification via WhatsApp.
 * @param orderId - Order UUID
 * @param phone - Customer phone number
 * @param trackingNumber - Carrier tracking number
 * @param carrier - Carrier name
 */
export async function sendShippingNotification(
  orderId: string,
  phone: string,
  trackingNumber: string,
  carrier: string
): Promise<void> {
  await api.post('/whatsapp/notifications/shipping', {
    orderId,
    phone,
    trackingNumber,
    carrier,
  });
}

/**
 * Send delivery notification via WhatsApp.
 * @param orderId - Order UUID
 * @param phone - Customer phone number
 */
export async function sendDeliveryNotification(
  orderId: string,
  phone: string
): Promise<void> {
  await api.post('/whatsapp/notifications/delivered', {
    orderId,
    phone,
  });
}
