import {getCityNamesByStateId, getStatesIds} from '@/actions/databases/neon'
import {searchListings, validateSearchForm} from '@/actions/projects/sale-and-rental-listings'
import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import {toListingDto} from '@/app/projects/sale-and-rental-listings/utilities'
import PrimaryButton from '@/components/buttons/primary'
import CheckBox from '@/components/check-box'
import UncontrolledComboBox from '@/components/combo-boxes/uncontrolled'
import UncontrolledAndCreatableComboBox from '@/components/combo-boxes/uncontrolled-and-creatable'
import NumberInput from '@/components/inputs/number'
import UncontrolledTextInput from '@/components/inputs/uncontrolled-text'
import UncontrolledSelect from '@/components/selects/uncontrolled'
import ControlLabelText from '@/components/texts/labels/control'
import ControlErrorMessageText from '@/components/texts/messages/control-error'
import statusConstant from '@/constants/statuses'
import clsx from 'clsx'
import React, {useContext, useEffect, useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'

// Separate from the panel to prevent re-rendering the form
// when making an API call to the server and receive the response
// or server error message back
export default function SearchListingsForm({
  className
}) {
  const [controlsErrorMessages, setControlsErrorMessages] = useState({})
  const [serverErrorMessage, setServerErrorMessage] = useState(undefined)
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
    setControlsErrorMessages(_previousState => {
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
      setControlsErrorMessages(searchFormValidation.errors)
      return
    }

    setListingUpdateType(listingUpdateTypeConstant.search)

    searchListings(formData)
      .then(_searchResult => { // searchResult can be an array or object
        if (Array.isArray(_searchResult)) {
          if (_searchResult.length > 0) {
            hideBackdropAndActivePanel()
            setServerErrorMessage(undefined)
            const sortedListingDto = _searchResult.map(_listings => toListingDto(_listings))
              .sort((_listing1, _listing2) => _listing1.price - _listing2.price)
            setListingDtos(sortedListingDto)
            setListingUpdateType(listingUpdateTypeConstant.none)

            return
          }

          // Tell the user there is no results
          setServerErrorMessage('No results found')
        }
        // else: likely an object with error
        else if (_searchResult?.error && _searchResult?.message) {
          // Tell the user the error
          setServerErrorMessage(_searchResult.message)
        }

        setListingUpdateType(listingUpdateTypeConstant.none)
        // Note: setListingUpdateType to none in the map component
      })
  }

  return <form onSubmit={onFormSubmit} className={className}>
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-8 gap-6">
      <div className="sm:col-span-6">
        <ControlLabelText htmlFor={'rentCastApiKey'} className={'mb-2'}>RentCast API key *</ControlLabelText>
        <UncontrolledTextInput
          id="rentCastApiKey"
          name={'rentCastApiKey'}
          onInputChange={_event => removeErrorMessages(['rentCastApiKey'])}
          errorCondition={controlsErrorMessages?.rentCastApiKey}
          errorMessage={controlsErrorMessages?.rentCastApiKey?.errors?.[0]}
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
          errorCondition={controlsErrorMessages?.state
            || controlsErrorMessages?.stateAndZipValidation}
          errorMessage={controlsErrorMessages?.state?.errors?.[0]}
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
          errorCondition={controlsErrorMessages?.city}
          errorMessage={controlsErrorMessages?.city?.errors?.[0]}
          disabled={cities.length === 0}
        />
      </div>

      <div className="sm:col-span-2">
        <ControlLabelText htmlFor={'zipCode'} className={'mb-2'}>Zip</ControlLabelText>
        <UncontrolledTextInput
          id="zipCode"
          name={'zipCode'}
          onInputChange={_event => removeErrorMessages(['zipCode', 'stateAndZipValidation'])}
          errorCondition={
            controlsErrorMessages?.zipCode || controlsErrorMessages?.stateAndZipValidation
          }
          errorMessage={controlsErrorMessages?.zipCode?.errors?.[0]}
        />
      </div>
    </div>

    {controlsErrorMessages?.stateAndZipValidation && <ControlErrorMessageText className={'mt-2'}>
      {controlsErrorMessages.stateAndZipValidation.errors[0]}
    </ControlErrorMessageText>}

    <div className="mt-6 mb-6">
      <ControlLabelText className={'mb-2'}>Property type</ControlLabelText>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
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
          <CheckBox id={'manufactured'} name={'manufactured'} />
          <ControlLabelText htmlFor={'manufactured'} isBold={false}>Manufactured</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'land'} name={'land'} />
          <ControlLabelText htmlFor={'land'} isBold={false}>Land</ControlLabelText>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
      <div>
        <ControlLabelText htmlFor={'bedrooms'} className={'mb-2'}>Bedrooms</ControlLabelText>
        <NumberInput
          id="bedrooms"
          name={'bedrooms'}
          min={0}
          max={100}
          onInputChange={_event => removeErrorMessages(['bedrooms'])}
          errorCondition={controlsErrorMessages?.bedrooms}
          errorMessage={controlsErrorMessages?.bedrooms?.errors?.[0]}
        />
      </div>
      <div>
        <ControlLabelText htmlFor={'bathrooms'} className={'mb-2'}>Bathrooms</ControlLabelText>
        <NumberInput
          id="bathrooms"
          name={'bathrooms'}
          onInputChange={_event => removeErrorMessages(['bathrooms'])}
          errorCondition={controlsErrorMessages?.bathrooms}
          errorMessage={controlsErrorMessages?.bathrooms?.errors?.[0]}
        />
      </div>
    </div>

    <PrimaryButton
      type={'submit'}
      className={'mt-6 w-full'}>
      Search
    </PrimaryButton>

    {serverErrorMessage && <ControlErrorMessageText className={'mt-2 text-center'}>
      {serverErrorMessage}
    </ControlErrorMessageText>}
  </form>
}
