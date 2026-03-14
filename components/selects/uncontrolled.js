import ControlErrorMessageText from '@/components/texts/messages/control-error'
import { Portal } from '@ark-ui/react/portal'
import { Select, createListCollection } from '@ark-ui/react/select'
import {ArrowDown01Icon, Cancel01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import React from 'react'


export default function UncontrolledSelect({
  id,
  name,
  options = [],
  displayValueKeyName = 'label',
  defaultValue = [''],
  hasBorder = true,
  className
}) {
  const collection = createListCollection({
    items: options,
    itemToString: (_option) => _option?.[displayValueKeyName],
    itemToValue: (_option) => {
      if (_option?.value) {
        return _option.value
      }

      return _option?.[displayValueKeyName]
    },
  })

  return <Select.Root
    id={id}
    name={name}
    collection={collection}
    defaultValue={defaultValue}
  >
    <Select.Control className={clsx(
      'text-sm lg:text-base relative',
    )}>
      {/* Button */}
      <Select.Trigger className={clsx(
        'select text-left select-boundary-normal',
        hasBorder ? 'control-boundary-width' : 'outline-none',
        className
      )}>
        <Select.ValueText />
      </Select.Trigger>
      {/* Nút kiểng */}
      <div className={'absolute inset-y-0 right-2 flex items-center justify-center pointer-events-none'}>
        <Select.Indicator>
          <HugeiconsIcon className={'size-5'} icon={ArrowDown01Icon} />
        </Select.Indicator>
      </div>
    </Select.Control>
    <Portal>
      <Select.Positioner>
        {/* --reference-width: provided by arkui */}
        <Select.Content className={'combo-box-options-container min-w-(--reference-width)'}>
          {collection.items.map((_option, _index) => (
            <Select.Item key={_index} item={_option} className={'combo-box-option'}>
              <Select.ItemText>{_option[displayValueKeyName]}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Portal>
    <Select.HiddenSelect />
  </Select.Root>
}