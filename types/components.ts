/**
 * Component-specific TypeScript interfaces
 */

import type { PlaceEmployee } from '@/lib/types'

// Button component props
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

// Input component props
export interface InputProps {
  label?: string
  error?: string
  helperText?: string
}

// Card component props
export interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

// Modal component props
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
}

// Loading spinner props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

// PlaceCard props
export interface PlaceCardProps {
  place: import('@/lib/types').Place
  cardStyle?: string
}

// Form field props
export interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  error?: string
  helperText?: string
}

// Table props
export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
}

export interface TableColumn<T = any> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

// User Profile (minimal for messages)
export interface MessageUserProfile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
}

// Place info (minimal for messages)
export interface MessagePlace {
  id: string
  name_ar?: string
}

// Product (simplified for messages)
export interface MessageProduct {
  id: string
  name_ar?: string
  name_en?: string
  price?: number
  currency?: string
  images?: Array<{ id: string; image_url: string }>
  videos?: Array<{ id: string; video_url: string }>
  variants?: Array<{ id: string; name: string; value: string }>
}

// PlaceEmployee is imported from @/lib/types to avoid duplication

// Conversation Message (replaces Message)
export interface ConversationMessage {
  id: string
  place_id: string
  sender_id: string
  recipient_id?: string | null
  employee_id?: string | null
  content?: string
  image_url?: string
  audio_url?: string
  product_id?: string
  reply_to?: string
  is_read: boolean
  created_at: string
  sender?: MessageUserProfile
  product?: MessageProduct
  replied_message?: ConversationMessage
  place?: MessagePlace
  employee?: PlaceEmployee
}

// Conversation metadata
export interface Conversation {
  senderId: string
  sender?: MessageUserProfile
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  placeId: string
  placeName?: string
  partnerName?: string
  partnerAvatar?: string
  productId?: string
  productName?: string
  employeeId?: string
}

// Chat Input Props
export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onImageSelect: (file: File) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onProductSelect: () => void
  selectedImage: File | null
  replyingTo: ConversationMessage | null
  onCancelReply: () => void
  isRecording: boolean
  recordingTime: number
  disabled?: boolean
  placeholder?: string
}

// Message Item Props
export interface MessageItemProps {
  message: ConversationMessage
  isOwn: boolean
  onReply: (message: ConversationMessage) => void
  showSender?: boolean
}
