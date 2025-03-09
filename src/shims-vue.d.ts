declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 如果使用第三方库没有类型声明，可以在这里添加
declare module 'vue-echarts' {
  import { DefineComponent } from 'vue'
  const ECharts: DefineComponent<any, any, any>
  export default ECharts
}

// 全局变量扩展
interface Window {
  // 可以在这里添加全局变量类型定义
} 