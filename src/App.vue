<template>
  <div class="screen-centered p-4">
    <Card :card="card" click-behavior="self-play" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from './components/Card.vue'
import type { Card as CardType } from '@/types/types'

const card = ref<CardType>({
  url_audio: 'https://pnb-website-bucket.s3.us-east-2.amazonaws.com/samples/audio/flac/sample-audio-30s.flac',
  url_image: 'https://i.ebayimg.com/images/g/LawAAOSwtutcWxl1/s-l1200.jpg',
  blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  year: 2022,
  month: '03',
  day: '12',
  hour: '09',
  artist: 'artist',
  title: 'title',
  slug: 'title-artist',
  esid: 'a2437ebc84f18abedd31d0c4550e5c40',
  suit: '♥',
  rank: '9',
  createdAt: new Date('2022-03-12T08:00:00.000Z'),
})
</script>
