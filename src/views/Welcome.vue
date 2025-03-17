<template>
    <div class="welcome-page" :class="mode">
        <div class="hero-section">
            <div class="overlay"></div>
            <div class="content">
                <h1 class="title">电影展览系统</h1>
                <p class="subtitle">探索、发现、体验电影的魅力</p>
                <div class="features">
                    <router-link to="/home" class="feature-card">
                        <div class="icon">🎬</div>
                        <h3>当下热映</h3>
                        <p>浏览正在热映的电影</p>
                    </router-link>
                    <router-link to="/former" class="feature-card">
                        <div class="icon">🏆</div>
                        <h3>往期经典</h3>
                        <p>重温经典电影作品</p>
                    </router-link>
                    <router-link to="/coming" class="feature-card">
                        <div class="icon">🔜</div>
                        <h3>即将上映</h3>
                        <p>抢先了解即将上映的电影</p>
                    </router-link>
                    <router-link to="/chat" class="feature-card">
                        <div class="icon">💬</div>
                        <h3>影迷社区</h3>
                        <p>与其他影迷交流讨论</p>
                    </router-link>
                </div>
                <div class="cta-buttons">
                    <router-link to="/home" class="cta-button primary">开始浏览</router-link>
                    <router-link to="/search" class="cta-button secondary">搜索电影</router-link>
                </div>
            </div>
        </div>

        <div class="about-section">
            <h2>关于本项目</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>电影展览系统是一个集电影信息展示、搜索、社区交流于一体的综合平台，旨在为电影爱好者提供便捷的电影资讯和交流环境。</p>
                    <p>本系统具有以下特点：</p>
                    <ul>
                        <li>全面的电影信息：提供当下热映、往期经典、即将上映的影片信息</li>
                        <li>强大的搜索功能：支持关键词搜索，快速找到心仪的电影</li>
                        <li>丰富的影片详情：包括剧情介绍、演员阵容、评分等</li>
                        <li>社区互动：与其他影迷分享观影体验和看法</li>
                        <li>日夜模式切换：提供舒适的浏览体验</li>
                    </ul>
                </div>
                <div class="about-image">
                    <div class="image-container"></div>
                </div>
            </div>
        </div>

        <!-- 数据可视化部分 -->
        <data-visualization></data-visualization>

        <div class="categories-section">
            <h2>浏览分类</h2>
            <div class="categories">
                <router-link to="/home" class="category-item">
                    <div class="category-icon">🎬</div>
                    <h3>当下热映</h3>
                </router-link>
                <router-link to="/former" class="category-item">
                    <div class="category-icon">🏆</div>
                    <h3>往期经典</h3>
                </router-link>
                <router-link to="/coming" class="category-item">
                    <div class="category-icon">🔜</div>
                    <h3>即将上映</h3>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/modeStores';
import DataVisualization from '@/components/DataVisualization.vue';

const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const mode = ref("");

watchEffect(() => {
    mode.value = isNightMode.value ? "night" : "";
});
</script>

<style scoped lang="scss">
.welcome-page {
    min-height: 100vh;
    padding-top: 64px; // 为顶部导航留出空间
    background-color: var(--light-bg-primary);
    color: var(--light-text-primary);
    transition: all 0.3s ease;
    overflow-x: hidden; // 防止水平滚动

    &.night {
        background-color: var(--dark-bg-primary);
        color: var(--dark-text-primary);
    }

    // 英雄区域
    .hero-section {
        position: relative;
        height: 90vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-image: url('../assets/images/background.jpg');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        color: #fff;
        overflow: hidden;
        margin-bottom: 40px; // 添加底部间距

        @media (max-width: 768px) {
            height: auto;
            min-height: 80vh;
            padding: 40px 0;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1;
        }

        .content {
            position: relative;
            z-index: 2;
            text-align: center;
            padding: 0 20px;
            max-width: 1200px;
            width: 100%;
        }

        .title {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: fadeInUp 1s ease-out;
        }

        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 3rem;
            opacity: 0.9;
            animation: fadeInUp 1.2s ease-out;
        }

        .features {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
            margin-bottom: 3rem;
            animation: fadeInUp 1.5s ease-out;

            .feature-card {
                background-color: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 24px;
                border-radius: 12px;
                width: 220px;
                text-align: center;
                transition: all 0.3s ease;
                text-decoration: none;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1);

                &:hover {
                    transform: translateY(-5px);
                    background-color: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }

                h3 {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                }

                p {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }
            }
        }

        .cta-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            animation: fadeInUp 1.8s ease-out;

            .cta-button {
                padding: 12px 30px;
                border-radius: 50px;
                font-size: 1rem;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s ease;

                &.primary {
                    background-color: var(--light-accent);
                    color: #fff;

                    &:hover {
                        background-color: darken(#e76f51, 10%);
                        transform: translateY(-2px);
                    }
                }

                &.secondary {
                    background-color: transparent;
                    border: 2px solid #fff;
                    color: #fff;

                    &:hover {
                        background-color: rgba(255, 255, 255, 0.1);
                        transform: translateY(-2px);
                    }
                }

                .night & {
                    &.primary {
                        background-color: var(--dark-accent);

                        &:hover {
                            background-color: darken(#f4a261, 10%);
                        }
                    }
                }
            }
        }
    }

    // 关于区域
    .about-section {
        padding: 80px 20px;
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
        z-index: 1;

        @media (max-width: 768px) {
            padding: 40px 15px;
        }

        h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 40px;
            position: relative;

            @media (max-width: 768px) {
                font-size: 2rem;
                margin-bottom: 30px;
            }

            &:after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 3px;
                background-color: var(--light-accent);

                .night & {
                    background-color: var(--dark-accent);
                }
            }
        }

        .about-content {
            display: flex;
            gap: 40px;
            align-items: center;

            @media (max-width: 768px) {
                flex-direction: column;

                .about-image {
                    width: 100%;
                    margin-top: 20px;

                    .image-container {
                        height: 250px;
                    }
                }
            }

            .about-text {
                flex: 1;

                p {
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                    line-height: 1.7;
                }

                ul {
                    list-style-type: none;
                    padding-left: 1rem;

                    li {
                        position: relative;
                        padding-left: 1.5rem;
                        margin-bottom: 1rem;
                        line-height: 1.6;

                        &:before {
                            content: '✓';
                            position: absolute;
                            left: 0;
                            color: var(--light-accent);
                            font-weight: bold;

                            .night & {
                                color: var(--dark-accent);
                            }
                        }
                    }
                }
            }

            .about-image {
                flex: 1;
                min-height: 350px;
                display: flex;
                align-items: center;
                justify-content: center;

                .image-container {
                    width: 100%;
                    height: 350px;
                    background-image: url('../assets/images/background.jpg');
                    background-size: cover;
                    background-position: center;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.3);

                    .night & {
                        box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.5);
                    }
                }
            }
        }
    }

    // 分类区域
    .categories-section {
        padding: 60px 20px 100px;
        background-color: var(--light-bg-secondary);
        position: relative;
        z-index: 1;

        .night & {
            background-color: var(--dark-bg-secondary);
        }

        @media (max-width: 768px) {
            padding: 40px 15px 60px;
        }

        h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 40px;

            @media (max-width: 768px) {
                font-size: 2rem;
                margin-bottom: 30px;
            }
        }

        .categories {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            justify-content: center;
            max-width: 1200px;
            margin: 0 auto;

            @media (max-width: 768px) {
                gap: 20px;
            }

            .category-item {
                width: calc(33.33% - 20px);
                min-width: 280px;
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                background-color: var(--light-bg-primary);
                color: var(--light-text-primary);
                border-radius: 12px;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);

                @media (max-width: 768px) {
                    width: calc(50% - 10px);
                    min-width: 140px;
                    height: 160px;
                }

                @media (max-width: 480px) {
                    width: 100%;
                    min-width: 100%;
                }

                &:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);

                    .category-icon {
                        transform: scale(1.1);
                    }

                    .night & {
                        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
                    }
                }

                .category-icon {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    transition: transform 0.3s ease;
                }

                h3 {
                    font-size: 1.3rem;
                }
            }
        }
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .welcome-page {
        .hero-section {
            .title {
                font-size: 2.5rem;
            }

            .subtitle {
                font-size: 1.2rem;
            }

            .features {
                .feature-card {
                    width: calc(50% - 10px);
                }
            }
        }
    }
}

@media (max-width: 480px) {
    .welcome-page {
        .hero-section {
            .features {
                .feature-card {
                    width: 100%;
                }
            }

            .cta-buttons {
                flex-direction: column;

                .cta-button {
                    width: 100%;
                }
            }
        }
    }
}
</style>