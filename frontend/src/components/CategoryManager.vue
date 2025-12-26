<template>
    <div class="category-manager">
        <!-- 分类选择器 -->
        <div class="category-selector">
            <button 
                v-for="cat in allCategories" 
                :key="cat.id"
                :class="['category-btn', { active: selectedCategory === cat.id }]"
                @click="selectCategory(cat.id)"
            >
                {{ cat.icon }} {{ cat.name }}
                <span v-if="cat.id !== 'all'" class="category-count">
                    {{ getCategoryCount(cat.id) }}
                </span>
            </button>
            <button class="category-btn add-btn" @click="showAddModal = true">
                ➕
            </button>
        </div>
        
        <!-- 添加分类模态框 -->
        <Teleport to="body">
            <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
                <div class="modal-content">
                    <h3>添加分类</h3>
                    <input 
                        v-model="newCategoryName" 
                        type="text" 
                        placeholder="分类名称"
                        @keypress.enter="addCategory"
                    >
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showAddModal = false">取消</button>
                        <button class="btn-confirm" @click="addCategory">添加</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'

const emit = defineEmits(['categoryChange'])

const store = useVocabularyStore()

// 默认分类
const defaultCategories = [
    { id: 'all', name: '全部', icon: '📚' },
    { id: 'cet4', name: '四级', icon: '4️⃣' },
    { id: 'cet6', name: '六级', icon: '6️⃣' },
    { id: 'kaoyan', name: '考研', icon: '🎓' },
    { id: 'other', name: '其他', icon: '📝' }
]

// 自定义分类
const customCategories = ref([])

// 当前选中分类
const selectedCategory = ref('all')

// 模态框状态
const showAddModal = ref(false)
const newCategoryName = ref('')

// 所有分类
const allCategories = computed(() => {
    return [
        ...defaultCategories,
        ...customCategories.value.map(c => ({ ...c, icon: '🏷️' }))
    ]
})

// 加载自定义分类
onMounted(() => {
    const saved = localStorage.getItem('customCategories')
    if (saved) {
        customCategories.value = JSON.parse(saved)
    }
})

// 保存自定义分类
function saveCategories() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories.value))
}

// 获取分类下的单词数量
function getCategoryCount(categoryId) {
    if (categoryId === 'all') {
        return store.wordCount
    }
    return store.vocabulary.filter(w => w.category === categoryId).length
}

// 选择分类
function selectCategory(categoryId) {
    selectedCategory.value = categoryId
    emit('categoryChange', categoryId)
}

// 添加分类
function addCategory() {
    const name = newCategoryName.value.trim()
    if (!name) return
    
    const id = 'custom_' + Date.now()
    customCategories.value.push({ id, name })
    saveCategories()
    
    newCategoryName.value = ''
    showAddModal.value = false
}

// 暴露方法给父组件
defineExpose({
    selectedCategory,
    allCategories
})
</script>

<style scoped>
.category-manager {
    margin-bottom: 16px;
}

.category-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.category-btn {
    padding: 8px 14px;
    border: none;
    border-radius: 20px;
    background: #f0f0f0;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}

.category-btn:hover {
    background: #e0e0e0;
}

.category-btn.active {
    background: linear-gradient(135deg, var(--sakura-300) 0%, var(--sakura-400) 100%);
    color: white;
}

.category-count {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
}

.category-btn.active .category-count {
    background: rgba(255, 255, 255, 0.2);
}

.add-btn {
    padding: 8px 12px;
}

/* 模态框 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 24px;
    border-radius: 16px;
    width: 300px;
    max-width: 90%;
}

.modal-content h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
}

.modal-content input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
    box-sizing: border-box;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn-cancel {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #f0f0f0;
    cursor: pointer;
}

.btn-confirm {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--sakura-300) 0%, var(--sakura-400) 100%);
    color: white;
    cursor: pointer;
}
</style>
