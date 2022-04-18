import axios, { AxiosRequestConfig, Canceler } from 'axios'
import { isFunction } from 'lodash-es'

const pendingMap = new Map<string, Canceler>()

export const getPendingUrl = (config: AxiosRequestConfig) => [config.method, config.url].join('&')

export class AxiosCanceler {
  /**
   * 添加请求
   * @param config
   */
  addPending(config: AxiosRequestConfig) {
    // 先去重
    this.removePending(config)
    const url = getPendingUrl(config)
    // 使用内置的CancelToken方法创建一个请求取消的方法
    config.cancelToken =
      config.cancelToken ||
      new axios.CancelToken((cancel) => {
        if (!pendingMap.has(url)) {
          // 如果里面没有处于pending则添加
          pendingMap.set(url, cancel)
        }
      })
  }

  removeAllPending() {
    pendingMap.forEach((cancel) => {
      cancel && isFunction(cancel) && cancel()
    })
    pendingMap.clear()
  }
  /**
   * 清除已存在的请求
   * @param config
   */
  removePending(config: AxiosRequestConfig) {
    const url = getPendingUrl(config)

    if (pendingMap.has(url)) {
      // 当前请求标识符存在时
      // 取消执行并删除
      const cancel = pendingMap.get(url)
      cancel && cancel(url)
      pendingMap.delete(url)
    }
  }
}
