<template>
  <div class="test-settings">
    <h3>测试设置</h3>
    
    <div class="setting-row">
      <label>测试模式：</label>
      <select v-model="testMode">
        <option value="en-to-cn">英译中</option>
        <option value="cn-to-en">中译英</option>
        <option value="fill-blank">填空测试</option>
        <option value="spelling">单词拼写</option>
      </select>
    </div>
    
    <div class="setting-row">
      <label>
        <input type="checkbox" v-model="useWrongOnly">
        仅测错题
      </label>
    </div>
    
    <div class="setting-row">
      <label>题目数量：</label>
      <input 
        type="number" 
        v-model.number="testQuantity"
        min="4" 
        max="50"
      >
    </div>
  </div>
</template>

<script setup>
const testMode = defineModel('testMode', { type: String, default: 'en-to-cn' })
const useWrongOnly = defineModel('useWrongOnly', { type: Boolean, default: false })
const testQuantity = defineModel('testQuantity', { type: Number, default: 10 })
</script>

<style scoped>
.setting-row {
  margin: 10px 0;
}

.setting-row label {
  margin-right: 10px;
}

select, input[type="number"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

input[type="checkbox"] {
  margin-right: 5px;
}
</style>
