import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function TextAreaInput({
  id,
  name,
  ariaLabel = '',
  hasBorder = true,
  onInputChange,
  errorCondition = false,
  errorMessage = '',
  rows,
  placeholder,
  className,
}) {
  return <>
    <textarea
      id={id}
      aria-label={ariaLabel}
      name={name}
      onChange={onInputChange}
      rows={rows}
      placeholder={placeholder}
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