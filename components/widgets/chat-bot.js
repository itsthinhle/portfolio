'use client'
import ChatBotWindow from '@/components/chat-bot-window'
import {
  Message01Icon
} from '@hugeicons-pro/core-solid-standard'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { useRef } from 'react'

export default function ChatBotWidget() {
  const chatWindowRef = useRef(null)

  const toggleChatWindow = () => {
    chatWindowRef.current.classList.toggle('hidden')
  }

  return <div className={'relative w-full'}>
    {/* Floating Button */}
    <button
      onClick={toggleChatWindow}
      className={clsx([
        // right: follows page-px:
        'fixed bottom-6 right-4 sm:right-6 lg:right-8',
        'bg-dark dark:bg-light text-light dark:text-dark',
        'p-3 rounded-full cursor-pointer z-40'
      ])}
      aria-label="Chat bot icon">
      <HugeiconsIcon icon={Message01Icon} className={'size-6 lg:size-7'} />
    </button>
    <ChatBotWindow
      ref={chatWindowRef}
      onCloseButtonClick={toggleChatWindow} />
  </div>
}
