const TAU = Math.PI * 2

const targetFPS = 60
const RPS = 0.75
const RPM = RPS * 60

const RADIANS_PER_MINUTE = RPM * TAU
const RADIANS_PER_SECOND = RADIANS_PER_MINUTE / 60
const RADIANS_PER_MILLISECOND = RADIANS_PER_SECOND * 0.001

const ROTATION_SPEED = (TAU * RPS) / targetFPS

type Vector = {
  x: number
  y: number
}

type NumberArray = Array<number>

const average = (arr: NumberArray) => arr.reduce((memo, val) => memo + val, 0) / arr.length

// Limit array size by cutting off from the start
const limit = (arr: NumberArray, maxLength = 10) => {
  const deleteCount = Math.max(0, arr.length - maxLength)
  return arr.slice(deleteCount)
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

const getElementCenter = (el: HTMLElement): Vector => {
  const { left, top, width, height } = el.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  return { x, y }
}

const angleBetween = (vec1: Vector, vec2: Vector) => Math.atan2(vec2.y - vec1.y, vec2.x - vec1.x)

const angleDifference = (x: number, y: number) => Math.atan2(Math.sin(x - y), Math.cos(x - y))

type DiscProgress = {
  playbackSpeed: number
  secondsPlayed: number
  progress: number
}

class Disc {
  public el: HTMLElement

  private _playbackSpeed = 1
  private _duration = 0
  private _isDragging = false
  private _isPoweredOn = false

  private _center: Vector

  private _currentAngle = 0
  private _previousAngle = 0
  private _maxAngle = TAU

  public rafId: number | null = null
  public previousTimestamp: number

  private _draggingSpeeds: Array<number> = []
  private _draggingFrom: Vector = { x: 0, y: 0 }

  // Propriétés pour l'inertie
  private _inertiaVelocity: number = 0
  private _isInertiaActive: boolean = false
  private _basePlaybackSpeed: number = 1
  private _inertiaFriction: number = 0.9
  private _lastDragVelocity: number = 0
  private _lastDragTime: number = 0
  private _inertiaAmplification: number = 12
  private _previousDuration: number = 0
  private _accelerationRafId: number | null = null
  private _decelerationRafId: number | null = null

  private _activePointerId: number | null = null

  public callbacks = {
    onDragStart: (): void => {},
    onDragProgress: (): void => {},
    onDragEnded: (secondsPlayed: number): void => {},
    onStop: (): void => {},
    onLoop: (params: DiscProgress): void => {}
  }

  constructor(el: HTMLElement) {
    this.el = el
    this._center = getElementCenter(this.el)
    this.previousTimestamp = performance.now()

    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerMove = this.handlePointerMove.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.loop = this.loop.bind(this)

    this.init()
  }

  init() {
    this.el.style.touchAction = 'none'
    this.el.addEventListener('pointerdown', this.handlePointerDown, { passive: false })
    document.addEventListener('pointermove', this.handlePointerMove, { passive: false })
    document.addEventListener('pointerup', this.handlePointerUp)
    document.addEventListener('pointercancel', this.handlePointerUp)
  }

  get playbackSpeed() {
    return this._playbackSpeed
  }

  set playbackSpeed(s) {
    this._draggingSpeeds.push(s)
    this._draggingSpeeds = limit(this._draggingSpeeds, 10)

    let avg = average(this._draggingSpeeds)

    const MAX_SCRATCH_SPEED = 3.5
    avg = clamp(avg, -MAX_SCRATCH_SPEED, MAX_SCRATCH_SPEED)

    this._playbackSpeed = avg
  }

  get secondsPlayed() {
    return this._currentAngle / TAU / RPS
  }

  set isDragging(d) {
    this._isDragging = d
    this.el.classList.toggle('is-scratching', d)
  }

  get isDragging() {
    return this._isDragging
  }

  powerOn() {
    if (this._decelerationRafId !== null) {
      cancelAnimationFrame(this._decelerationRafId)
      this._decelerationRafId = null
      this.powerOnWithAcceleration()
      return
    }
    this._isPoweredOn = true
    this._basePlaybackSpeed = 1
    this.start()
  }

  powerOnWithAcceleration(duration = 1500) {
    if (this._decelerationRafId !== null) {
      cancelAnimationFrame(this._decelerationRafId)
      this._decelerationRafId = null
    }

    this._isInertiaActive = false
    this._inertiaVelocity = 0

    this._isPoweredOn = true
    const targetSpeed = 1
    const startTime = performance.now()
    const startSpeed = this._basePlaybackSpeed

    const accelerate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeIn = 1 - Math.pow(1 - progress, 3)
      this._basePlaybackSpeed = startSpeed + (targetSpeed - startSpeed) * easeIn

      if (progress < 1) {
        this._accelerationRafId = requestAnimationFrame(accelerate)
      } else {
        this._basePlaybackSpeed = targetSpeed
        this._accelerationRafId = null
      }
    }

    this.start()
    this._accelerationRafId = requestAnimationFrame(accelerate)
  }

  powerOff() {
    if (this._accelerationRafId !== null) {
      cancelAnimationFrame(this._accelerationRafId)
      this._accelerationRafId = null
      this.powerOffWithDeceleration()
      return
    }

    this._isInertiaActive = false
    this._inertiaVelocity = 0

    this._isPoweredOn = false
    this._basePlaybackSpeed = 0
  }

  powerOffWithDeceleration(duration = 1500) {
    if (this._accelerationRafId !== null) {
      cancelAnimationFrame(this._accelerationRafId)
      this._accelerationRafId = null
    }

    this._isInertiaActive = false
    this._inertiaVelocity = 0

    const startTime = performance.now()
    const startSpeed = this._basePlaybackSpeed

    const decelerate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, 3)
      this._basePlaybackSpeed = startSpeed * (1 - easeOut)

      if (progress < 1) {
        this._decelerationRafId = requestAnimationFrame(decelerate)
      } else {
        this._basePlaybackSpeed = 0
        this._isPoweredOn = false
        this._decelerationRafId = null
      }
    }

    this._decelerationRafId = requestAnimationFrame(decelerate)
  }

  public setDuration(duration: number) {
    this._previousDuration = this._duration
    this._duration = duration
    this._maxAngle = duration * RPS * TAU
  }

  handlePointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement
    if (target.closest('.power-button, .power-logo')) {
      return
    }

    if (this._activePointerId !== null) {
      return
    }

    try {
      this.el.setPointerCapture(e.pointerId)
    } catch {}

    this._activePointerId = e.pointerId
    this._lastDragTime = performance.now()
    this._lastDragVelocity = 0

    if (this.rafId === null) {
      this.start()
    }

    e.preventDefault()

    this.callbacks.onDragStart()

    this._center = getElementCenter(this.el)
    this._draggingFrom = { x: e.clientX, y: e.clientY }
    this.isDragging = true
  }

  handlePointerMove(e: PointerEvent) {
    if (e.pointerId !== this._activePointerId) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this._lastDragTime

    const pointerPosition: Vector = {
      x: e.clientX,
      y: e.clientY
    }

    const anglePointerToCenter = angleBetween(this._center, pointerPosition)
    const angle_DraggingFromToCenter = angleBetween(this._center, this._draggingFrom)
    let angleDragged = angleDifference(angle_DraggingFromToCenter, anglePointerToCenter)

    if (deltaTime > 0) {
      this._lastDragVelocity = -angleDragged / deltaTime
    }

    this._lastDragTime = currentTime

    this.setAngle(this._currentAngle - angleDragged)
    this._draggingFrom = { ...pointerPosition }

    if (e.cancelable) {
      try { e.preventDefault() } catch {}
    }
  }

  handlePointerUp(e: PointerEvent) {
    if (e.pointerId !== this._activePointerId) return

    try {
      this.el.releasePointerCapture(e.pointerId)
    } catch {}

    this._activePointerId = null
    this.isDragging = false

    this._isInertiaActive = true
    this._inertiaVelocity = this._lastDragVelocity * this._inertiaAmplification

    if (this.rafId === null) {
      this.start()
    }

    if (this._accelerationRafId === null && this._decelerationRafId === null) {
      this._basePlaybackSpeed = this._isPoweredOn ? 1 : 0
    }

    this.callbacks.onDragEnded(this.secondsPlayed)
  }

  autoRotate(currentTimestamp: number) {
    const timestampElapsed = currentTimestamp - this.previousTimestamp

    if (this._isInertiaActive) {
      const inertiaRotation = this._inertiaVelocity * timestampElapsed
      this.setAngle(this._currentAngle + inertiaRotation, true)

      if (this._isPoweredOn) {
        const targetVelocity = RADIANS_PER_MILLISECOND * Math.abs(this._basePlaybackSpeed)

        if (Math.abs(this._inertiaVelocity - targetVelocity) < 0.0001) {
          this._isInertiaActive = false
          this._inertiaVelocity = targetVelocity
        } else {
          this._inertiaVelocity += (targetVelocity - this._inertiaVelocity) * 0.1
        }
      } else {
        this._inertiaVelocity *= this._inertiaFriction

        if (Math.abs(this._inertiaVelocity) < 0.0001) {
          this._isInertiaActive = false
          this._inertiaVelocity = 0
          this._playbackSpeed = 0
          this.callbacks.onStop()
        }
      }
    } else {
      const baseRotation = RADIANS_PER_MILLISECOND * Math.abs(this._basePlaybackSpeed) * timestampElapsed
      this.setAngle(this._currentAngle + baseRotation, true)
    }
  }

  setAngle(angle: number, checkBounds = false) {
    if (checkBounds) {
      if (angle < 0) {
        this._currentAngle = 0
        this._inertiaVelocity = 0
        this._isInertiaActive = false
        this._playbackSpeed = 0
        this._basePlaybackSpeed = 1
        this.el.style.transform = 'rotate(0rad)'
        return 0
      } else if (angle >= this._maxAngle) {
        this._currentAngle = this._maxAngle
        this._inertiaVelocity = 0
        this._isInertiaActive = false
        this._playbackSpeed = 0
        this._basePlaybackSpeed = 0
        this.el.style.transform = `rotate(${this._maxAngle}rad)`
        this.callbacks.onStop()
        this._isPoweredOn = false
        this.stop()
        return this._maxAngle
      }
    }

    if (angle < 0) {
      this._currentAngle = 0
    } else if (angle > this._maxAngle) {
      this._currentAngle = this._maxAngle
    } else {
      this._currentAngle = angle
    }

    if (this.el) {
      this.el.style.transform = `rotate(${this._currentAngle}rad)`
    }

    return this._currentAngle
  }

  start() {
    this.previousTimestamp = performance.now()
    this.loop()
  }

  stop() {
    this._isInertiaActive = false
    this._inertiaVelocity = 0
    cancelAnimationFrame(this.rafId!)
    this.rafId = null
  }

  isStopped(): boolean {
    return this.rafId === null && !this._isInertiaActive
  }

  loop() {
    const currentTimestamp = performance.now()
    const timestampDifferenceMS = currentTimestamp - this.previousTimestamp

    if ((this._isPoweredOn || this._isInertiaActive) && !this.isDragging) {
      this.autoRotate(currentTimestamp)
    }

    if (this.isDragging || this._isInertiaActive) {
      const rotated = this._currentAngle - this._previousAngle
      const rotationNormal = RADIANS_PER_MILLISECOND * timestampDifferenceMS
      this.playbackSpeed = rotated / rotationNormal || 0
    } else if (this._isPoweredOn) {
      this._playbackSpeed = this._basePlaybackSpeed
    } else {
      this._playbackSpeed = 0
    }

    this.el.style.transform = `rotate(${this._currentAngle}rad)`

    const secondsPlayed = this.secondsPlayed
    const progress = this._duration > 0 ? secondsPlayed / this._duration : 0

    if (this._previousAngle !== this._currentAngle || this._previousDuration !== this._duration) {
      this.callbacks.onLoop({
        playbackSpeed: this._playbackSpeed,
        secondsPlayed,
        progress
      })
    }

    this._previousAngle = this._currentAngle
    this.previousTimestamp = currentTimestamp

    this.rafId = requestAnimationFrame(this.loop)
  }
}

export default Disc