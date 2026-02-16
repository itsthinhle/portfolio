import Modal from '@/components/modal'
import ModalHeadingText from '@/components/texts/headings/modal'
import React, {memo} from 'react'

const FilterListingsPanel = memo(({
  ref,
  className
}) => {
  // Or a custom loading skeleton component
  return <Modal
    ref={ref}
    className={`hidden w-full sm:max-w-lg max-h-full overflow-y-auto ${className}`}>
    <ModalHeadingText>Filter panel</ModalHeadingText>
  </Modal>
})

export default FilterListingsPanel
