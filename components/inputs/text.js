import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function TextInput({
  id,
  name,
  hasBorder = true,
  onInputChange,
  errorCondition = false,
  errorMessage = '',
  className,
}) {
  return <>
    <input
      id={id}
      name={name}
      type="text"
      onChange={onInputChange}
      className={clsx(
        'control',
        hasBorder && errorCondition ? 'control-boundary-error' : 'control-boundary-normal',
        className
      )}
    />
    {errorCondition && <ControlErrorMessageText className={'mt-2'}>
      {errorMessage}
    </ControlErrorMessageText>}
  </>
}