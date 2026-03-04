import FilterListingsForm from '@/app/projects/sale-and-rental-listings/components/forms/filter-listings'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import Modal from '@/components/modal'
import ModalHeadingText from '@/components/texts/headings/modal'
import {Cancel01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import React, {memo, useContext} from 'react'

const FilterListingsPanel = memo(({
  ref,
  className
}) => {
  const {
    hideBackdropAndActivePanel
  } = useContext(SaleAndRentalListingsContext)
  
  return <Modal
    ref={ref}
    className={`hidden w-full sm:max-w-xl max-h-full overflow-y-auto ${className}`}>
    <div className={'flex justify-between mb-6'}>
      <ModalHeadingText>Filter</ModalHeadingText>
      <button
        className={'cursor-pointer text-center'}
        onClick={(_event) => {
          _event.stopPropagation()
          hideBackdropAndActivePanel()
        }}>
        <HugeiconsIcon className={'size-6'} icon={Cancel01Icon} />
      </button>
    </div>

    <FilterListingsForm />
  </Modal>
})

export default FilterListingsPanel
