import SearchListingsForm from '@/app/projects/sale-and-rental-listings/components/forms/search-listings'
import Modal from '@/components/modal'
import ModalHeadingText from '@/components/texts/headings/modal'
import clsx from 'clsx'
import React, {memo, useEffect, useState} from 'react'

export default function SearchListingsPanel({
  ref,
  className
}) {
  const [serverError, setServerError] = useState('')

  // Or a custom loading skeleton component
  return <Modal
    ref={ref}
    className={clsx(
      `hidden min-w-sm w-full sm:max-w-lg max-h-full overflow-y-auto ${className}`
    )}>
    <ModalHeadingText className={'mb-6'}>Search</ModalHeadingText>
    <SearchListingsForm />
  </Modal>
}
