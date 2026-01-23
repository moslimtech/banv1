'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Place, Product, Message } from '@/lib/types'
import { incrementPlaceView } from '@/lib/api/places'
import { useAuth, usePlace, useProducts, useMessages } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { MapPin, Phone, MessageCircle, Send, Image as ImageIcon, Users, X, Reply, Mic, Square, Loader2, Package, UserPlus, CheckCircle, Plus, Trash2, Video, Upload } from 'lucide-react'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { LoadingSpinner } from '@/components/common'
import { AudioRecorder } from '@/lib/audio-recorder'

// Component that uses useSearchParams - must be wrapped in Suspense
function ProductIdHandler({ children }: { children: (productId: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  
  return <>{children(productId)}</>
}

function PlacePageContent({ productId }: { productId: string | null }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const placeId = params.id as string

  // Use custom hooks
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  const { place, loading: placeLoading, refresh: refreshPlace } = usePlace(placeId)
  const { products, loading: productsLoading } = useProducts({ placeId, autoLoad: !!placeId })
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage: sendMessageHook,
    markAsRead,
    refresh: refreshMessages
  } = useMessages({ placeId, autoLoad: !!placeId })

  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
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
  const [showEmployeeRequestModal, setShowEmployeeRequestModal] = useState(false)
  const [employeePhone, setEmployeePhone] = useState('')
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeePermissions, setEmployeePermissions] = useState<'basic' | 'messages_posts' | 'full' | null>(null)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [postData, setPostData] = useState({
    content: '',
    post_type: 'text' as 'text' | 'image' | 'video',
    image_url: '',
    video_url: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUploadMethod, setVideoUploadMethod] = useState<'link' | 'upload'>('link')

  useEffect(() => {
    if (place) {
      incrementPlaceView(placeId).catch(console.error)
      loadPosts()
    }
    // Set loading to false when place loading completes (whether successful or not)
    if (!placeLoading) {
      setLoading(false)
    }
  }, [place, placeId, placeLoading])

  useEffect(() => {
    // Check if user is employee or has pending request
    if (user && place) {
      checkEmployeeStatus()
    }
  }, [user, place])


  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const checkEmployeeStatus = async () => {
    if (!user || !place) return

    try {
      // Check if user is an employee
      const { data: employeeData, error: employeeError } = await supabase
        .from('place_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('is_active', true)
        .maybeSingle()

      if (employeeError) {
        console.error('Error checking employee status:', employeeError)
      }

      if (employeeData) {
        setIsEmployee(true)
        setEmployeePermissions(employeeData.permissions || 'basic')
        setHasPendingRequest(false)
        return
      }

      setIsEmployee(false)
      setEmployeePermissions(null)

      // Check if user has a pending request
      const { data: requestData, error: requestError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (requestError) {
        console.error('Error checking pending request:', requestError)
      }

      if (requestData) {
        setHasPendingRequest(true)
      } else {
        setHasPendingRequest(false)
      }
    } catch (error) {
      console.error('Error checking employee status:', error)
    }
  }

  const handleEmployeeRequest = async () => {
    if (!user || !place || !employeePhone.trim()) {
      showError('يرجى إدخال رقم الهاتف')
      return
    }

    try {
      const { error } = await supabase
        .from('employee_requests')
        .insert({
          user_id: user.id,
          place_id: place.id,
          phone: employeePhone.trim(),
          status: 'pending',
          permissions: 'basic'
        })

      if (error) {
        console.error('Error creating employee request:', error)
        showError('حدث خطأ في إرسال الطلب. حاول مرة أخرى')
        return
      }

      showSuccess('تم إرسال طلبك بنجاح! سيتم مراجعته قريباً')
      setShowEmployeeRequestModal(false)
      setEmployeePhone('')
      setHasPendingRequest(true)
      
      // Refresh employee status
      await checkEmployeeStatus()
    } catch (error) {
      console.error('Error handling employee request:', error)
      showError('حدث خطأ في إرسال الطلب')
    }
  }

  // Messages are automatically loaded by useMessages hook
  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && messages.length > 0 && user) {
      const uniqueSenders = Array.from(
        new Set(
          messages
            .filter((msg) => msg.sender_id !== user.id)
            .map((msg) => msg.sender_id)
        )
      )
      if (uniqueSenders.length > 0) {
        setSelectedConversation(uniqueSenders[0])
      }
    }
  }, [messages, user, selectedConversation])

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

  // Mark messages as read using hook function
  const markConversationAsRead = async (senderId: string) => {
    if (!user) return
    
    // Mark all unread messages from this sender
    const unreadMessages = messages.filter(
      msg => msg.sender_id === senderId && !msg.is_read && msg.sender_id !== user.id
    )
    
    for (const msg of unreadMessages) {
      await markAsRead(msg.id)
    }
  }

  useEffect(() => {
    if (selectedConversation && user) {
      markConversationAsRead(selectedConversation)
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

    // Add temporary message ID to sending set
    setSendingMessages((prev) => new Set(prev).add(tempId))
    setNewMessage('')
    setReplyingTo(null)

    try {
      // Determine recipient_id
      let recipientId = null
      if (selectedConversation) {
        recipientId = selectedConversation
      } else if (messageReplyTo) {
        recipientId = messageReplyTo.sender_id
      } else if (place && place.user_id === user.id) {
        recipientId = null
      } else {
        recipientId = place?.user_id || null
      }

      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        recipient_id: recipientId,
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
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await refreshMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      
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

      // Determine recipient_id
      // If there's a selected conversation, recipient is the conversation partner
      // Otherwise, if user is owner, recipient should be the last sender they're replying to
      let recipientId = null
      if (selectedConversation) {
        recipientId = selectedConversation
      } else if (messageReplyTo) {
        // If replying to a message, recipient is the sender of that message
        recipientId = messageReplyTo.sender_id
      } else if (place && place.user_id === user.id) {
        // If owner sending a message without conversation selected, we can't determine recipient
        // This case shouldn't happen as owner should use sidebar for messaging
        recipientId = null
      } else {
        // Client sending to owner - recipient is the place owner
        recipientId = place?.user_id || null
      }

      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        recipient_id: recipientId,
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
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await refreshMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4" style={{ color: colors.onSurfaceVariant }}>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="app-text-muted">المكان غير موجود</p>
      </div>
    )
  }

  const videoId = place.video_url ? extractYouTubeId(place.video_url) : null
  
  // Check if current user is the place owner
  const isOwner = user && place && user.id === place.user_id
  
  // Check if user can manage posts (owner or employee with messages_posts/full permissions)
  const canManagePosts = isOwner || (isEmployee && (employeePermissions === 'messages_posts' || employeePermissions === 'full'))
  
  // Check if user can manage products (owner or employee with full permissions)
  const canManageProducts = isOwner || (isEmployee && employeePermissions === 'full')
  
  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!canManagePosts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) {
        console.error('Error deleting post:', error)
        showError('حدث خطأ في حذف المنشور')
        return
      }
      
      showSuccess('تم حذف المنشور بنجاح')
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      showError('حدث خطأ في حذف المنشور')
    }
  }
  
  // Handle image upload for post
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('الرجاء اختيار ملف صورة صحيح')
      return
    }

    if (file.size > 32 * 1024 * 1024) {
      showError('حجم الصورة كبير جداً. الحد الأقصى هو 32MB')
      return
    }

    setUploadingImage(true)
    showLoading('جاري رفع الصورة...')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'حدث خطأ في رفع الصورة')
      }

      setPostData({ ...postData, image_url: result.url, post_type: 'image' })
      closeLoading()
      showSuccess('تم رفع الصورة بنجاح')
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle video file select
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      showError('الرجاء اختيار ملف فيديو صحيح')
      return
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      showError('حجم الفيديو كبير جداً. الحد الأقصى هو 2GB')
      return
    }

    setSelectedVideoFile(file)
    if (!videoTitle) {
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  // Handle video upload to YouTube
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle.trim()) {
      showError('الرجاء اختيار فيديو وإدخال عنوان')
      return
    }

    setUploadingVideo(true)
    showLoading('جاري رفع الفيديو إلى YouTube...')

    try {
      const formData = new FormData()
      formData.append('video', selectedVideoFile)
      formData.append('title', videoTitle)
      formData.append('description', postData.content || '')
      formData.append('tags', '')
      formData.append('privacyStatus', 'unlisted')

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }

      if (data.videoUrl) {
        setPostData({ ...postData, video_url: data.videoUrl, post_type: 'video' })
        setSelectedVideoFile(null)
        setVideoTitle('')
        setVideoUploadMethod('link')
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
      } else {
        throw new Error('لم يتم إرجاع رابط الفيديو من YouTube')
      }
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.')
      console.error('YouTube upload error:', error)
    } finally {
      setUploadingVideo(false)
    }
  }

  // Handle save post
  const handleSavePost = async () => {
    if (!user || !place) return

    if (!postData.content.trim()) {
      showError('الرجاء إدخال محتوى المنشور')
      return
    }

    if (postData.post_type === 'image' && !postData.image_url) {
      showError('الرجاء رفع صورة')
      return
    }

    if (postData.post_type === 'video' && !postData.video_url) {
      if (videoUploadMethod === 'upload') {
        showError('الرجاء رفع الفيديو أولاً')
      } else {
        showError('الرجاء إدخال رابط الفيديو')
      }
      return
    }

      showLoading('جاري إضافة المنشور...')

    try {
      const postPayload: any = {
        place_id: placeId,
        created_by: user.id,
        content: postData.content.trim(),
        post_type: postData.post_type,
        is_active: true,
      }

      if (postData.post_type === 'image') {
        postPayload.image_url = postData.image_url
        postPayload.video_url = null
      } else if (postData.post_type === 'video') {
        postPayload.video_url = postData.video_url
        postPayload.image_url = null
      } else {
        postPayload.image_url = null
        postPayload.video_url = null
      }

      const { error } = await supabase
        .from('posts')
        .insert(postPayload)

      if (error) throw error

      showSuccess('تم إضافة المنشور بنجاح')
      closeLoading()
      setShowAddPostModal(false)
      setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
      setSelectedVideoFile(null)
      setVideoTitle('')
      setVideoUploadMethod('link')
      loadPosts()
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المنشور')
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!canManageProducts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) {
        console.error('Error deleting product:', error)
        showError('حدث خطأ في حذف المنتج')
        return
      }
      
      showSuccess('تم حذف المنتج بنجاح')
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('حدث خطأ في حذف المنتج')
    }
  }
  
  // Get messages for client view (only messages between client and place)
  const getClientMessages = () => {
    if (!user || isOwner) return []
    return messages.filter((msg) => msg.sender_id === user.id || msg.sender_id === place.user_id)
  }

  return (
    <div className="min-h-screen app-bg-base">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Place Header */}
        <div className="app-card shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {place.logo_url ? (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={place.logo_url}
                  alt={place.name_ar}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-cover rounded-lg border-2"
                  style={{ borderColor: colors.outline }}
                  onError={(e) => {
                    // Hide broken image and show placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.logo-placeholder')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'logo-placeholder w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold'
                      placeholder.style.background = `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                      placeholder.style.borderColor = colors.outline
                      placeholder.style.color = colors.onPrimary
                      placeholder.textContent = place.name_ar?.[0]?.toUpperCase() || 'M'
                      parent.appendChild(placeholder)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
                    borderColor: colors.outline,
                    color: colors.onPrimary,
                  }}
                >
                  {place.name_ar?.[0]?.toUpperCase() || 'M'}
                </div>
              </div>
            )}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.name_ar}</h1>
              <p className="text-sm sm:text-base mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.description_ar}</p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm justify-center md:justify-start">
                <a
                  href={`tel:${place.phone_1}`}
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{place.phone_1}</span>
                </a>
                {place.phone_2 && (
                  <a
                    href={`tel:${place.phone_2}`}
                    className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>{place.phone_2}</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{place.address || 'العنوان غير متاح'}</span>
                </a>
              </div>
              
              {/* Employee Request and Message Buttons - Only for logged-in clients */}
              {user && !isOwner && (
                <div className="mt-4 flex justify-center md:justify-start gap-2 flex-wrap">
                  {!isEmployee && (
                    hasPendingRequest ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border app-border" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">طلبك قيد المراجعة</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEmployeeRequestModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                        style={{ background: colors.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <UserPlus size={18} />
                        <span>انضمام كموظف</span>
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      // Add openConversation query parameter to current URL without navigating away
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('openConversation', placeId)
                      router.push(`/places/${placeId}?${params.toString()}`)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                    style={{ background: colors.secondary }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <MessageCircle size={18} />
                    <span>إرسال رسالة</span>
                  </button>
                </div>
              )}

              {/* Video - Small inline video */}
              {videoId && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold app-text-main mb-2">فيديو المكان</h3>
                  <div className="aspect-video rounded-lg overflow-hidden max-w-sm mx-auto md:mx-0">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Request Modal */}
        {showEmployeeRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="app-card shadow-xl rounded-3xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold app-text-main">طلب انضمام كموظف</h3>
                <button
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                  className="transition-colors hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="app-text-muted mb-4">
                أدخل رقم هاتفك لإرسال طلب الانضمام كموظف في {place.name_ar}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ borderColor: 'var(--border-color)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEmployeeRequest}
                  className="flex-1 px-6 py-3 text-white rounded-full transition-colors font-medium"
                  style={{ background: colors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  إرسال الطلب
                </button>
                <button
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                  className="px-4 py-2 rounded-lg transition-colors app-bg-surface app-hover-bg app-text-main"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts and Products Tabs */}
        <div className="app-card shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Tabs */}
          <div className="flex justify-between items-center mb-4 border-b app-border">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'icon-primary border-b-2 border-primary'
                    : 'app-text-muted app-hover-text'
                }`}
              >
                المنشورات ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'icon-primary border-b-2 border-primary'
                    : 'app-text-muted app-hover-text'
                }`}
              >
                المنتجات ({products.length})
              </button>
            </div>
            
            {/* Add Buttons */}
            {canManagePosts && activeTab === 'posts' && (
              <button
                onClick={() => setShowAddPostModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                style={{ background: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={16} />
                <span>إضافة منشور</span>
              </button>
            )}
            {canManageProducts && activeTab === 'products' && (
              <button
                onClick={() => router.push(`/dashboard/places/${placeId}/products/new`)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                style={{ background: colors.secondary }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={16} />
                <span>إضافة منتج</span>
              </button>
            )}
          </div>

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <p className="text-center app-text-muted py-8">
                  لا توجد منشورات حالياً
                </p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border app-border rounded-lg p-3 sm:p-4 relative"
                    >
                      {/* Delete Button */}
                      {canManagePosts && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-2 left-2 p-1.5 rounded-lg transition-all hover:scale-110"
                          style={{
                            backgroundColor: colors.error,
                            color: colors.onPrimary,
                          }}
                          title="حذف المنشور"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      {/* Post Content */}
                      <p className="text-sm app-text-main mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Post Image */}
                      {post.post_type === 'image' && post.image_url && (
                        <div className="mb-3">
                          <img
                            src={post.image_url}
                            alt="منشور"
                            className="w-full max-w-xl mx-auto rounded-lg"
                          />
                        </div>
                      )}

                      {/* Post Video */}
                      {post.post_type === 'video' && post.video_url && (
                        <div className="mb-3">
                          <div className="aspect-video rounded-lg overflow-hidden max-w-xl mx-auto">
                            {extractYouTubeId(post.video_url) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(extractYouTubeId(post.video_url)!)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={post.video_url}
                                controls
                                className="w-full h-full"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Post Date */}
                      <p className="text-xs app-text-muted mt-2">
                        {new Date(post.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <p className="text-center app-text-muted py-8">
                  لا توجد منتجات حالياً
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 transition-all relative ${
                        productId === product.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {/* Delete Button */}
                      {canManageProducts && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="absolute top-2 left-2 p-2 rounded-lg transition-all hover:scale-110 z-10"
                          style={{
                            backgroundColor: colors.error,
                            color: colors.onPrimary,
                          }}
                          title="حذف المنتج"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
                        />
                      )}
                      <h3 className="font-bold text-base sm:text-lg mb-1.5 sm:mb-2 app-text-main">
                        {product.name_ar}
                      </h3>
                      <p className="app-text-muted text-xs sm:text-sm mb-2 line-clamp-2">
                        {product.description_ar}
                      </p>
                      {product.price && (
                        <p className="icon-primary font-semibold">
                          {product.price} {product.currency}
                        </p>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm app-text-muted mb-1">المتغيرات المتاحة:</p>
                          <div className="flex flex-wrap gap-2">
                            {product.variants.map((variant) => (
                              <span
                                key={variant.id}
                                className="px-2 py-1 rounded text-xs app-bg-surface"
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
              )}
            </div>
          )}
        </div>

      </div>

      {/* Add Post Modal */}
      {showAddPostModal && canManagePosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="app-card shadow-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 app-card border-b app-border p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold app-text-main">إضافة منشور جديد</h3>
              <button
                onClick={() => {
                  setShowAddPostModal(false)
                  setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                  setSelectedVideoFile(null)
                  setVideoTitle('')
                  setVideoUploadMethod('link')
                }}
                className="transition-colors hover:opacity-70"
                style={{ color: colors.onSurfaceVariant }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                  نوع المنشور
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'text', image_url: '', video_url: '' })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      postData.post_type === 'text'
                        ? 'text-white'
                        : 'app-bg-surface app-text-main'
                    }`}
                    style={postData.post_type === 'text' ? { background: 'var(--primary-color)' } : {}}
                  >
                    نص
                  </button>
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'image', video_url: '' })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      postData.post_type === 'image'
                        ? 'text-white'
                        : 'app-bg-surface app-text-main'
                    }`}
                    style={postData.post_type === 'image' ? { background: 'var(--primary-color)' } : {}}
                  >
                    صورة
                  </button>
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'video', image_url: '' })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      postData.post_type === 'video'
                        ? 'text-white'
                        : 'app-bg-surface app-text-main'
                    }`}
                    style={postData.post_type === 'video' ? { background: 'var(--primary-color)' } : {}}
                  >
                    فيديو
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                  المحتوى
                </label>
                <textarea
                  value={postData.content}
                  onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                  placeholder="اكتب محتوى المنشور هنا..."
                  rows={6}
                  className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ borderColor: 'var(--border-color)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>

              {/* Image Upload */}
              {postData.post_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                    الصورة
                  </label>
                  {postData.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={postData.image_url}
                        alt="Preview"
                        className="max-w-full h-64 object-contain rounded-lg border app-border"
                      />
                      <button
                        onClick={() => setPostData({ ...postData, image_url: '' })}
                        className="absolute top-2 right-2 rounded-full p-1 transition-all hover:scale-110"
                        style={{
                          backgroundColor: colors.error,
                          color: colors.onPrimary,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer app-border app-hover-bg">
                      <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm app-text-muted">
                        {uploadingImage ? 'جاري الرفع...' : 'انقر لرفع صورة'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Video Upload/Link */}
              {postData.post_type === 'video' && (
                <div className="space-y-4">
                  {/* Video Method Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                      طريقة إضافة الفيديو
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVideoUploadMethod('link')
                          setSelectedVideoFile(null)
                          setVideoTitle('')
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          videoUploadMethod === 'link'
                            ? 'text-white'
                            : 'app-bg-surface app-text-main'
                        }`}
                        style={videoUploadMethod === 'link' ? { background: 'var(--primary-color)' } : {}}
                      >
                        رابط YouTube
                      </button>
                      <button
                        onClick={() => {
                          setVideoUploadMethod('upload')
                          setPostData({ ...postData, video_url: '' })
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          videoUploadMethod === 'upload'
                            ? 'text-white'
                            : 'app-bg-surface app-text-main'
                        }`}
                        style={videoUploadMethod === 'upload' ? { background: 'var(--primary-color)' } : {}}
                      >
                        رفع من الجهاز
                      </button>
                    </div>
                  </div>

                  {/* Video Link Method */}
                  {videoUploadMethod === 'link' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                        رابط الفيديو (YouTube)
                      </label>
                      <input
                        type="text"
                        value={postData.video_url}
                        onChange={(e) => setPostData({ ...postData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ borderColor: 'var(--border-color)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      />
                    </div>
                  )}

                  {/* Video Upload Method */}
                  {videoUploadMethod === 'upload' && (
                    <div className="space-y-4">
                      {/* File Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                          اختر فيديو للرفع *
                        </label>
                        {selectedVideoFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 app-bg-surface rounded-lg">
                              <Video size={20} style={{ color: colors.onSurfaceVariant }} />
                              <div className="flex-1">
                                <p className="text-sm font-medium app-text-main">
                                  {selectedVideoFile!.name}
                                </p>
                                <p className="text-xs app-text-muted">
                                  الحجم: {(selectedVideoFile!.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedVideoFile(null)
                                  setVideoTitle('')
                                }}
                                className="transition-colors hover:opacity-70"
                                style={{ color: colors.error }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <button
                              onClick={handleVideoUpload}
                              disabled={uploadingVideo || !videoTitle.trim()}
                              className="w-full px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                              style={{ background: (uploadingVideo || !videoTitle.trim()) ? 'var(--text-muted)' : 'var(--secondary-color)' }}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
                            >
                              {uploadingVideo ? 'جاري الرفع...' : 'رفع الفيديو إلى YouTube'}
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer app-border app-hover-bg">
                            <Upload className="w-8 h-8 mb-2" style={{ color: colors.onSurfaceVariant }} />
                            <span className="text-sm app-text-muted">
                              انقر لاختيار فيديو
                            </span>
                            <span className="text-xs app-text-muted mt-1">
                              الحد الأقصى: 2GB
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoFileSelect}
                              className="hidden"
                              disabled={uploadingVideo}
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Title */}
                      {selectedVideoFile && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                            عنوان الفيديو *
                          </label>
                          <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="أدخل عنوان الفيديو"
                            className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ borderColor: 'var(--border-color)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            maxLength={100}
                          />
                          <p className="text-xs app-text-muted mt-1">
                            {videoTitle.length}/100
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePost}
                  disabled={uploadingImage || uploadingVideo || !postData.content.trim() || (postData.post_type === 'video' && videoUploadMethod === 'upload' && !postData.video_url)}
                  className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                  style={{ background: (uploadingImage || uploadingVideo || !postData.content.trim() || (postData.post_type === 'video' && videoUploadMethod === 'upload' && !postData.video_url)) ? 'var(--text-muted)' : 'var(--primary-color)' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
                >
                  {uploadingVideo ? 'جاري الرفع...' : 'إضافة المنشور'}
                </button>
                <button
                  onClick={() => {
                    setShowAddPostModal(false)
                    setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                    setSelectedVideoFile(null)
                    setVideoTitle('')
                    setVideoUploadMethod('link')
                  }}
                  className="px-4 py-2 rounded-lg transition-colors app-bg-surface app-hover-bg app-text-main"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 text-white hover:opacity-70 transition-opacity"
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
          <div className="fixed bottom-0 left-0 right-0 app-card rounded-t-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full" style={{ background: 'var(--border-color)' }} />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: colors.onSurfaceVariant }}>اختر منتج للمشاركة</h3>
                <button
                  onClick={() => setShowProductPicker(false)}
                  className="p-2 rounded-full transition-colors app-hover-bg"
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
                      className="p-3 border-2 rounded-lg text-right hover:app-hover-bg transition-all"
                      style={{
                        borderColor: selectedProduct?.id === product.id ? colors.primary : colors.outline,
                        backgroundColor: selectedProduct?.id === product.id ? `${colors.primary}10` : 'transparent',
                      }}
                    >
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-semibold truncate mb-1" style={{ color: colors.onSurfaceVariant }}>
                        {product.name_ar}
                      </p>
                      {product.price && (
                        <p className="text-xs font-bold" style={{ color: colors.primary }}>
                          {product.price} {product.currency}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto mb-4" style={{ color: colors.onSurfaceVariant }} />
                  <p className="app-text-muted">لا توجد منتجات متاحة</p>
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
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    }>
      <ProductIdHandler>
        {(productId) => <PlacePageContent productId={productId} />}
      </ProductIdHandler>
    </Suspense>
  )
}
