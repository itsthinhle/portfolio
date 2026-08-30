import ControlErrorMessageText from '@/components/texts/messages/control-error'
import clsx from 'clsx'
import React from 'react'

export default function UncontrolledTextAreaInput({
  id,
  name,
  defaultValue,
  hasBorder = true,
  onInputChange,
  errorCondition = false,
  errorMessage = '',
  rows = 3,
  placeholder,
  onKeyDown,
  onKeyUp,
  readOnly = false,
  className
}) {
  return <>
    <textarea
      id={id}
      name={name}
      defaultValue={defaultValue}
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