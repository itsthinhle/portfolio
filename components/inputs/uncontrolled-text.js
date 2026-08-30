import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function UncontrolledTextInput({
  id,
  name,
  defaultValue,
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
      defaultValue={defaultValue}
      type="text"
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