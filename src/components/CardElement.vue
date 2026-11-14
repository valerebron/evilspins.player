<template>
  <article :role="props.role" :class="[
    'card-element cursor-pointer',
    isFaceUp ? 'face-up' : 'face-down',
    props.isDisabled ? 'is-disabled' : ''
  ]" :tabindex="props.tabindex" :aria-disabled="props.isDisabled" @click="onCardClick" @keydown.enter="onCardEnter">
    <div class="flip-inner" ref="cardElement">
      <!-- Face-Up -->
      <main
        class="face-up z-10 p-[6%] hover:shadow-xl hover:scale-110 transition-all shadow-lg flex flex-col overflow-hidden border-2">

        <slot name="rank">
          <Rank :card="card" v-if="showRank" />
        </slot>

        <!-- Cover -->
        <figure class="cover relative">
          <slot name="cover" :isLoading="isLoading" :isPlaying="isPlaying">
            <PlayButton :is-loading="isLoading" :is-playing="isPlaying" interactive :tabindex="-1"
                aria-label="play" class="z-10" />
            <img v-if="isInlineImageUrl" :src="card.imageUrl" alt="card cover"
              class="cover-image relative z-0 w-full h-full object-cover object-center" draggable="false" />
            <img v-else :src="card.imageUrl" alt="card cover" loading="lazy"
              class="cover-image relative z-0 w-full h-full object-cover object-center"
              draggable="false" />
          </slot>
        </figure>

        <!-- Body -->
        <slot name="card-body" :card="card">
          <div
            class="card-body p-[6%] text-center bg-white rounded-b-xl opacity-0 -mt-16 hover:opacity-100 hover:-mt-0 transition-all duration-300">
            <h2 class="select-text text-sm text-neutral-500 first-letter:uppercase truncate">
              {{ card.title || '' }}
            </h2>
            <p class="select-text text-base text-neutral-800 font-bold capitalize truncate">
              {{ card.artist || '' }}
            </p>
          </div>
        </slot>
      </main>

      <!-- Face-Down -->
      <footer
        class="face-down z-10 p-[6%] bg-opacity-10 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden select-none">
        <figure class="cover">
          <slot name="face-down" :isLoading="isLoading" :isPlaying="isPlaying" :backColor="resolvedBackColor" :backImage="resolvedBackImage">
            <PlayButton :is-loading="isLoading" :is-playing="isPlaying" />
            <img :src="resolvedBackImage" class="cover-image" :style="{ backgroundColor: resolvedBackColor }" draggable="false" />
          </slot>
        </figure>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { CardData, Suit, Rank as RankType, YearColorMap } from '@/types/types'
import { computed } from 'vue'
import { getYearColor, defaultYearColorMap } from '@/utils/colors'
import Rank from './Rank.vue'
import PlayButton from './UI/PlayButton.vue'

// Import SVG assets for library distribution
import FaceDownSvg from '@/assets/face-down.svg?url'
import FaceDownTarotSvg from '@/assets/face-down-tarot.svg?url'

const emit = defineEmits<{
  click: [event: MouseEvent | KeyboardEvent]
  'button-click': [payload: { button: string; card: CardData }]
}>()

const props = withDefaults(defineProps<{
  /** Card data - uses the new generic CardData interface */
  card: CardData;
  /** Custom back color, overrides year-based color */
  backColor?: string | null;
  /** Whether the card is face up */
  isFaceUp?: boolean;
  /** Loading state for play button */
  isLoading?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Playing state for play button */
  isPlaying?: boolean;
  /** Available buttons (for future extension) */
  buttons?: string[];
  /** ARIA role */
  role?: string;
  /** Tab index for accessibility */
  tabindex?: string | number;
  /** Use tarot-style back image */
  useTarotBack?: boolean;
  /** Custom back image URL (overrides useTarotBack) */
  backImage?: string;
  /** Custom function to resolve back color from year */
  backColorResolver?: (year: number | undefined) => string;
  /** Custom year-to-color map */
  yearColorMap?: YearColorMap;
  /** Show rank indicator (suit + rank) */
  showRank?: boolean;
  /** Image loading strategy */
  imageLoading?: 'lazy' | 'eager' | 'inline';
}>(), {
  backColor: null,
  isFaceUp: false,
  isDisabled: false,
  isPlaying: false,
  buttons: () => ['play'],
  role: 'button',
  tabindex: '0',
  useTarotBack: false,
  showRank: true,
  imageLoading: 'lazy'
})

// Convert legacy Card to CardData if needed
const card = computed<CardData>(() => {
  const c = props.card as any
  // Support both new CardData and legacy Card formats
  return {
    audioUrl: c.audioUrl || c.url_audio,
    imageUrl: c.imageUrl || c.url_image,
    blurhash: c.blurhash,
    title: c.title,
    artist: c.artist,
    year: c.year,
    startTime: c.startTime || c.start,
    suit: c.suit,
    rank: c.rank,
    ...c // Pass through any additional properties
  }
})

const resolvedBackColor = computed(() => {
  if (props.backColor) return props.backColor
  if (props.backColorResolver) return props.backColorResolver(card.value.year)
  return getYearColor(card.value.year || 0, props.yearColorMap || defaultYearColorMap)
})

const resolvedBackImage = computed(() => {
  if (props.backImage) return props.backImage
  return props.useTarotBack ? FaceDownTarotSvg : FaceDownSvg
})

const isInlineImageUrl = computed(() => {
  const image = card.value.imageUrl || ''
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

// Expose slot data types for consumers
defineExpose({
  // Slot prop types are inferred from template
})
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
    img {
      width: 100%;
    }

    figure {
      overflow: hidden;
    }
  }

  .face-down {
    transform: rotateY(-180deg);
  }

  &.face-down .flip-inner {
    transform: rotateY(180deg);
  }

  &.face-up .flip-inner {
    transform: rotateY(0deg);
  }

  &.face-down:hover {
    .play-button {
      opacity: 1;
    }

    .flip-inner {
      transform: rotateY(170deg);
    }
  }

  &:focus:not(.is-disabled),
  &.current-card:not(.is-disabled) {
    @apply z-50 scale-110;
    outline: none;

    .face-up {
      @apply shadow-2xl;
      transition:
        box-shadow 0.6s,
        transform 6s;
    }
  }

  &:focus:not(.is-disabled),
  &.current-card:not(.is-disabled) {
    .play-button {
      @apply opacity-100;
    }
  }

  .face-up {

    &:hover {

      .play-button,
      .action-buttons {
        opacity: 1;
      }

      .action-buttons {
        pointer-events: auto;
      }
    }

    .flip-inner {
      transform: rotateY(-170deg);
    }
  }


  .play-button {
    @apply absolute opacity-100;
  }

  @media (hover: hover) and (pointer: fine) {
    .play-button {
      @apply opacity-0 hover:opacity-100;
    }
  }

  .play-button {

    &.loading {
      opacity: 1 !important;
    }

  }

  .cover-image:active,
  .face-down:active {
    .play-button {
      @apply scale-90;
    }
  }
}
</style>