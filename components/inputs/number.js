import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

// May look similart to text input but useful for future features
export default function NumberInput({
  id,
  name,
  onInputChange,
  errorCondition = false,
  errorMessage = '',
  className,
}) {
  // Or a custom loading skeleton component
  return <>
    <input
      id={id}
      name={name}
      type="number"
      onChange={onInputChange}
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