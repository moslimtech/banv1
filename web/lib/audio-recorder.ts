// Audio recorder helper with Opus encoding
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = stream

      // Try to use Opus codec if available
      const options: MediaRecorderOptions = {
        mimeType: this.getOpusMimeType(),
        audioBitsPerSecond: 32000, // Lower bitrate for smaller files
      }

      this.mediaRecorder = new MediaRecorder(stream, options)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('فشل في بدء التسجيل. تأكد من السماح بالوصول إلى الميكروفون.')
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.getOpusMimeType() || 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.cleanup()
        reject(new Error('Recording error'))
      }

      this.mediaRecorder.stop()
    })
  }

  private getOpusMimeType(): string | undefined {
    // Check for Opus support
    const opusTypes = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
    ]

    for (const type of opusTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    // Fallback to default
    return undefined
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    this.cleanup()
  }
}

export { AudioRecorder }
