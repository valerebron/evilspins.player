<template>
  <button :tabindex="props.tabindex" class="play-button"
    :class="{ 'is-loading': isLoading }" :disabled="isLoading" type="button">
    <Loader v-if="props.isLoading" />
    <template v-else>
      <PlayPauseIcon :isPlaying class="text-esyellow" />
    </template>
  </button>
</template>

<script setup lang="ts">
import PlayPauseIcon from './PlayPauseIcon.vue'
import Loader from './Loader.vue'

const props = withDefaults(defineProps<{
  isLoading?: boolean;
  isPlaying?: boolean;
  /** Surcharge le tabindex calculé (permet de garder le bouton cliquable sans l'inclure dans l'ordre de tabulation) */
  tabindex?: number | undefined;
}>(), {
  isLoading: false,
  isPlaying: false
})
</script>

<style scoped lang="scss">
.play-button {
  @apply text-esyellow bg-black/50 transition-all duration-100 ease-in-out transform active:scale-90 scale-110 text-4xl font-bold;
  pointer-events: none;
  border-radius: 100%;
  height: 30%;
  font-size: 420%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    @apply bg-esyellow;
    width: 30%;
    height: 30%;
    clip-path: polygon(0% 5%, 95% 50%, 0% 95%);
    border-radius: 10px;
  }

  .loader {
    @apply fill-esyellow opacity-70;
    padding: 22%;
  }
}
</style>
