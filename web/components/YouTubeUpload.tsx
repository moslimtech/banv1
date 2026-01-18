'use client'

import { useState } from 'react'
import { showError, showSuccess, showLoading, closeLoading } from './SweetAlert'
import { Upload, X } from 'lucide-react'

interface YouTubeUploadProps {
  onVideoUploaded: (videoUrl: string) => void
  maxVideos?: number
  currentVideos?: number
  allowReplace?: boolean // السماح باستبدال الفيديو الموجود
}

export default function YouTubeUpload({
  onVideoUploaded,
  maxVideos = 1,
  currentVideos = 0,
  allowReplace = false,
}: YouTubeUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Default privacy status: unlisted (غير مدرج)
  const privacyStatus: 'unlisted' = 'unlisted'

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2GB for YouTube)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        showError('حجم الفيديو كبير جداً. الحد الأقصى هو 2GB')
        return
      }

      // Check file type
      if (!file.type.startsWith('video/')) {
        showError('الرجاء اختيار ملف فيديو صحيح')
        return
      }

      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      showError('الرجاء اختيار فيديو وإدخال عنوان')
      return
    }

    // السماح بالرفع إذا كان في وضع الاستبدال (التعديل)
    if (!allowReplace && currentVideos >= maxVideos) {
      showError(`تم الوصول للحد الأقصى من الفيديوهات (${maxVideos})`)
      return
    }

    try {
      setUploading(true)
      showLoading('جاري رفع الفيديو إلى YouTube...')

      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('tags', tags)
      formData.append('privacyStatus', 'unlisted') // Default: unlisted (غير مدرج)

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }

      if (data.videoUrl) {
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
        onVideoUploaded(data.videoUrl)
        // Reset form
        setSelectedFile(null)
        setTitle('')
        setDescription('')
        setTags('')
      } else {
        throw new Error('لم يتم إرجاع رابط الفيديو من YouTube')
      }
    } catch (error: any) {
      closeLoading()
      const errorMessage = error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.'
      showError(errorMessage)
      console.error('YouTube upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg app-border" style={{ background: 'var(--status-blue-bg)', borderColor: 'var(--primary-color)' }}>
        <p className="text-sm" style={{ color: 'var(--primary-color)' }}>
          <strong>ملاحظة:</strong> جميع الفيديوهات تُرفع على حساب YouTube الخاص بالموقع. لا حاجة لربط حساب YouTube شخصي.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          اختر فيديو للرفع *
        </label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors app-border" style={{ borderColor: 'var(--border-color)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload size={32} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm app-text-muted">
              {selectedFile ? selectedFile.name : 'انقر لاختيار فيديو'}
            </span>
            <span className="text-xs app-text-muted">
              الحد الأقصى: 2GB
            </span>
          </label>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 text-sm app-text-muted">
            <span>الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="app-hover-bg"
              style={{ color: 'var(--status-error)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 app-text-main">
          عنوان الفيديو *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل عنوان الفيديو"
          className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
          style={{ borderColor: 'var(--border-color)' }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          maxLength={100}
        />
        <p className="text-xs app-text-muted mt-1">{title.length}/100</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 app-text-main">
          وصف الفيديو (اختياري)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أدخل وصف الفيديو"
          rows={4}
          className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
          style={{ borderColor: 'var(--border-color)' }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          maxLength={5000}
        />
        <p className="text-xs app-text-muted mt-1">{description.length}/5000</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 app-text-main">
          العلامات (Tags) - مفصولة بفواصل
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="مثال: منتج، تسوق، عرض"
          className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
          style={{ borderColor: 'var(--border-color)' }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos)}
        className="w-full px-4 py-3 text-white rounded-lg disabled:cursor-not-allowed transition-colors font-semibold"
        style={{ 
          background: !selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos) 
            ? 'var(--text-muted)' 
            : 'var(--primary-color)' 
        }}
        onMouseEnter={(e) => {
          if (!(!selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos))) {
            e.currentTarget.style.opacity = '0.9'
          }
        }}
        onMouseLeave={(e) => {
          if (!(!selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos))) {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        {uploading ? 'جاري الرفع...' : allowReplace && currentVideos > 0 ? 'استبدال الفيديو' : 'رفع الفيديو إلى YouTube'}
      </button>

      {!allowReplace && currentVideos >= maxVideos && (
        <p className="text-sm text-center" style={{ color: 'var(--status-error)' }}>
          تم الوصول للحد الأقصى من الفيديوهات ({maxVideos})
        </p>
      )}
    </div>
  )
}
