'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePlaces } from '@/hooks'
import { useConversationsManager } from '@/hooks/useConversationsManager'
import { MessageCircle, X, Users, Package, Loader2 } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'

export default function ConversationsSidebar() {
  const { user } = useAuthContext()
  const { places: userPlaces } = usePlaces({ userId: user?.id, autoLoad: !!user })
  const [isOpen, setIsOpen] = useState(true) // Local UI state only
  const [isMounted, setIsMounted] = useState(false)
  
  // All messaging logic is now in this single hook
  const {
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
    selectConversation,
    sendMessage,
    startRecording,
    stopRecording,
    getConversations,
    getConversationMessages
  } = useConversationsManager({ userId: user?.id || null, userPlaces })

  // Mark as mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update CSS variable for sidebar width (desktop only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      const isDesktop = window.innerWidth >= 1024
      if (isDesktop) {
        root.style.setProperty('--sidebar-width', isOpen ? '384px' : '0px')
      }
    }
  }, [isOpen])

  // Don't render until mounted (avoid hydration mismatch)
  if (!isMounted || !user) return null

  const conversations = getConversations()
  const conversationMessages = getConversationMessages()

  // Find selected conversation info
  const selectedConv = conversations.find(
    c => c.senderId === selectedConversation && c.placeId === selectedPlaceId
  )

  // Check if user is employee for selected place
  const isEmployee = !!currentEmployee
  const isOwner = userPlaces.some(p => p.id === selectedPlaceId)

  return (
    <>
      {/* Desktop Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex fixed w-14 h-14 text-white rounded-full shadow-lg transition-all z-[70] items-center justify-center relative"
        style={{ 
          background: 'var(--primary-color)',
          top: '5.5rem',
          left: '1rem'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        aria-label="فتح/إغلاق المحادثات"
      >
        <MessageCircle size={24} />
        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
          <span className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 w-14 h-14 text-white rounded-full shadow-lg transition-all z-50 flex items-center justify-center relative"
        style={{ background: 'var(--primary-color)' }}
        aria-label="فتح/إغلاق المحادثات"
      >
        <MessageCircle size={24} />
        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
          <span className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Backdrop for Desktop - covers everything including Sidebar */}
      {isOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-black bg-opacity-50 z-[55]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full app-bg-main shadow-lg transition-transform duration-300 z-[65] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full lg:w-96`}
        style={{
          paddingTop: 'var(--header-height)',
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b app-border sticky top-0 app-bg-main z-10">
          <h2 className="text-xl font-bold app-text-main">المحادثات</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full transition-colors app-hover-bg"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* No Conversation Selected - Show List */}
        {!selectedConversation && (
          <div className="p-4">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle size={48} className="mx-auto mb-4 app-text-muted" />
                <p className="app-text-muted">لا توجد محادثات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const place = userPlaces.find(p => p.id === conv.placeId)
                  const isPlaceOwner = !!place

                  return (
                    <div
                      key={`${conv.senderId}-${conv.placeId}`}
                      onClick={() => selectConversation(conv.senderId, conv.placeId)}
                      className="p-3 rounded-lg cursor-pointer transition-all app-hover-bg border app-border"
                    >
                      <div className="flex items-start gap-3">
                        {conv.partnerAvatar ? (
                          <img
                            src={conv.partnerAvatar}
                            alt={conv.partnerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ background: 'var(--primary-color)' }}
                          >
                            {conv.partnerName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold app-text-main truncate">
                              {conv.partnerName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm app-text-muted mb-1 truncate">
                            {conv.placeName}
                          </p>
                          <p className="text-xs app-text-subtle line-clamp-1">
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Conversation Selected - Show Messages */}
        {selectedConversation && selectedPlaceId && (
          <div className="flex flex-col h-full">
            {/* Conversation Header */}
            <div className="p-3 border-b app-border backdrop-blur-sm app-bg-surface">
              <button
                onClick={() => {
                  selectConversation(null, null)
                  setReplyingTo(null)
                }}
                className="mb-2 text-sm app-text-link hover:underline"
              >
                ← العودة للمحادثات
              </button>
              <div className="flex items-center gap-3">
                {selectedConv?.partnerAvatar || selectedSenderInfo?.avatar_url ? (
                  <img
                    src={selectedConv?.partnerAvatar || selectedSenderInfo?.avatar_url}
                    alt={selectedConv?.partnerName || selectedSenderInfo?.full_name || ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'var(--primary-color)' }}
                  >
                    {(selectedConv?.partnerName || selectedSenderInfo?.full_name || 'U')[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold app-text-main">
                    {selectedConv?.partnerName || selectedSenderInfo?.full_name || selectedSenderInfo?.email || 'مستخدم'}
                  </p>
                  <p className="text-sm app-text-muted">
                    {selectedConv?.placeName || selectedPlaceInfo?.name_ar || 'مكان'}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/places/${selectedPlaceId}/employees`}
                      className="p-2 rounded-full app-hover-bg"
                      title="الموظفون"
                    >
                      <Users size={18} />
                    </Link>
                    <Link
                      href={`/dashboard/places/${selectedPlaceId}/products/new`}
                      className="p-2 rounded-full app-hover-bg"
                      title="المنتجات"
                    >
                      <Package size={18} />
                    </Link>
                  </div>
                )}
              </div>
              {isEmployee && currentEmployee && (
                <div className="mt-2 p-2 rounded text-xs" style={{ background: 'rgba(var(--primary-color-rgb), 0.1)' }}>
                  <p className="app-text-main">
                    أنت موظف في هذا المكان
                  </p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="overflow-y-auto p-3 backdrop-blur-sm app-bg-surface" style={{ height: '400px', flexShrink: 1 }}>
              {conversationMessages.length > 0 ? (
                <div>
                  {conversationMessages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isOwn={message.sender_id === user.id}
                      onReply={(msg) => setReplyingTo(msg)}
                      showSender={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center app-text-muted text-sm">
                  لا توجد رسائل
                </p>
              )}
            </div>

            {/* Message Input */}
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={sendMessage}
              onImageSelect={setSelectedImage}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onProductSelect={() => setShowProductPicker(!showProductPicker)}
              selectedImage={selectedImage}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              isRecording={isRecording}
              recordingTime={recordingTime}
              disabled={sendingMessages.size > 0}
              placeholder={replyingTo ? "اكتب ردك..." : "اكتب رسالتك..."}
            />

            {/* Product Picker */}
            {showProductPicker && products.length > 0 && (
              <div className="p-3 border-t app-border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <p className="text-sm font-semibold mb-2 app-text-main">اختر منتج:</p>
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowProductPicker(false)
                      }}
                      className={`p-2 rounded-lg cursor-pointer border-2 transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-[var(--primary-color)] bg-[rgba(var(--primary-color-rgb),0.1)]'
                          : 'app-border app-hover-bg'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name_ar}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold app-text-main">{product.name_ar}</p>
                          <p className="text-xs app-text-muted">{product.price_range}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Product Preview */}
            {selectedProduct && (
              <div className="p-2 border-t app-border bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                      <img
                        src={selectedProduct.images[0].image_url}
                        alt={selectedProduct.name_ar}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <p className="text-xs app-text-main truncate">{selectedProduct.name_ar}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs app-text-link hover:underline"
                  >
                    إزالة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
