import listingTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listing-type'
import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/property-type'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import {getMinAndMaxOfLivingAndLotAreas} from '@/app/projects/sale-and-rental-listings/utilities'
import PrimaryButton from '@/components/buttons/primary'
import CheckBox from '@/components/check-box'
import RangeSlider from '@/components/range-slider/slider'
import ControlLabelText from '@/components/texts/labels/control'
import {toCurrencyFormat, toNearestStep} from '@/utilities/number'
import clsx from 'clsx'
import React, {
  useCallback,
  useContext, useEffect,
  useMemo,
  useState
} from 'react'

// Separate from the panel to prevent re-rendering the form
// when making an API call to the server and receive the response
// or server error message back
export default function FilterListingsForm({
  className
}) {
  const {
    listingDtos,
    setFilteredListingDtos,
    setListingUpdateType,
    hideBackdropAndActivePanel
  } = useContext(SaleAndRentalListingsContext)

  const minPrice = useMemo(() =>
    listingDtos ? toNearestStep(listingDtos[0].price)
    : 0, [listingDtos])
  const maxPrice = useMemo(() =>
    listingDtos
      ? toNearestStep(listingDtos[listingDtos.length - 1].price)
      : 1000, [listingDtos])
  const {
    minLivingArea,
    maxLivingArea,
    minLotArea,
    maxLotArea,
  } = useMemo(() =>
    getMinAndMaxOfLivingAndLotAreas(listingDtos), [listingDtos])

  const [priceRange, setPriceRange] = useState([minPrice, maxPrice])
  const [livingAreaRange, setLivingAreaRange] = useState([minLivingArea, maxLivingArea])
  const [lotAreaRange, setLotAreaRange] = useState([minLotArea, maxLotArea])

  useEffect(() => {
    setPriceRange([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  useEffect(() => {
    setLivingAreaRange([minLivingArea, maxLivingArea])
  }, [minLivingArea, maxLivingArea])

  useEffect(() => {
    setLotAreaRange([minLotArea, maxLotArea])
  }, [minLotArea, maxLotArea])

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
    hideBackdropAndActivePanel()
    setListingUpdateType(listingUpdateTypeConstant.filter)

    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())

    // Get checked property types and listing types
    const checkedPropertyTypes = []
    const checkedListingTypes = []

    Object.entries(formData).forEach(([_key, _value]) => {
      const isPropertyType = _key in propertyTypeConstant
      const isListingType = _key in listingTypeConstant

      // Handle propertyType checkboxes
      if (isPropertyType && _value === 'on') {
        checkedPropertyTypes.push(propertyTypeConstant[_key])
      }

      // Handle listingType checkboxes
      if (isListingType && _value === 'on') {
        checkedListingTypes.push(listingTypeConstant[_key])
      }
    })

    // Special cases: filter form is reset
    if (parseInt(priceRange[0]) === minPrice
      && parseInt(priceRange[1]) === maxPrice
      && checkedPropertyTypes.length === Object.keys(propertyTypeConstant).length
      && checkedListingTypes.length === Object.keys(listingTypeConstant).length
      && parseInt(livingAreaRange[0]) === minLivingArea
      && parseInt(livingAreaRange[1]) === maxLivingArea
      && parseInt(lotAreaRange[0]) === minLotArea
      && parseInt(lotAreaRange[1]) === maxLotArea
    ) {
      setFilteredListingDtos(listingDtos)
      setListingUpdateType(listingUpdateTypeConstant.none)
      return
    }

    // Otherwise apply filter
    const filteredListingDtos = listingDtos.filter(
      (_listingDto) => {
        if (_listingDto.price < priceRange[0]
          || _listingDto.price > priceRange[1]) {
          return false
        }

        if (_listingDto.propertyType
          && !(checkedPropertyTypes.includes(_listingDto.propertyType))) {
          return false
        }

        if (_listingDto.listingType
          && !(checkedListingTypes.includes(_listingDto.listingType))) {
          return false
        }

        if (_listingDto.livingArea
          && (_listingDto.livingArea < livingAreaRange[0]
            || _listingDto.livingArea > livingAreaRange[1])) {
          return false
        }

        if (_listingDto.lotArea
          && (_listingDto.lotArea < lotAreaRange[0]
            || _listingDto.lotArea > lotAreaRange[1])) {
          return false
        }

        return true
      })

    setFilteredListingDtos(filteredListingDtos)
    setListingUpdateType(listingUpdateTypeConstant.none)
  }

  const onPriceRangeSlide = useCallback((_handleValues) => {
    setPriceRange(_handleValues)
  }, [])

  const onLivingAreaRangeSlide = useCallback((_handleValues) => {
    setLivingAreaRange(_handleValues)
  }, [])

  const onLotAreaRangeSlide = useCallback((_handleValues) => {
    setLotAreaRange(_handleValues)
  }, [])

  return <form
    onSubmit={onFormSubmit}
    className={clsx('text-sm lg:text-base', className)}>
    <ControlLabelText
      className={'mb-3.5'}>Price range</ControlLabelText>
    <RangeSlider
      min={minPrice}
      max={maxPrice}
      step={1000}
      onSlide={onPriceRangeSlide}
      className={'mb-3.5'}
    ></RangeSlider>
    <p className={'mb-6'}>{
      toCurrencyFormat(priceRange[0])
    } - {
      toCurrencyFormat(priceRange[1])
    }</p>

    <div className="mb-6">
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

    <div className="mt-6 mb-6">
      <ControlLabelText className={'mb-2'}>Listing type</ControlLabelText>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
        <div className="flex gap-3">
          <CheckBox id={'standard'} name={'standard'} />
          <ControlLabelText htmlFor={'standard'} isBold={false}>Standard</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'newConstruction'} name={'newConstruction'} />
          <ControlLabelText htmlFor={'newConstruction'} isBold={false}>New Construction</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'foreclosure'} name={'foreclosure'} />
          <ControlLabelText htmlFor={'foreclosure'} isBold={false}>Foreclosure</ControlLabelText>
        </div>
        <div className="flex gap-3">
          <CheckBox id={'shortSale'} name={'shortSale'} />
          <ControlLabelText htmlFor={'shortSale'} isBold={false}>Short Sale</ControlLabelText>
        </div>

      </div>
    </div>

    <div className={'grid grid-cols-1 sm:grid-cols-2 gap-6'}>
      <div>
        <ControlLabelText
          className={'mb-3.5'}>Living area</ControlLabelText>
        {minLivingArea !== Number.POSITIVE_INFINITY
          && maxLivingArea !== Number.NEGATIVE_INFINITY
          && minLivingArea !== maxLivingArea
          ? <>
              <RangeSlider
                min={minLivingArea}
                max={maxLivingArea}
                step={100}
                onSlide={onLivingAreaRangeSlide}
                className={'mb-3.5'}
              ></RangeSlider>
              <p>{
                parseInt(livingAreaRange[0]).toLocaleString()
              } - {
                parseInt(livingAreaRange[1]).toLocaleString()
              } sqft</p>
            </>
          : <p className={'italic'}>Data is not available</p>}
      </div>

      <div>
        <ControlLabelText
          className={'mb-3.5'}>Lot area</ControlLabelText>
        {minLotArea !== Number.POSITIVE_INFINITY
          && maxLotArea !== Number.NEGATIVE_INFINITY
          && minLotArea !== maxLotArea
          ? <>
              <RangeSlider
                min={minLotArea}
                max={maxLotArea}
                step={100}
                onSlide={onLotAreaRangeSlide}
                className={'mb-3.5'}
              ></RangeSlider>
              <p>{
                parseInt(lotAreaRange[0]).toLocaleString()
              } - {
                parseInt(lotAreaRange[1]).toLocaleString()
              } sqft</p>
            </>
          : <p className={'italic'}>Data is not available</p>}
      </div>
    </div>

    <PrimaryButton
      type={'submit'}
      className={'mt-6 w-full'}>
      Filter
    </PrimaryButton>
  </form>
}
