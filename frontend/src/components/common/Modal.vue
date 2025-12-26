<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal show" @click.self="close">
      <div class="modal-content">
        <span class="close-btn" @click="close">&times;</span>
        <h2 v-if="title">{{ title }}</h2>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>
