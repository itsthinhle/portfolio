import {getCityNamesByStateId, getStatesIds} from '@/actions/databases/neon'
import {searchListings, validateSearchForm} from '@/actions/projects/sale-and-rental-listings'
import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import PrimaryButton from '@/components/buttons/primary'
import CheckBox from '@/components/check-box'
import UncontrolledComboBox from '@/components/combo-boxes/uncontrolled'
import UncontrolledAndCreatableComboBox from '@/components/combo-boxes/uncontrolled-and-creatable'
import NumberInput from '@/components/inputs/number'
import TextInput from '@/components/inputs/text'
import UncontrolledSelect from '@/components/selects/uncontrolled'
import RangeSlider from '@/components/range-slider/slider'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'

// Separate from the panel to prevent re-rendering the form
// when making an API call to the server and receive the response
// or server error message back
export default function FilterListingsForm({
  className
}) {
  const priceRangeSliderRef = useRef(null)

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
  }

  return <form onSubmit={onFormSubmit} className={className}>
    <RangeSlider ref={priceRangeSliderRef}></RangeSlider>
  </form>
}
