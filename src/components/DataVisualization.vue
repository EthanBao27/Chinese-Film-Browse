<template>
    <div class="data-visualization" :class="mode">
        <h2 class="section-title">电影数据统计</h2>
        <div class="description">
            统计来自当下热映、往期经典和即将上映的所有电影数据，为您提供最全面的电影信息概览
        </div>
        <div class="charts-container">
            <div class="chart-card">
                <h3>电影评分分布</h3>
                <p class="chart-desc">统计各评分区间电影数量，反映电影整体质量</p>
                <v-chart class="chart" :option="ratingOption" autoresize />
            </div>
            <div class="chart-card">
                <h3>电影类型分布</h3>
                <p class="chart-desc">统计各类型电影数量，展示最受欢迎的电影类型</p>
                <v-chart class="chart" :option="categoryOption" autoresize />
            </div>
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="stat-value">{{ totalMovies }}</div>
                    <div class="stat-label">电影总数</div>
                    <div class="stat-desc">总收录电影数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ avgRating.toFixed(1) }}</div>
                    <div class="stat-label">平均评分</div>
                    <div class="stat-desc">全部电影平均分</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ topCategory }}</div>
                    <div class="stat-label">最热门类型</div>
                    <div class="stat-desc">拥有最多电影的类型</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '../stores/modeStores';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { ChartOption, ColorParams, CategoryCount } from '../types'; // 引入自定义类型

// 注册 ECharts 必须的组件
use([
    CanvasRenderer,
    PieChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
]);

const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const mode = ref("");

watchEffect(() => {
    mode.value = isNightMode.value ? "night" : "";
});

const isLoading = ref(true);

// 统计数据
const totalMovies = ref(0);
const avgRating = ref(0);
const topCategory = ref('');

// 评分分布数据
const ratingOption = ref({
    title: {
        text: '电影评分区间分布',
        left: 'center',
        textStyle: {
            color: isNightMode.value ? '#fff' : '#333'
        }
    },
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}部电影 ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
            color: isNightMode.value ? '#fff' : '#333'
        }
    },
    series: [
        {
            name: '评分分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: '{b}: {c}部',
                position: 'outside',
                fontSize: 14
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: true
            },
            data: [
                { value: 0, name: '9分以上' },
                { value: 0, name: '8-9分' },
                { value: 0, name: '7-8分' },
                { value: 0, name: '6-7分' },
                { value: 0, name: '6分以下' }
            ]
        }
    ]
});

// 类型分布数据
const categoryOption = ref<ChartOption>({
    title: {
        text: '电影类型数量统计',
        left: 'center',
        textStyle: {
            color: isNightMode.value ? '#fff' : '#333'
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        },
        formatter: '{b}: {c}部电影'
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: [] as string[],
        axisLabel: {
            color: isNightMode.value ? '#fff' : '#333',
            interval: 0,
            rotate: 30
        }
    },
    yAxis: {
        type: 'value',
        name: '电影数量',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
            color: isNightMode.value ? '#fff' : '#333'
        }
    },
    series: [
        {
            name: '电影数量',
            type: 'bar',
            barWidth: '60%',
            data: [] as number[],
            itemStyle: {
                color: function (params: ColorParams) {
                    const colorList = ['#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#264653', '#43aa8b', '#577590', '#f94144'];
                    return colorList[params.dataIndex % colorList.length];
                }
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}部'
            }
        }
    ]
});

// 获取电影数据并处理
async function fetchMovieData() {
    try {
        // 获取热映电影数据
        const latestResponse = await fetch('/api/ajax/movieOnInfoList');
        const latestData = await latestResponse.json();
        const latestMovies = latestData.movieList || [];

        // 获取经典电影数据
        const formerResponse = await fetch('/api/asgard/asgardapi/mmdb/movieboard/moviedetail/fixedboard/39.json?ci=1&year=0&term=0&limit=100&offset=0');
        const formerData = await formerResponse.json();
        const formerMovies = formerData.data?.movies || [];

        // 获取即将上映电影数据
        const comingResponse = await fetch('/api/ajax/comingList?ci=10&token=&limit=20');
        const comingData = await comingResponse.json();
        const comingMovies = comingData.coming || [];

        // 合并所有电影数据
        const allMovies = [...latestMovies, ...formerMovies, ...comingMovies];

        // 计算总电影数
        totalMovies.value = allMovies.length;

        // 计算评分分布
        const ratingDistribution = {
            '9分以上': 0,
            '8-9分': 0,
            '7-8分': 0,
            '6-7分': 0,
            '6分以下': 0
        };

        let totalRating = 0;
        let ratedMoviesCount = 0;

        // 类型统计
        const categoryCount: CategoryCount = {};

        allMovies.forEach(movie => {
            // 评分统计
            const score = parseFloat(movie.sc);
            if (!isNaN(score) && score > 0) {
                if (score >= 9) {
                    ratingDistribution['9分以上']++;
                } else if (score >= 8) {
                    ratingDistribution['8-9分']++;
                } else if (score >= 7) {
                    ratingDistribution['7-8分']++;
                } else if (score >= 6) {
                    ratingDistribution['6-7分']++;
                } else {
                    ratingDistribution['6分以下']++;
                }

                totalRating += score;
                ratedMoviesCount++;
            }

            // 类型统计
            if (movie.cat) {
                const categories = movie.cat.split(',');
                categories.forEach((category: string) => {
                    const trimmedCategory = category.trim();
                    if (trimmedCategory) {
                        categoryCount[trimmedCategory] = (categoryCount[trimmedCategory] || 0) + 1;
                    }
                });
            }
        });

        // 更新评分图表数据
        ratingOption.value.series[0].data = Object.entries(ratingDistribution).map(([name, value]) => ({
            name,
            value
        }));

        // 计算平均评分
        avgRating.value = ratedMoviesCount > 0 ? totalRating / ratedMoviesCount : 0;

        // 更新类型图表数据
        const sortedCategories = Object.entries(categoryCount)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 8); // 只显示前8个类型

        categoryOption.value.xAxis.data = sortedCategories.map(item => item[0]);
        categoryOption.value.series[0].data = sortedCategories.map(item => item[1]);

        // 获取最热门类型
        if (sortedCategories.length > 0) {
            topCategory.value = sortedCategories[0][0];
        }

    } catch (error) {
        console.error('获取电影数据失败:', error);
        // 使用模拟数据
        useMockData();
    } finally {
        isLoading.value = false;
    }
}

// 使用模拟数据（当API请求失败时）
function useMockData() {
    totalMovies.value = 235;
    avgRating.value = 7.8;
    topCategory.value = '剧情';

    ratingOption.value.series[0].data = [
        { value: 28, name: '9分以上' },
        { value: 65, name: '8-9分' },
        { value: 87, name: '7-8分' },
        { value: 43, name: '6-7分' },
        { value: 12, name: '6分以下' }
    ];

    categoryOption.value.xAxis.data = ['剧情', '喜剧', '动作', '爱情', '科幻', '动画', '悬疑', '惊悚'];
    categoryOption.value.series[0].data = [95, 78, 65, 53, 42, 38, 30, 25];
}

// 监听夜间模式变化，更新图表主题
watchEffect(() => {
    const textColor = isNightMode.value ? '#fff' : '#333';

    ratingOption.value.legend.textStyle.color = textColor;
    ratingOption.value.title.textStyle.color = textColor;

    categoryOption.value.xAxis.axisLabel.color = textColor;
    categoryOption.value.yAxis.axisLabel.color = textColor;
    categoryOption.value.title.textStyle.color = textColor;
});

onMounted(() => {
    fetchMovieData();
});
</script>

<style scoped lang="scss">
.data-visualization {
    padding: 60px 0;
    background-color: rgba(250, 235, 215, 0.3);

    &.night {
        background-color: rgba(61, 61, 61, 0.971);
        color: #f8f4f4;
    }

    .section-title {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 20px;
        font-weight: 700;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, #e76f51, #f4a261);
            border-radius: 2px;
        }
    }

    .description {
        text-align: center;
        max-width: 800px;
        margin: 0 auto 40px;
        font-size: 1.1rem;
        color: #666;
        line-height: 1.6;

        .night & {
            color: #bbb;
        }
    }

    .charts-container {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: auto auto;
        gap: 30px;
        padding: 0 20px;

        @media (max-width: 992px) {
            grid-template-columns: 1fr;
        }
    }

    .chart-card {
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        padding: 20px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;

        .night & {
            background-color: rgba(48, 48, 54, 0.9);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
        }

        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);

            .night & {
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
            }
        }

        h3 {
            font-size: 1.5rem;
            margin-bottom: 8px;
            text-align: center;
            font-weight: 600;
        }

        .chart-desc {
            text-align: center;
            margin-bottom: 15px;
            color: #777;
            font-size: 0.9rem;

            .night & {
                color: #aaa;
            }
        }

        .chart {
            height: 300px;
            width: 100%;
            margin-top: 10px;
        }
    }

    .stats-cards {
        grid-column: 1 / -1;
        display: flex;
        justify-content: space-between;
        gap: 20px;

        @media (max-width: 768px) {
            flex-direction: column;
        }

        .stat-card {
            flex: 1;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            padding: 30px 20px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;

            .night & {
                background-color: rgba(48, 48, 54, 0.9);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
            }

            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);

                .night & {
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
                }
            }

            .stat-value {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #e76f51, #f4a261);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .stat-label {
                font-size: 1.2rem;
                font-weight: 500;
                margin-bottom: 5px;
            }

            .stat-desc {
                font-size: 0.9rem;
                color: #777;

                .night & {
                    color: #aaa;
                }
            }
        }
    }
}

// 添加动画效果
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.chart-card,
.stat-card {
    animation: fadeInUp 0.8s ease forwards;
    opacity: 0;
}

.chart-card:nth-child(1) {
    animation-delay: 0.2s;
}

.chart-card:nth-child(2) {
    animation-delay: 0.4s;
}

.stat-card:nth-child(1) {
    animation-delay: 0.6s;
}

.stat-card:nth-child(2) {
    animation-delay: 0.8s;
}

.stat-card:nth-child(3) {
    animation-delay: 1s;
}
</style>