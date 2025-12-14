'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Place, Product, Message } from '@/lib/types'
import { getPlaceById, incrementPlaceView } from '@/lib/api/places'
import { getProductsByPlace } from '@/lib/api/products'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { MapPin, Phone, MessageCircle, Send, Image as ImageIcon, Users, X, Reply, Mic, Square, Loader2, Package } from 'lucide-react'
import { showError, showSuccess } from '@/components/SweetAlert'
import { AudioRecorder } from '@/lib/audio-recorder'

// Component that uses useSearchParams - must be wrapped in Suspense
function ProductIdHandler({ onProductIdChange }: { onProductIdChange: (productId: string | null) => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const productId = searchParams.get('product')
    onProductIdChange(productId)
  }, [searchParams, onProductIdChange])
  
  return null
}

function PlacePageContent() {
  const params = useParams()
  const placeId = params.id as string
  const [productId, setProductId] = useState<string | null>(null)

  const [place, setPlace] = useState<Place | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState<any>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)

  useEffect(() => {
    loadData()
    checkUser()
  }, [placeId])

  useEffect(() => {
    // Load messages when user is available or when placeId changes
    if (placeId) {
      loadMessages()
    }
  }, [user, placeId])

  const loadData = async () => {
    try {
      const [placeData, productsData] = await Promise.all([
        getPlaceById(placeId),
        getProductsByPlace(placeId),
      ])
      setPlace(placeData)
      setProducts(productsData)
      if (placeData) {
        await incrementPlaceView(placeId)
      }
    } catch (error) {
      showError('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('place_id', placeId)
        .order('created_at', { ascending: true })

      // Load replied messages separately
      if (data) {
        const replyIds = data.filter(m => m.reply_to).map(m => m.reply_to).filter(Boolean)
        if (replyIds.length > 0) {
          const { data: repliedMessages } = await supabase
            .from('messages')
            .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
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

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      if (data) {
        // Load products for messages that have product_id but product is null
        const messagesWithProductId = data.filter(m => m.product_id && !m.product)
        if (messagesWithProductId.length > 0) {
          const productIds = messagesWithProductId.map(m => m.product_id).filter(Boolean)
          const { data: productsData } = await supabase
            .from('products')
            .select('*, images:product_images(*), videos:product_videos(*), variants:product_variants(*)')
            .in('id', productIds)
          
          if (productsData) {
            const productsMap = new Map(productsData.map(p => [p.id, p]))
            data.forEach(msg => {
              if (msg.product_id && productsMap.has(msg.product_id)) {
                msg.product = productsMap.get(msg.product_id)
              }
            })
          }
        }
        
        setMessages(data)
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && data.length > 0 && user) {
          // Get unique sender IDs (excluding current user)
          const uniqueSenders = Array.from(
            new Set(
              data
                .filter((msg) => msg.sender_id !== user.id)
                .map((msg) => msg.sender_id)
            )
          )
          if (uniqueSenders.length > 0) {
            setSelectedConversation(uniqueSenders[0])
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Group messages by sender (conversations)
  const getConversations = () => {
    if (!user) return []
    
    // Get unique sender IDs (excluding current user)
    const uniqueSenders = Array.from(
      new Set(
        messages
          .filter((msg) => msg.sender_id !== user.id)
          .map((msg) => msg.sender_id)
      )
    )

    return uniqueSenders.map((senderId) => {
      const senderMessages = messages.filter((msg) => msg.sender_id === senderId)
      const lastMessage = senderMessages[senderMessages.length - 1]
      const unreadCount = senderMessages.filter((msg) => !msg.is_read && msg.sender_id !== user.id).length
      
      return {
        senderId,
        sender: lastMessage?.sender,
        lastMessage,
        unreadCount,
        messageCount: senderMessages.length,
      }
    }).sort((a, b) => {
      // Sort by last message time (newest first)
      const timeA = new Date(a.lastMessage?.created_at || 0).getTime()
      const timeB = new Date(b.lastMessage?.created_at || 0).getTime()
      return timeB - timeA
    })
  }

  // Get messages for selected conversation (owner view)
  const getConversationMessages = () => {
    if (!selectedConversation || !user) return []
    // Show messages from the selected sender and replies from the owner
    return messages.filter((msg) => 
      msg.sender_id === selectedConversation || 
      (msg.sender_id === user.id && messages.some(m => m.sender_id === selectedConversation))
    )
  }

  // Mark messages as read
  const markAsRead = async (senderId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('place_id', placeId)
        .eq('sender_id', senderId)
        .neq('sender_id', user.id) // Don't mark own messages as read

      if (!error) {
        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender_id === senderId && msg.sender_id !== user.id
              ? { ...msg, is_read: true }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  useEffect(() => {
    if (selectedConversation && user) {
      markAsRead(selectedConversation)
    }
  }, [selectedConversation, user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRecorder) {
        audioRecorder.cancelRecording()
      }
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [audioRecorder, recordingTimer])

  const startRecording = async () => {
    try {
      const recorder = new AudioRecorder()
      await recorder.startRecording()
      setAudioRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
    } catch (error: any) {
      console.error('فشل في بدء التسجيل:', error)
    }
  }

  const stopRecording = async () => {
    if (!audioRecorder) return

    try {
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      const audioBlob = await audioRecorder.stopRecording()
      setIsRecording(false)
      setRecordingTime(0)

      // Upload audio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.opus')

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        // Send message with audio
        await sendMessageWithAudio(data.url)
      } else {
        throw new Error(data.error || 'فشل في رفع الصوت')
      }
    } catch (error: any) {
      console.error('حدث خطأ في تسجيل الصوت:', error)
      setIsRecording(false)
      setRecordingTime(0)
    } finally {
      setAudioRecorder(null)
    }
  }

  const cancelRecording = () => {
    if (audioRecorder) {
      audioRecorder.cancelRecording()
      setAudioRecorder(null)
    }
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    setIsRecording(false)
    setRecordingTime(0)
  }

  const sendMessageWithAudio = async (audioUrl: string) => {
    if (!user) return

    // Save values before clearing
    const messageContent = newMessage.trim()
    const messageReplyTo = replyingTo

    // Create temporary message ID
    const tempId = `temp-${Date.now()}`
    const tempMessage: any = {
      id: tempId,
      sender_id: user.id,
      place_id: placeId,
      content: messageContent || null,
      audio_url: audioUrl,
      reply_to: messageReplyTo?.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        email: user.email || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      replied_message: messageReplyTo || null,
    }

    // Add temporary message with loading state
    setMessages((prev) => [...prev, tempMessage])
    setSendingMessages((prev) => new Set(prev).add(tempId))
    setNewMessage('')
    setReplyingTo(null)

    try {
      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        content: messageContent || null,
        audio_url: audioUrl,
        reply_to: messageReplyTo?.id || null,
      }

      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, sender:user_profiles(*)')
        .single()

      if (error) {
        console.error('Error sending message:', error)
        // Remove temporary message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setSendingMessages((prev) => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        return
      }

      // Load replied message if exists
      if (newMessageData && messageReplyTo) {
        newMessageData.replied_message = messageReplyTo
      }

      // Replace temporary message with real one
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? newMessageData : msg)))
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await loadMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }

  const sendMessage = async () => {
    if (!user) return

    if (!newMessage.trim() && !selectedImage && !selectedProduct) return

    // Create temporary message ID
    const tempId = `temp-${Date.now()}`
    const messageContent = newMessage.trim()
    const messageImage = selectedImage
    const messageReplyTo = replyingTo
    const messageProduct = selectedProduct

    // Create temporary message
    const tempMessage: any = {
      id: tempId,
      sender_id: user.id,
      place_id: placeId,
      content: messageContent || null,
      image_url: messageImage ? URL.createObjectURL(messageImage) : null,
      product_id: messageProduct?.id || null,
      reply_to: messageReplyTo?.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        email: user.email || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      replied_message: messageReplyTo || null,
      product: messageProduct || null,
    }

    // Add temporary message with loading state
    setMessages((prev) => [...prev, tempMessage])
    setSendingMessages((prev) => new Set(prev).add(tempId))
    setNewMessage('')
    setSelectedImage(null)
    setSelectedProduct(null)
    setReplyingTo(null)

    try {
      let imageUrl = null
      if (messageImage) {
        // Upload image to ImgBB
        const formData = new FormData()
        formData.append('image', messageImage)
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        })
        
        const data = await response.json()
        if (data.success) {
          imageUrl = data.url
        }
      }

      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        content: messageContent || null,
        reply_to: messageReplyTo?.id || null,
      }
      
      if (imageUrl) {
        messageData.image_url = imageUrl
      }

      if (messageProduct) {
        messageData.product_id = messageProduct.id
      }

      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, sender:user_profiles(*)')
        .single()

      if (error) {
        console.error('Error sending message:', error)
        // Remove temporary message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setSendingMessages((prev) => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        return
      }

      // Load replied message if exists
      if (newMessageData && messageReplyTo) {
        newMessageData.replied_message = messageReplyTo
      }

      // Load product if exists
      if (newMessageData && messageProduct) {
        newMessageData.product = messageProduct
      } else if (newMessageData && newMessageData.product_id) {
        // Load product from database if not already loaded
        const { data: productData } = await supabase
          .from('products')
          .select('*, images:product_images(*), videos:product_videos(*), variants:product_variants(*)')
          .eq('id', newMessageData.product_id)
          .single()
        
        if (productData) {
          newMessageData.product = productData
        }
      }

      // Replace temporary message with real one
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? newMessageData : msg)))
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await loadMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">المكان غير موجود</p>
      </div>
    )
  }

  const videoId = place.video_url ? extractYouTubeId(place.video_url) : null
  
  // Check if current user is the place owner
  const isOwner = user && place && user.id === place.user_id
  
  // Get messages for client view (only messages between client and place)
  const getClientMessages = () => {
    if (!user || isOwner) return []
    return messages.filter((msg) => msg.sender_id === user.id || msg.sender_id === place.user_id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Place Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {place.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={place.logo_url}
                  alt={place.name_ar}
                  className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{place.name_ar}</h1>
              <p className="text-gray-600 mb-4">{place.description_ar}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href={`tel:${place.phone_1}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Phone size={18} />
                  <span>{place.phone_1}</span>
                </a>
                {place.phone_2 && (
                  <a
                    href={`tel:${place.phone_2}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Phone size={18} />
                    <span>{place.phone_2}</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <MapPin size={18} />
                  <span>{place.address || 'العنوان غير متاح'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Video */}
        {videoId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">فيديو المكان</h2>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(videoId)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">المنتجات والخدمات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-all ${
                    productId === product.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name_ar}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{product.name_ar}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description_ar}</p>
                  {product.price && (
                    <p className="text-blue-600 font-semibold">
                      {product.price} {product.currency}
                    </p>
                  )}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">المتغيرات المتاحة:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => (
                          <span
                            key={variant.id}
                            className="px-2 py-1 bg-gray-100 rounded text-xs"
                          >
                            {variant.variant_name_ar}: {variant.variant_value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
            <MessageCircle size={20} />
            {isOwner ? 'المحادثات' : 'إرسال رسالة'}
          </h2>
          
          {user ? (
            isOwner ? (
              // Owner View: Conversations List
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conversations List */}
                <div className="md:col-span-1 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Users size={18} />
                      العملاء ({getConversations().length})
                    </h3>
                  </div>
                  <div className="h-64 overflow-y-auto">
                    {getConversations().length > 0 ? (
                      <div className="divide-y">
                        {getConversations().map((conversation) => (
                          <button
                            key={conversation.senderId}
                            onClick={() => setSelectedConversation(conversation.senderId)}
                            className={`w-full p-3 text-right hover:bg-gray-50 transition-colors ${
                              selectedConversation === conversation.senderId ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              {conversation.sender?.avatar_url ? (
                                <img
                                  src={conversation.sender.avatar_url}
                                  alt={conversation.sender.full_name || conversation.sender.email || ''}
                                  className="w-12 h-12 rounded-full flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {(conversation.sender?.full_name?.[0] || conversation.sender?.email?.[0] || 'U').toUpperCase()}
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {conversation.sender?.full_name || conversation.sender?.email || 'مستخدم'}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-700 truncate">
                                    {conversation.lastMessage.content || 'صورة'}
                                  </p>
                                )}
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {new Date(conversation.lastMessage.created_at).toLocaleDateString('ar-EG', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-700">
                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-600" />
                        <p>لا توجد محادثات بعد</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="md:col-span-2 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Conversation Header */}
                      <div className="bg-gray-50 p-4 border-b rounded-t-lg">
                        {(() => {
                          const conversation = getConversations().find((c) => c.senderId === selectedConversation)
                          return (
                            <div className="flex items-center gap-3">
                              {conversation?.sender?.avatar_url ? (
                                <img
                                  src={conversation.sender.avatar_url}
                                  alt={conversation.sender.full_name || conversation.sender.email || ''}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                  {(conversation?.sender?.full_name?.[0] || conversation?.sender?.email?.[0] || 'U').toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {conversation?.sender?.full_name || conversation?.sender?.email || 'مستخدم'}
                                </p>
                                <p className="text-xs text-gray-700">
                                  {conversation?.messageCount || 0} رسالة
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Messages */}
                      <div className="flex-1 h-64 overflow-y-auto border-x border-b rounded-b-lg p-4 bg-gray-50">
                        {getConversationMessages().length > 0 ? (
                          <div className="space-y-2">
                            {getConversationMessages().map((message) => (
                              <div
                                key={message.id}
                                className={`flex items-start gap-2 ${
                                  message.sender_id === user.id ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                {/* Avatar */}
                                {message.sender?.avatar_url ? (
                                  <img
                                    src={message.sender.avatar_url}
                                    alt={message.sender.full_name || message.sender.email || ''}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {message.sender?.full_name?.[0]?.toUpperCase() || message.sender?.email?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                )}
                                
                                {/* Message Content */}
                                <div className="flex-1">
                                  {message.reply_to && message.replied_message && (
                                    <div className={`mb-2 p-2 rounded text-xs border-r-2 ${
                                      message.sender_id === user.id 
                                        ? 'bg-blue-100 border-blue-400' 
                                        : 'bg-gray-100 border-gray-400'
                                    }`}>
                                      <p className={`font-semibold mb-1 ${
                                        message.sender_id === user.id 
                                          ? 'text-blue-900' 
                                          : 'text-gray-900'
                                      }`}>
                                        رد على: {message.replied_message.sender?.full_name || message.replied_message.sender?.email || 'مستخدم'}
                                      </p>
                                      <p className={`line-clamp-1 ${
                                        message.sender_id === user.id 
                                          ? 'text-blue-800' 
                                          : 'text-gray-800'
                                      }`}>
                                        {message.replied_message.content || 'صورة'}
                                      </p>
                                    </div>
                                  )}
                                  <div
                                    className={`p-2 rounded-lg ${
                                      message.sender_id === user.id
                                        ? 'bg-blue-500 text-white max-w-xs'
                                        : 'bg-white border max-w-xs'
                                    }`}
                                  >
                                    {message.sender_id !== user.id && message.sender && (
                                      <p className={`text-xs font-semibold mb-1 ${
                                        message.sender_id === user.id 
                                          ? 'text-white' 
                                          : 'text-gray-900'
                                      }`}>
                                        {message.sender.full_name || message.sender.email || 'مستخدم'}
                                      </p>
                                    )}
                                    {message.content && <p className={message.sender_id === user.id ? 'text-white' : 'text-gray-900'}>{message.content}</p>}
                                    {message.image_url && (
                                      <img
                                        src={message.image_url}
                                        alt="Message"
                                        className="mt-2 rounded max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setEnlargedImage(message.image_url!)}
                                      />
                                    )}
                                    {message.audio_url && (
                                      <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          {sendingMessages.has(message.id) && (
                                            <>
                                              <Loader2 size={16} className="animate-spin text-blue-500 flex-shrink-0" />
                                              <span className="text-xs text-blue-500">جاري الإرسال...</span>
                                            </>
                                          )}
                                        </div>
                                        <audio
                                          controls
                                          className={`w-full max-w-xs ${sendingMessages.has(message.id) ? 'opacity-60 pointer-events-none' : ''}`}
                                          style={{ maxHeight: '40px' }}
                                        >
                                          <source src={message.audio_url} type="audio/opus" />
                                          <source src={message.audio_url} type="audio/webm" />
                                          <source src={message.audio_url} type="audio/ogg" />
                                          متصفحك لا يدعم تشغيل الصوت
                                        </audio>
                                      </div>
                                    )}
                                    {message.product && (
                                      <a
                                        href={`/places/${placeId}?product=${message.product.id}`}
                                        className={`mt-2 block border-2 rounded-lg p-3 transition-colors ${
                                          message.sender_id === user.id
                                            ? 'border-purple-400 bg-purple-100 hover:bg-purple-200'
                                            : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          {message.product.images && message.product.images.length > 0 && (
                                            <img
                                              src={message.product.images[0].image_url}
                                              alt={message.product.name_ar}
                                              className="h-16 w-16 object-cover rounded flex-shrink-0"
                                            />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm mb-1 ${message.sender_id === user.id ? 'text-gray-900' : 'text-gray-900'}`}>
                                              {message.product.name_ar}
                                            </p>
                                            {message.product.description_ar && (
                                              <p className={`text-xs line-clamp-2 ${message.sender_id === user.id ? 'text-gray-700' : 'text-gray-600'}`}>
                                                {message.product.description_ar}
                                              </p>
                                            )}
                                            {message.product.price && (
                                              <p className={`text-sm font-bold mt-1 ${message.sender_id === user.id ? 'text-blue-600' : 'text-blue-600'}`}>
                                                {message.product.price} {message.product.currency}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </a>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center gap-2">
                                        {sendingMessages.has(message.id) && (
                                          <Loader2 size={14} className="animate-spin text-gray-400" />
                                        )}
                                        <p className={`text-xs ${message.sender_id === user.id ? 'opacity-70' : 'text-gray-500'}`}>
                                          {new Date(message.created_at).toLocaleString('ar-EG')}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => setReplyingTo(message)}
                                        className={`ml-2 p-1 rounded hover:bg-opacity-80 transition-colors ${
                                          message.sender_id === user.id 
                                            ? 'hover:bg-blue-400' 
                                            : 'hover:bg-gray-200'
                                        }`}
                                        title="رد"
                                        disabled={sendingMessages.has(message.id)}
                                      >
                                        <Reply size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-700">لا توجد رسائل في هذه المحادثة</p>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="flex flex-col gap-2 p-4 border-t bg-white rounded-b-lg">
                        {replyingTo && (
                          <div className="bg-blue-50 border-r-4 border-blue-500 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  رد على: {replyingTo.sender?.full_name || replyingTo.sender?.email || 'مستخدم'}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {replyingTo.content || 'صورة'}
                                </p>
                              </div>
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="text-gray-500 hover:text-gray-700 ml-2"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                        {isRecording ? (
                          <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-red-700 font-semibold">
                                جاري التسجيل... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <button
                              onClick={stopRecording}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                              <Square size={16} />
                              إيقاف وإرسال
                            </button>
                            <button
                              onClick={cancelRecording}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder={replyingTo ? "اكتب ردك..." : "اكتب رسالتك..."}
                              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                              onClick={startRecording}
                              className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                              title="تسجيل صوتي"
                            >
                              <Mic size={20} />
                            </button>
                            <label className="cursor-pointer px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors">
                              <ImageIcon size={20} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                              />
                            </label>
                            {isOwner && products.length > 0 && (
                              <button
                                onClick={() => setShowProductPicker(!showProductPicker)}
                                className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                                title="مشاركة منتج"
                              >
                                <Package size={20} />
                              </button>
                            )}
                            <button
                              onClick={sendMessage}
                              disabled={!newMessage.trim() && !selectedImage && !selectedProduct}
                              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              <Send size={20} />
                              {replyingTo ? 'إرسال الرد' : 'إرسال'}
                            </button>
                          </div>
                        )}
                      </div>
                      {selectedProduct && (
                        <div className="px-4 pb-4">
                          <div className="relative inline-block border-2 border-purple-300 rounded-lg p-2 bg-purple-50">
                            <div className="flex items-center gap-2">
                              {selectedProduct.images && selectedProduct.images.length > 0 && (
                                <img
                                  src={selectedProduct.images[0].image_url}
                                  alt={selectedProduct.name_ar}
                                  className="h-16 w-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{selectedProduct.name_ar}</p>
                                {selectedProduct.price && (
                                  <p className="text-xs text-blue-600">{selectedProduct.price} {selectedProduct.currency}</p>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedImage && (
                        <div className="px-4 pb-4">
                          <div className="relative inline-block">
                            <img
                              src={URL.createObjectURL(selectedImage)}
                              alt="Selected"
                              className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                            />
                            <button
                              onClick={() => setSelectedImage(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50">
                      <div className="text-center text-gray-700">
                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-600" />
                        <p>اختر محادثة لعرض الرسائل</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Client View: Simple Message Interface
              <div className="flex flex-col">
                {/* Messages History */}
                <div className="flex-1 h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 mb-3">
                  {getClientMessages().length > 0 ? (
                    <div className="space-y-3">
                      {getClientMessages().map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start gap-2 ${
                            message.sender_id === user.id ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          {message.sender?.avatar_url ? (
                            <img
                              src={message.sender.avatar_url}
                              alt={message.sender.full_name || message.sender.email || ''}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {message.sender?.full_name?.[0]?.toUpperCase() || message.sender?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className="flex-1">
                            {message.reply_to && message.replied_message && (
                              <div className={`mb-2 p-2 rounded text-xs border-r-2 ${
                                message.sender_id === user.id 
                                  ? 'bg-blue-100 border-blue-400' 
                                  : 'bg-gray-100 border-gray-400'
                              }`}>
                                <p className={`font-semibold mb-1 ${
                                  message.sender_id === user.id 
                                    ? 'text-blue-900' 
                                    : 'text-gray-900'
                                }`}>
                                  رد على: {message.replied_message.sender?.full_name || message.replied_message.sender?.email || place.name_ar}
                                </p>
                                <p className={`line-clamp-1 ${
                                  message.sender_id === user.id 
                                    ? 'text-blue-800' 
                                    : 'text-gray-800'
                                }`}>
                                  {message.replied_message.content || 'صورة'}
                                </p>
                              </div>
                            )}
                            <div
                              className={`p-3 rounded-lg ${
                                message.sender_id === user.id
                                  ? 'bg-blue-500 text-white max-w-xs'
                                  : 'bg-white border max-w-xs'
                              }`}
                            >
                              {message.sender_id !== user.id && message.sender && (
                                <p className={`text-xs font-semibold mb-1 ${
                                  message.sender_id === user.id 
                                    ? 'text-white' 
                                    : 'text-gray-900'
                                }`}>
                                  {message.sender.full_name || message.sender.email || place.name_ar}
                                </p>
                              )}
                              {message.content && <p className={message.sender_id === user.id ? 'text-white' : 'text-gray-900'}>{message.content}</p>}
                              {message.image_url && (
                                <img
                                  src={message.image_url}
                                  alt="Message"
                                  className="mt-2 rounded max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setEnlargedImage(message.image_url!)}
                                />
                              )}
                              {message.audio_url && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    {sendingMessages.has(message.id) && (
                                      <>
                                        <Loader2 size={16} className="animate-spin text-blue-500 flex-shrink-0" />
                                        <span className="text-xs text-blue-500">جاري الإرسال...</span>
                                      </>
                                    )}
                                  </div>
                                  <audio
                                    controls
                                    className={`w-full max-w-xs ${sendingMessages.has(message.id) ? 'opacity-60 pointer-events-none' : ''}`}
                                    style={{ maxHeight: '40px' }}
                                  >
                                    <source src={message.audio_url} type="audio/opus" />
                                    <source src={message.audio_url} type="audio/webm" />
                                    <source src={message.audio_url} type="audio/ogg" />
                                    متصفحك لا يدعم تشغيل الصوت
                                  </audio>
                                </div>
                              )}
                              {message.product && (
                                <a
                                  href={`/places/${placeId}?product=${message.product.id}`}
                                  className={`mt-2 block border-2 rounded-lg p-3 transition-colors ${
                                    message.sender_id === user.id
                                      ? 'border-purple-400 bg-purple-100 hover:bg-purple-200'
                                      : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {message.product.images && message.product.images.length > 0 && (
                                      <img
                                        src={message.product.images[0].image_url}
                                        alt={message.product.name_ar}
                                        className="h-16 w-16 object-cover rounded flex-shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold text-sm mb-1 ${message.sender_id === user.id ? 'text-gray-900' : 'text-gray-900'}`}>
                                        {message.product.name_ar}
                                      </p>
                                      {message.product.description_ar && (
                                        <p className={`text-xs line-clamp-2 ${message.sender_id === user.id ? 'text-gray-700' : 'text-gray-600'}`}>
                                          {message.product.description_ar}
                                        </p>
                                      )}
                                      {message.product.price && (
                                        <p className={`text-sm font-bold mt-1 ${message.sender_id === user.id ? 'text-blue-600' : 'text-blue-600'}`}>
                                          {message.product.price} {message.product.currency}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </a>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {sendingMessages.has(message.id) && (
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                  )}
                                  <p className={`text-xs ${message.sender_id === user.id ? 'opacity-70' : 'text-gray-500'}`}>
                                    {new Date(message.created_at).toLocaleString('ar-EG')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className={`ml-2 p-1 rounded hover:bg-opacity-80 transition-colors ${
                                    message.sender_id === user.id 
                                      ? 'hover:bg-blue-400' 
                                      : 'hover:bg-gray-200'
                                  }`}
                                  title="رد"
                                  disabled={sendingMessages.has(message.id)}
                                >
                                  <Reply size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-700">
                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-600" />
                        <p>لا توجد رسائل بعد. ابدأ المحادثة الآن!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex flex-col gap-2 mt-2">
                  {replyingTo && (
                    <div className="bg-blue-50 border-r-4 border-blue-500 p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            رد على: {replyingTo.sender?.full_name || replyingTo.sender?.email || place.name_ar}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {replyingTo.content || 'صورة'}
                          </p>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-500 hover:text-gray-700 ml-2"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                  {isRecording ? (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-700 font-semibold">
                          جاري التسجيل... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Square size={16} />
                        إيقاف وإرسال
                      </button>
                      <button
                        onClick={cancelRecording}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={replyingTo ? "اكتب ردك..." : "اكتب رسالتك للمكان..."}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button
                        onClick={startRecording}
                        className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                        title="تسجيل صوتي"
                      >
                        <Mic size={20} />
                      </button>
                      <label className="cursor-pointer px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors">
                        <ImageIcon size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                        />
                      </label>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() && !selectedImage}
                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send size={20} />
                        {replyingTo ? 'إرسال الرد' : 'إرسال'}
                      </button>
                    </div>
                  )}
                </div>
                {selectedImage && (
                  <div className="mt-2">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Selected"
                        className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <p className="text-center text-gray-700 py-8">
              يجب تسجيل الدخول لإرسال الرسائل
            </p>
          )}
        </div>
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="إغلاق"
            >
              <X size={32} />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Product Picker Bottom Sheet */}
      {showProductPicker && isOwner && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowProductPicker(false)}
          />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">اختر منتج للمشاركة</h3>
                <button
                  onClick={() => setShowProductPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowProductPicker(false)
                      }}
                      className={`p-3 border-2 rounded-lg text-right hover:bg-blue-50 transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {product.name_ar}
                      </p>
                      {product.price && (
                        <p className="text-xs text-blue-600 font-bold">
                          {product.price} {product.currency}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">لا توجد منتجات متاحة</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PlacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ProductIdHandler>
        {(productId) => <PlacePageContent productId={productId} />}
      </ProductIdHandler>
    </Suspense>
  )
}
