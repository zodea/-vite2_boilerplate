import { AxiosResponse } from 'axios'
import { isString, merge } from 'lodash-es'
import { VAxios } from './Axios'
import type { AxiosTransform, CreateAxiosOptions } from './axiosTransforms'
import { checkStatus } from './checkStatus'
import type { RequestOptions, Result } from '/#/axios'
import { ContentTypeEnum } from '/@/enums/httpEnum'
import { ResultEnum } from '/@/enums/resultEnum'
import { useMessage } from '/@/hooks/web/useMessage'
import sys from '/@/utils/lang/sys'

const { createMessage, createErrorModal } = useMessage()

const transform: AxiosTransform = {
  beforeRequestHook: (config, options: RequestOptions) => {
    const { apiUrl } = options
    if (apiUrl && isString(apiUrl)) {
      config.url = apiUrl + config.url
    }
    return config
  },

  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: (config: Record<string, any>, options) => {
    // 请求之前处理config， 添加token等操作
    // const token = getToken()
    const token = ''
    // 不需要时可以在 requestOptions 新增属性进行配置
    if (token) {
      // jwt token
      config.headers.Authorization = options.authenticationScheme
        ? `${options.authenticationScheme} ${token}`
        : token
    }
    return config
  },

  transformRequestHook: (response: AxiosResponse<Result>, options: RequestOptions) => {
    const { isReturnNativeResponse, isTransformResponse } = options
    if (isReturnNativeResponse) {
      return response
    }

    if (isTransformResponse) {
      return response.data
    }

    const { data } = response
    if (!data) {
      throw new Error('response data is empty')
    }

    const { code, data: realData, msg } = data

    const hasSuccess = Reflect.has(data, 'code') && code === ResultEnum.SUCCESS
    if (hasSuccess) {
      return realData
    }

    let timeoutMsg = ''
    switch (code) {
      case ResultEnum.TIMEOUT:
        timeoutMsg = sys.api.apiTimeoutMessage
      default:
        timeoutMsg = msg
    }

    throw new Error(timeoutMsg)
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (error: any) => {
    const { response, code, message, config } = error || {}
    const errorMessageMode = config?.requestOptions?.errorMessageMode || 'none'
    const msg: string = response?.data?.message ?? ''
    const err: string = error?.toString?.() ?? ''
    let errMessage = ''

    try {
      // 当连接中止时这里做个处理
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        errMessage = sys.api.apiTimeoutMessage
      }
      if (err?.includes('Network Error')) {
        errMessage = sys.api.networkExceptionMsg
      }

      if (errMessage) {
        if (errorMessageMode === 'modal') {
          createErrorModal({ title: sys.api.errorTip })
        } else if (errorMessageMode === 'message') {
          createMessage.error(errMessage)
        }
        return Promise.reject(error)
      }
    } catch (err) {
      throw new Error(err as unknown as string)
    }

    checkStatus(response?.status, msg, errorMessageMode)
    return Promise.reject(error)
  },
}

function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    merge(
      {
        authenticationScheme: 'Bearer',
        timeout: 10 * 1000,
        urlPrefix: '',
        headers: { 'Content-Type': ContentTypeEnum.JSON },
        transform,
        requestOptions: {
          // 是否处理请求结果
          isTransformResponse: true,
          // 是否返回本地响应头信息
          isReturnNativeResponse: true,
          // 接口地址，留空则使用默认url
          apiUrl: '',
          // 错误信息提示类型
          errorMessageMode: 'none',
          // 忽略重复请求
          ignoreCancelToken: true,
        },
      },
      opt,
    ),
  )
}

export const defHttp = createAxios()
