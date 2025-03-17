<template>
    <div class="chat-room" :class="mode">
        <div class="chat-header">
            <h3>{{ movieTitle }} 的讨论区</h3>
            <span class="online-count">{{ onlineCount }}人在线</span>
        </div>

        <div class="messages" ref="messagesContainer">
            <div v-if="isLoggedIn && isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>正在连接...</p>
            </div>
            <div v-else-if="!isLoggedIn" class="login-state">
                <div class="lock-animation">
                    <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <rect class="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path class="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <p>登录后查看与参与讨论</p>
            </div>
            <div v-else-if="messages.length === 0" class="empty-state">
                <p>暂无讨论，成为第一个发言的人吧！</p>
            </div>
            <div v-for="(message, index) in messages" :key="index"
                :class="['message', message.username === username ? 'own' : '']">
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(message.username) }">
                    {{ message.username ? message.username.charAt(0).toUpperCase() : '?' }}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="username">{{ message.username }}</span>
                        <span class="time">{{ formatTime(message.created_at) }}</span>
                    </div>
                    <div class="message-text">{{ message.msg || message.content }}</div>
                </div>
            </div>
        </div>

        <div class="chat-input">
            <input type="text" v-model="newMessage" @keyup.enter="sendMessage" placeholder="发送消息..."
                :disabled="!isLoggedIn || isLoading" />
            <button @click="sendMessage" :disabled="!isLoggedIn || isLoading">
                发送
            </button>
        </div>
        <div v-if="!isLoggedIn" class="login-prompt">
            <p>请<router-link to="/login">登录</router-link>后参与讨论</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/modeStores';
import { useUserStore } from '@/stores/userStore';
import { io } from "socket.io-client";

const props = defineProps<{
    movieId: string;
    movieTitle: string;
}>();

const modeStore = useModeStore();
const userStore = useUserStore();
const { isNightMode } = storeToRefs(modeStore);
const { username } = storeToRefs(userStore);

const mode = ref("");
const messages = ref<any[]>([]);
const newMessage = ref("");
const onlineCount = ref(0);
const messagesContainer = ref<HTMLElement | null>(null);
const socket = ref<any>(null);
const messageColors = ref<Record<string, string>>({});
const isLoading = ref(true);
const connectionTimeout = ref<number | null>(null);

const isLoggedIn = computed(() => !!username.value);

watchEffect(() => {
    mode.value = isNightMode.value ? "night" : "";
});

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

function getRandomColor() {
    const colors = [
        '#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#264653',
        '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getAvatarColor(username: string) {
    if (!messageColors.value[username]) {
        messageColors.value[username] = getRandomColor();
    }
    return messageColors.value[username];
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
}

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
    }, 300000); // 300秒超时

    // 连接到WebSocket服务器，传递用户名和电影ID
    socket.value = io('http://8.153.74.243:3000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        query: {
            username: username.value || '匿名用户',
            movieId: props.movieId
        },
        reconnectionAttempts: 5 // 增加重连尝试次数
    });

    // 连接成功
    socket.value.on('connect', () => {
        if (connectionTimeout.value) {
            clearTimeout(connectionTimeout.value);
            connectionTimeout.value = null;
        }
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
        onlineCount.value = count;
    });

    // 加载历史消息，只显示当前电影的消息
    socket.value.on('load previous messages', (data: any[]) => {
        isLoading.value = false;

        if (connectionTimeout.value) {
            clearTimeout(connectionTimeout.value);
            connectionTimeout.value = null;
        }

        // 过滤出当前电影的消息
        messages.value = data.filter(msg =>
            msg.movieId === props.movieId ||
            !msg.movieId // 兼容旧数据
        );
        scrollToBottom();
    });

    // 监听新消息，只处理当前电影的消息
    socket.value.on('chat message', (data: any) => {
        // 只显示与当前电影相关的消息
        if (data.movieId === props.movieId || !data.movieId) {
            messages.value.push(data);
            scrollToBottom();
        }
    });

    // 监听登录消息
    socket.value.on('login message', (data: any) => {
        // 只显示与当前电影相关的系统消息
        if (data.movieId === props.movieId || !data.movieId) {
            messages.value.push({
                ...data,
                isSystem: true
            });
            scrollToBottom();
        }
    });
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
        color: getAvatarColor(username.value || '匿名用户'),
        movieId: props.movieId,
        movieTitle: props.movieTitle
    };

    // 发送消息到服务器
    socket.value.emit('chat message', messageData);
    newMessage.value = '';
}

onMounted(() => {
    if (isLoggedIn.value) {
        connectWebSocket();
    }
});

onUnmounted(() => {
    if (socket.value) {
        socket.value.disconnect();
    }

    // 清理超时定时器
    if (connectionTimeout.value) {
        clearTimeout(connectionTimeout.value);
        connectionTimeout.value = null;
    }
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
.chat-room {
    display: flex;
    flex-direction: column;
    height: 500px;
    background-color: var(--light-bg-primary);
    border-radius: 12px;
    box-shadow: var(--light-shadow);
    overflow: hidden;

    &.night {
        background-color: var(--dark-bg-primary);
        box-shadow: var(--dark-shadow);

        .chat-header {
            background-color: var(--dark-card-bg);
            border-color: var(--dark-border);
            color: rgba(255, 255, 255, 0.95);
        }

        .messages {
            background-color: var(--dark-bg-primary);
        }

        .message {
            background-color: var(--dark-card-bg);
            border-color: var(--dark-border);

            &.own {
                background-color: rgba(244, 162, 97, 0.2);
            }

            .message-header {
                .time {
                    color: rgba(255, 255, 255, 0.6);
                }
            }
        }

        .chat-input {
            background-color: var(--dark-card-bg);
            border-color: var(--dark-border);

            input {
                background-color: rgba(45, 45, 58, 0.8);
                color: rgba(255, 255, 255, 0.95);
                border-color: var(--dark-border);

                &::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }
            }

            button {
                background-color: var(--dark-accent);
                color: white;

                &:hover {
                    background-color: darken(#f4a261, 10%);
                }

                &:disabled {
                    background-color: rgba(244, 162, 97, 0.2);
                    color: rgba(255, 255, 255, 0.4);
                }
            }
        }

        .login-prompt {
            background-color: var(--dark-card-bg);
            border-color: var(--dark-border);
            color: rgba(255, 255, 255, 0.7);

            a {
                color: var(--dark-accent);
            }
        }
    }
}

.chat-header {
    padding: 16px;
    background-color: var(--light-card-bg);
    border-bottom: 1px solid var(--light-border);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
        margin: 0;
        font-size: 18px;
    }

    .online-count {
        font-size: 14px;
        color: var(--light-text-secondary);
    }
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .empty-state,
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--light-text-secondary);
        font-style: italic;
    }

    .loading-state {
        .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(231, 111, 81, 0.2);
            border-radius: 50%;
            border-top-color: var(--light-accent);
            animation: spin 0.8s linear infinite;
            margin-bottom: 10px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    }

    .night .loading-state .spinner {
        border: 3px solid rgba(244, 162, 97, 0.2);
        border-top-color: var(--dark-accent);
    }
}

.message {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--light-card-bg);
    border: 1px solid var(--light-border);

    &.own {
        background-color: rgba(231, 111, 81, 0.1);
    }

    &.system {
        background-color: rgba(0, 0, 0, 0.05);
        font-style: italic;

        .night & {
            background-color: rgba(255, 255, 255, 0.05);
        }
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        background-color: var(--light-accent);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
    }

    .message-content {
        flex: 1;

        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;

            .username {
                font-weight: 500;
            }

            .time {
                font-size: 12px;
                color: var(--light-text-secondary);
            }
        }

        .message-text {
            line-height: 1.5;
        }
    }
}

.chat-input {
    padding: 16px;
    background-color: var(--light-card-bg);
    border-top: 1px solid var(--light-border);
    display: flex;
    gap: 12px;

    input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--light-border);
        border-radius: 6px;
        font-size: 14px;
        background-color: var(--light-bg-primary);
        color: var(--light-text-primary);

        &:focus {
            outline: none;
            border-color: var(--light-accent);
            box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.1);
        }

        &:disabled {
            background-color: var(--light-border);
            cursor: not-allowed;
        }
    }

    button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background-color: var(--light-accent);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            background-color: darken(#e76f51, 10%);
        }

        &:disabled {
            background-color: var(--light-border);
            cursor: not-allowed;
        }
    }
}

.login-prompt {
    padding: 10px 16px;
    background-color: var(--light-card-bg);
    border-top: 1px solid var(--light-border);
    text-align: center;
    font-size: 14px;
    color: var(--light-text-secondary);

    a {
        color: var(--light-accent);
        text-decoration: none;
        font-weight: 500;

        &:hover {
            text-decoration: underline;
        }
    }
}

@media (max-width: 768px) {
    .chat-room {
        border-radius: 0;
        height: calc(100vh - 120px);
        max-height: 500px;
    }

    .chat-header {
        padding: 10px;

        h3 {
            font-size: 16px;
            max-width: 70%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .online-count {
            font-size: 12px;
        }
    }

    .messages {
        padding: 10px;
        gap: 10px;
    }

    .message {
        padding: 8px;

        .avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
        }

        .message-content {
            .message-text {
                font-size: 14px;
                word-break: break-word;
            }
        }
    }

    .chat-input {
        padding: 10px;

        input {
            font-size: 16px;
            padding: 6px 10px;
        }

        button {
            padding: 6px 12px;
            font-size: 14px;
        }
    }

    .login-prompt {
        padding: 8px;
        font-size: 13px;
    }
}

.login-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--light-text-secondary);

    .night & {
        color: rgba(255, 255, 255, 0.7);
    }

    .lock-animation {
        margin-bottom: 20px;
        animation: float 3s ease-in-out infinite;
    }

    .lock-icon {
        color: var(--light-accent, #e76f51);
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));

        .night & {
            color: var(--dark-accent, #f4a261);
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }

        .lock-body {
            animation: pulse-opacity 2s infinite alternate;
        }

        .lock-shackle {
            transform-origin: center 7px;
            animation: wiggle 5s ease-in-out infinite;
        }
    }

    p {
        font-size: 1.2rem;
        text-align: center;
        max-width: 80%;
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

@keyframes pulse-opacity {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

@keyframes wiggle {

    0%,
    100% {
        transform: rotate(0);
    }

    25% {
        transform: rotate(-5deg);
    }

    75% {
        transform: rotate(5deg);
    }
}
</style>