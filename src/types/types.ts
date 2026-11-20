/**
 * Generic card data interface for the evilspins-player component library.
 * All fields are optional except audioUrl to maximize flexibility.
 * Consumers can extend this interface with additional properties as needed.
 */
export interface CardData {
  /** Required: URL to the audio file */
  audioUrl: string

  /** Optional: URL to the cover image */
  imageUrl?: string

  /** Optional: BlurHash string for placeholder image */
  blurhash?: string

  /** Optional: Track title */
  title?: string

  /** Optional: Artist name */
  artist?: string

  /** Optional: Release year */
  year?: number

  /** Optional: Start time in seconds for playback */
  startTime?: number

  /** Optional: Unicode playing card character (from U+1F0A0–U+1F0FF) */
  unicode?: CardUnicode

  /** Allow arbitrary additional properties for extensibility */
  [key: string]: unknown
}

/**
 * @deprecated Use CardData instead. Kept for backward compatibility.
 * The original Card interface with app-specific fields (esid, slug, box_position, etc.)
 */
export interface Card {
  url_audio: string
  url_image?: string
  blurhash?: string
  year: number
  month: string
  day: string
  hour: string
  artist: string
  title: string
  esid: string
  slug: string
  createdAt: Date
  unicode: CardUnicode
  start?: number
  box_position?: number
  box_side?: string | null
}

export type CardUnicode = '🂠' | '🂡' | '🂢' | '🂣' | '🂤' | '🂥' | '🂦' | '🂧' | '🂨' | '🂩' | '🂪' | '🂫' | '🂬' | '🂭' | '🂮' | '🂱' | '🂲' | '🂳' | '🂴' | '🂵' | '🂶' | '🂷' | '🂸' | '🂹' | '🂺' | '🂻' | '🂼' | '🂽' | '🂾' | '®' | '🃁' | '🃂' | '🃃' | '🃄' | '🃅' | '🃆' | '🃇' | '🃈' | '🃉' | '🃊' | '🃋' | '🃌' | '🃍' | '🃎' | '🃏' | '🃑' | '🃒' | '🃓' | '🃔' | '🃕' | '🃖' | '🃗' | '🃘' | '🃙' | '🃚' | '🃛' | '🃜' | '🃝' | '🃞' | '🃟' | '🃠' | '🃡' | '🃢' | '🃣' | '🃤' | '🃥' | '🃦' | '🃧' | '🃨' | '🃩' | '🃪' | '🃫' | '🃬' | '🃭' | '🃮' | '🃯' | '🃰' | '🃱' | '🃲' | '🃳' | '🃴' | '🃵'

/** Configuration types for component customization */

export interface CardSize {
  width: string
  aspectRatio: string
  maxWidth?: string
  maxHeight?: string
}

export interface CardTransitionConfig {
  duration: number
  easing: string
}

export interface PlatineProgressConfig {
  minPercentage: number
  maxPercentage: number
}

export interface PlatinePhysicsConfig {
  inertiaFriction: number
  inertiaAmplification: number
  maxScratchSpeed: number
}

export interface PlatineAnimationConfig {
  accelerationDuration: number
  decelerationDuration: number
  rewindSlowDownDuration: number
  rewindScratchDuration: number
  seekScratchDuration: number
  seekInterval: number
}

export interface YearColorMap {
  [year: number]: string
}
