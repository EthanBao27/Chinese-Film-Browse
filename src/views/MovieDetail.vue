<template>
    <div class="movie-detail" :class="mode">
        <div class="container">
            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
            <div v-else class="movie-content">
                <div class="movie-header">
                    <h1>{{ movieTitle }}</h1>
                    <div class="movie-meta">
                        <span v-if="movieData.sc">评分: {{ movieData.sc }}</span>
                        <span v-if="movieData.cat">类型: {{ movieData.cat }}</span>
                        <span v-if="movieData.src">地区: {{ movieData.src }}</span>
                        <span v-if="movieData.dur">时长: {{ movieData.dur }}分钟</span>
                        <span v-if="movieData.pubDesc">上映: {{ movieData.pubDesc }}</span>
                    </div>
                </div>

                <div class="movie-info">
                    <div class="poster-container">
                        <img :src="moviePoster" alt="电影海报" class="movie-poster" />
                    </div>

                    <div class="movie-details">
                        <div class="section">
                            <h3>剧情简介</h3>
                            <p>{{ movieData.dra || '暂无简介' }}</p>
                        </div>

                        <div class="section" v-if="movieData.star">
                            <h3>主演</h3>
                            <p>{{ movieData.star }}</p>
                        </div>

                        <div class="section" v-if="movieData.dir">
                            <h3>导演</h3>
                            <p>{{ movieData.dir }}</p>
                        </div>
                    </div>
                </div>

                <div class="chat-section" ref="chatSectionRef">
                    <h2>观影讨论</h2>
                    <ChatRoom :movieId="movieId" :movieTitle="movieTitle" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/modeStores';
import ChatRoom from '@/components/ChatRoom.vue';

const route = useRoute();
const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);

const mode = computed(() => isNightMode.value ? "night" : "");
const movieId = ref(route.query.id?.toString() || '');
const movieTitle = ref(route.query.title?.toString() || '加载中...');
const moviePoster = ref('');
const movieData = ref<any>({});
const loading = ref(true);
const chatSectionRef = ref<HTMLElement | null>(null);

onMounted(async () => {
    try {
        // 使用猫眼API获取电影详情
        const response = await fetch(`/api/ajax/detailmovie?movieId=${movieId.value}`);
        const data = await response.json();

        if (data && data.detailMovie) {
            const movie = data.detailMovie;
            movieData.value = movie;
            movieTitle.value = movie.nm || route.query.title?.toString() || '未知电影';

            // 修复图片URL构建
            if (movie.img) {
                // 检查img是否已经是完整URL
                if (movie.img.startsWith('http')) {
                    moviePoster.value = movie.img;
                } else {
                    // 构建完整URL，使用正确的基础URL
                    moviePoster.value = `https://p0.meituan.net/movie/${movie.img}`;
                }
            } else if (movie.photos && movie.photos.length > 0) {
                // 尝试使用电影剧照作为备选
                moviePoster.value = movie.photos[0];
            } else {
                // 使用默认图片
                moviePoster.value = '/src/assets/images/default-poster.jpg';
            }

            // 确保剧情简介有值
            if (!movie.dra || movie.dra.trim() === '') {
                console.log('剧情简介为空，尝试使用其他字段');
                // 尝试使用其他可能包含简介的字段
                movieData.value.dra = movie.story || movie.brief || movie.shortComment || movie.longComment || '暂无简介';
            }

            console.log('电影数据:', movie);
            console.log('海报URL:', moviePoster.value);
        }
    } catch (error) {
        console.error('获取电影详情失败:', error);
        // 如果API请求失败，至少显示从URL获取的标题
        movieTitle.value = route.query.title?.toString() || '未知电影';
        // 设置默认海报
        moviePoster.value = '/src/assets/images/default-poster.jpg';
    } finally {
        loading.value = false;
    }

    // 如果URL中有scrollToChat参数，滚动到聊天区域
    if (route.query.scrollToChat === 'true') {
        await nextTick();
        chatSectionRef.value?.scrollIntoView({ behavior: 'smooth' });
    }
});
</script>

<style scoped lang="scss">
.movie-detail {
    padding-top: 20px;
    min-height: 100vh;
    background-color: var(--light-bg-secondary);

    &.night {
        background-color: var(--dark-bg-secondary);
        color: var(--dark-text-primary);
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;

        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: var(--light-accent);
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    }

    .night .loading .spinner {
        border: 5px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--dark-accent);
    }

    .movie-content {
        display: flex;
        flex-direction: column;
        gap: 30px;
    }

    .movie-header {
        margin-bottom: 20px;

        h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .movie-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 14px;
            color: var(--light-text-secondary);

            .night & {
                color: var(--dark-text-secondary);
            }
        }
    }

    .movie-info {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 30px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .poster-container {
        .movie-poster {
            width: 100%;
            border-radius: 12px;
            box-shadow: var(--light-shadow);

            .night & {
                box-shadow: var(--dark-shadow);
            }
        }
    }

    .movie-details {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .section {
            h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 10px;
                color: var(--light-accent);

                .night & {
                    color: var(--dark-accent);
                }
            }

            p {
                line-height: 1.6;
            }
        }
    }

    .chat-section {
        margin-top: 30px;

        h2 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--light-accent);

            .night & {
                color: var(--dark-accent);
            }
        }
    }
}
</style>