import { message as Message, Modal, ModalFuncProps, notification } from 'ant-design-vue'
import type { ModalFunc } from 'ant-design-vue/es/modal/Modal'
import type { ConfigProps, NotificationArgsProps } from 'ant-design-vue/es/notification'
import { isString } from 'lodash-es'

export interface NotifyApi {
  info(config: NotificationArgsProps): void
  success(config: NotificationArgsProps): void
  error(config: NotificationArgsProps): void
  warn(config: NotificationArgsProps): void
  warning(config: NotificationArgsProps): void
  open(args: NotificationArgsProps): void
  close(key: String): void
  config(options: ConfigProps): void
  destroy(): void
}
export interface ModalOptionsEx extends Omit<ModalFuncProps, 'iconType'> {
  iconType: 'warning' | 'success' | 'error' | 'info'
}
export type ModalOptionsPartial = Partial<ModalOptionsEx> & Pick<ModalOptionsEx, 'content'>

interface ConfirmOptions {
  info: ModalFunc
  success: ModalFunc
  error: ModalFunc
  warn: ModalFunc
  warning: ModalFunc
}

function getIcon(iconType: string) {
  if (iconType === 'warning') {
    return <div class="i-ant-design:info-circle-filled modal-icon-warning" />
  } else if (iconType === 'success') {
    return <div class="i-ant-design:check-circle-filled modal-icon-success" />
  } else if (iconType === 'info') {
    return <div class="i-ant-design:info-circle-filled modal-icon-info" />
  } else {
    return <div class="i-ant-design:close-circle-filled modal-icon-error" />
  }
}

function renderContent({ content }: Pick<ModalOptionsEx, 'content'>) {
  if (isString(content)) {
    return <div innerHTML={`<div>${content as string}</div>`}></div>
  } else {
    return content
  }
}

const getBaseOptions = () => {
  return {
    okText: '确认',
    centered: true,
  }
}

/**
 * @description: Create confirmation box
 */
function createConfirm(options: ModalOptionsEx): ConfirmOptions {
  const iconType = options.iconType || 'warning'
  Reflect.deleteProperty(options, 'iconType')
  const opt: ModalFuncProps = {
    centered: true,
    icon: getIcon(iconType),
    ...options,
    content: renderContent(options),
  }
  return Modal.confirm(opt) as unknown as ConfirmOptions
}

function createModalOptions(options: ModalOptionsPartial, icon: string): ModalOptionsPartial {
  return {
    ...getBaseOptions(),
    ...options,
    content: renderContent(options),
    icon: getIcon(icon),
  }
}

function createSuccessModal(options: ModalOptionsPartial) {
  return Modal.success(createModalOptions(options, 'success'))
}

function createErrorModal(options: ModalOptionsPartial) {
  return Modal.error(createModalOptions(options, 'close'))
}

function createInfoModal(options: ModalOptionsPartial) {
  return Modal.info(createModalOptions(options, 'info'))
}

function createWarningModal(options: ModalOptionsPartial) {
  return Modal.warning(createModalOptions(options, 'warning'))
}

notification.config({
  placement: 'topRight',
  duration: 3,
})

/**
 * @description: message
 */
export function useMessage() {
  return {
    createMessage: Message,
    notification: notification as NotifyApi,
    createConfirm: createConfirm,
    createSuccessModal,
    createErrorModal,
    createInfoModal,
    createWarningModal,
  }
}
