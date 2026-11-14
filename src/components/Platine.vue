<template>
  <div class="platine" :class="{ 'loading': isLoadingTrack, 'mounted': isMounted, 'playing': isPlaying }">
    <div class="disc" ref="discRef" id="disc">
      <div class="bobine" :style="{
        height: visibleProgressPercentage + '%',
        width: visibleProgressPercentage + '%'
      }"></div>
      <button class="power-button" @click="Power" :disabled="isLoadingTrack">
        <img class="macaron" src="/favicon.svg" />
      </button>
      <div class="turn-point" v-if="!isLoadingTrack">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/types'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Disc from '@/utils/platine/disc'
import Sampler from '@/utils/platine/sampler'

const props = withDefaults(defineProps<{
  card?: Card;
  /** Indique si cette platine est la carte actuellement ouverte/visible */
  active?: boolean;
  delegateReplayOnEnd?: boolean;
}>(), {
  card: undefined,
  active: true,
  delegateReplayOnEnd: false,
})

const emit = defineEmits(['loaded', 'finishPlaying', 'play-state-changed', 'replay-requested'])

// State
const isLoadingTrack = ref(false)
const isFirstPlay = ref(true)
const isEndOfTrack = ref(false)

const progressPercentage = ref(0)
const frozenProgressPercentage = ref<number | null>(null)
const currentTurns = ref(0)
const totalTurns = ref(0)

const disc = ref<Disc | null>(null)
const sampler = ref<Sampler | null>(null)
const discRef = ref<HTMLElement>()
const isMounted = ref(false)

const isPlaying = computed(() => Math.abs(Math.round(sampler.value?.currentSpeed || 0)) !== 0)
const currentSpeed = computed(() => sampler.value?.currentSpeed || 0)
const visibleProgressPercentage = computed(() => frozenProgressPercentage.value ?? progressPercentage.value)

let bobineFreezeTimer: ReturnType<typeof window.setTimeout> | null = null

const canAutoplayNow = async () => {
  if (!sampler.value) return false
  return await sampler.value.ensureAudioContextRunning()
}

const initPlatine = (element: HTMLElement) => {
  discRef.value = element
  disc.value = new Disc(element)
  sampler.value = new Sampler()

  if (disc.value) {
    disc.value.callbacks.onStop = () => {
      sampler.value?.pause()
    }

    disc.value.callbacks.onDragStart = async () => {
      if (sampler.value && disc.value) {
        const canPlay = await sampler.value.ensureAudioContextRunning()
        if (!canPlay) return

        sampler.value.play(disc.value.secondsPlayed || 0, false)
      }
    }

    disc.value.callbacks.onDragEnded = (secondsPlayed) => {
      if (!sampler.value || !disc.value) return

      sampler.value.play(Math.max(0, secondsPlayed), false)
      updateTurns()
    }

    disc.value.callbacks.onLoop = ({ playbackSpeed, secondsPlayed }) => {
      if (Math.abs((sampler.value?.currentSpeed || 0) - playbackSpeed) > 0.01) {
        const safeSecondsPlayed = Math.max(0, secondsPlayed)
        sampler.value?.updateSpeed(playbackSpeed, safeSecondsPlayed)
      }
      updateTurns()
    }
  }
}

const updateTurns = () => {
  if (!disc.value) return

  const newTurns = disc.value.secondsPlayed * 0.75
  const newTotalTurns = (disc.value as any)._duration * 0.75

  const minPercentage = 17
  const maxPercentage = 100
  const progressRatio = disc.value.secondsPlayed / (disc.value as any)._duration
  const newProgressPercentage = minPercentage + (progressRatio * (maxPercentage - minPercentage))

  if (
    Math.abs(currentTurns.value - newTurns) > 0.01 ||
    Math.abs(totalTurns.value - newTotalTurns) > 0.01 ||
    Math.abs(progressPercentage.value - newProgressPercentage) > 0.1
  ) {
    currentTurns.value = newTurns
    totalTurns.value = newTotalTurns
    progressPercentage.value = newProgressPercentage
    isEndOfTrack.value = disc.value.secondsPlayed + 0.1 >= (disc.value as any)._duration
    if (isEndOfTrack.value) {
      emit('finishPlaying')
    }
  }
}

const loadAudio = async (card: Card) => {
  if (!sampler.value || !card) return

  isLoadingTrack.value = true
  try {
    await sampler.value.loadTrack(card.url_audio)
    if (disc.value) {
      disc.value.setDuration(sampler.value.duration)
      disc.value.setAngle(0)
      isEndOfTrack.value = false
      currentTurns.value = 0
      totalTurns.value = sampler.value.duration * 0.75
      progressPercentage.value = 17
      updateTurns()
    }
  } finally {
    isLoadingTrack.value = false
    emit('loaded')
  }
}

const play = async (position = 0, withAcceleration = true) => {
  isFirstPlay.value = false
  if (!disc.value || !sampler.value || !props.card) return false

  const canPlay = await sampler.value.ensureAudioContextRunning()
  if (!canPlay) {
    return false
  }

  if (position === 0) {
    disc.value.setAngle(0)
    isEndOfTrack.value = false
    currentTurns.value = 0
    progressPercentage.value = 17
  }

  sampler.value.play(position, withAcceleration)

  if (withAcceleration) {
    disc.value.powerOnWithAcceleration()
  } else {
    disc.value.powerOn()
  }

  emit('play-state-changed', true)
  return true
}

const setVolume = (volume: number) => {
  sampler.value?.setVolume(volume)
}

const getCurrentTime = () => {
  return disc.value?.secondsPlayed || 0
}

const getDuration = () => {
  return sampler.value?.duration || 0
}

const getRemainingTime = () => {
  const duration = getDuration()
  if (!duration) return Infinity
  return Math.max(0, duration - getCurrentTime())
}

const jumpToPosition = async (position: number) => {
  if (!disc.value || !sampler.value) return false

  const duration = getDuration()
  if (!Number.isFinite(duration) || duration <= 0) {
    return false
  }

  const target = Math.max(0, Math.min(position, duration))

  sampler.value.play(target, false)
  disc.value.setAngle(target * 0.75 * Math.PI * 2)
  updateTurns()
  return true
}

const jumpToNearEnd = async (secondsBeforeEnd = 5) => {
  const duration = getDuration()
  if (!Number.isFinite(duration) || duration <= 0) {
    return false
  }

  const target = Math.max(0, duration - secondsBeforeEnd)
  return await jumpToPosition(target)
}

const unload = () => {
  cleanup()
  emit('play-state-changed', false)
  isEndOfTrack.value = false
  progressPercentage.value = 0
  currentTurns.value = 0
  totalTurns.value = 0
}

const freezeBobineFor = (durationMs: number) => {
  if (bobineFreezeTimer) {
    window.clearTimeout(bobineFreezeTimer)
  }

  frozenProgressPercentage.value = progressPercentage.value
  bobineFreezeTimer = window.setTimeout(() => {
    frozenProgressPercentage.value = null
    bobineFreezeTimer = null
  }, durationMs)
}

const pause = () => {
  if (!disc.value || !sampler.value) return

  sampler.value.pauseWithDeceleration()
  disc.value.powerOffWithDeceleration()
  emit('play-state-changed', false)
}

const togglePlay = async () => {
  if (isPlaying.value) {
    pause()
    return false
  } else {
    const currentPosition = disc.value?.secondsPlayed || 0
    return await play(currentPosition)
  }
}

const cleanup = () => {
  if (disc.value) {
    disc.value.stop()
    disc.value.powerOff()
  }
  if (sampler.value) {
    sampler.value.pause()
  }
}

const Power = async () => {
  if (isEndOfTrack.value) {
    if (props.delegateReplayOnEnd) {
      emit('replay-requested')
      return
    }

    // Rewind to start without scratch effect
    if (disc.value) {
      disc.value.setAngle(0)
      updateTurns()
    }
    await play(0, false)
    return
  }
  await togglePlay()
}

onMounted(async () => {
  isMounted.value = true
  if (discRef.value) {
    initPlatine(discRef.value)
    if (props.card) {
      await loadAudio(props.card)
    }
  }
})

onUnmounted(() => {
  isMounted.value = false
  if (bobineFreezeTimer) {
    window.clearTimeout(bobineFreezeTimer)
  }
  cleanup()
})

watch(() => props.card, (newCard) => {
  if (newCard) {
    loadAudio(newCard)
  }
})

defineExpose({
  canAutoplayNow,
  pause,
  play,
  jumpToNearEnd,
  freezeBobineFor,
  togglePlay,
  setVolume,
  getCurrentTime,
  getDuration,
  getRemainingTime,
  unload,
})
</script>

<style lang="scss">
.platine {
  overflow: hidden;
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;

  .disc {
    pointer-events: auto;
    position: absolute;
    background-color: transparent;
    position: relative;
    aspect-ratio: 1;
    width: 100%;
    overflow: hidden;
    border-radius: 50%;
    cursor: grab;
    background-position: center;
    background-size: cover;
    padding: 6%;

    .loading & {
      box-shadow: none;
    }
  }

  .turn-point {
    @apply absolute top-1/2 right-2 size-1/12 rounded-full bg-esyellow;
  }

  .disc.is-scratching {
    cursor: grabbing;
  }

  .power-button {
    position: absolute;
    z-index: 100;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 33%;
    height: 33%;
    border-radius: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.2);

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 220, 0, 0.5);
    }

    .macaron {
      @apply size-2/3;
      filter: grayscale(1);
      transition: filter 0.3s;
    }

    &:active .macaron {
      transform: scale(0.9);
    }
  }

  &.playing .power-button .macaron {
    filter: grayscale(0);
  }

  .bobine {
    width: 17%;
    height: 17%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    @apply relative bg-black/70 rounded-full;
  }
}
</style>