import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import "@/style/reset.scss";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";

// 导入ECharts组件
import VChart from "vue-echarts";

// 导入其他组件
import Header from "@/components/Header.vue";
import Hero from "@/components/Hero.vue";
import Content from "@/components/Content.vue";
import FilmBoard from "@/components/FilmBoard.vue";
import FilmInfo from "@/components/FilmInfo.vue";
import Former from "@/views/Former.vue";
import Latest from "@/views/Latest.vue";
import Search from "@/views/Search.vue";
import Coming from "@/views/Coming.vue";
import Register from "@/views/Register.vue";
import Login from "@/views/Login.vue";
import Chat from "@/views/Chat.vue";
import MovieDetail from "@/views/MovieDetail.vue";
import Welcome from "@/views/Welcome.vue";

const app = createApp(App);
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Welcome },
    { path: "/home", component: Latest },
    { path: "/former", component: Former },
    { path: "/search", component: Search },
    { path: "/coming", component: Coming },
    { path: "/register", component: Register },
    { path: "/login", component: Login },
    { path: "/chat", component: Chat },
    { path: "/movie", component: MovieDetail },
  ],
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 全局注册组件
app.component("film-header", Header);
app.component("hero", Hero);
app.component("content", Content);
app.component("film-board", FilmBoard);
app.component("film-info", FilmInfo);
app.component("v-chart", VChart);

app.use(router).use(pinia).mount("#app");
