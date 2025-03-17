<template>
    <div class="chat-container" :class="mode">
        <!-- 仅登录用户可见的聊天区域 -->
        <template v-if="username">
            <div class="chat-header">
                <div class="header-content">
                    <h1 class="title">🎬 影迷社区</h1>
                    <p class="subtitle">与其他影迷分享您的观影体验</p>
                </div>
                <div class="user-badge">
                    <div class="user-avatar" :style="{ backgroundColor: userColor }">
                        {{ username.charAt(0).toUpperCase() }}
                    </div>
                    <span class="username">{{ username }}</span>
                </div>
            </div>

            <div class="chat-body">
                <div v-if="isLoading" class="connecting-overlay">
                    <div class="spinner"></div>
                    <p>连接中，请稍候...</p>
                </div>

                <div v-else class="chat-content">
                    <div class="messages-container" ref="messagesContainer">
                        <div v-if="messages.length === 0" class="empty-messages">
                            <div class="empty-icon">💬</div>
                            <p>还没有消息，成为第一个发言的人吧！</p>
                        </div>

                        <transition-group name="message" tag="div" class="messages">
                            <div v-for="(message, index) in messages" :key="index" :class="[
                                'message-item',
                                message.isSystem ? 'system-message' : (message.username === username ? 'own-message' : ''),
                                message.isOffline ? 'offline-message' : ''
                            ]">
                                <div v-if="message.isSystem" class="system-content">
                                    <div class="icon">🔔</div>
                                    <span>{{ message.msg }}</span>
                                </div>
                                <template v-else>
                                    <div class="message-header">
                                        <div class="message-avatar"
                                            :style="{ backgroundColor: message.color || '#ddd' }">
                                            {{ message.username ? message.username.charAt(0).toUpperCase() : '?' }}
                                        </div>
                                        <div class="message-info">
                                            <span class="message-author">{{ message.username }}</span>
                                            <span class="message-time">{{ formatTime(message.created_at) }}</span>
                                        </div>
                                    </div>
                                    <div class="message-content">
                                        {{ message.msg }}
                                    </div>
                                </template>
                            </div>
                        </transition-group>
                    </div>

                    <div class="online-users">
                        <div class="online-count">
                            <div class="online-icon"></div>
                            <span>{{ onlineCount }} 人在线</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chat-footer">
                <form @submit.prevent="sendMessage" class="message-form">
                    <input v-model="newMessage" type="text" placeholder="输入您的消息..." class="message-input"
                        :disabled="!isLoggedIn">
                    <button type="submit" class="send-button" :disabled="!isLoggedIn || !newMessage.trim()">
                        发送
                    </button>
                </form>
                <p class="community-info">影迷社区 · 尊重他人 · 共建和谐交流环境</p>
            </div>
        </template>

        <!-- 未登录用户提示登录 -->
        <div v-else class="login-required">
            <div class="animation-container">
                <div class="lock-animation">
                    <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <rect class="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path class="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div class="lock-keyhole"></div>
                </div>
                <div class="ripple-container">
                    <div class="ripple"></div>
                    <div class="ripple"></div>
                    <div class="ripple"></div>
                </div>
            </div>

            <h2 class="login-title">影迷社区需要登录</h2>
            <p class="login-message">登录后即可与其他影迷交流分享您的观影体验</p>

            <div class="auth-buttons">
                <router-link to="/login" class="auth-button login-btn">
                    <span class="icon">👤</span>
                    <span>登录账号</span>
                </router-link>
                <router-link to="/register" class="auth-button register-btn">
                    <span class="icon">✨</span>
                    <span>创建账号</span>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { io } from 'socket.io-client';
import { storeToRefs } from 'pinia';
import { useModeStore } from '../stores/modeStores';
import { useUserStore } from '@/stores/userStore';
import type { ChatMessage } from '../types'; // 导入聊天消息类型

// 删除props，使用固定的社区聊天室ID
const COMMUNITY_CHAT_ID = 999999;

const userStore = useUserStore();
const modeStore = useModeStore();
const { username } = storeToRefs(userStore);
// 注释掉未使用的变量
// const { isNightMode } = storeToRefs(modeStore);
const mode = ref("");

const newMessage = ref('');
const messages = ref<ChatMessage[]>([]);
const onlineCount = ref(0);
const userColor = computed(() => username.value ? getColorFromUsername(username.value) : '#ddd');
const messagesContainer = ref<HTMLElement | null>(null);
const socket = ref<any>(null);
const isLoggedIn = computed(() => !!username.value);

const isLoading = ref(true);
const connectionTimeout = ref<number | null>(null);

function formatTime(timestamp: string | number) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai'  // 使用中国时区，会自动处理 UTC+8 转换
    });
}

function getColorFromUsername(name: string): string {
    const hash = Array.from(name).reduce(
        (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0),
        0
    );

    const colors = [
        '#e76f51', '#f4a261', '#2a9d8f', '#e9c46a',
        '#264653', '#43aa8b', '#577590', '#f94144',
        '#90be6d', '#f8961e', '#577399', '#f3722c'
    ];

    return colors[Math.abs(hash) % colors.length];
}

// 注释掉未使用的函数，或者在需要使用的地方调用它们
/*
function getFormattedDate() {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return new Intl.DateTimeFormat('zh-CN', options).format(date);
}

function getFormattedDatetime() {
    const date = new Date();
    // ... 实现逻辑 ...
}
*/

function connectWebSocket() {
    if (!isLoggedIn.value) return;

    isLoading.value = true;

    // 设置连接超时
    connectionTimeout.value = window.setTimeout(() => {
        if (isLoading.value) {
            isLoading.value = false;
            messages.value = [{
                isSystem: true,
                msg: "连接超时，请检查网络或刷新页面重试",
                created_at: new Date().toLocaleString('zh-CN')
            }];
        }
    }, 300000); // 30秒超时

    // 连接到WebSocket服务器，传递用户名和电影ID - 修复：使用固定的社区ID
    socket.value = io('http://8.153.74.243:3000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        query: {
            username: username.value || '匿名用户',
            movieId: COMMUNITY_CHAT_ID.toString() // 修复：字段名从movie_id改为movieId
        },
        reconnectionAttempts: 5 // 重连尝试次数
    });

    // 连接成功
    socket.value.on('connect', () => {
        if (connectionTimeout.value) {
            clearTimeout(connectionTimeout.value);
            connectionTimeout.value = null;
        }
        console.log("已成功连接到聊天服务器");
        isLoading.value = false;
    });

    // 连接错误
    socket.value.on('connect_error', (error: any) => {
        console.error('连接错误:', error);
        isLoading.value = false;
        messages.value = [{
            isSystem: true,
            msg: "连接服务器失败，请检查网络或稍后重试",
            created_at: new Date().toLocaleString('zh-CN')
        }];

        if (connectionTimeout.value) {
            clearTimeout(connectionTimeout.value);
            connectionTimeout.value = null;
        }
    });

    // 监听在线人数
    socket.value.on('show count', (count: number) => {
        console.log("当前在线人数:", count);
        onlineCount.value = count;
    });

    // 加载历史消息
    socket.value.on('load previous messages', (data: any[]) => {
        isLoading.value = false;

        if (connectionTimeout.value) {
            clearTimeout(connectionTimeout.value);
            connectionTimeout.value = null;
        }

        // 显示所有消息，不需要过滤
        console.log("收到历史消息:", data);
        messages.value = data || [];
        scrollToBottom();
    });

    // 监听新消息
    socket.value.on('chat message', (data: any) => {
        console.log("收到新消息:", data);
        // 不过滤消息，直接显示所有消息
        messages.value.push(data);
        scrollToBottom();
    });

    // 监听登录消息
    socket.value.on('login message', (data: any) => {
        console.log("收到登录消息:", data);
        // 不过滤消息，直接显示所有系统消息
        messages.value.push({
            ...data,
            isSystem: true
        });
        scrollToBottom();
    });
}

function scrollToBottom() {
    setTimeout(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    }, 50);
}

function sendMessage() {
    if (!newMessage.value.trim() || !socket.value || !isLoggedIn.value) return;

    const now = new Date();
    const beijingOffset = 8 * 60 * 60 * 1000; // 东八区偏移量（毫秒）
    const beijingTime = new Date(now.getTime() + beijingOffset);
    // 转换为 MySQL 格式 (YYYY-MM-DD HH:mm:ss)
    const formattedDate = beijingTime
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);


    // 构建消息数据，包含电影ID
    const messageData = {
        msg: newMessage.value,
        created_at: formattedDate,  // 使用 ISO 格式的时间
        color: userColor.value,
        movieId: COMMUNITY_CHAT_ID.toString()
    };

    console.log("发送消息:", messageData);
    // 发送消息到服务器
    socket.value.emit('chat message', messageData);
    newMessage.value = '';
}

// 添加断开连接的函数
function disconnect() {
    if (socket.value) {
        socket.value.disconnect();
    }
}

onMounted(() => {
    if (isLoggedIn.value) {
        connectWebSocket();
    }

    // 设置页面标题
    document.title = "影迷社区 - 公共聊天室";
});

onBeforeUnmount(() => {
    disconnect();

    if (connectionTimeout.value) {
        clearTimeout(connectionTimeout.value);
    }

    window.removeEventListener('unload', disconnect);
});

// 当用户登录状态改变时重新连接
watch(isLoggedIn, (newValue) => {
    if (newValue) {
        connectWebSocket();
    } else if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
    }
});
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');

:root {
    --light-bg-primary: #f8f5f2;
    --light-bg-secondary: #ffffff;
    --light-text-primary: #1a1a1a;
    --light-text-secondary: #6e6e6e;
    --light-border: #e5e5e5;
    --light-accent: #e76f51;
    --light-accent-hover: #d65f41;

    --dark-bg-primary: #2a2a2a;
    --dark-bg-secondary: #353535;
    --dark-text-primary: #f8f5f2;
    --dark-text-secondary: #c5c5c5;
    --dark-border: #4a4a4a;
    --dark-accent: #f4a261;
    --dark-accent-hover: #e59351;
}

/* 主容器 */
.chat-container {
    min-height: 100vh;
    background-color: var(--light-bg-primary);
    color: var(--light-text-primary);
    font-family: 'Noto Sans SC', sans-serif;
    padding-top: 70px;
    /* 为顶部导航栏留出空间 */
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    &.night {
        background-color: var(--dark-bg-primary);
        color: var(--dark-text-primary);
    }
}

/* 聊天头部 */
.chat-header {
    padding: 25px 30px;
    background-color: var(--light-bg-secondary);
    border-bottom: 1px solid var(--light-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    .night & {
        background-color: var(--dark-bg-secondary);
        border-bottom-color: var(--dark-border);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .title {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        margin-bottom: 5px;
        background: linear-gradient(45deg, var(--light-accent), #f3722c);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        .night & {
            background: linear-gradient(45deg, var(--dark-accent), #f3722c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    }

    .subtitle {
        color: var(--light-text-secondary);
        margin: 0;
        font-size: 0.9rem;

        .night & {
            color: var(--dark-text-secondary);
        }
    }

    .user-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background-color: rgba(231, 111, 81, 0.1);
        border-radius: 30px;

        .night & {
            background-color: rgba(244, 162, 97, 0.15);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 1rem;
        }

        .username {
            font-weight: 500;
            color: var(--light-text-primary);

            .night & {
                color: var(--dark-text-primary);
            }
        }
    }

    @media (max-width: 600px) {
        padding: 15px;
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;

        .title {
            font-size: 1.6rem;
        }

        .user-badge {
            align-self: flex-end;
        }
    }
}

/* 聊天主体 */
.chat-body {
    flex: 1;
    position: relative;
    background-color: var(--light-bg-primary);

    .night & {
        background-color: var(--dark-bg-primary);
    }

    .connecting-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 20px;
        background-color: rgba(255, 255, 255, 0.8);
        z-index: 10;

        .night & {
            background-color: rgba(42, 42, 42, 0.8);
        }

        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(231, 111, 81, 0.2);
            border-top-color: var(--light-accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;

            .night & {
                border: 4px solid rgba(244, 162, 97, 0.2);
                border-top-color: var(--dark-accent);
            }
        }

        p {
            font-size: 1.1rem;
            color: var(--light-text-primary);

            .night & {
                color: var(--dark-text-primary);
            }
        }
    }

    .chat-content {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 70px - 140px - 80px);
        /* viewport高 - 顶部导航 - 头部高度 - 底部高度 */
        overflow: hidden;

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;

            &::-webkit-scrollbar {
                width: 6px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
            }

            &::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 3px;

                .night & {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            }
        }

        .empty-messages {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--light-text-secondary);

            .night & {
                color: var(--dark-text-secondary);
            }

            .empty-icon {
                font-size: 3rem;
                margin-bottom: 10px;
                opacity: 0.7;
            }

            p {
                font-size: 1.1rem;
            }
        }

        .messages {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .message-item {
            max-width: 85%;

            &.own-message {
                align-self: flex-end;

                .message-header {
                    flex-direction: row-reverse;
                }

                .message-info {
                    text-align: right;
                }

                .message-content {
                    background-color: var(--light-accent);
                    color: white;
                    border-radius: 18px 4px 18px 18px;

                    .night & {
                        background-color: var(--dark-accent);
                    }
                }
            }

            &.system-message {
                align-self: center;
                max-width: 90%;

                .system-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background-color: rgba(0, 0, 0, 0.05);
                    padding: 10px 20px;
                    border-radius: 20px;
                    color: var(--light-text-secondary);

                    .night & {
                        background-color: rgba(255, 255, 255, 0.1);
                        color: var(--dark-text-secondary);
                    }

                    .icon {
                        font-size: 1.1rem;
                    }
                }
            }

            .message-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 5px;
            }

            .message-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 0.9rem;
            }

            .message-info {
                display: flex;
                flex-direction: column;

                .message-author {
                    font-weight: 500;
                    font-size: 0.9rem;
                    color: var(--light-text-primary);

                    .night & {
                        color: var(--dark-text-primary);
                    }
                }

                .message-time {
                    font-size: 0.7rem;
                    color: var(--light-text-secondary);

                    .night & {
                        color: var(--dark-text-secondary);
                    }
                }
            }

            .message-content {
                padding: 12px 16px;
                background-color: var(--light-bg-secondary);
                border-radius: 4px 18px 18px 18px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                line-height: 1.5;
                font-size: 0.95rem;
                word-break: break-word;

                .night & {
                    background-color: var(--dark-bg-secondary);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
            }
        }

        .online-users {
            padding: 10px 20px;
            background-color: var(--light-bg-secondary);
            border-top: 1px solid var(--light-border);

            .night & {
                background-color: var(--dark-bg-secondary);
                border-top-color: var(--dark-border);
            }

            .online-count {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                color: var(--light-text-secondary);

                .night & {
                    color: var(--dark-text-secondary);
                }

                .online-icon {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: #4CAF50;
                    position: relative;

                    &:after {
                        content: '';
                        position: absolute;
                        top: -2px;
                        left: -2px;
                        right: -2px;
                        bottom: -2px;
                        background-color: rgba(76, 175, 80, 0.3);
                        border-radius: 50%;
                        animation: pulse 1.5s infinite;
                    }
                }
            }
        }
    }
}

/* 聊天底部 */
.chat-footer {
    background-color: var(--light-bg-secondary);
    border-top: 1px solid var(--light-border);
    padding: 15px 20px;

    .night & {
        background-color: var(--dark-bg-secondary);
        border-top-color: var (--dark-border);
    }

    .message-form {
        display: flex;
        gap: 10px;
    }

    .message-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid var(--light-border);
        border-radius: 24px;
        background-color: var(--light-bg-primary);
        color: var (--light-text-primary);
        font-size: 1rem;
        transition: all 0.2s ease;

        &:focus {
            outline: none;
            border-color: var(--light-accent);
            box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.2);
        }

        &:disabled {
            background-color: rgba(0, 0, 0, 0.05);
            cursor: not-allowed;
        }

        .night & {
            background-color: var(--dark-bg-primary);
            border-color: var(--dark-border);
            color: var(--dark-text-primary);

            &:focus {
                border-color: var(--dark-accent);
                box-shadow: 0 0 0 3px rgba(244, 162, 97, 0.2);
            }

            &:disabled {
                background-color: rgba(255, 255, 255, 0.05);
            }
        }
    }

    .send-button {
        background-color: var(--light-accent);
        color: white;
        border: none;
        border-radius: 24px;
        padding: 12px 24px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
            background-color: var(--light-accent-hover);
            transform: translateY(-2px);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .night & {
            background-color: var(--dark-accent);

            &:hover:not(:disabled) {
                background-color: var(--dark-accent-hover);
            }
        }
    }

    .community-info {
        margin-top: 12px;
        text-align: center;
        font-size: 0.8rem;
        color: var(--light-text-secondary);

        .night & {
            color: var(--dark-text-secondary);
        }
    }
}

/* 未登录状态 */
.login-required {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 70px);
    padding: 30px;
    text-align: center;

    .animation-container {
        position: relative;
        width: 160px;
        height: 160px;
        margin-bottom: 30px;
    }

    .lock-animation {
        position: relative;
        z-index: 2;
        animation: float 3s ease-in-out infinite;

        .lock-icon {
            color: var(--light-accent);

            .night & {
                color: var(--dark-accent);
            }
        }

        .lock-keyhole {
            position: absolute;
            width: 6px;
            height: 10px;
            background-color: currentColor;
            border-radius: 50% 50% 0 0;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0.3;
            animation: glow 2s infinite alternate;
        }
    }

    .ripple-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .ripple {
            position: absolute;
            border: 4px solid var(--light-accent);
            border-radius: 50%;
            opacity: 0;

            &:nth-child(1) {
                animation: ripple 2s linear infinite;
            }

            &:nth-child(2) {
                animation: ripple 2s linear 0.6s infinite;
            }

            &:nth-child(3) {
                animation: ripple 2s linear 1.2s infinite;
            }

            .night & {
                border-color: var(--dark-accent);
            }
        }
    }

    .login-title {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0 0 15px;
        background: linear-gradient(45deg, var(--light-accent), #f3722c);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: fade-up 0.8s ease-out;

        .night & {
            background: linear-gradient(45deg, var (--dark-accent), #f3722c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    }

    .login-message {
        font-size: 1.1rem;
        margin-bottom: 30px;
        color: var(--light-text-secondary);
        max-width: 500px;
        line-height: 1.5;
        animation: fade-up 1s ease-out;

        .night & {
            color: var(--dark-text-secondary);
        }
    }

    .auth-buttons {
        display: flex;
        gap: 15px;
        animation: fade-up 1.2s ease-out;

        @media (max-width: 480px) {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
        }

        .auth-button {
            padding: 14px 28px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;

            .icon {
                font-size: 1.2rem;
            }

            &.login-btn {
                background-color: transparent;
                border: 2px solid var(--light-accent);
                color: var(--light-accent);

                &:hover {
                    background-color: rgba(231, 111, 81, 0.1);
                    transform: translateY(-3px);
                }

                .night & {
                    border-color: var(--dark-accent);
                    color: var(--dark-accent);

                    &:hover {
                        background-color: rgba(244, 162, 97, 0.15);
                    }
                }
            }

            &.register-btn {
                background-color: var(--light-accent);
                border: 2px solid var(--light-accent);
                color: white;

                &:hover {
                    background-color: var(--light-accent-hover);
                    transform: translateY(-3px);
                }

                .night & {
                    background-color: var(--dark-accent);
                    border-color: var(--dark-accent);

                    &:hover {
                        background-color: var(--dark-accent-hover);
                    }
                }
            }
        }
    }
}

/* 动画定义 */
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

@keyframes glow {
    0% {
        opacity: 0.3;
        box-shadow: 0 0 5px currentColor;
    }

    100% {
        opacity: 0.7;
        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
    }
}

@keyframes ripple {
    0% {
        transform: scale(0.1);
        opacity: 0.4;
    }

    100% {
        transform: scale(3);
        opacity: 0;
    }
}

@keyframes fade-up {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.5);
        opacity: 0.5;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 消息动画 */
.message-enter-active,
.message-leave-active {
    transition: all 0.3s;
}

.message-enter-from,
.message-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* 添加离线消息和连接状态样式 */
.connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: rgba(255, 152, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 15px;

    .night & {
        background-color: rgba(255, 152, 0, 0.2);
    }

    .status-icon {
        width: 10px;
        height: 10px;
        border-radius: 50%;

        &.offline {
            background-color: #FF9800;
            position: relative;

            &:after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background-color: rgba(255, 152, 0, 0.3);
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
        }
    }

    span {
        font-size: 0.9rem;
        color: #FF9800;
    }
}

.offline-message {
    opacity: 0.8;

    .message-content {
        border: 1px dashed rgba(255, 152, 0, 0.5);

        &:after {
            content: ' (离线)';
            font-size: 0.8em;
            opacity: 0.7;
        }
    }
}
</style>
