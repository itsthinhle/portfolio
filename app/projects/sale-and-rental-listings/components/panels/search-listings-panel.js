import SearchListingsForm from '@/app/projects/sale-and-rental-listings/components/forms/search-listings'
import Modal from '@/components/modal'
import ModalHeadingText from '@/components/texts/headings/modal'
import clsx from 'clsx'
import React, {memo} from 'react'

const SearchListingsPanel = memo(({
  ref,
  className
}) => {
  return <Modal
    ref={ref}
    className={clsx(
      `hidden min-w-sm w-full sm:max-w-lg max-h-full overflow-y-auto ${className}`
    )}>
    <ModalHeadingText className={'mb-6'}>Search</ModalHeadingText>
    <SearchListingsForm />
  </Modal>
})

export default SearchListingsPanel
