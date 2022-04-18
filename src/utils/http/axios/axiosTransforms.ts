/**
 * 数据处理类，可根据项目情况进行配置
 */
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RequestOptions, Result } from '/#/axios'

export interface CreateAxiosOptions extends AxiosRequestConfig {
  authenticationScheme?: string
  transform?: AxiosTransform
  requestOptions?: RequestOptions
}

// 此处的处理考虑 请求前操作 结果返回后的操作，失败和成功的操作
export abstract class AxiosTransform {
  /**
   * @description 请求前的钩子 axios.create(options)的步骤 过期时间，请求头类型等操作
   */
  beforeRequestHook?: (config: AxiosRequestConfig, options: RequestOptions) => AxiosRequestConfig

  // service.interceptors.request.use((config, options)=>{}, (error) => {})
  /**
   * @description 请求之前的拦截器 res处的处理
   */
  requestInterceptors?: (
    config: AxiosRequestConfig,
    options: CreateAxiosOptions,
  ) => AxiosRequestConfig
  /**
   * @description 请求之前的错误拦截器 err处的处理
   */
  requestInterceptorsCatch?: (error: Error) => void

  // service.interceptors.response.use((res)=>{}, (error) => {})
  /**
   * @description 请求之前的拦截器 res处的处理
   */
  responseInterceptors?: (res: AxiosResponse<any>) => AxiosResponse<any>
  /**
   * @description 请求之前的错误拦截器 err处的处理
   */
  responseInterceptorsCatch?: (error: Error) => void

  /**
   * @description 请求成功后的钩子 请求之后的then处理 是否对完成请求后的数据进行一个过滤
   */
  transformRequestHook?: (res: AxiosResponse<Result>, options: RequestOptions) => any

  /**
   * @description 请求失败的钩子 请求之后的catch处理 请求失败后的展示方式，状态码的处理
   */
  requestCatchHook?: (e: Error, options: RequestOptions) => Promise<any>
}
