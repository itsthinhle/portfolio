import {sendMessage} from '@/actions/databases/upstash'
import {metadataType} from '@/components/chat-bot/constants/metadata-type'
import ControlledTextAreaInput from '@/components/inputs/controlled-text-area'
import InlineTextLink from '@/components/links/inline-text'
import {Cancel01Icon, ChatBotIcon, PauseIcon, Search01Icon, SentIcon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import Image from 'next/image'
import React, {useEffect, useRef, useState} from 'react'

export default function ChatBotWindow({
  ref,
  onCloseButtonClick
}) {

  const messagesContainerRef = useRef(null)
  const messagesContainerEndRef = useRef(null)

  const [userMessage, setUserMessage] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      content: `Hi there! I can help you navigate this website quickly. Please start by asking me something.

Note: The first request may take up to 1 minute while the service restarts from inactivity.`,
      metadata: {}
    }
  ])

  useEffect(() => {
    // Scroll to the end when has new message
    messagesContainerEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages, isBotTyping])

  const onUserMessageValueChange = (_event) => {
    setUserMessage(_event.target.value)
  }

  const addBotMessageToChatWindow = async () => {
    sendMessage(userMessage)
      .then(_responseDto => {
        const newBotMessage = {
          sender: 'bot',
          content: '',
          metadata: undefined
        }

        if (_responseDto[0].score > 0.6 && _responseDto[0]?.metadata) {
          newBotMessage.metadata = _responseDto[0].metadata
        }

        setMessages((previousMessages) =>
          [...previousMessages, newBotMessage])
      })
  }

  const addUserMessageToChatWindow = () => {
    if (!userMessage.trim() || isBotTyping) {
      return
    }

    const newUserMessage = {
      sender: 'user',
      content: userMessage,
      metadata: {}
    }

    setMessages((previousMessages) =>
      [...previousMessages, newUserMessage]
    )
  }

  const onEnterKeyDown = (_event) => {
    if (_event.key === 'Enter') {
      if (!isBotTyping) {
        if (!_event.shiftKey) {
          _event.preventDefault()
          addUserMessageToChatWindow()
          setUserMessage('')
          setIsBotTyping(true)
          addBotMessageToChatWindow()
          setIsBotTyping(false)
        }
      } else {
        // Prevent user from sending message
        _event.preventDefault()
      }
    }
  }

  const renderChatProfileImage = (_imageSource, _imageAlt) => {
    return <Image
      src={_imageSource}
      width={44}
      height={44}
      className={'size-11 rounded-full object-cover'}
      alt={_imageAlt}
    />
  }

  function renderBotMessage(_message) {
    if (_message.metadata) {
      if (_message.metadata.type === metadataType.page
        || _message.metadata.type === metadataType.project
        || _message.metadata.type === metadataType.blog) {
        return <>
          The <InlineTextLink
            ariaLabel={'navigation-link-in-chat'}
            target={'_self'}
            className={'font-semibold'}
            href={_message.metadata.path}>
            {_message.metadata.title}
          </InlineTextLink> {_message.metadata.type} {_message.metadata.answer}
        </>
      }
      // FAQ
      else {
        return <>
          {_message.metadata.answer}
        </>
      }
    }
    else {
      return <>
        I&#39;m still being trained and can&#39;t answer queries that not related to the website, please try again 😁.
      </>
    }
  }

  function renderMessageContent(_message) {
    const commonClassName = 'px-3 py-1.5 w-fit max-w-[70%] rounded-md whitespace-pre-wrap wrap-break-word'

    if (_message.sender === 'user') {
      return <p
        className={clsx([
          commonClassName,
          'rounded-br-none bg-dark dark:bg-light text-light dark:text-dark',
        ])}>
        {_message.content}
      </p>
    }

    return <p
      className={clsx([
        commonClassName,
        'rounded-bl-none bg-light-badge dark:bg-dark-badge/75'
      ])}>
      {_message.content
        ? _message.content
        : renderBotMessage(_message)}
    </p>
  }

  return <div
    ref={ref}
    className={clsx([
      'fixed bottom-21 lg:bottom-23 left-4 sm:left-auto right-4 sm:right-6 lg:right-8 z-40',
      'flex flex-col',
      'w-auto sm:w-144 h-144 rounded-lg shadow-xl',
      'shadow-dark/25 dark:shadow-light/25 hidden'
    ])}>
    {/* Header */}
    <div className={clsx([
      'px-4 py-2 font-semibold rounded-t-lg',
      'bg-dark dark:bg-light text-light dark:text-dark',
      'border border-dark dark:border-light'
    ])}>
      <div className={'flex justify-between'}>
        <p className={'flex gap-2 items-center'}>
          <HugeiconsIcon icon={ChatBotIcon} className={'size-5 lg:size-6'} />
          Chatbot
        </p>
        <button
          className={'cursor-pointer text-center'}
          onClick={onCloseButtonClick}>
          <HugeiconsIcon className={'size-6'} icon={Cancel01Icon} />
        </button>
      </div>
    </div>

    {/* Message Area */}
    <div
      ref={messagesContainerRef}
      className={clsx([
        'flex-1 overflow-auto px-4 py-4 flex flex-col',
        'bg-light dark:bg-dark',
        'border-x border-light-boundary dark:border-dark-boundary'
      ])}>
      <div className={'flex-1 flex flex-col gap-y-2 justify-end'}>
        {messages.map((_message, _index) => (
          <div
            key={_index}
            className={`flex gap-2 items-end ${_message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {_message.sender === 'bot' && renderChatProfileImage('/bot-avatar.png', 'Bot')}
            {renderMessageContent(_message)}
            {_message.sender === 'user' && renderChatProfileImage('/user-avatar.jpg', 'User')}
          </div>
        ))}
      </div>

      {isBotTyping && (
        <div className={'mt-4 text-sm lg:text-base italic text-light-normal-text dark:text-dark-normal-text'}>
          Chatbot is typing...
        </div>
      )}

      <div ref={messagesContainerEndRef} />
    </div>

    {/* Input Area */}
    <div className={clsx([
      'px-3 py-1.5 flex gap-4 items-center rounded-b-lg',
      'bg-light dark:bg-dark',
      'border border-light-boundary dark:border-dark-boundary'
    ])}>
      <ControlledTextAreaInput
        id={'input-message'}
        name={'input-message'}
        hasBorder={false}
        rows={1}
        ariaLabel={'chatbot input message'}
        placeholder={'Ask me something'}
        className={'resize-none'}
        value={userMessage}
        onInputChange={onUserMessageValueChange}
        onKeyDown={onEnterKeyDown} />
      <button
        aria-label={'Send message button'}
        onClick={addUserMessageToChatWindow}
        className={clsx([
          isBotTyping ? 'cursor-default' : 'cursor-pointer'
        ])}>
        {isBotTyping
          ? <HugeiconsIcon icon={PauseIcon} className={'size-5 lg:size-6'} />
          : <HugeiconsIcon icon={SentIcon} className={'size-5 lg:size-6'} />}
      </button>
    </div>
  </div>
}
