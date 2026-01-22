import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AudioRecorder } from '@/lib/audio-recorder'
import { showError, showSuccess } from '@/components/SweetAlert'
import { createLogger } from '@/lib/logger'
import type { 
  ConversationMessage, 
  Conversation, 
  MessageProduct, 
  PlaceEmployee, 
  MessageUserProfile,
  Place 
} from '@/types'

const logger = createLogger('ConversationsManager')

interface UseConversationsManagerOptions {
  userId: string | null
  userPlaces: Place[]
}

export function useConversationsManager({ userId, userPlaces }: UseConversationsManagerOptions) {
  // ==================== STATE ====================
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<ConversationMessage | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorder | null>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<MessageProduct | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [products, setProducts] = useState<MessageProduct[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<PlaceEmployee | null>(null)
  const [placeEmployees, setPlaceEmployees] = useState<Map<string, PlaceEmployee[]>>(new Map())
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{ id: string, name_ar?: string } | null>(null)
  const [selectedSenderInfo, setSelectedSenderInfo] = useState<MessageUserProfile | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const subscriptionRef = useRef<any>(null)

  // ==================== DATA LOADING ====================
  
  const loadPlaceEmployees = useCallback(async () => {
    if (!userId || userPlaces.length === 0) return

    try {
      const placeIds = userPlaces.map(p => p.id)
      const { data: employeesData, error } = await supabase
        .from('place_employees')
        .select('*')
        .in('place_id', placeIds)
        .eq('is_active', true)

      if (error) {
        console.error('Error loading place employees:', error)
        return
      }

      if (employeesData && employeesData.length > 0) {
        const userIds = employeesData.map(e => e.user_id)
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds)

        const profilesMap = new Map()
        if (userProfiles) {
          userProfiles.forEach(profile => {
            profilesMap.set(profile.id, profile)
          })
        }

        employeesData.forEach(employee => {
          employee.user = profilesMap.get(employee.user_id)
        })
      }

      const employeesMap = new Map<string, any[]>()
      if (employeesData) {
        employeesData.forEach(employee => {
          const placeId = employee.place_id
          if (!employeesMap.has(placeId)) {
            employeesMap.set(placeId, [])
          }
          employeesMap.get(placeId)!.push(employee)
        })
      }

      setPlaceEmployees(employeesMap)
    } catch (error) {
      console.error('Error loading place employees:', error)
    }
  }, [userId, userPlaces])

  const checkEmployeeForPlace = useCallback(async (placeId: string) => {
    if (!userId) return null

    const { data: employeeData, error } = await supabase
      .from('place_employees')
      .select('*')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error checking employee status:', error)
      setCurrentEmployee(null)
      return null
    }

    if (employeeData) {
      setCurrentEmployee(employeeData)
      return employeeData
    }

    setCurrentEmployee(null)
    return null
  }, [userId])

  const loadAllMessages = useCallback(async () => {
    if (!userId) {
      return
    }

    try {
      const placeIds = userPlaces.map(p => p.id)
      
      let allMessages: any[] = []
      
      if (placeIds.length > 0) {
        const { data: ownerMessages, error: ownerError } = await supabase
          .from('messages')
          .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
          .in('place_id', placeIds)
          .order('created_at', { ascending: true })
      
        if (ownerError) {
          console.error('❌ [LOAD MESSAGES] Error loading owner messages:', ownerError)
        } else {
          if (ownerMessages) allMessages = [...allMessages, ...ownerMessages]
        }
      }
      
      const { data: clientMessages, error: clientError } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: true })
      
      if (clientError) {
        console.error('❌ [LOAD MESSAGES] Error loading client messages:', clientError)
      } else {
        if (clientMessages) {
          const existingIds = new Set(allMessages.map(m => m.id))
          const newMessages = clientMessages.filter(m => !existingIds.has(m.id))
          allMessages = [...allMessages, ...newMessages]
        }
      }
      
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('sender_id', userId)
        .order('created_at', { ascending: true })
      
      if (sentError) {
        console.error('❌ [LOAD MESSAGES] Error loading sent messages:', sentError)
      } else {
        if (sentMessages) {
          const existingIds = new Set(allMessages.map(m => m.id))
          const newMessages = sentMessages.filter(m => !existingIds.has(m.id))
          allMessages = [...allMessages, ...newMessages]
        }
      }
      
      const data = allMessages

      if (data && data.length > 0) {
        const replyIds = data.filter(m => m.reply_to).map(m => m.reply_to).filter(Boolean)
        if (replyIds.length > 0) {
          const { data: repliedMessages } = await supabase
            .from('messages')
            .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
            .in('id', replyIds)
          
          if (repliedMessages) {
            const repliedMap = new Map(repliedMessages.map(m => [m.id, m]))
            data.forEach(msg => {
              if (msg.reply_to && repliedMap.has(msg.reply_to)) {
                msg.replied_message = repliedMap.get(msg.reply_to)
              }
            })
          }
        }
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [userId, userPlaces])

  const loadProducts = useCallback(async (placeId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*), videos:product_videos(*), variants:product_variants(*)')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading products:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }, [])

  // ==================== CONVERSATIONS ====================

  const getConversations = useCallback((): Conversation[] => {
    if (!userId || messages.length === 0) {
      return []
    }
    
    const conversationsMap = new Map<string, Conversation>()
    const messagesByPlace = new Map<string, ConversationMessage[]>()
    
    messages.forEach(msg => {
      if (!messagesByPlace.has(msg.place_id)) {
        messagesByPlace.set(msg.place_id, [])
      }
      messagesByPlace.get(msg.place_id)!.push(msg)
    })

    messagesByPlace.forEach((placeMessages, placeId) => {
      const place = userPlaces.find(p => p.id === placeId)
      const placeName = place?.name_ar || placeMessages[0]?.place?.name_ar || placeId
      const isOwner = !!place

      const conversationPartnersMap = new Map<string, ConversationMessage[]>()
      
      placeMessages.forEach(msg => {
        let partnerId: string
        if (isOwner) {
          partnerId = msg.sender_id === userId ? (msg.recipient_id || msg.sender_id) : msg.sender_id
        } else {
          partnerId = msg.sender_id === userId ? (msg.recipient_id || msg.sender_id) : msg.sender_id
        }

        if (!conversationPartnersMap.has(partnerId)) {
          conversationPartnersMap.set(partnerId, [])
        }
        conversationPartnersMap.get(partnerId)!.push(msg)
      })

      conversationPartnersMap.forEach((partnerMessages, partnerId) => {
        const conversationKey = `${partnerId}-${placeId}`
        const lastMessage = partnerMessages[partnerMessages.length - 1]
        const unreadCount = partnerMessages.filter(m => 
          !m.is_read && m.sender_id !== userId
        ).length

        const partnerInfo = partnerMessages.find(m => m.sender_id === partnerId)?.sender
        
        conversationsMap.set(conversationKey, {
          senderId: partnerId,
          placeId: placeId,
          placeName: placeName,
          lastMessage: lastMessage.content || (lastMessage.image_url ? 'صورة' : (lastMessage.audio_url ? 'رسالة صوتية' : 'رسالة')),
          lastMessageTime: lastMessage.created_at,
          unreadCount,
          partnerName: partnerInfo?.full_name || partnerInfo?.email || 'مستخدم',
          partnerAvatar: partnerInfo?.avatar_url
        })
      })
    })

    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }, [userId, messages, userPlaces])

  const getConversationMessages = useCallback(() => {
    if (!selectedConversation || !selectedPlaceId) return []
    
    const conversationMessages = messages.filter(msg => {
      const isInPlace = msg.place_id === selectedPlaceId
      const isBetweenUsers = (msg.sender_id === selectedConversation || msg.recipient_id === selectedConversation)
      return isInPlace && isBetweenUsers
    })

    return conversationMessages
  }, [messages, selectedConversation, selectedPlaceId])

  // ==================== MESSAGE ACTIONS ====================

  const selectConversation = useCallback(async (senderId: string | null, placeId: string | null) => {
    
    setSelectedConversation(senderId)
    setSelectedPlaceId(placeId)
    
    // Only check employee status if placeId is provided
    if (placeId) {
      await checkEmployeeForPlace(placeId)
    } else {
      setCurrentEmployee(null)
    }
    
    const conversationMessages = messages.filter(msg => 
      msg.place_id === placeId && 
      (msg.sender_id === senderId || msg.recipient_id === senderId)
    )
    
    const unreadMessages = conversationMessages.filter(m => 
      !m.is_read && m.sender_id === senderId && m.recipient_id === userId
    )
    
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(m => m.id)
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds)
      
      if (error) {
        console.error('❌ [SELECT CONVERSATION] Error marking messages as read:', error)
      } else {
        setMessages(prev => prev.map(m => 
          unreadIds.includes(m.id) ? { ...m, is_read: true } : m
        ))
      }
    }
  }, [userId, messages, checkEmployeeForPlace])

  const sendMessage = useCallback(async () => {
    if (!userId || !selectedConversation || !selectedPlaceId) {
      showError('يجب اختيار محادثة أولاً')
      return
    }

    if (!newMessage.trim() && !selectedImage && !selectedProduct) {
      showError('يجب كتابة رسالة أو اختيار صورة')
      return
    }

    const tempId = `temp-${Date.now()}`
    setSendingMessages(prev => new Set(prev).add(tempId))

    try {
      let imageUrl = null
      if (selectedImage) {
        const formData = new FormData()
        formData.append('file', selectedImage)

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('فشل رفع الصورة')
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const messageData: any = {
        sender_id: userId,
        recipient_id: selectedConversation,
        place_id: selectedPlaceId,
        content: newMessage.trim() || null,
        image_url: imageUrl,
        reply_to: replyingTo?.id || null,
        product_id: selectedProduct?.id || null,
        employee_id: currentEmployee?.id || null,
        is_read: false
      }


      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()

      if (error) {
        console.error('❌ [SEND MESSAGE] Error:', error)
        throw error
      }


      if (replyingTo && data) {
        data.replied_message = replyingTo
      }

      setMessages(prev => [...prev, data])
      setNewMessage('')
      setSelectedImage(null)
      setReplyingTo(null)
      setSelectedProduct(null)
      setShowProductPicker(false)
      showSuccess('تم إرسال الرسالة')
    } catch (error: any) {
      console.error('Error sending message:', error)
      showError(error.message || 'فشل إرسال الرسالة')
    } finally {
      setSendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }, [userId, selectedConversation, selectedPlaceId, newMessage, selectedImage, selectedProduct, replyingTo, currentEmployee])

  // ==================== AUDIO RECORDING ====================

  const startRecording = useCallback(async () => {
    try {
      const recorder = new AudioRecorder()
      await recorder.startRecording()
      setAudioRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
    } catch (error: any) {
      showError(error.message || 'فشل بدء التسجيل')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!audioRecorder || !userId || !selectedConversation || !selectedPlaceId) return

    try {
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      const audioBlob = await audioRecorder.stopRecording()
      setIsRecording(false)
      setRecordingTime(0)

      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')

      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('فشل رفع الملف الصوتي')
      }

      const uploadData = await uploadResponse.json()
      const audioUrl = uploadData.url

      const messageData: any = {
        sender_id: userId,
        recipient_id: selectedConversation,
        place_id: selectedPlaceId,
        audio_url: audioUrl,
        reply_to: replyingTo?.id || null,
        employee_id: currentEmployee?.id || null,
        is_read: false
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()

      if (error) throw error

      if (replyingTo && data) {
        data.replied_message = replyingTo
      }

      setMessages(prev => [...prev, data])
      setReplyingTo(null)
      showSuccess('تم إرسال الرسالة الصوتية')
    } catch (error: any) {
      showError(error.message || 'فشل إرسال الرسالة الصوتية')
    }
  }, [audioRecorder, userId, selectedConversation, selectedPlaceId, recordingTimer, replyingTo, currentEmployee])

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  useEffect(() => {
    if (!userId) return


    // Cleanup previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
    }

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload) => {
          handleRealtimeChange(payload)
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          handleRealtimeChange(payload)
        }
      )

    // Subscribe to place messages if user owns places
    if (userPlaces.length > 0) {
      userPlaces.forEach(place => {
        channel.on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `place_id=eq.${place.id}`
          },
          (payload) => {
            handleRealtimeChange(payload)
          }
        )
      })
    }

    channel.subscribe((status) => {
    })

    subscriptionRef.current = channel

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [userId, userPlaces])

  const handleRealtimeChange = useCallback(async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newMessageId = payload.new.id

      const { data: fullMessage, error } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('id', newMessageId)
        .single()

      if (error) {
        console.error('Error fetching full message:', error)
        return
      }

      if (fullMessage.reply_to) {
        const { data: repliedMessage } = await supabase
          .from('messages')
          .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
          .eq('id', fullMessage.reply_to)
          .single()

        if (repliedMessage) {
          fullMessage.replied_message = repliedMessage
        }
      }

      setMessages(prev => {
        if (prev.find(m => m.id === fullMessage.id)) {
          return prev
        }
        return [...prev, fullMessage]
      })
    } else if (payload.eventType === 'UPDATE') {
      setMessages(prev => prev.map(m => 
        m.id === payload.new.id ? { ...m, ...payload.new } : m
      ))
    } else if (payload.eventType === 'DELETE') {
      setMessages(prev => prev.filter(m => m.id !== payload.old.id))
    }
  }, [])

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (userId && userPlaces.length > 0) {
      loadPlaceEmployees()
      loadAllMessages()
    }
  }, [userId, userPlaces, loadPlaceEmployees, loadAllMessages])

  useEffect(() => {
    if (selectedPlaceId) {
      loadProducts(selectedPlaceId)
    }
  }, [selectedPlaceId, loadProducts])

  // Handle openConversation query parameter
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return
    
    const openConversationPlaceId = searchParams.get('openConversation')
    
    if (!openConversationPlaceId) return
    
    const openConversationWithPlace = async () => {
      if (messages.length > 0) {
        const conversations = getConversations()
        const conversation = conversations.find(c => c.placeId === openConversationPlaceId)
        
        if (conversation) {
          selectConversation(conversation.senderId, conversation.placeId)
          const currentParams = new URLSearchParams(window.location.search)
          currentParams.delete('openConversation')
          const newUrl = window.location.pathname + (currentParams.toString() ? '?' + currentParams.toString() : '')
          window.history.replaceState({}, '', newUrl)
          return
        }
      }
      
      const userPlace = userPlaces.find(p => p.id === openConversationPlaceId)
      if (userPlace) {
        const currentParams = new URLSearchParams(window.location.search)
        currentParams.delete('openConversation')
        const newUrl = window.location.pathname + (currentParams.toString() ? '?' + currentParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
        return
      }
      
      try {
        const { data: placeData, error } = await supabase
          .from('places')
          .select('user_id')
          .eq('id', openConversationPlaceId)
          .single()
        
        if (error) {
          console.error('❌ [OPEN CONVERSATION] Error fetching place:', error)
          return
        }
        
        if (placeData) {
          const placeOwnerId = placeData.user_id
          
          const [placeResult, senderResult] = await Promise.all([
            supabase
              .from('places')
              .select('id, name_ar')
              .eq('id', openConversationPlaceId)
              .single(),
            supabase
              .from('user_profiles')
              .select('id, full_name, email, avatar_url')
              .eq('id', placeOwnerId)
              .single()
          ])
          
          if (placeResult.data) {
            setSelectedPlaceInfo(placeResult.data)
          }
          
          if (senderResult.data) {
            setSelectedSenderInfo(senderResult.data)
          }
          
          selectConversation(placeOwnerId, openConversationPlaceId)
          const currentParams = new URLSearchParams(window.location.search)
          currentParams.delete('openConversation')
          const newUrl = window.location.pathname + (currentParams.toString() ? '?' + currentParams.toString() : '')
          window.history.replaceState({}, '', newUrl)
        }
      } catch (error) {
        console.error('❌ [OPEN CONVERSATION] Error fetching place owner:', error)
      }
    }
    
    const timer = setTimeout(() => {
      openConversationWithPlace()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [userId, userPlaces, messages, pathname, searchParams, getConversations, selectConversation])

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedPlaceId) {
      const conversationMessages = messages.filter(
        (msg) => msg.place_id === selectedPlaceId && msg.sender_id === selectedConversation
      )
      if (conversationMessages.length > 0) {
        setTimeout(() => {
          const messagesContainer = document.querySelector('[style*="height: 400px"]') as HTMLElement
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
          }
        }, 200)
      }
    }
  }, [messages, selectedConversation, selectedPlaceId])

  // ==================== RETURN ====================

  return {
    // State
    messages,
    selectedConversation,
    selectedPlaceId,
    newMessage,
    setNewMessage,
    selectedImage,
    setSelectedImage,
    replyingTo,
    setReplyingTo,
    isRecording,
    recordingTime,
    sendingMessages,
    selectedProduct,
    setSelectedProduct,
    showProductPicker,
    setShowProductPicker,
    products,
    currentEmployee,
    placeEmployees,
    selectedPlaceInfo,
    selectedSenderInfo,
    
    // Actions
    selectConversation,
    sendMessage,
    startRecording,
    stopRecording,
    getConversations,
    getConversationMessages,
    loadProducts
  }
}
