import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function TextInput({
  id,
  name,
  onControlChange,
  errorCondition = false,
  errorMessage = '',
  className,
}) {
  // Or a custom loading skeleton component
  return <>
    <input
      id={id}
      name={name}
      type="text"
      onChange={onControlChange}
      className={clsx(
        'control',
        errorCondition ? 'control-boundary-error' : 'control-boundary-normal',
        className
      )}
    />
    {errorCondition && <ControlErrorMessageText className={'mt-2'}>
      {errorMessage}
    </ControlErrorMessageText>}
  </>
}