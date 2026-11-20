<template>
  <div class="screen-centered p-4">
    <CardComponent :card="card" click-behavior="self-play" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CardComponent from './components/Card.vue'
import type { CardData } from '@/types/types'

const card = ref<CardData>({
  audioUrl: 'https://pnb-website-bucket.s3.us-east-2.amazonaws.com/samples/audio/flac/sample-audio-30s.flac',
  imageUrl: 'https://i.ebayimg.com/images/g/LawAAOSwtutcWxl1/s-l1200.jpg',
  blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  year: 2022,
  artist: 'artist',
  title: 'title',
  unicode: '🂹', // 9 of hearts
})
</script>
