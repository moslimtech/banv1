// Catbox API helper for audio uploads
const CATBOX_USERHASH = 'fb0e9c60051cd14b12cef1250'

export async function uploadAudioToCatbox(audioFile: File | Blob): Promise<string> {
  const formData = new FormData()
  formData.append('fileToUpload', audioFile)
  formData.append('reqtype', 'fileupload')
  formData.append('userhash', CATBOX_USERHASH)

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Catbox API error: ${response.statusText}`)
    }

    const url = await response.text()
    
    // Catbox returns the URL directly as text
    if (url && url.startsWith('http')) {
      return url.trim()
    }
    
    throw new Error('Failed to upload audio to Catbox')
  } catch (error) {
    console.error('Catbox upload error:', error)
    throw new Error('Failed to upload audio to Catbox')
  }
}
