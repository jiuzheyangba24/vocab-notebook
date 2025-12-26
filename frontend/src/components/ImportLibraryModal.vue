<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-card import-modal">
        <div class="modal-header">
          <h3>📥 导入词库</h3>
          <button class="close-btn" @click="close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 词库名称 -->
          <div class="form-group">
            <label>词库名称</label>
            <input 
              v-model="libraryName"
              type="text" 
              placeholder="例如：托福核心词汇"
              class="form-input"
            />
          </div>
          
          <!-- 导入方式选择 -->
          <div class="form-group">
            <label>导入方式</label>
            <div class="import-tabs">
              <button 
                :class="{ active: importType === 'text' }"
                @click="importType = 'text'"
              >
                📝 文本粘贴
              </button>
              <button 
                :class="{ active: importType === 'file' }"
                @click="importType = 'file'"
              >
                📁 文件上传
              </button>
            </div>
          </div>
          
          <!-- 文本粘贴 -->
          <div v-if="importType === 'text'" class="form-group">
            <label>粘贴单词（每行一个单词）</label>
            <textarea 
              v-model="textInput"
              placeholder="apple&#10;banana&#10;orange&#10;..."
              rows="8"
              class="form-textarea"
            ></textarea>
          </div>
          
          <!-- 文件上传 -->
          <div v-if="importType === 'file'" class="form-group">
            <label>选择文件（支持 TXT、JSON）</label>
            <div 
              class="file-drop-zone"
              :class="{ dragover: isDragover }"
              @dragover.prevent="isDragover = true"
              @dragleave="isDragover = false"
              @drop.prevent="handleFileDrop"
              @click="triggerFileInput"
            >
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileSelect"
                accept=".txt,.json"
                style="display: none"
              />
              <span class="drop-icon">📂</span>
              <p v-if="!selectedFile">点击或拖拽文件到这里</p>
              <p v-else class="file-name">{{ selectedFile.name }}</p>
            </div>
          </div>
          
          <!-- 预览 -->
          <div v-if="previewWords.length > 0" class="preview-section">
            <label>预览（共 {{ previewWords.length }} 个单词）</label>
            <div class="preview-list">
              <span v-for="(word, i) in previewWords.slice(0, 20)" :key="i" class="preview-word">
                {{ word }}
              </span>
              <span v-if="previewWords.length > 20" class="preview-more">
                +{{ previewWords.length - 20 }} 更多...
              </span>
            </div>
          </div>
          
          <!-- 错误提示 -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="close">取消</button>
          <button 
            class="import-btn" 
            @click="confirmImport"
            :disabled="!canImport || isImporting"
          >
            {{ isImporting ? '导入中...' : `导入 ${previewWords.length} 个单词` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'import'])

// State
const libraryName = ref('')
const importType = ref('text')
const textInput = ref('')
const selectedFile = ref(null)
const fileInput = ref(null)
const isDragover = ref(false)
const previewWords = ref([])
const error = ref('')
const isImporting = ref(false)

// Computed
const canImport = computed(() => {
  return libraryName.value.trim() && previewWords.value.length > 0
})

// Watch text input to update preview
watch(textInput, (val) => {
  if (importType.value === 'text') {
    parseTextInput(val)
  }
})

// Methods
function close() {
  resetForm()
  emit('close')
}

function resetForm() {
  libraryName.value = ''
  importType.value = 'text'
  textInput.value = ''
  selectedFile.value = null
  previewWords.value = []
  error.value = ''
  isImporting.value = false
}

function parseTextInput(text) {
  error.value = ''
  const words = text
    .split('\n')
    .map(w => w.trim())
    .filter(w => w && w.length > 0)
  
  // 去重
  previewWords.value = [...new Set(words)]
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleFileDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file) {
  error.value = ''
  selectedFile.value = file
  
  try {
    const text = await file.text()
    
    if (file.name.endsWith('.json')) {
      // 尝试解析 JSON
      try {
        const data = JSON.parse(text)
        // 支持多种 JSON 格式
        if (Array.isArray(data)) {
          // 简单数组 ["word1", "word2"] 或 [{word: "word1"}, ...]
          previewWords.value = data.map(item => 
            typeof item === 'string' ? item : (item.word || item.headWord || '')
          ).filter(w => w)
        } else if (data.words && Array.isArray(data.words)) {
          // {words: [...]}
          previewWords.value = data.words.map(item => 
            typeof item === 'string' ? item : (item.word || item.headWord || '')
          ).filter(w => w)
        } else {
          throw new Error('不支持的 JSON 格式')
        }
      } catch (e) {
        error.value = 'JSON 格式错误: ' + e.message
        previewWords.value = []
      }
    } else {
      // TXT 文件按行分割
      parseTextInput(text)
    }
  } catch (e) {
    error.value = '读取文件失败: ' + e.message
  }
}

async function confirmImport() {
  if (!canImport.value) return
  
  isImporting.value = true
  error.value = ''
  
  try {
    emit('import', {
      name: libraryName.value.trim(),
      words: previewWords.value
    })
    close()
  } catch (e) {
    error.value = '导入失败: ' + e.message
    isImporting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--primary-100, #fdeef2);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  font-size: 24px;
  color: var(--gray-500, #71717a);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--gray-700, #3f3f46);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--primary-400, #f4729a);
}

.import-tabs {
  display: flex;
  gap: 8px;
}

.import-tabs button {
  flex: 1;
  padding: 12px;
  border: 2px solid var(--primary-100, #fdeef2);
  border-radius: 10px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.import-tabs button.active {
  border-color: var(--primary-500, #ec4074);
  background: var(--primary-50, #fef7f9);
  color: var(--primary-500, #ec4074);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--primary-200, #fbd5df);
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--primary-400, #f4729a);
}

.file-drop-zone {
  border: 2px dashed var(--primary-200, #fbd5df);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-drop-zone:hover,
.file-drop-zone.dragover {
  border-color: var(--primary-400, #f4729a);
  background: var(--primary-50, #fef7f9);
}

.drop-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.file-drop-zone p {
  margin: 0;
  color: var(--gray-500, #71717a);
  font-size: 14px;
}

.file-name {
  color: var(--primary-500, #ec4074) !important;
  font-weight: 500;
}

.preview-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--primary-100, #fdeef2);
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preview-word {
  padding: 4px 12px;
  background: var(--primary-50, #fef7f9);
  border-radius: 20px;
  font-size: 13px;
  color: var(--gray-700, #3f3f46);
}

.preview-more {
  padding: 4px 12px;
  color: var(--gray-500, #71717a);
  font-size: 13px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--primary-100, #fdeef2);
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  border: 2px solid var(--gray-200, #e4e4e7);
  border-radius: 12px;
  background: white;
  color: var(--gray-600, #52525b);
  font-weight: 600;
  cursor: pointer;
}

.import-btn {
  flex: 2;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-400, #f4729a), var(--primary-500, #ec4074));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(236, 64, 116, 0.3);
}
</style>
