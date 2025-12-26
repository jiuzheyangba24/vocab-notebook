<template>
  <Modal v-model="showModal" title="所有生词">
    <ul class="all-words-list">
      <li v-for="word in vocabulary" :key="word.id">
        <strong>{{ word.headWord }}</strong>: {{ word.definition }}
      </li>
    </ul>
    <p v-if="vocabulary.length === 0" class="empty-tip">
      生词本是空的
    </p>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from './common/Modal.vue'
import { useVocabularyStore } from '../stores/vocabulary'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useVocabularyStore()

const showModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const vocabulary = computed(() => store.vocabulary)
</script>

<style scoped>
.empty-tip {
  text-align: center;
  color: #666;
  padding: 30px 0;
}
</style>
