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
import ControlLabelText from '@/components/texts/labels/control'
import ControlErrorMessageText from '@/components/texts/messages/control-error'
import statusConstant from '@/constants/status'
import clsx from 'clsx'
import React, {useContext, useEffect, useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'

// Separate from the panel to prevent re-rendering the form
// when making an API call to the server and receive the response
// or server error message back
export default function SearchListingsForm({
  className
}) {
  const [controlsErrors, setControlsErrors] = useState({})
  const [stateIds, setStateIds] = useState([])
  const [cities, setCities] = useState([])
  const [cityKey, setCityKey] = useState(0)

  const {
    setListingDtos,
    setListingUpdateType,
    hideBackdropAndActivePanel
  } = useContext(SaleAndRentalListingsContext)

  useEffect(() => {
    // Get states when the component first loaded
    getStatesIds()
      .then(_stateIds=>
        setStateIds(_stateIds)
      )
  }, [])

  /* Update error fields */
  const removeErrorMessages = useDebouncedCallback((_fields = []) => {
    setControlsErrors(_previousState => {
      const newState = { ..._previousState }

      _fields.forEach(_field => {
        newState[_field] = undefined
      })

      return newState
    })
  }, 250)

  const onStateOptionChange = (_option) => {
    removeErrorMessages(['state', 'stateAndZipValidation'])
    setCityKey((_key) => _key + 1) // To rerender the city combobox

    // Update cities based on the new state
    if (_option) {
      getCityNamesByStateId(_option[0])
        .then(newCities => setCities(newCities))
    } else {
      setCities([])
    }
  }

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())
    // Object.fromEntries: convert Form object to JS object
    const searchFormValidation = await validateSearchForm(formData)

    if (searchFormValidation.status === statusConstant.error) {
      setControlsErrors(searchFormValidation.errors)

      return
    }

    setListingUpdateType(listingUpdateTypeConstant.search)
    hideBackdropAndActivePanel()

    searchListings(formData)
      .then(_listingDtos => {
        setListingDtos(_listingDtos)
        // Note: setListingUpdateType to none in the map component
      })
  }

  return <form onSubmit={onFormSubmit} className={className}>
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-8 gap-6">
      <div className="sm:col-span-6">
        <ControlLabelText htmlFor={'rentCastApiKey'} className={'mb-2'}>RentCast API key *</ControlLabelText>
        <TextInput
          id="rentCastApiKey"
          name={'rentCastApiKey'}
          onInputChange={_event => removeErrorMessages(['rentCastApiKey'])}
          errorCondition={controlsErrors?.rentCastApiKey}
          errorMessage={controlsErrors?.rentCastApiKey?.errors?.[0]}
        />
      </div>

      <div className="sm:col-span-2">
        <ControlLabelText htmlFor={'listingFor'} className={'mb-2'}>Listings for</ControlLabelText>
        <UncontrolledSelect
          id={'listingFor'}
          name={'listingFor'}
          options={[{listingFor: 'Sale'}, {listingFor: 'Rent'}]}
          displayValueKeyName={'listingFor'}
          defaultValue={['Sale']}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-8 gap-6">
      <div className="sm:col-span-2">
        <ControlLabelText htmlFor={'state'} className={'mb-2'}>State</ControlLabelText>
        <UncontrolledComboBox
          id={'state'}
          name={'state'}
          options={stateIds}
          displayValueKeyName={'id'}
          onOptionChange={onStateOptionChange}
          errorCondition={controlsErrors?.state || controlsErrors?.stateAndZipValidation}
          errorMessage={controlsErrors?.state?.errors?.[0]}
        />
      </div>
      
      <div className="sm:col-span-4">
        <ControlLabelText
          htmlFor={'city'}
          className={clsx(
            'mb-2',
            {'opacity-75 select-none': cities.length === 0}
          )}>City</ControlLabelText>
        <UncontrolledAndCreatableComboBox
          key={cityKey}
          id={'city'}
          name={'city'}
          placeholder={'Search cities by state'}
          options={cities}
          displayValueKeyName={'city'}
          onOptionChange={(_option) => removeErrorMessages(['city'])}
          errorCondition={controlsErrors?.city}
          errorMessage={controlsErrors?.city?.errors?.[0]}
          disabled={cities.length === 0}
        />
      </div>

      <div className="sm:col-span-2">
        <ControlLabelText htmlFor={'zipCode'} className={'mb-2'}>Zip</ControlLabelText>
        <TextInput
          id="zipCode"
          name={'zipCode'}
          onInputChange={_event => removeErrorMessages(['zipCode', 'stateAndZipValidation'])}
          errorCondition={controlsErrors?.zipCode || controlsErrors?.stateAndZipValidation}
          errorMessage={controlsErrors?.zipCode?.errors?.[0]}
        />
      </div>
    </div>

    {controlsErrors?.stateAndZipValidation && <ControlErrorMessageText className={'mt-2'}>
      {controlsErrors.stateAndZipValidation.errors[0]}
    </ControlErrorMessageText>}

    <div className="mt-6 mb-6">
      <ControlLabelText className={'mb-2'}>Property type</ControlLabelText>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
        <div className="flex gap-3">
          <CheckBox id={'singleFamily'} name={'singleFamily'} />
          <ControlLabelText htmlFor={'singleFamily'} isBold={false}>Single Family</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'multiFamily'} name={'multiFamily'} />
          <ControlLabelText htmlFor={'multiFamily'} isBold={false}>Multi-Family</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'condo'} name={'condo'} />
          <ControlLabelText htmlFor={'condo'} isBold={false}>Condo</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'townhouse'} name={'townhouse'} />
          <ControlLabelText htmlFor={'townhouse'} isBold={false}>Townhouse</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'apartment'} name={'apartment'} />
          <ControlLabelText htmlFor={'apartment'} isBold={false}>Apartment</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'manufactured'} name={'manufactured'} defaultChecked={false} />
          <ControlLabelText htmlFor={'manufactured'} isBold={false}>Manufactured</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'land'} name={'land'} defaultChecked={false} />
          <ControlLabelText htmlFor={'land'} isBold={false}>Land</ControlLabelText>
        </div>
      </div>
    </div>

    <div className="mb-6 grid grid-cols-2 gap-6">
      <div>
        <ControlLabelText htmlFor={'bedrooms'} className={'mb-2'}>Bedrooms</ControlLabelText>
        <NumberInput
          id="bedrooms"
          name={'bedrooms'}
          min={0}
          max={100}
          onInputChange={_event => removeErrorMessages(['bedrooms'])}
          errorCondition={controlsErrors?.bedrooms}
          errorMessage={controlsErrors?.bedrooms?.errors?.[0]}
        />
      </div>
      <div>
        <ControlLabelText htmlFor={'bathrooms'} className={'mb-2'}>Bathrooms</ControlLabelText>
        <NumberInput
          id="bathrooms"
          name={'bathrooms'}
          onInputChange={_event => removeErrorMessages(['bathrooms'])}
          errorCondition={controlsErrors?.bathrooms}
          errorMessage={controlsErrors?.bathrooms?.errors?.[0]}
        />
      </div>
    </div>
    <PrimaryButton
      type={'submit'}
      className={'w-full'}>
      Search
    </PrimaryButton>
  </form>
}
