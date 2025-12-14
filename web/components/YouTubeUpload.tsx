'use client'

import { useState } from 'react'
import { showError, showSuccess, showLoading, closeLoading } from './SweetAlert'
import { Upload, X } from 'lucide-react'

interface YouTubeUploadProps {
  onVideoUploaded: (videoUrl: string) => void
  maxVideos?: number
  currentVideos?: number
}

export default function YouTubeUpload({
  onVideoUploaded,
  maxVideos = 1,
  currentVideos = 0,
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

    if (currentVideos >= maxVideos) {
      showError(`الحد الأقصى للفيديوهات هو ${maxVideos}`)
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

      if (data.success && data.videoUrl) {
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
        onVideoUploaded(data.videoUrl)
        // Reset form
        setSelectedFile(null)
        setTitle('')
        setDescription('')
        setTags('')
      } else {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>ملاحظة:</strong> جميع الفيديوهات تُرفع على حساب YouTube الخاص بالموقع. لا حاجة لربط حساب YouTube شخصي.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          اختر فيديو للرفع *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
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
            <Upload className="text-gray-400" size={32} />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'انقر لاختيار فيديو'}
            </span>
            <span className="text-xs text-gray-500">
              الحد الأقصى: 2GB
            </span>
          </label>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span>الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          عنوان الفيديو *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل عنوان الفيديو"
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          maxLength={100}
        />
        <p className="text-xs text-gray-600 mt-1">{title.length}/100</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          وصف الفيديو (اختياري)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أدخل وصف الفيديو"
          rows={4}
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          maxLength={5000}
        />
        <p className="text-xs text-gray-600 mt-1">{description.length}/5000</p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          العلامات (Tags) - مفصولة بفواصل
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="مثال: منتج، تسوق، عرض"
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || !title.trim() || uploading || currentVideos >= maxVideos}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        {uploading ? 'جاري الرفع...' : 'رفع الفيديو إلى YouTube'}
      </button>

      {currentVideos >= maxVideos && (
        <p className="text-sm text-red-600 text-center">
          تم الوصول للحد الأقصى من الفيديوهات ({maxVideos})
        </p>
      )}
    </div>
  )
}
