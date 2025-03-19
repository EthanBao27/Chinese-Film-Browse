<template>
  <section :class="mode">
    <ul class="movie">
      <li v-for="movie in paginatedMovies" :key="movie.id">
        <film-board :movie="movie" :infoApi="Info_API"></film-board>
      </li>
    </ul>

    <!-- 分页控件 -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="currentPage--" :class="{ disabled: currentPage === 1 }">
        上一页
      </button>

      <div class="page-jump">
        <input type="number" v-model="pageInput" min="1" :max="totalPages" @keyup.enter="jumpToPage">
        <button @click="jumpToPage" class="jump-btn">跳转</button>
      </div>

      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

      <button :disabled="currentPage === totalPages" @click="currentPage++"
        :class="{ disabled: currentPage === totalPages }">
        下一页
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </section>
  <film-info></film-info>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/modeStores';
import FilmBoard from '@/components/FilmBoard_Former.vue';


interface Movie {
  id: number;
  img: string;
  nm: string;
  sc: string;
}

const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const mode = ref("");

// API 路径
const API = '/api/asgard/asgardapi/mmdb/movieboard/moviedetail/fixedboard/39.json?ci=1&year=0&term=0&limit=100&offset=0';
const Info_API = '/api/ajax/detailmovie';

// 定义电影列表
const movies = ref<Movie[]>([]);
const loading = ref(false);

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(12); // 每页显示的电影数
const pageInput = ref<number | ''>('');
const totalPages = computed(() => Math.ceil(movies.value.length / pageSize.value));

// 根据当前页码计算要展示的电影
const paginatedMovies = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return movies.value.slice(start, end);
});

// 重置分页到第一页
function resetPagination() {
  currentPage.value = 1;
  pageInput.value = '';
}

// 跳转到指定页面
function jumpToPage() {
  if (pageInput.value === '') return;

  const page = Number(pageInput.value);
  if (isNaN(page)) return;

  if (page < 1) {
    currentPage.value = 1;
  } else if (page > totalPages.value) {
    currentPage.value = totalPages.value;
  } else {
    currentPage.value = page;
  }

  // 跳转后清空输入框
  pageInput.value = '';
}

// 获取往期经典电影数据
async function GetClassicMovies(apiUrl: string) {
  loading.value = true;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // 打印返回的 API 数据
    console.log("API 返回的数据:", data);

    if (data && data.data && data.data.movies) {
      movies.value = data.data.movies;
      resetPagination();
    }
  } catch (error) {
    console.error("获取电影数据失败:", error);
  } finally {
    loading.value = false;
  }
}

// 根据夜间模式调整样式
watchEffect(() => {
  mode.value = isNightMode.value ? "night" : "";
});

// 组件挂载时获取数据
onMounted(() => {
  GetClassicMovies(API);
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap');

:root {
  --light-bg-color: rgba(250, 235, 215, 0.3);
  --night-bg-color: rgba(61, 61, 61, 0.971);
  --text-color: #f8f4f4;
  --light-accent: #e76f51;
  --dark-accent: #f4a261;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

body {
  font-family: 'Noto Sans SC', 'sans-serif';
  padding-bottom: 50px;
  color: #222;
}

.container {
  position: relative;
  height: 100%;
}

section {
  width: 100%;
  background-color: var(--light-bg-color);
  min-height: 100vh;
  padding-bottom: 40px;
  padding-top: 50px;
}

section.night {
  background-color: var(--night-bg-color);
  color: var(--text-color);
}

.movie {
  display: flex;
  margin: 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 添加暗黑模式下电影列表的样式 */
section.night .movie {
  background-color: transparent;
}

section.night .container {
  color: var(--text-color);
  background-color: var(--night-card-bg);
  box-shadow: var(--night-shadow);
}

section.night li {
  color: var(--text-color);
}

h1 {
  font-size: 36px;
  text-align: center;
  margin: 20px;
}

/* 分页控件样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0 20px;
  gap: 16px;
}

.pagination button {
  padding: 8px 16px;
  background-color: var(--light-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination button:hover:not(.disabled) {
  background-color: #d15c3f;
  transform: translateY(-2px);
}

.pagination button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination .page-info {
  font-size: 16px;
  font-weight: 600;
}

.pagination .page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination .page-jump input {
  width: 60px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
}

.pagination .page-jump .jump-btn {
  padding: 6px 12px;
  font-size: 14px;
}

/* 修复分页组件暗黑模式样式 */
section.night .pagination button {
  background-color: var(--dark-accent);
}

section.night .pagination button:hover:not(.disabled) {
  background-color: #e76f51;
  transform: translateY(-2px);
}

section.night .pagination .page-info {
  color: var(--text-color);
}

section.night .pagination .page-jump input {
  background-color: rgba(48, 48, 54, 0.9);
  border-color: #555;
  color: #fff;
}

/* 加载状态样式 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(231, 111, 81, 0.3);
  border-top-color: var(--light-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

section.night .spinner {
  border: 4px solid rgba(244, 162, 97, 0.3);
  border-top-color: var(--dark-accent);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>