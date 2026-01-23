'use client'

import { Reply } from 'lucide-react'
import { MessageItemProps } from '@/types'

export default function MessageItem({ message, isOwn, onReply, showSender = true }: MessageItemProps) {
  return (
    <div className={`mb-3 ${isOwn ? 'text-left' : 'text-right'}`}>
      {/* Sender name */}
      {showSender && message.sender && !isOwn && (
        <p className="text-xs app-text-muted mb-1">
          {message.sender.full_name || message.sender.email || 'مستخدم'}
        </p>
      )}

      {/* Replied message preview */}
      {message.replied_message && (
        <div
          className="text-xs p-2 rounded mb-1 border-r-2"
          style={{
            background: 'rgba(var(--primary-color-rgb), 0.1)',
            borderColor: 'var(--primary-color)',
          }}
        >
          <p className="app-text-muted text-[10px] mb-0.5">
            الرد على: {message.replied_message.sender?.full_name || 'مستخدم'}
          </p>
          {message.replied_message.content && (
            <p className="app-text-main truncate">
              {message.replied_message.content}
            </p>
          )}
          {message.replied_message.image_url && !message.replied_message.content && (
            <p className="app-text-muted italic">صورة</p>
          )}
          {message.replied_message.audio_url && !message.replied_message.content && !message.replied_message.image_url && (
            <p className="app-text-muted italic">رسالة صوتية</p>
          )}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`inline-block max-w-[80%] p-3 rounded-lg ${
          isOwn ? 'rounded-br-none' : 'rounded-bl-none'
        }`}
        style={{
          background: isOwn
            ? 'var(--primary-color)'
            : 'var(--bg-surface)',
        }}
      >
        {/* Text content */}
        {message.content && (
          <p
            className="text-sm mb-0 whitespace-pre-wrap break-words"
            style={{ color: isOwn ? '#fff' : 'var(--text-color)' }}
          >
            {message.content}
          </p>
        )}

        {/* Image */}
        {message.image_url && (
          <img
            src={message.image_url}
            alt="رسالة"
            className="max-w-full rounded mt-2"
            style={{ maxHeight: '300px' }}
          />
        )}

        {/* Audio */}
        {message.audio_url && (
          <audio controls className="mt-2 w-full">
            <source src={message.audio_url} type="audio/webm" />
          </audio>
        )}

        {/* Product */}
        {message.product && (
          <div
            className="mt-2 p-2 rounded border"
            style={{
              background: isOwn
                ? 'rgba(255,255,255,0.1)'
                : 'var(--bg-color)',
              borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'var(--border-color)',
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: isOwn ? '#fff' : 'var(--text-color)' }}
            >
              {message.product.name_ar || message.product.name_en}
            </p>
            {message.product.price && (
              <p
                className="text-xs"
                style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
              >
                {message.product.price} {message.product.currency || 'ج.م'}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p
          className="text-[10px] mt-1 mb-0"
          style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
        >
          {new Date(message.created_at).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Reply button */}
      {!isOwn && (
        <button
          onClick={() => onReply(message)}
          className="mr-2 p-1 rounded transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title="الرد"
        >
          <Reply size={14} />
        </button>
      )}
    </div>
  )
}
