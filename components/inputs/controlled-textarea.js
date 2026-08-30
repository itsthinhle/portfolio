import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function ControlledTextAreaInput({
  id,
  name,
  ariaLabel = '',
  hasBorder = true,
  value = '',
  onInputChange,
  errorCondition = false,
  errorMessage = '',
  rows,
  placeholder,
  onKeyDown,
  onKeyUp,
  readOnly = false,
  className,
}) {
  return <>
    <textarea
      id={id}
      aria-label={ariaLabel}
      name={name}
      value={value}
      onChange={onInputChange}
      rows={rows}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      readOnly={readOnly}
      className={clsx(
        'control',
        hasBorder ? 'control-boundary-width' : 'outline-none',
        errorCondition ? 'control-boundary-error' : 'control-boundary-normal',
        {'cursor-default': readOnly},
        className
      )}
    />
    {errorCondition && <ControlErrorMessageText className={'mt-2'}>
      {errorMessage}
    </ControlErrorMessageText>}
  </>
}