import { defineStore } from "pinia";
import { Ref } from "vue";
import { useStorage } from "@vueuse/core";

export const useModeStore = defineStore("modeStore", () => {
  // 使用 useStorage 持久化存储用户的主题设置
  const isNightMode: Ref<boolean> = useStorage("isNightMode", false);

  // 记录用户是否手动设置过主题
  const userPreferredTheme: Ref<boolean> = useStorage(
    "userPreferredTheme",
    false
  );

  // 检查系统主题
  const checkSystemTheme = () => {
    // 如果用户已经手动设置过主题，则不再跟随系统主题
    if (userPreferredTheme.value) {
      return;
    }

    // 否则跟随系统主题
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    isNightMode.value = prefersDark;
  };

  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有当用户没有手动设置过主题时，才跟随系统变化
      if (!userPreferredTheme.value) {
        isNightMode.value = e.matches;
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  };

  // 切换夜间模式
  const toggleMode = () => {
    isNightMode.value = !isNightMode.value;
    // 标记用户已手动设置主题
    userPreferredTheme.value = true;
  };

  // 初始化时检查系统主题
  if (typeof window !== "undefined") {
    checkSystemTheme();
    setupSystemThemeListener();
  }

  return { isNightMode, toggleMode };
});
