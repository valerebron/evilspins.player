class Sampler {
  public audioContext: AudioContext = new AudioContext()
  public gainNode: GainNode = new GainNode(this.audioContext)
  public compressorNode: DynamicsCompressorNode = new DynamicsCompressorNode(this.audioContext)

  public audioBuffer: AudioBuffer | null = null
  public audioSource: AudioBufferSourceNode | null = null

  public duration: number = 0
  public currentSpeed: number = 0
  private userVolume: number = 1
  private normalizationGain: number = 1
  private stopTimeoutId: number | null = null

  isAudioContextRunning() {
    return String(this.audioContext.state) === 'running'
  }

  async ensureAudioContextRunning() {
    if (String(this.audioContext.state) === 'running') {
      return true
    }

    try {
      await this.audioContext.resume()
    } catch {
      return false
    }

    return String(this.audioContext.state) === 'running'
  }

  constructor() {
    this.compressorNode.threshold.value = -10
    this.compressorNode.knee.value = 20
    this.compressorNode.ratio.value = 6
    this.compressorNode.attack.value = 0.005
    this.compressorNode.release.value = 0.2

    this.gainNode.connect(this.compressorNode)
    this.compressorNode.connect(this.audioContext.destination)
  }

  private computeRmsLevel(audioBuffer: AudioBuffer): number {
    if (audioBuffer.numberOfChannels === 0) return 0

    const channelData = audioBuffer.getChannelData(0)
    const step = Math.max(1, Math.floor(channelData.length / 44100))
    let sumSquares = 0
    let count = 0

    for (let i = 0; i < channelData.length; i += step) {
      const sample = channelData[i] ?? 0
      sumSquares += sample * sample
      count++
    }

    if (count === 0) return 0
    return Math.sqrt(sumSquares / count)
  }

  private updateEffectiveGain() {
    const MAX_EFFECTIVE_GAIN = 2
    const effectiveGain = Math.max(0, Math.min(MAX_EFFECTIVE_GAIN, this.userVolume * this.normalizationGain))
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.cancelScheduledValues(currentTime)
    this.gainNode.gain.linearRampToValueAtTime(effectiveGain, currentTime + 0.03)
  }

  async getAudioBuffer(audioUrl: string) {
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    return audioBuffer
  }

  async loadTrack(audioUrl: string) {
    this.audioBuffer = await this.getAudioBuffer(audioUrl)

    const rms = this.computeRmsLevel(this.audioBuffer)
    const TARGET_RMS = 0.12
    const MIN_NORMALIZATION_GAIN = 0.65
    const MAX_NORMALIZATION_GAIN = 1.8
    const computedGain = rms > 0.0001 ? TARGET_RMS / rms : 1
    this.normalizationGain = Math.max(MIN_NORMALIZATION_GAIN, Math.min(MAX_NORMALIZATION_GAIN, computedGain))
    this.updateEffectiveGain()

    this.duration = this.audioBuffer.duration
  }

  play(offset = 0, withAcceleration = true) {
    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId)
      this.stopTimeoutId = null
    }

    this.pause()

    if (!this.audioBuffer) {
      return
    }

    const safeOffset = Math.max(0, Math.min(offset, this.duration))

    this.audioSource = this.audioContext.createBufferSource()
    this.audioSource.buffer = this.audioBuffer
    this.audioSource.loop = false

    this.audioSource.connect(this.gainNode)

    const startTime = Math.max(0, safeOffset)
    this.audioSource.start(0, startTime)

    if (withAcceleration) {
      const currentTime = this.audioContext.currentTime
      const accelerationDuration = 1.5

      this.audioSource.playbackRate.value = 0.001

      this.audioSource.playbackRate.linearRampToValueAtTime(
        1.0,
        currentTime + accelerationDuration
      )

      this.currentSpeed = 1.0
    } else {
      this.audioSource.playbackRate.value = 1.0
      this.currentSpeed = 1.0
    }
  }

  updateSpeed(speed: number, secondsPlayed: number) {
    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId)
      this.stopTimeoutId = null
    }

    if (!this.audioSource) {
      return
    }

    const MAX_RATE = 3.5
    const clampedSpeed = Math.max(-MAX_RATE, Math.min(MAX_RATE, speed))

    this.currentSpeed = clampedSpeed

    const { currentTime } = this.audioContext
    const speedAbsolute = Math.abs(clampedSpeed)

    this.audioSource.playbackRate.cancelScheduledValues(currentTime)
    this.audioSource.playbackRate.linearRampToValueAtTime(
      Math.max(0.001, speedAbsolute),
      currentTime
    )
  }

  pause() {
    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId)
      this.stopTimeoutId = null
    }

    if (!this.audioSource) {
      return
    }

    this.audioSource.stop()
  }

  pauseWithDeceleration(duration = 1.5) {
    if (!this.audioSource) {
      return
    }

    const currentTime = this.audioContext.currentTime

    this.audioSource.playbackRate.cancelScheduledValues(currentTime)
    this.audioSource.playbackRate.linearRampToValueAtTime(
      0.001,
      currentTime + duration
    )

    this.stopTimeoutId = setTimeout(() => {
      if (this.audioSource) {
        this.audioSource.stop()
      }
      this.stopTimeoutId = null
    }, duration * 1000) as unknown as number

    this.currentSpeed = 0
  }

  setVolume(volume: number) {
    this.userVolume = Math.max(0, Math.min(1, volume))
    this.updateEffectiveGain()
  }

  setPlaybackRate(rate: number) {
    if (!this.audioSource) return

    const MAX_RATE = 3.5
    const clampedRate = Math.max(-MAX_RATE, Math.min(MAX_RATE, rate))

    const currentTime = this.audioContext.currentTime
    this.audioSource.playbackRate.cancelScheduledValues(currentTime)
    this.audioSource.playbackRate.linearRampToValueAtTime(
      Math.max(0.001, Math.abs(clampedRate)),
      currentTime + 0.05
    )

    this.currentSpeed = clampedRate
  }
}

export default Sampler