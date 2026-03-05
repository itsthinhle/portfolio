import ControlErrorMessageText from '@/components/texts/messages/control-error'
import { Combobox, useListCollection } from '@ark-ui/react/combobox'
import { useFilter } from '@ark-ui/react/locale'
import { Portal } from '@ark-ui/react/portal'
import {ArrowDown01Icon, Cancel01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import React, {useEffect, useState} from 'react'


/**
 * By default, the combobox collection expects an array of objects
 * with `label` and `value` properties
 *
 * Option có thể có option.value hoặc không. option.value thường dùng để
 * tạo option mới (xem mục creatable trên arkui website)
 *
 * @param options Must be an array of objects
 * @param displayValueKeyName The key name to display value of an option as object
 */
export default function UncontrolledComboBox({
  id,
  name,
  placeholder = '',
  defaultValue = '',
  hasBorder = true,
  options,
  displayValueKeyName = 'country',
  onOptionChange,
  errorCondition = false,
  errorMessage = '',
  disabled = false,
  className
}) {
  const [option, setOption] = useState([]) // option is an aray :)
  const { contains } = useFilter({ sensitivity: 'base' })

  const { collection, filter, set } = useListCollection({
    initialItems: options,
    itemToString: (_option) => _option?.[displayValueKeyName],
    itemToValue: (_option) => {
      if (_option?.value) {
        return _option.value
      }

      return _option?.[displayValueKeyName]
    },
    filter: contains,
    // Large datasets: limit the number of rendered items in the DOM to improve performance
    // This may replace virtualization
    limit: 50
  })

  useEffect(() => {
    set(options)
  }, [options, set])

  const onInputValueChange = ({ inputValue }) => {
    filter(inputValue)
  }

  const onInternalOptionChange = ({ value }) => {
    setOption(value)
    onOptionChange?.(value)
  }

  return <>
    <Combobox.Root
      id={id}
      name={name}
      collection={collection}
      onInputValueChange={onInputValueChange}
      defaultInputValue={defaultValue}
      value={option}
      onValueChange={onInternalOptionChange}
      disabled={disabled}
    >
      <Combobox.Control className={clsx(
        'relative text-sm lg:text-base',
        {'opacity-75': disabled},
      )}>
        <Combobox.Input
          className={clsx(
            'control',
            hasBorder ? 'control-boundary-width' : 'outline-none',
            errorCondition ? 'control-boundary-error' : 'control-boundary-normal',
            className
          )}
          placeholder={placeholder} />
        <div className={'absolute inset-y-0 right-2 flex items-center justify-center'}>
          <Combobox.ClearTrigger className={'combo-box-button'}>
            <HugeiconsIcon className={'size-4'} icon={Cancel01Icon} />
          </Combobox.ClearTrigger>
          <Combobox.Trigger className={'combo-box-button'}>
            <HugeiconsIcon className={'size-5'} icon={ArrowDown01Icon} />
          </Combobox.Trigger>
        </div>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content className={'combo-box-options-container'}>
            {collection.items.map((item, index) => (
              <Combobox.Item key={index} item={item} className={'combo-box-option'}>
                {/* Lợi dụng builtin value */}
                <Combobox.ItemText>
                  {item[displayValueKeyName]}
                </Combobox.ItemText>
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
    {errorCondition && <ControlErrorMessageText className={'mt-2'}>
      {errorMessage}
    </ControlErrorMessageText>}
  </>
}
