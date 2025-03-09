<template>
  <div class="container" :class="['pop', modeClass]">
    <div class="movie-card" @click="ShowDetails(movie.id)">
      <div class="poster-wrapper">
        <img class="img" :src="getImageUrl(movie.img)" :alt="movie.nm" />
        <div class="overlay">
          <div class="overlay-content">
            <button class="preview-btn" @click.stop="goToMovieDetail(movie.id, movie.nm)">
              <span class="icon">👁️</span>
              <span>预览</span>
            </button>
          </div>
        </div>
      </div>
      <div class="movie-info">
        <h3>{{ movie.nm }}</h3>
        <div class="rating-badge" :class="getRatingClass(Number(movie.sc))">
          <span>{{ isValidScore(movie.sc) ? movie.sc : '暂无' }}</span>
        </div>
      </div>
      <div class="details">
        <h3>details</h3>
      </div>
    </div>
    <div class="action-buttons">
      <button class="details-btn" @click="goToMovieDetail(movie.id, movie.nm)">
        <span class="btn-icon">📽️</span>
        <span>详情</span>
      </button>
      <button class="chat-btn" @click="goToMovieChat(movie.id, movie.nm)">
        <span class="btn-icon">💬</span>
        <span>讨论</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, Ref, onMounted, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '../stores/modeStores';
import { useRouter } from 'vue-router';
import type { Movie, Details } from '../types'; // 引入自定义类型

const details = inject('details') as Ref<Details>;
const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const router = useRouter();

const modeClass = ref("");

watchEffect(() => {
  modeClass.value = isNightMode.value ? "night" : "";
});

function isValidScore(score: string): boolean {
  // 如果需要显示0分，移除score !== '0'条件
  return score !== '' && !isNaN(Number(score));
}

function getRatingClass(score: number) {
  if (score >= 8) {
    return 'excellent';
  } else if (score >= 7) {
    return 'good';
  } else if (score >= 5) {
    return 'average';
  } else if (score > 0) {
    return 'poor';
  } else {
    return 'none';
  }
}

const props = defineProps<{ movie: Movie; infoApi: string }>();

function getImageUrl(img: string) {
  if (!img) return '/src/assets/images/default-poster.jpg';
  if (img.startsWith('http')) return img;
  return `https://p0.meituan.net/movie/${img}`;
}

async function ShowDetails(movieId: number) {
  const response = await fetch(props.infoApi + '?movieId=' + movieId);
  const data = await response.json();
  const message = data.detailMovie; // 更新以访问 detailMovie
  details.value = {
    title: message.nm,
    brief: message.dra,
    isActive: true,
  };
}

function goToMovieDetail(movieId: number, movieName: string) {
  router.push({
    path: '/movie',
    query: {
      id: movieId,
      title: movieName
    }
  });
}

function goToMovieChat(movieId: number, movieName: string) {
  router.push({
    path: '/movie',
    query: {
      id: movieId,
      title: movieName,
      scrollToChat: 'true'
    }
  });
}

// 添加 Intersection Observer
onMounted(() => {
  const containers = document.querySelectorAll('.container');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('pop-in'); // 添加弹入效果类
      } else {
        entry.target.classList.remove('pop-in'); // 移除弹入效果类
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px 50px 0px'
  });

  containers.forEach(container => observer.observe(container));
});
</script>

<style scoped lang="scss">
:root {
  --light-card-bg: rgba(255, 255, 255, 0.9);
  --night-card-bg: rgba(48, 48, 54, 0.9);
  --light-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);
  --night-shadow: 0 10px 20px rgba(0, 0, 0, 0.25), 0 6px 6px rgba(0, 0, 0, 0.2);
  --card-radius: 16px;
  --rating-excellent: #4caf50;
  --rating-good: #8bc34a;
  --rating-average: #ffc107;
  --rating-poor: #f44336;
  --rating-none: #9e9e9e;
}

.container {
  position: relative;
  width: 300px;
  height: 520px;
  background-color: var(--light-card-bg);
  margin: 30px 20px;
  border-radius: var(--card-radius);
  box-shadow: var(--light-shadow);
  overflow: hidden;
  transform: translateY(50px);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;

  &.night {
    background-color: var(--night-card-bg);
    box-shadow: var(--night-shadow);
    color: #fff;
  }

  &.pop-in {
    transform: translateY(0);
    opacity: 1;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2), 0 8px 12px rgba(0, 0, 0, 0.15);

    .night & {
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3), 0 8px 12px rgba(0, 0, 0, 0.2);
    }

    .poster-wrapper .overlay {
      opacity: 1;
    }
  }

  .movie-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    cursor: pointer;

    .poster-wrapper {
      position: relative;
      height: 400px;
      overflow: hidden;
      border-top-left-radius: var(--card-radius);
      border-top-right-radius: var(--card-radius);

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40%;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        opacity: 0.8;
        transition: opacity 0.3s ease;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 2;

        .overlay-content {
          text-align: center;
          transform: translateY(20px);
          transition: transform 0.3s ease;

          .preview-btn {
            background-color: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;

            &:hover {
              background-color: white;
              color: #222;
              transform: scale(1.05);
            }

            .icon {
              font-size: 18px;
            }
          }
        }
      }

      &:hover .overlay-content {
        transform: translateY(0);
      }
    }

    .img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .movie-info {
    padding: 15px 15px 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1;

    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .rating-badge {
      padding: 5px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      color: white;
      min-width: 40px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: center;
      align-items: center;

      span {
        display: inline-block;
        line-height: 1;
      }

      &.excellent {
        background-color: var(--rating-excellent);
        
        span {
          color: #222; /* 白天模式下使用深色文本 */
        }
        
        .night & span {
          color: white; /* 夜间模式下使用白色文本 */
        }
      }

      &.good {
        background-color: var(--rating-good);
        
        span {
          color: #222; /* 白天模式下使用深色文本 */
        }
        
        .night & span {
          color: white; /* 夜间模式下使用白色文本 */
        }
      }

      &.average {
        background-color: var(--rating-average);
        
        span {
          color: #222; /* 平均评分使用深色文本 */
        }
      }

      &.poor {
        background-color: var(--rating-poor);
        
        span {
          color: #222; /* 白天模式下使用深色文本 */
        }
        
        .night & span {
          color: white; /* 夜间模式下使用白色文本 */
        }
      }

      &.none {
        background-color: var(--rating-none);
        
        span {
          color: #222; /* 白天模式下使用深色文本 */
        }
        
        .night & span {
          color: white; /* 夜间模式下使用白色文本 */
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    padding: 12px 15px;
    gap: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);

    .night & {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    button {
      flex: 1;
      padding: 10px 0;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .btn-icon {
        font-size: 16px;
      }

      &.details-btn {
        background-color: rgba(231, 111, 81, 0.1);
        color: var(--light-accent, #e76f51);

        .night & {
          background-color: rgba(244, 162, 97, 0.15);
          color: var(--dark-accent, #f4a261);
        }

        &:hover {
          background-color: rgba(231, 111, 81, 0.2);
          transform: translateY(-2px);
        }
      }

      &.chat-btn {
        background-color: var(--light-accent, #e76f51);
        color: white;
        box-shadow: 0 2px 5px rgba(231, 111, 81, 0.3);

        .night & {
          background-color: var(--dark-accent, #f4a261);
          box-shadow: 0 2px 5px rgba(244, 162, 97, 0.3);
        }

        &:hover {
          background-color: darken(#e76f51, 5%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(231, 111, 81, 0.4);

          .night & {
            background-color: darken(#f4a261, 5%);
            box-shadow: 0 4px 8px rgba(244, 162, 97, 0.4);
          }
        }
      }

      &:active {
        transform: translateY(1px);
      }
    }
  }
}

.details {
  position: absolute;
  display: none;
}

// 响应式调整
@media (max-width: 768px) {
  .container {
    width: 280px;
    height: 500px;
    margin: 20px 15px;

    .movie-card .poster-wrapper {
      height: 380px;
    }
  }
}
</style>
