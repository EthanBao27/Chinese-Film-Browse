<template>
  <div class="app-container">
    <!-- 根据路由meta信息，动态显示布局或者仅显示页面内容 -->
    <div v-if="!isAuthPage" class="main-layout">
      <Header />
      <main :class="['main-content', mode]">
        <router-view></router-view>
      </main>
    </div>

    <!-- 如果是登录或注册页面或聊天室组件，仅显示内容 -->
    <div v-else>
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, watchEffect, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useModeStore } from './stores/modeStores';
import Header from './components/Header.vue';

const modeStore = useModeStore()
const route = useRoute()

// 检查当前路由是否是登录或注册页面
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register' || route.path == '/chat';
});

const { isNightMode } = storeToRefs(modeStore)

interface Details {
  title: String | null;
  brief: String | null;
  isActive: Boolean;
}

const mode = ref("")

const details = ref<Details>({
  title: null,
  brief: null,
  isActive: false,
});

provide('details', details);

// 确保在组件挂载后立即应用正确的模式
onMounted(() => {
  applyThemeMode();
});

// 监听模式变化
watchEffect(() => {
  applyThemeMode();
});

// 应用主题模式到 DOM
function applyThemeMode() {
  mode.value = isNightMode.value ? "night" : "";
  // 添加/移除 HTML 元素上的 night 类
  if (isNightMode.value) {
    document.documentElement.classList.add('night')
    document.body.classList.add('night')
  } else {
    document.documentElement.classList.remove('night')
    document.body.classList.remove('night')
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap');

:root {
  /* Light theme */
  --light-bg-primary: #ffffff;
  --light-bg-secondary: rgba(250, 245, 240, 0.95);
  --light-text-primary: #2c3e50;
  --light-text-secondary: #606f7b;
  --light-accent: #e76f51;
  --light-border: rgba(0, 0, 0, 0.1);
  --light-card-bg: #ffffff;
  --light-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  /* Dark theme */
  --dark-bg-primary: #1a1a1f;
  --dark-bg-secondary: rgba(28, 28, 35, 0.95);
  --dark-text-primary: #e9ecef;
  --dark-text-secondary: #a0aec0;
  --dark-accent: #f4a261;
  --dark-border: rgba(255, 255, 255, 0.1);
  --dark-card-bg: #2d2d3a;
  --dark-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background-color: var(--light-bg-primary);
}

html.night,
body.night {
  background-color: var(--dark-bg-primary);
  color: var(--dark-text-primary);
}

/* 针对登录/注册页面的额外样式 */
body.login-page,
body.register-page {
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--light-text-primary);
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--light-bg-primary);
}

.night .app-container {
  background-color: var(--dark-bg-primary);
}

.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--light-bg-primary);
}

.night .main-layout {
  background-color: var(--dark-bg-primary);
}

.main-content {
  flex: 1;
  width: 100%;
  padding-top: 0;
  background-color: var(--light-bg-secondary);
  min-height: calc(100vh - 64px);
}

.main-content.night {
  background-color: var(--dark-bg-secondary);
  color: var(--dark-text-primary);
}

.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 20px;
}

.movie {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 添加卡片基础样式 */
.card {
  background: var(--light-card-bg);
  border-radius: 12px;
  box-shadow: var(--light-shadow);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.night .card {
  background: var(--dark-card-bg);
  box-shadow: var(--dark-shadow);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }

  .main-content {
    padding-top: 56px;
    /* 移动端Header高度 */
  }

  .movie {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

/* 添加全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--light-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

html.night ::-webkit-scrollbar-track {
  background: var(--dark-bg-secondary);
}

html.night ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

/* 添加页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>