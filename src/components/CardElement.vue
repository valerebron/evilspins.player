<template>
  <article class="card-element cursor-pointer" :class="{ 'face-up': isFaceUp, 'face-down': !isFaceUp, 'is-disabled': props.isDisabled }" :aria-disabled="props.isDisabled" @click="onCardClick" @keydown.enter="onCardEnter">
    <div class="flip-inner" ref="cardElement">
      <!-- Face-Up -->
      <main class="face-up z-10 p-[6%] hover:shadow-xl hover:scale-110 transition-all shadow-lg flex flex-col overflow-hidden border-2">
        <Rank :card="props.card" />
        <!-- Cover -->
        <figure class="cover relative">
          <PlayButton :is-loading="isLoading" :is-playing="props.isPlaying" interactive :tabindex="-1" aria-label="play" class="z-10" />
          <img v-if="isInlineImageUrl" :src="props.card.url_image" alt="card cover" class="cover-image relative z-0 w-full h-full object-cover object-center" draggable="false" />
          <img v-else :src="props.card.url_image" alt="card cover" loading="lazy" class="cover-image relative z-0 w-full h-full object-cover object-center" draggable="false" />
        </figure>
        <!-- Body -->
        <div class="card-body p-[6%] text-center bg-white rounded-b-xl opacity-0 -mt-16 hover:opacity-100 hover:-mt-0 transition-all duration-300">
          <h2 class="select-text text-sm text-neutral-500 first-letter:uppercase truncate">{{ props.card.title || 'title' }}</h2>
          <p class="select-text text-base text-neutral-800 font-bold capitalize truncate">{{ props.card.artist || 'artist' }}</p>
        </div>
      </main>
      <!-- Face-Down -->
      <footer class="face-down z-10 p-[6%] bg-opacity-10 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden select-none">
        <figure class="cover">
          <PlayButton :is-loading="isLoading" :is-playing="props.isPlaying" />
          <img :src="faceDownImageSrc" class="cover-image" :style="{ backgroundColor: cardColor }" draggable="false" />
        </figure>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Card } from '@/types/types'
import { computed } from 'vue'
import { getYearColor } from '@/utils/colors'
import Rank from './Rank.vue'
import PlayButton from './UI/PlayButton.vue'

const emit = defineEmits(['click'])

const props = withDefaults(defineProps<{
  card: Card;
  backColor?: string | null;
  isFaceUp?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  isPlaying?: boolean;
}>(), {
  backColor: null,
  isFaceUp: false,
  isDisabled: false,
  isPlaying: false
})

const cardColor = computed(() => props.backColor || getYearColor(props.card.year || 0))
const faceDownImageSrc = '/face-down.svg'
const isInlineImageUrl = computed(() => {
  const image = props.card.url_image || ''
  return image.startsWith('blob:') || image.startsWith('data:')
})

const onCardClick = (event: MouseEvent) => {
  if (props.isDisabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

const onCardEnter = (event: KeyboardEvent) => {
  if (props.isDisabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style lang="scss">
.card-element {
  perspective: 1000px;
  @apply transition-all scale-100 size-full;

  .flip-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    transform-origin: center;
  }

  .face-down,
  .face-up {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    will-change: transform;
    background-color: white;

    .cover {
      @apply flex-1 flex justify-center items-center overflow-hidden cursor-pointer;
      border-radius: 0.75rem;
    }
  }

  .face-up {
    border-radius: 1rem;
    border: none;
    transform: rotateY(0deg);
    transition: box-shadow 0.6s;
  }

  .face-down {
    img { width: 100%; }
    figure { overflow: hidden; }
    transform: rotateY(-180deg);
  }

  &.face-down .flip-inner { transform: rotateY(180deg); }
  &.face-up .flip-inner { transform: rotateY(0deg); }

  .face-up:hover .flip-inner { transform: rotateY(-170deg); }

  .play-button {
    @apply absolute opacity-100;
  }

  @media (hover: hover) and (pointer: fine) {
    .play-button { @apply opacity-0 hover:opacity-100; }
  }

  .play-button.loading { opacity: 1 !important; }

  .cover-image:active, .face-down:active .play-button { @apply scale-90; }
}
</style>