import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { cloneDeep, isFunction } from 'lodash-es'
import qs from 'qs'
import { AxiosCanceler } from './axiosCancel'
import type { CreateAxiosOptions } from './axiosTransforms'
import type { RequestOptions, Result } from '/#/axios'
import { ContentTypeEnum, RequestEnum } from '/@/enums/httpEnum'

export class VAxios {
  private axiosInstance: AxiosInstance
  private options: CreateAxiosOptions

  constructor(options: CreateAxiosOptions) {
    this.options = options
    this.axiosInstance = axios.create(options)
    this.setupInterceptors()
  }

  /**
   * 获取拦截器需要配置的一些操作
   * @returns
   */
  private getTransform() {
    const { transform } = this.options
    return transform
  }

  // 支持form表单的编码数据
  supportFormData(config: AxiosRequestConfig) {
    const headers = config.headers || this.options.headers
    const contentType = headers?.['Content-Type'] || headers?.['content-type']

    // 当不是 application/x-www-form-urlencoded 编码格式
    // 参数中不存在 data 键名
    // 是 get 请求
    if (
      contentType !== ContentTypeEnum.FORM_URLENCODED ||
      !Reflect.has(config, 'data') ||
      config.method?.toUpperCase() === RequestEnum.GET
    ) {
      return config
    }

    return {
      ...config,
      data: qs.stringify(config.data, { arrayFormat: 'brackets' }),
    }
  }

  /**
   * 拦截器配置
   */
  private setupInterceptors() {
    const transform = this.getTransform()
    if (!transform) {
      return
    }

    // 获取配置相关的钩子，并执行
    const {
      requestInterceptors,
      requestInterceptorsCatch,
      responseInterceptors,
      responseInterceptorsCatch,
    } = transform
    // 取消请求的实例
    const axiosCanceler = new AxiosCanceler()

    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // 如果取消重复请求被打开，则禁止取消重复请求
        const {
          // @ts-ignore
          headers: { ignoreCancelToken },
        } = config
        // 执行钩子
        if (requestInterceptors && isFunction(requestInterceptors)) {
          requestInterceptors(config, this.options)
        }
        !ignoreCancelToken && axiosCanceler.addPending(config)
        return config
      },
      (error: any) => {
        if (requestInterceptorsCatch && isFunction(requestInterceptorsCatch)) {
          requestInterceptorsCatch(error)
        }
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        response && axiosCanceler.removePending(response.config)
        if (responseInterceptors && isFunction(responseInterceptors)) {
          responseInterceptors(response)
        }
        return response
      },
      (error: any) => {
        error && axiosCanceler.removePending(error.config)
        if (responseInterceptorsCatch && isFunction(responseInterceptorsCatch)) {
          responseInterceptorsCatch(error)
        }
        return Promise.reject(error)
      },
    )
  }

  // 常用的四种请求封装
  get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'GET' }, options)
  }

  post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'POST' }, options)
  }

  put<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'PUT' }, options)
  }

  delete<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'DELETE' }, options)
  }

  request<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    let conf: CreateAxiosOptions = cloneDeep(config)
    const transform = this.getTransform()

    const { requestOptions } = this.options

    // 将全局配置和单独配置进行一个合并
    const opt: RequestOptions = Object.assign({}, requestOptions, options)

    // 获取与请求相关的钩子
    const { beforeRequestHook, requestCatchHook, transformRequestHook } = transform || {}
    // 如果存在请求前钩子，则对其的配置项再处理一次
    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt)
    }

    // 将配置项保存在 requestOptions 参数中
    conf.requestOptions = opt

    // 根据请求的方式和类型 处理成表单的格式
    conf = this.supportFormData(conf)

    return new Promise((resolve, reject) => {
      this.axiosInstance
        .request<any, AxiosResponse<Result>>(conf)
        .then((response: AxiosResponse<Result>) => {
          if (transformRequestHook && isFunction(transformRequestHook)) {
            try {
              const result = transformRequestHook(response, opt)
              resolve(result)
            } catch (error) {
              if (error) {
                reject(error)
              } else {
                new Error('request error!')
              }
            }
          }
        })
        .catch((e: Error | AxiosError) => {
          if (requestCatchHook && isFunction(requestCatchHook)) {
            reject(requestCatchHook(e, opt))
            return
          }
          reject(e)
        })
    })
  }
}
