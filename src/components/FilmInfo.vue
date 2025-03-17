<template>
  <div :class="['filter', modeClass, { active: details.isActive }]">
    <div id="popup">
      <div class="content">
        <h2>{{ details.title == null ? '标题正在加载中，请等待片刻~' : details.title }}</h2>
        <p>
          {{ details.brief == null ? '简介正在加载中，请等待片刻~' : details.brief }}
        </p>
      </div>
      <img src="@/assets/images/cancel.png" @click="changeActive" class="close-button" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, Ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useModeStore } from '../stores/modeStores';

interface Details {
  title: string;
  brief: string;
  isActive: boolean;
}

const details = inject('details') as Ref<Details>;
const modeStore = useModeStore();
const { isNightMode } = storeToRefs(modeStore);

const modeClass = ref('');

watchEffect(() => {
  modeClass.value = isNightMode.value ? 'night' : '';
});

function changeActive() {
  details.value.isActive = !details.value.isActive;
}
</script>

<style scoped lang="scss">
.filter {
  position: fixed;
  width: 100%;
  height: 100vh;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s;
  visibility: hidden;

  &.active {
    visibility: visible;

    &::before {
      backdrop-filter: blur(10px);
    }

    #popup {
      transform: scale(1);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0);
    transition: 0.5s;
    z-index: -1;
  }

  #popup {
    position: fixed;
    z-index: 1000;
    background: #fff;
    width: 70%;
    max-width: 850px;
    min-width: 320px;
    max-height: 70%;
    padding: 30px;
    box-shadow: 0 15px 30px inset rgba(0, 0, 0, 0.08);
    transform: scale(0);
    transition: transform 0.5s ease-in-out;
    overflow-y: auto;
    position: relative;
    border-radius: 12px;

    .content {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      top: 10px;

      h2 {
        font-size: 2rem;
        margin: 0 10px 24px;
        text-align: center;
      }

      p {
        text-align: justify;
        font-size: 1.25rem;
        color: #333;
        line-height: 1.6;
        padding: 0 10px;
        margin-bottom: 20px;
      }
    }

    .close-button {
      position: absolute;
      width: 28px;
      top: 15px;
      right: 15px;
      cursor: pointer;

      &:hover {
        transform: scale(1.5) rotate(90deg);
        transition: 0.5s ease;
      }
    }
  }
}

/* 夜晚模式的样式 */
.filter.night {
  color: #daeff5;
  /* 文字变为浅色 */

  #popup {
    background-color: #4b5258;
    /* 弹出窗口背景色 */
    box-shadow: 0 15px 30px inset rgba(0, 0, 0, 0.3);
    /* 更暗的阴影 */

    .content p {
      color: rgb(206, 215, 222);
    }
  }
}

/* 媒体查询，调整移动端样式 */
@media (max-width: 768px) {
  #popup {
    width: 90%;
    min-width: 280px;
    padding: 20px;
    max-height: 80%;

    .content {
      h2 {
        font-size: 1.5rem;
        margin-bottom: 16px;
      }

      p {
        font-size: 1rem;
        line-height: 1.5;
      }
    }

    .close-button {
      width: 24px;
      top: 10px;
      right: 10px;
    }
  }
}
</style>
