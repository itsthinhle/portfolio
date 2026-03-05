import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

// May look similart to text input but useful for future features
export default function NumberInput({
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
      type="number"
      onChange={onInputChange}
      className={clsx(
        'control',
        hasBorder ? 'control-boundary-width' : 'outline-none',
        errorCondition ? 'control-boundary-error' : 'control-boundary-normal',
        className
      )}
    />
    {errorCondition && <ControlErrorMessageText className={'mt-2'}>
      {errorMessage}
    </ControlErrorMessageText>}
  </>
}