'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Post } from '@/lib/types'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon, Video, FileText, Upload } from 'lucide-react'
import Link from 'next/link'
import { extractYouTubeId } from '@/lib/youtube'
import { useTheme } from '@/contexts/ThemeContext'

export default function PlacePostsPage() {
  const params = useParams()
  const router = useRouter()
  const { colors } = useTheme()
  const placeId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [place, setPlace] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [postData, setPostData] = useState({
    content: '',
    post_type: 'text' as 'text' | 'image' | 'video',
    image_url: '',
    video_url: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    checkUser()
  }, [placeId])

  useEffect(() => {
    if (user && place && hasPermission) {
      loadPosts()
    }
  }, [user, place, hasPermission])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)

    // Check if user owns this place or is an employee with permission
    const { data: placeData, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single()

    if (placeError || !placeData) {
      showError('المكان غير موجود')
      router.push('/dashboard/places')
      return
    }

    setPlace(placeData)

    // Check if user is owner
    if (placeData.user_id === user.id) {
      setHasPermission(true)
      setLoading(false)
      return
    }

    // Check if user is employee with permission
    const { data: employeeData } = await supabase
      .from('place_employees')
      .select('*')
      .eq('user_id', user.id)
      .eq('place_id', placeId)
      .eq('is_active', true)
      .in('permissions', ['messages_posts', 'full'])
      .maybeSingle()

    if (employeeData) {
      setHasPermission(true)
    } else {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard/places')
    }

    setLoading(false)
  }

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, creator:user_profiles(*)')
        .eq('place_id', placeId)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setPostData({ ...postData, image_url: result.url })
      closeLoading()
      showSuccess('تم رفع الصورة بنجاح')
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!postData.content.trim()) {
      showError('الرجاء إدخال محتوى المنشور')
      return
    }

    if (postData.post_type === 'image' && !postData.image_url) {
      showError('الرجاء رفع صورة')
      return
    }

    if (postData.post_type === 'video' && !postData.video_url) {
      showError('الرجاء إدخال رابط الفيديو')
      return
    }

    showLoading(editingPost ? 'جاري تحديث المنشور...' : 'جاري إضافة المنشور...')

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

      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update(postPayload)
          .eq('id', editingPost.id)

        if (error) throw error
        showSuccess('تم تحديث المنشور بنجاح')
      } else {
        const { error } = await supabase
          .from('posts')
          .insert(postPayload)

        if (error) throw error
        showSuccess('تم إضافة المنشور بنجاح')
      }

      closeLoading()
      setShowAddModal(false)
      setEditingPost(null)
      setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
      loadPosts()
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في حفظ المنشور')
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setPostData({
      content: post.content,
      post_type: post.post_type,
      image_url: post.image_url || '',
      video_url: post.video_url || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return

    showLoading('جاري حذف المنشور...')
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_active: false })
        .eq('id', postId)

      if (error) throw error

      closeLoading()
      showSuccess('تم حذف المنشور بنجاح')
      loadPosts()
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في حذف المنشور')
    }
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setEditingPost(null)
    setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return colors.primary
      case 'image':
        return colors.success
      case 'video':
        return colors.error
      default:
        return colors.onSurfaceVariant
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/dashboard/places/${placeId}`}
            className="mb-4 inline-block hover:underline"
            style={{ color: colors.primary }}
          >
            ← العودة إلى صفحة المكان
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: colors.onSurfaceVariant }}
              >
                إدارة المنشورات - {place?.name_ar}
              </h1>
              <p style={{ color: colors.onSurfaceVariant }}>إضافة وتعديل منشورات المكان</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: colors.primary,
                color: colors.onPrimary,
              }}
            >
              <Plus size={20} />
              إضافة منشور
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div 
          className="rounded-3xl shadow-lg p-6"
          style={{ backgroundColor: colors.surface }}
        >
          {posts.length === 0 ? (
            <p 
              className="text-center py-8"
              style={{ color: colors.onSurfaceVariant }}
            >
              لا توجد منشورات حالياً
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-xl p-3 sm:p-4"
                  style={{ borderColor: colors.outline }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {post.post_type === 'text' && <FileText size={16} style={{ color: colors.primary }} />}
                      {post.post_type === 'image' && <ImageIcon size={16} style={{ color: colors.success }} />}
                      {post.post_type === 'video' && <Video size={16} style={{ color: colors.error }} />}
                      <div>
                        <p 
                          className="text-sm font-semibold"
                          style={{ color: colors.onSurfaceVariant }}
                        >
                          {post.post_type === 'text' && 'منشور نصي'}
                          {post.post_type === 'image' && 'منشور بصورة'}
                          {post.post_type === 'video' && 'منشور بفيديو'}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: colors.onSurfaceVariant }}
                        >
                          {new Date(post.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{
                          color: colors.primary,
                          backgroundColor: `${colors.primary}15`,
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{
                          color: colors.error,
                          backgroundColor: `${colors.error}15`,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p 
                    className="text-sm mb-3 whitespace-pre-wrap"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    {post.content}
                  </p>

                  {post.post_type === 'image' && post.image_url && (
                    <div className="mb-3">
                      <img
                        src={post.image_url}
                        alt="منشور"
                        className="w-full max-w-xl mx-auto rounded-lg"
                      />
                    </div>
                  )}

                  {post.post_type === 'video' && post.video_url && (
                    <div className="mb-3">
                      <p 
                        className="text-xs"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        رابط الفيديو: {post.video_url}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div 
              className="rounded-3xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: colors.surface }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 
                  className="text-xl font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {editingPost ? 'تعديل المنشور' : 'إضافة منشور جديد'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="transition-colors"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Post Type Selection */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  نوع المنشور
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'text', image_url: '', video_url: '' })}
                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
                    style={{
                      backgroundColor: postData.post_type === 'text' 
                        ? colors.primary 
                        : colors.surfaceVariant,
                      color: postData.post_type === 'text' 
                        ? colors.onPrimary 
                        : colors.onSurfaceVariant,
                    }}
                  >
                    <FileText size={18} />
                    نص فقط
                  </button>
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'image', video_url: '' })}
                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
                    style={{
                      backgroundColor: postData.post_type === 'image' 
                        ? colors.success 
                        : colors.surfaceVariant,
                      color: postData.post_type === 'image' 
                        ? colors.onPrimary 
                        : colors.onSurfaceVariant,
                    }}
                  >
                    <ImageIcon size={18} />
                    صورة وكتابة
                  </button>
                  <button
                    onClick={() => setPostData({ ...postData, post_type: 'video', image_url: '' })}
                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
                    style={{
                      backgroundColor: postData.post_type === 'video' 
                        ? colors.error 
                        : colors.surfaceVariant,
                      color: postData.post_type === 'video' 
                        ? colors.onPrimary 
                        : colors.onSurfaceVariant,
                    }}
                  >
                    <Video size={18} />
                    فيديو وكتابة
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  المحتوى
                </label>
                <textarea
                  value={postData.content}
                  onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                  placeholder="اكتب محتوى المنشور..."
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.onSurfaceVariant,
                  }}
                />
              </div>

              {/* Image Upload */}
              {postData.post_type === 'image' && (
                <div className="mb-4">
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    الصورة
                  </label>
                  {postData.image_url ? (
                    <div className="relative">
                      <img
                        src={postData.image_url}
                        alt="Preview"
                        className="w-full max-w-md mx-auto rounded-lg mb-2"
                      />
                      <button
                        onClick={() => setPostData({ ...postData, image_url: '' })}
                        className="absolute top-2 right-2 p-1 rounded-full"
                        style={{
                          backgroundColor: colors.error,
                          color: colors.onPrimary,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center"
                      style={{ borderColor: colors.outline }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload size={32} style={{ color: colors.onSurfaceVariant }} />
                        <span 
                          className="text-sm"
                          style={{ color: colors.onSurfaceVariant }}
                        >
                          {uploadingImage ? 'جاري الرفع...' : 'اضغط لرفع صورة'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Video URL */}
              {postData.post_type === 'video' && (
                <div className="mb-4">
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    رابط الفيديو (YouTube أو رابط مباشر)
                  </label>
                  <input
                    type="url"
                    value={postData.video_url}
                    onChange={(e) => setPostData({ ...postData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... أو رابط مباشر"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.onSurfaceVariant,
                    }}
                  />
                  {extractYouTubeId(postData.video_url) && (
                    <p 
                      className="text-xs mt-1"
                      style={{ color: colors.success }}
                    >
                      ✓ تم التعرف على رابط YouTube بنجاح
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                  }}
                >
                  <Save size={18} />
                  {editingPost ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
