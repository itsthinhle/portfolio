import ControlErrorMessageText from '@/components/texts/messages/control-error'
import {hasExactMatchOption} from '@/utilities/ark-ui/list-collection'
import { Combobox, useListCollection } from '@ark-ui/react/combobox'
import { useFilter } from '@ark-ui/react/locale'
import { Portal } from '@ark-ui/react/portal'
import {ArrowDown01Icon, Cancel01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import React, {useEffect, useState} from 'react'
import { flushSync } from 'react-dom'

const NEW_OPTION_VALUE = '[[new]]'


/**
 * By default, the combobox collection expects an array of objects
 * with `label` and `value` properties
 *
 * Option có thể có value hoặc không. option.value thường dùng để
 * tạo option mới (xem mục creatable trên arkui website)
 *
 * @param options Must be an array of objects
 * @param displayValueKeyName The key name to display value of an option as object
 */
export default function UncontrolledAndCreatableComboBox({
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
  className,
}) {
  const [inputValue, setInputValue] = useState('')
  const [option, setOption] = useState([]) // option is an aray :)
  const { contains } = useFilter({ sensitivity: 'base' })

  const { collection, filter, upsert, update, remove, set } = useListCollection({
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

  // To actually add the option to the list officially
  // its value is not NEW_OPTION_VALUE anymore
  const setInputValueAsOption = (_option, _inputValue) => {
    return _option.map((v) => (v === NEW_OPTION_VALUE ? _inputValue : v))
  }

  const onInputValueChange = ({ inputValue, reason }) => {
    if (reason === 'input-change' || reason === 'item-select') {
      flushSync(() => {
        if (inputValue.trim().length > 0
          && !hasExactMatchOption(collection, inputValue)) {
          const newOption = {
            [displayValueKeyName]: inputValue,
            // Tricky 'value' key to apply builtin methods like upsert, remove
            value: NEW_OPTION_VALUE
          }
          // Update, else insert new record
          upsert(NEW_OPTION_VALUE, newOption)
        } else if (inputValue.trim().length === 0) {
          remove(NEW_OPTION_VALUE)
        }
      })
      filter(inputValue)
    }
    setInputValue(inputValue)
  }

  const onOpenChange = ({ reason }) => {
    if (reason === 'trigger-click') {
      filter('')
    }
  }

  const onInternalOptionChange = ({ value }) => {
    setOption(setInputValueAsOption(value, inputValue))
    if (value.includes(NEW_OPTION_VALUE)) {
      const updatedOption = {
        [displayValueKeyName]: inputValue,
        value: inputValue, __new__: true }
      // At this step, there will be no option with value: NEW_OPTION_VALUE
      update(NEW_OPTION_VALUE, updatedOption)
    }

    onOptionChange?.(value)
  }

  return <>
    <Combobox.Root
      id={id}
      name={name}
      collection={collection}
      onInputValueChange={onInputValueChange}
      defaultInputValue={defaultValue}
      onOpenChange={onOpenChange}
      value={option}
      onValueChange={onInternalOptionChange}
      allowCustomValue
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
                {item?.value === NEW_OPTION_VALUE ? (
                  <Combobox.ItemText>+ Create &#34;{item[displayValueKeyName]}&#34;</Combobox.ItemText>
                ) : (
                  <Combobox.ItemText>
                    {item[displayValueKeyName]} {item.__new__ ? '(new)' : ''}
                  </Combobox.ItemText>
                )}
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
