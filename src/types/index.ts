/**
 * 电影信息接口
 */
export interface Movie {
  id: number;
  nm: string; // 电影名称
  img: string; // 电影海报
  sc: string; // 评分
  dir?: string; // 导演
  cat?: string; // 分类
  dur?: number; // 时长
  wish?: number; // 想看数
  dra?: string; // 简介
}

/**
 * 图表选项接口
 */
export interface ChartOption {
  xAxis: {
    data: string[];
    [key: string]: any;
  };
  series: {
    data: number[] | any[];
    [key: string]: any;
  }[];
  [key: string]: any;
}

/**
 * 详情信息接口
 */
export interface Details {
  title: string | null;
  brief: string | null;
  isActive: boolean;
}

/**
 * 电影推荐接口
 */
export interface MovieSuggestion {
  id: number;
  nm: string;
  img?: string;
  [key: string]: any;
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  id?: number | string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: number | string;
  movieId?: number;
  // 系统消息相关字段
  isSystem?: boolean;
  msg?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * 颜色处理参数接口
 */
export interface ColorParams {
  value: number;
  dataIndex: number;
  [key: string]: any;
}

/**
 * 分类统计接口
 */
export interface CategoryCount {
  [category: string]: number;
}
