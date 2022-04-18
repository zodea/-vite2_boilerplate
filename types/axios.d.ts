export type ErrorMessageMode = 'none' | 'modal' | 'message' | undefined

/**
 * @description 请求配置项
 */
export interface RequestOptions {
  // 是否处理请求结果
  isTransformResponse?: boolean
  // 是否返回本地响应头信息
  isReturnNativeResponse?: boolean
  // 接口地址，留空则使用默认url
  apiUrl?: string
  // 错误信息提示类型
  errorMessageMode?: ErrorMessageMode
  ignoreCancelToken?: boolean
}

export interface Result<T = any> {
  code: number
  data: T
  msg: string
}
