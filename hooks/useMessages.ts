import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import { validateArray, MessageSchema } from '@/types/schemas'

interface UseMessagesOptions {
  placeId?: string | string[] | undefined
  limit?: number
  autoLoad?: boolean
}

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: string | null
  unreadCount: number
  refresh: () => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  sendMessage: (content: string, imageUrl?: string, audioUrl?: string, productId?: string, recipientId?: string) => Promise<void>
}

/**
 * Custom hook for fetching and managing messages
 */
export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { placeId, limit = 50, autoLoad = true } = options
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadMessages = useCallback(async () => {
    if (!placeId) {
      setMessages([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const placeIds = Array.isArray(placeId) ? placeId : [placeId]
      
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(*),
          product:products(*),
          replied_message:messages(*)
        `)
        .in('place_id', placeIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      // ✅ Validate data with Zod
      const validatedMessages = validateArray(MessageSchema, data || [], 'useMessages')
      const messagesData = validatedMessages as Message[]
      setMessages(messagesData)

      // Count unread messages
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const unread = messagesData.filter(
          msg => !msg.is_read && msg.sender_id !== user.id
        ).length
        setUnreadCount(unread)
      }
    } catch (err: any) {
      console.error('Error loading messages:', err)
      setError(err.message || 'فشل في تحميل الرسائل')
      setMessages([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [placeId, limit])

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (updateError) throw updateError

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error('Error marking message as read:', err)
    }
  }, [])

  const sendMessage = useCallback(async (
    content: string,
    imageUrl?: string,
    audioUrl?: string,
    productId?: string,
    recipientId?: string
  ) => {
    if (!placeId) {
      throw new Error('Place ID is required')
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const placeIds = Array.isArray(placeId) ? placeId : [placeId]
      const placeIdToUse = placeIds[0] // Use first place ID

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          place_id: placeIdToUse,
          content,
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          product_id: productId || null,
          recipient_id: recipientId || null,
          is_read: false,
        })

      if (insertError) throw insertError

      // Refresh messages
      await loadMessages()
    } catch (err: any) {
      console.error('Error sending message:', err)
      throw err
    }
  }, [placeId, loadMessages])

  useEffect(() => {
    if (autoLoad) {
      loadMessages()
    }

    // Subscribe to real-time updates
    if (placeId) {
      const placeIds = Array.isArray(placeId) ? placeId : [placeId]
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `place_id=in.(${placeIds.join(',')})`,
          },
          () => {
            loadMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [autoLoad, placeId, loadMessages])

  return {
    messages,
    loading,
    error,
    unreadCount,
    refresh: loadMessages,
    markAsRead,
    sendMessage,
  }
}
