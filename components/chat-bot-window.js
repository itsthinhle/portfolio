import TextAreaInput from '@/components/inputs/text-area'
import {Cancel01Icon, ChatBotIcon} from '@hugeicons-pro/core-solid-standard'
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
      content: process.env.NODE_ENV === 'production'
        ? 'Sorry, this function is not available at the moment.'
        : 'Hi there! I can help you navigate this website quickly. Please start by asking me something.',
      payload: {}
    }
  ])

  useEffect(() => {
    // Scroll to the end when has new message
    messagesContainerEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages, isBotTyping])

  const onUserMessageValueChange = (_event) => {
    setUserMessage(_event.target.value)
  }

  const addBotMessageToChatWindow = () => {
    setIsBotTyping(true)

    chatApi.sendMessage(userMessage)
      .then(pointDto => {
        const newBotMessage = {
          sender: 'bot',
          content: '',
          payload: undefined
        }

        if (pointDto?.payload) {
          newBotMessage.payload = pointDto.payload

          // Page navigation: add a template answer
          if (pointDto.payload.type === 1) {
            const pageNavigationAnswerTemplate = chatbotAnswerTemplateConstant
              .pickRandomTemplate(chatbotAnswerTemplateConstant.pageNavigationTemplates)

            pointDto.payload.templateAnswer = pageNavigationAnswerTemplate
          }
        }

        setMessages((previousMessages) =>
          [...previousMessages, newBotMessage])
      })

    setIsBotTyping(false)
  }

  const addUserMessageToChatWindow = () => {
    if (!userMessage.trim() || isBotTyping) {
      return
    }

    const newUserMessage = {
      sender: 'user',
      content: userMessage,
      payload: {}
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
          addBotMessageToChatWindow()
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

  function renderBotMessageByPayload(_message) {
    // Search for page
    if (_message.payload.type === 1) {

      return <>
        {_message.payload.description}
        <br />
        {_message.payload.templateAnswer}
        <span>
          <Link
            aria-label={'navigation-link'}
            className={clsx([
              'font-medium underline',
              textTheme.hover.accentColor700
            ])}
            to={{
              pathname: _message.payload.path
            }}>
            {_message.payload.title}
          </Link>
          {' '}page.
        </span>
      </>
    }
    // FAQ
    else {
      return <>
        {_message.payload.answer}
      </>
    }
  }

  function getNotFoundMessage() {
    return 'I can only answer queries related to this website, please try again with another query 😁.'
  }

  function renderMessageContent(_message) {
    const commonClassName = 'px-3 py-1.5 w-fit max-w-[70%] rounded-md whitespace-pre-wrap wrap-break-word'

    if (_message.sender === 'user') {
      return <p
        className={clsx([
          commonClassName,
          'rounded-br-none',
          // backgroundTheme.accentColor700, ???
          // textTheme.primaryColor
        ])}>
        {_message.content}
      </p>
    }

    return <p
      className={clsx([
        commonClassName,
        'rounded-bl-none bg-gray-100 dark:bg-gray-600/50'
      ])}>
      {_message.content
        ? _message.content
        : _message.payload
          ? renderBotMessageByPayload(_message)
          : getNotFoundMessage()}
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
            {/*{renderUtility.renderIfTrue(*/}
            {/*  _message.sender === 'user',*/}
            {/*  renderChatProfileImage('/user-avatar.jpg', 'User'))}*/}
          </div>
        ))}
      </div>

      {/*  {isBotTyping && (*/}
      {/*    <div className={`pl-12 mt-2 small-text italic ${textTheme.secondaryColor600}`}>*/}
      {/*      Chatbot is typing...*/}
      {/*    </div>*/}
      {/*  )}*/}

      {/*  <div ref={messagesContainerEndRef} />*/}
    </div>

    {/* Input Area */}
    <div className={clsx([
      'px-3 py-1.5 flex gap-4 items-center rounded-b-lg border-t-1',
      // borderTheme.secondaryColor300,
      // backgroundTheme.primaryColor
    ])}>
      <TextAreaInput
        id={'input-message'}
        name={'input-message'}
        hasBorder={false}
        rows={1}
        ariaLabel={'chatbot input message'}
        placeholder={'Ask me something'}
        value={userMessage}
        onValueChange={onUserMessageValueChange}
        onKeyDown={onEnterKeyDown} />
      {/*<IconButton*/}
      {/*  isDisabled={process.env.NODE_ENV === 'production'}*/}
      {/*  ariaLabel={'Send message button'}*/}
      {/*  onClick={addUserMessageToChatWindow}*/}
      {/*  className={clsx([*/}
      {/*    textTheme.hover.accentColor700,*/}
      {/*    isBotTyping ? 'cursor-default' : 'cursor-pointer'*/}
      {/*  ])}>*/}
      {/*  {isBotTyping*/}
      {/*    ? <HugeiconsIcon icon={PauseIcon} size={24} />*/}
      {/*    : <HugeiconsIcon icon={SentIcon} size={24} />}*/}
      {/*</IconButton>*/}
    </div>
  </div>
}
