<template>
    <Transition name="slide-up">
        <div v-if="showPrompt" class="install-prompt">
            <div class="install-content">
                <div class="install-icon">📲</div>
                <div class="install-text">
                    <strong>安装生词本</strong>
                    <span>添加到桌面，随时学习</span>
                </div>
                <div class="install-actions">
                    <button class="btn-install" @click="install">安装</button>
                    <button class="btn-dismiss" @click="dismiss">稍后</button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showPrompt = ref(false)
const deferredPrompt = ref(null)

function handleBeforeInstallPrompt(e) {
    // 阻止默认的安装提示
    e.preventDefault()
    // 保存事件，稍后触发
    deferredPrompt.value = e
    // 检查是否之前已关闭过提示
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) {
        showPrompt.value = true
    }
}

async function install() {
    if (!deferredPrompt.value) return
    
    // 显示安装提示
    deferredPrompt.value.prompt()
    
    // 等待用户响应
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
        console.log('PWA 安装成功')
    }
    
    deferredPrompt.value = null
    showPrompt.value = false
}

function dismiss() {
    showPrompt.value = false
    // 记录用户选择，24小时内不再提示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // 检查是否过期（24小时后重新提示）
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
        const dismissedTime = parseInt(dismissed)
        if (Date.now() - dismissedTime > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('pwa-install-dismissed')
        }
    }
})

onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<style scoped>
.install-prompt {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    max-width: 400px;
    width: calc(100% - 40px);
}

.install-content {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, var(--sakura-300) 0%, var(--sakura-400) 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(248, 165, 194, 0.4);
}

.install-icon {
    font-size: 32px;
    flex-shrink: 0;
}

.install-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.install-text strong {
    font-size: 16px;
}

.install-text span {
    font-size: 13px;
    opacity: 0.9;
}

.install-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.btn-install {
    background: white;
    color: var(--sakura-400);
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-install:hover {
    transform: scale(1.05);
}

.btn-dismiss {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-dismiss:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
}
</style>
