import { createRouter, createWebHistory } from 'vue-router'

// Views
import DashboardView from '../views/DashboardView.vue'
import VocabularyView from '../views/VocabularyView.vue'
import QuizView from '../views/QuizView.vue'
import WrongQuestionsView from '../views/WrongQuestionsView.vue'
import StatisticsView from '../views/StatisticsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LibraryView from '../views/LibraryView.vue'
import StudyView from '../views/StudyView.vue'
import AIView from '../views/AIView.vue'

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: '首页', icon: '🏠' }
    },
    {
        path: '/library',
        name: 'library',
        component: LibraryView,
        meta: { title: '词库', icon: '📚' }
    },
    {
        path: '/study/:id',
        name: 'study',
        component: StudyView,
        meta: { title: '学习', icon: '📖' }
    },
    {
        path: '/vocabulary',
        name: 'vocabulary',
        component: VocabularyView,
        meta: { title: '我的单词', icon: '📖', hidden: true }
    },
    {
        path: '/quiz',
        name: 'quiz',
        component: QuizView,
        meta: { title: '测试', icon: '📝' }
    },
    {
        path: '/wrong',
        name: 'wrong',
        component: WrongQuestionsView,
        meta: { title: '错题', icon: '❌' }
    },
    {
        path: '/statistics',
        name: 'statistics',
        component: StatisticsView,
        meta: { title: '统计', icon: '📊' }
    },
    {
        path: '/ai',
        name: 'ai',
        component: AIView,
        meta: { title: 'AI', icon: '🤖' }
    },
    {
        path: '/settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: '设置', icon: '⚙️' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
