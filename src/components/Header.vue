<template>
  <nav class="nav" :class="mode">
    <div class="container">
      <div class="logo">
        <router-link to="/" class="logo-link">
          <h1>电影展览</h1>
        </router-link>
      </div>

      <!-- 移动端菜单按钮 -->
      <div class="mobile-menu" @click="toggleMobileMenu">
        <span :class="{ bar: true, open: isMobileMenuOpen }"></span>
        <span :class="{ bar: true, open: isMobileMenuOpen }"></span>
        <span :class="{ bar: true, open: isMobileMenuOpen }"></span>
      </div>

      <!-- 导航菜单，移动端根据 isMobileMenuOpen 显示或隐藏 -->
      <ul :class="{ 'mobile-open': isMobileMenuOpen }">
        <li>
          <router-link to="/former" @click="closeMobileMenu">往期经典</router-link>
        </li>
        <li>
          <router-link to="/home" @click="closeMobileMenu">当下热映</router-link>
        </li>
        <li>
          <router-link to="/coming" @click="closeMobileMenu">即将推出</router-link>
        </li>
      </ul>

      <div class="search-container" ref="searchContainer">
        <input type="text" v-model="keyword" @input="fetchSuggestions" @keydown.enter="searchMovies"
          @focus="isSearchFocused = true" placeholder="请输入关键词" class="search-input" :class="{ dark: isNightMode }" />
        <img v-if="!isLoading" src="../assets/images/search.svg" alt="搜索" @click="searchMovies" class="search-icon" />
        <div v-else class="loading-spinner"></div>

        <!-- 搜索建议 - 从上到下排列电影名字 -->
        <ul v-if="keywordSuggestions.length && isSearchFocused" class="keyword-suggestions"
          :class="{ dark: isNightMode }">
          <li v-for="(term, index) in keywordSuggestions" :key="`keyword-${index}`"
            @click="selectKeywordSuggestion(term)">
            <div class="keyword-suggestion">
              <span class="search-icon-small">🔍</span>
              <span class="keyword">{{ term }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="auth-buttons" v-if="!username">
        <router-link to="/login">
          <button class="login-btn">登录</button>
        </router-link>
        <router-link to="/register">
          <button class="register-btn">注册</button>
        </router-link>
      </div>
      <div v-else class="user-info">
        <span>欢迎，{{ username }}</span>
        <button @click="logout" class="logout-btn">注销</button>
      </div>
      <div class="btn">
        <button @click="handleSwitchMode" class="theme-toggle">
          <div class="icon-wrapper">
            <svg v-if="isNightMode" class="icon sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg v-else class="icon moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <span>{{ isNightMode ? '日间模式' : '夜间模式' }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useModeStore } from "@/stores/modeStores";
import { useUserStore } from "@/stores/userStore";
import type { MovieSuggestion } from '../types';

const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const { toggleMode } = modeStore;
const userStore = useUserStore();
const { username } = storeToRefs(userStore);

const mode = ref("");
watchEffect(() => {
  mode.value = isNightMode.value ? "night" : "";
});

function handleSwitchMode() {
  toggleMode();
}

const keyword = ref("");
const router = useRouter();
const searchHistory = ref<string[]>([]);

const suggestions = ref<MovieSuggestion[]>([]);
const keywordSuggestions = ref<string[]>([]);
const searchContainer = ref<HTMLElement | null>(null);
const isSearchFocused = ref(false);
const isLoading = ref(false);

// 控制移动端菜单显示
const isMobileMenuOpen = ref(false);
function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}
function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

// 从本地存储加载搜索历史
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  const history = localStorage.getItem('searchHistory');
  if (history) {
    try {
      searchHistory.value = JSON.parse(history).slice(0, 5);
    } catch (e) {
      searchHistory.value = [];
    }
  }
});

// 保存搜索历史到本地存储
function saveSearchHistory(term: string) {
  if (!term) return;

  // 将新搜索词添加到历史记录的开头
  searchHistory.value = [
    term,
    ...searchHistory.value.filter(item => item !== term)
  ].slice(0, 5);

  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}

// 防抖函数
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 使用防抖处理搜索建议请求
const debouncedFetchSuggestions = debounce(async () => {
  if (keyword.value.trim() === "") {
    keywordSuggestions.value = [];
    return;
  }

  isLoading.value = true;

  try {
    // 使用本地开发服务器上的API端点，限制只返回3个结果
    const response = await fetch(
      `/api/ajax/search?kw=${encodeURIComponent(
        keyword.value
      )}&cityId=1&stype=0&limit=3`
    );
    const data = await response.json();

    if (data && data.movies && data.movies.list && data.movies.list.length > 0) {
      // 只提取电影名称作为建议，最多3个
      keywordSuggestions.value = data.movies.list
        .filter((movie: any) =>
          movie.nm.toLowerCase().includes(keyword.value.toLowerCase())
        )
        .map((movie: any) => movie.nm)
        .slice(0, 3); // 确保最多只有3个建议
    } else {
      // 尝试使用备选API
      const suggestResponse = await fetch(
        `https://apis.netstart.cn/maoyan/search/suggest?kw=${encodeURIComponent(
          keyword.value
        )}`
      );
      const suggestData = await suggestResponse.json();

      if (suggestData.success && suggestData.movies && suggestData.movies.list) {
        keywordSuggestions.value = suggestData.movies.list
          .filter((movie: any) =>
            movie.nm.toLowerCase().includes(keyword.value.toLowerCase())
          )
          .map((movie: any) => movie.nm)
          .slice(0, 3); // 确保最多只有3个建议
      } else {
        // 如果API没有返回结果，使用搜索历史
        const term = keyword.value.toLowerCase().trim();
        keywordSuggestions.value = searchHistory.value
          .filter(s => s.toLowerCase().includes(term))
          .slice(0, 3); // 确保最多只有3个建议
      }
    }

    // 如果没有找到任何建议，显示一个默认建议
    if (keywordSuggestions.value.length === 0) {
      keywordSuggestions.value = [keyword.value];
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);

    // 出错时也使用搜索历史
    const term = keyword.value.toLowerCase().trim();
    keywordSuggestions.value = searchHistory.value
      .filter(s => s.toLowerCase().includes(term))
      .slice(0, 3); // 确保最多只有3个建议

    // 如果没有历史记录匹配，至少显示当前输入
    if (keywordSuggestions.value.length === 0) {
      keywordSuggestions.value = [keyword.value];
    }
  } finally {
    isLoading.value = false;
  }
}, 300); // 300ms防抖延迟

function fetchSuggestions() {
  debouncedFetchSuggestions();
}

// 搜索建议选择
// 检查该函数是否在template中使用，如果没有使用，则注释掉或调整
// function selectSuggestion(movie: MovieSuggestion) {
//     searchQuery.value = movie.nm;
//     showSuggestions.value = false;
//     // 其他逻辑...
// }

function selectKeywordSuggestion(term: string) {
  keyword.value = term;
  saveSearchHistory(term);
  searchMovies();
}

async function searchMovies() {
  const searchTerm = keyword.value.trim();
  if (searchTerm == "") {
    alert("请输入搜索关键词");
    return;
  }

  saveSearchHistory(searchTerm);
  router.push({ path: "/search", query: { keyword: searchTerm } });
  keyword.value = "";
  suggestions.value = [];
  keywordSuggestions.value = [];
}

// 注销功能：清除用户信息并返回登录页面
function logout() {
  userStore.clearUsername(); // 清除用户名
  localStorage.removeItem("token"); // 清除 token
  router.push("/");
}

// 点击页面其他地方时隐藏建议列表
function handleClickOutside(event: Event) {
  if (
    searchContainer.value &&
    !searchContainer.value.contains(event.target as Node)
  ) {
    suggestions.value = [];
    keywordSuggestions.value = [];
    isSearchFocused.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.nav {
  background-color: var(--light-bg-primary);
  font-size: 16px;
  color: var(--light-text-primary);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  /* 固定高度 */
  z-index: 100;
  transition: all 0.3s ease-in-out;
  box-shadow: var(--light-shadow);

  &.night {
    background-color: var(--dark-bg-primary);
    box-shadow: var(--dark-shadow);

    .logo h1 {
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    a,
    .user-info,
    button {
      color: rgba(255, 255, 255, 0.95);
    }

    .user-info {
      span {
        color: #ffffff;
        font-weight: 500;
      }

      .logout-btn {
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.4);

        &:hover {
          background: rgba(244, 162, 97, 0.15);
          color: var(--dark-accent);
          border-color: var(--dark-accent);
        }
      }
    }

    .btn button {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.4);
      font-weight: 500;

      &:hover {
        background: rgba(244, 162, 97, 0.15);
        color: var(--dark-accent);
        border-color: var(--dark-accent);
      }
    }

    .search-container {
      .search-input {
        background-color: rgba(45, 45, 58, 0.95);
        color: rgba(255, 255, 255, 0.95);
        border-color: rgba(255, 255, 255, 0.2);

        &::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        &:focus {
          background-color: rgba(45, 45, 58, 1);
          border-color: var(--dark-accent);
          box-shadow: 0 0 0 3px rgba(244, 162, 97, 0.2);
        }

        &:hover {
          border-color: var(--dark-accent);
        }
      }

      .search-icon {
        filter: invert(1);
        opacity: 0.8;

        &:hover {
          opacity: 1;
        }
      }

      .keyword-suggestions {
        background-color: rgba(45, 45, 58, 0.98);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        li {
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.95);

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: rgba(244, 162, 97, 0.15);
          }

          .keyword-suggestion {
            .search-icon-small {
              opacity: 0.8;
            }

            .keyword {
              color: rgba(255, 255, 255, 0.95);
            }
          }
        }
      }
    }

    .mobile-menu .bar {
      background-color: rgba(255, 255, 255, 0.95);
    }

    ul.mobile-open {
      background: var(--dark-bg-primary);
    }

    a {
      &:hover {
        color: var(--dark-accent);
        background-color: rgba(244, 162, 97, 0.15);
      }

      &.router-link-active {
        color: var(--dark-accent);
      }
    }

    .auth-buttons {
      button.login-btn {
        border-color: var(--dark-accent);
        color: var(--dark-accent);

        &:hover {
          background: rgba(244, 162, 97, 0.15);
        }
      }

      button.register-btn {
        background: var(--dark-accent);
        border-color: var(--dark-accent);
        color: rgba(255, 255, 255, 0.95);

        &:hover {
          background: darken(#f4a261, 10%);
        }
      }
    }

    .user-info .logout-btn:hover {
      background: rgba(244, 162, 97, 0.15);
      color: var(--dark-accent);
      border-color: var(--dark-accent);
    }
  }

  a {
    color: var(--light-text-primary);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s ease-in-out;

    &:hover {
      color: var(--light-accent);
      background-color: rgba(231, 111, 81, 0.1);
    }

    &.router-link-active {
      color: var(--light-accent);
      font-weight: 500;
    }
  }

  .container {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    max-width: 1440px;
    margin: 0 auto;

    .logo {
      h1 {
        font-size: 24px;
        font-weight: 600;
        color: var(--light-text-primary);
        letter-spacing: 2px;
      }

      .logo-link {
        text-decoration: none;
        transition: all 0.3s ease;
        padding: 8px 0;
        display: block;
        border-radius: 0;

        &:hover h1 {
          color: var(--light-accent);
        }

        .night &:hover h1 {
          color: var(--dark-accent);
        }

        &:hover {
          background-color: transparent;
        }
      }
    }

    .mobile-menu {
      display: none;
    }

    ul {
      display: flex;
      gap: 16px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .search-container {
      position: relative;
      flex: 0 1 300px;

      .search-input {
        width: 100%;
        padding: 8px 36px 8px 12px;
        border: 1px solid var(--light-border);
        border-radius: 8px;
        background-color: var(--light-bg-primary);
        color: var(--light-text-primary);
        font-size: 14px;
        transition: all 0.3s ease;

        &.dark {
          background-color: rgba(45, 45, 58, 0.95);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(255, 255, 255, 0.2);

          &::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }

          &:focus {
            background-color: rgba(45, 45, 58, 1);
            border-color: var(--dark-accent);
            box-shadow: 0 0 0 3px rgba(244, 162, 97, 0.2);
          }

          &:hover {
            border-color: var(--dark-accent);
          }
        }

        &:focus {
          outline: none;
          border-color: var(--light-accent);
          box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.1);
        }

        &:hover {
          border-color: var(--light-accent);
        }
      }

      .search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 1;
        }
      }

      .loading-spinner {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        border: 2px solid rgba(231, 111, 81, 0.2);
        border-top-color: var(--light-accent, #e76f51);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;

        @keyframes spin {
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        .night & {
          border: 2px solid rgba(244, 162, 97, 0.2);
          border-top-color: var(--dark-accent, #f4a261);
        }
      }

      .keyword-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background-color: var(--light-bg-primary);
        border: 1px solid var(--light-border);
        border-radius: 8px;
        box-shadow: var(--light-shadow);
        overflow: hidden;
        z-index: 1000;
        display: flex;
        flex-direction: column;

        &.dark {
          background-color: rgba(45, 45, 58, 0.98);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

          li {
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.95);

            &:hover {
              background-color: rgba(244, 162, 97, 0.15);
            }

            .keyword-suggestion {
              .search-icon-small {
                opacity: 0.8;
              }

              .keyword {
                color: rgba(255, 255, 255, 0.95);
              }
            }
          }
        }

        li {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--light-border);
          transition: all 0.2s ease;
          width: 100%;
          display: block;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: rgba(231, 111, 81, 0.1);
          }

          .keyword-suggestion {
            display: flex;
            align-items: center;
            gap: 8px;

            .search-icon-small {
              font-size: 14px;
              opacity: 0.5;
            }

            .keyword {
              color: var(--light-text-primary);
            }
          }
        }
      }
    }

    .auth-buttons {
      display: flex;
      gap: 12px;

      button {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;

        &.login-btn {
          background: transparent;
          border: 1px solid var(--light-accent);
          color: var(--light-accent);

          &:hover {
            background: rgba(231, 111, 81, 0.1);
          }
        }

        &.register-btn {
          background: var(--light-accent);
          border: 1px solid var(--light-accent);
          color: white;

          &:hover {
            background: darken(#e76f51, 10%);
          }
        }
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;

      span {
        color: var(--light-text-primary);
      }

      .logout-btn {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        color: var(--light-text-primary);
        border: 1px solid var(--light-border);
        background: transparent;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(231, 111, 81, 0.1);
          color: var(--light-accent);
          border-color: var(--light-accent);
        }
      }
    }

    .btn button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: var(--light-text-primary);
      border: 1px solid var(--light-border);
      background: transparent;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(231, 111, 81, 0.1);
        color: var(--light-accent);
        border-color: var(--light-accent);
      }

      &.theme-toggle {
        display: flex;
        align-items: center;
        gap: 8px;

        .icon-wrapper {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .icon {
          position: absolute;
          top: 0;
          left: 0;
          transition: all 0.5s ease-in-out;

          &.sun {
            color: #f4a261;
            transform-origin: center;
            animation: sun-appear 0.5s ease-in-out;
          }

          &.moon {
            color: #2b3945;
            transform-origin: center;
            animation: moon-appear 0.5s ease-in-out;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    height: 56px;
    /* 移动端降低高度 */

    .container {
      padding: 0 16px;

      .logo h1 {
        font-size: 20px;
      }

      .mobile-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
        cursor: pointer;

        .bar {
          width: 24px;
          height: 2px;
          background-color: var(--light-text-primary);
          transition: all 0.3s ease;

          &.open {
            &:nth-child(1) {
              transform: translateY(6px) rotate(45deg);
            }

            &:nth-child(2) {
              opacity: 0;
            }

            &:nth-child(3) {
              transform: translateY(-6px) rotate(-45deg);
            }
          }
        }
      }

      ul {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--light-bg-primary);
        padding: 8px 16px;
        box-shadow: var(--light-shadow);

        &.mobile-open {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }

      .search-container {
        flex: 1;
        margin: 8px 0;
      }

      .auth-buttons,
      .user-info {
        flex-wrap: wrap;
        gap: 8px;

        button {
          width: auto;
        }
      }
    }
  }
}

@keyframes sun-appear {
  0% {
    transform: scale(0) rotate(-90deg);
    opacity: 0;
  }

  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

@keyframes moon-appear {
  0% {
    transform: scale(0) rotate(90deg);
    opacity: 0;
  }

  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}
</style>
