'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePlaces } from '@/hooks'
import { useConversationsManager } from '@/hooks/useConversationsManager'
import { MessageCircle, Search, Loader2, Users, Package, MapPin, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'places' | 'products' | 'employees'>('all')
  
  // Get user's places
  const { places: userPlaces, loading: placesLoading } = usePlaces()
  
  const {
    getConversations,
    messages
  } = useConversationsManager({ userId: user?.id || null, userPlaces })
  
  // Get conversations from manager
  const conversations = useMemo(() => getConversations(), [getConversations])
  
  // Calculate loading and unread counts
  const loading = placesLoading
  const unreadCounts = useMemo(() => {
    const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
    return { total }
  }, [conversations])

  // Filter conversations
  const filteredConversations = (conversations || []).filter(conv => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' || 
      conv.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filter
    let matchesType = true
    if (filterType !== 'all') {
      if (filterType === 'places') matchesType = !conv.productId && !conv.employeeId
      if (filterType === 'products') matchesType = !!conv.productId
      if (filterType === 'employees') matchesType = !!conv.employeeId
    }

    return matchesSearch && matchesType
  })

  // Get conversation icon based on type
  const getConversationIcon = (conv: any) => {
    if (conv.employeeId) return <Users size={20} style={{ color: colors.primary }} />
    if (conv.productId) return <Package size={20} style={{ color: colors.primary }} />
    return <MapPin size={20} style={{ color: colors.primary }} />
  }

  // Get conversation subtitle
  const getConversationSubtitle = (conv: any) => {
    if (conv.employeeId) return 'موظف'
    if (conv.productId) return conv.productName || 'منتج'
    return 'مكان'
  }

  const handleConversationClick = (conv: any) => {
    // Navigate to the place page with conversation context
    if (conv.placeId) {
      router.push(`/places/${conv.placeId}`)
    }
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <MessageCircle 
            size={64} 
            className="mx-auto mb-4" 
            style={{ color: colors.onSurface, opacity: 0.3 }} 
          />
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            يجب تسجيل الدخول
          </h3>
          <p 
            className="mb-4"
            style={{ color: colors.onSurface }}
          >
            قم بتسجيل الدخول لعرض رسائلك
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 rounded-full font-medium"
            style={{
              backgroundColor: colors.primary,
              color: colors.onPrimary
            }}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 
            className="text-3xl font-bold mb-2 flex items-center gap-3"
            style={{ color: colors.onSurface }}
          >
            <MessageCircle size={32} style={{ color: colors.primary }} />
            الرسائل
          </h1>
          <p style={{ color: colors.onSurface }}>
            {unreadCounts?.total > 0 
              ? `لديك ${unreadCounts.total} رسالة غير مقروءة`
              : 'جميع رسائلك'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.outline
            }}
          >
            <Search size={20} style={{ color: colors.onSurface }} />
            <input
              type="text"
              placeholder="ابحث في الرسائل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base"
              style={{ color: colors.onSurface }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'الكل', count: (conversations || []).length },
            { id: 'places', label: 'الأماكن', count: (conversations || []).filter(c => !c.productId && !c.employeeId).length },
            { id: 'products', label: 'المنتجات', count: (conversations || []).filter(c => c.productId).length },
            { id: 'employees', label: 'الموظفين', count: (conversations || []).filter(c => c.employeeId).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: filterType === tab.id 
                  ? colors.surfaceContainer 
                  : colors.surfaceVariant,
                color: filterType === tab.id 
                  ? colors.primary 
                  : colors.onSurface
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: filterType === tab.id 
                      ? colors.primary 
                      : colors.outline,
                    color: filterType === tab.id 
                      ? colors.onPrimary 
                      : colors.onSurface
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 
              size={48} 
              className="animate-spin mb-4" 
              style={{ color: colors.primary }} 
            />
            <p style={{ color: colors.onSurface }}>جاري التحميل...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl"
            style={{ backgroundColor: colors.surface }}
          >
            <MessageCircle 
              size={64} 
              className="mx-auto mb-4" 
              style={{ color: colors.onSurface, opacity: 0.3 }} 
            />
            <h3 
              className="text-xl font-bold mb-2"
              style={{ color: colors.onSurface }}
            >
              {searchQuery || filterType !== 'all' 
                ? 'لا توجد نتائج' 
                : 'لا توجد رسائل بعد'}
            </h3>
            <p style={{ color: colors.onSurface }}>
              {searchQuery || filterType !== 'all'
                ? 'جرب البحث بكلمات مختلفة أو غيّر الفلتر'
                : 'ابدأ محادثة مع أحد الأماكن'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => {
              const unreadCount = conv.unreadCount || 0
              const hasUnread = unreadCount > 0

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => handleConversationClick(conv)}
                  className="rounded-3xl p-4 cursor-pointer transition-all hover:scale-[1.01] border"
                  style={{
                    backgroundColor: hasUnread ? colors.surfaceContainer : colors.surface,
                    borderColor: hasUnread ? colors.primary : colors.outline,
                    borderWidth: hasUnread ? '2px' : '1px'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="rounded-full p-3 flex-shrink-0"
                      style={{
                        backgroundColor: colors.surfaceVariant
                      }}
                    >
                      {getConversationIcon(conv)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 
                          className="font-bold text-lg truncate"
                          style={{ 
                            color: hasUnread ? colors.primary : colors.onSurface 
                          }}
                        >
                          {conv.placeName}
                        </h3>
                        {conv.lastMessageAt && (
                          <span 
                            className="text-xs whitespace-nowrap flex-shrink-0"
                            style={{ 
                              color: hasUnread ? colors.primary : colors.onSurface 
                            }}
                          >
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </span>
                        )}
                      </div>

                      <p 
                        className="text-sm mb-1"
                        style={{ 
                          color: hasUnread ? colors.primary : colors.onSurface 
                        }}
                      >
                        {getConversationSubtitle(conv)}
                      </p>

                      {conv.lastMessage && (
                        <div className="flex items-center justify-between gap-2">
                          <p 
                            className="text-sm truncate"
                            style={{ 
                              color: hasUnread ? colors.primary : colors.onSurface,
                              fontWeight: hasUnread ? 600 : 400
                            }}
                          >
                            {conv.lastMessage}
                          </p>
                          {hasUnread && (
                            <div
                              className="rounded-full px-2 py-1 text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: colors.primary,
                                color: colors.onPrimary
                              }}
                            >
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
