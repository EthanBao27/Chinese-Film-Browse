<template>
  <div class="login-page" :class="mode">
    <div class="background-container">
      <div class="images-grid">
        <img v-for="(image, index) in images" :key="index" :src="image" alt="Background image" />
      </div>
    </div>

    <div class="form-container">
      <h2>登录</h2>
      <form @submit.prevent="login">
        <label for="username">用户名:</label>
        <input type="text" v-model="username" id="username" required />
        <label for="password">密码:</label>
        <input type="password" v-model="password" id="password" required />
        <button type="submit" class="submit-btn">登录</button>
      </form>

      <!-- 注册提示 -->
      <div class="register-link">
        首次使用？<a href="#" @click.prevent="goToRegister">点此注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '@/stores/modeStores';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');

const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);
const mode = ref("");
const userStore = useUserStore()

// 背景图相关
const images = ref([]);
const apiUrl = '/api/asgard/asgardapi/mmdb/movieboard/moviedetail/fixedboard/39.json?ci=1&year=0&term=0&limit=100&offset=0';

const fetchImages = async () => {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data && data.data && data.data.movies && Array.isArray(data.data.movies)) {
      images.value = data.data.movies.map((movie) => movie.img).reverse();
    } else {
      console.error('Unexpected data format:', data);
      images.value = [];
    }
  } catch (error) {
    console.error('Error fetching movie images:', error);
    images.value = [];
  }
};

onMounted(() => {
  window.scrollTo(0, 0);
  fetchImages();
  document.body.style.overflow = 'hidden';
  document.body.classList.add('login-page');
});

onBeforeUnmount(() => {
  document.body.style.overflow = 'auto';
  document.body.classList.remove('login-page');
});

watchEffect(() => {
  mode.value = isNightMode.value ? "night" : "";
});

function login() {
  fetch(`/db/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username: username.value, password: password.value }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert('登录成功');
        localStorage.setItem('token', data.token);
        userStore.setUsername(username.value);
        router.push('/');
      } else {
        alert(data.message);
      }
    });
}

function goToRegister() {
  router.push('/register');
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #f0f0f0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
}

.login-page.night {
  background-color: var(--night-bg-color);

  .form-container {
    background-color: #333;

    h2,
    form,
    input {
      color: #dedede;
    }

    label {
      color: #dedede;
    }

    input {
      background-color: #555;
      border-style: none;
    }
  }
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(10px);
  opacity: 0.8;
  overflow: hidden;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.images-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-container {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
}

input {
  width: 100%;
  padding: 4px 12px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.3s ease-in-out;
}

input:focus {
  transform: scale(1.03);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.submit-btn {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background-color: #0056b3;
  transform: scale(1.03);
}

.register-link {
  margin-top: 10px;
  text-align: right;
  font-size: 14px;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
