<template>
  <div :class="[
    'rank flex items-center justify-center absolute',
    { 'suit-dark': !isRedCard, 'suit-red': isRedCard, 'revert': isDarkBackground }
  ]" :style="rankStyle">
    <slot name="suit" :isRedCard="isRedCard" :svgComponent="svgComponent">
      <div class="suit absolute">
        <component :is="svgComponent" :class="{ 'suit-red': isRedCard, 'suit-black': !isRedCard }" />
      </div>
    </slot>
    <slot name="number" :rank="rankValue">
      <div class="number text-white font-bold absolute -mt-1" :style="numberStyle">
        {{ rankValue }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardData, Suit, Rank } from '@/types/types'
import HeartSVG from '@/components/svg/HeartSVG.vue'
import DiamondSVG from '@/components/svg/DiamondSVG.vue'
import ClubSVG from '@/components/svg/ClubSVG.vue'
import SpadeSVG from '@/components/svg/SpadeSVG.vue'
import { decode } from 'blurhash'

const props = withDefaults(defineProps<{
  /** Card data */
  card?: CardData;
  /** Custom position: { top, left, size } */
  position?: { top?: string; left?: string; size?: string };
  /** Custom number style */
  numberStyle?: { size?: string; lineHeight?: string };
  /** Dark background luminance threshold (0-255) */
  darkThreshold?: number;
}>(), {
  position: () => ({ top: '8%', left: '12%', size: '20%' }),
  numberStyle: () => ({ size: '38cqw', lineHeight: '38cqw' }),
  darkThreshold: 100
})

const isRedCard = computed(() => (props.card?.suit === '♥' || props.card?.suit === '♦'))

const svgComponent = computed(() => {
  if (!props.card?.suit) return null
  switch (props.card.suit) {
    case '♥': return HeartSVG
    case '♦': return DiamondSVG
    case '♣': return ClubSVG
    case '♠': return SpadeSVG
    default: return null
  }
})

const rankValue = computed(() => {
  return props.card?.rank
})

const isDarkBackground = computed(() => {
  const blurhash = props.card?.blurhash

  if (!blurhash) return false

  const pixels = decode(blurhash, 1, 1)

  const r = pixels[0]
  const g = pixels[1]
  const b = pixels[2]

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  return luminance < props.darkThreshold
})

const rankStyle = computed(() => ({
  width: props.position?.size || '20%',
  height: props.position?.size || '20%',
  top: props.position?.top || '8%',
  left: props.position?.left || '12%',
  fontSize: '100%'
}))

const numberStyle = computed(() => ({
  width: '20%',
  fontSize: props.numberStyle?.size || '34cqw',
  lineHeight: props.numberStyle?.lineHeight || '40cqw'
}))
</script>

<style scoped>
.rank {
  transition: opacity 0.5s ease-in-out;
  container-type: inline-size;
  z-index: 10;

  .suit {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.number {
  width: 100%;
  font-size: 34cqw;
  line-height: 40cqw;
}

.suit-dark {
  color: black;
}

.suit-red {
  @apply text-red-600;
}
</style>