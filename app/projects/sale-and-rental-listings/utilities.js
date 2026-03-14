import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/property-type'
import {
  ApartmentIcon,
  Building02Icon,
  DuplexIcon,
  Home09Icon,
  House01Icon, Leaf01Icon,
  Settings01Icon
} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import React, {useCallback} from 'react'

export const toListingDto = (listing) => {
  const result = {
    fullAddress: listing.formattedAddress,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.propertyType,
    listingType: listing.listingType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    livingArea: listing.squareFootage,
    lotArea: listing.lotSize,
    yearBuilt: listing.yearBuilt,
    price: listing.price,
    daysOnMarket: listing.daysOnMarket,
    status: listing.status
  }

  if (listing.hoa) {
    result.hoaFee = listing.hoa.fee
  }

  if (listing.listingOffice) {
    result.listingOfficeName = listing.listingOffice.name
    result.listingOfficePhone = listing.listingOffice.phone
    result.listingOfficeEmail = listing.listingOffice.email
  }

  if (listing.listingAgent) {
    result.listingAgentName = listing.listingAgent.name
    result.listingAgentPhone = listing.listingAgent.phone
    result.listingAgentEmail = listing.listingAgent.email
  }

  if (listing.history) {
    result.history = Object.entries(listing.history).map(([_date, _event]) => {
      return {
        date: _date,
        event: _event.event,
        price: _event.price,
        daysOnMarket: _event.daysOnMarket
      }
    })
  }

  return result
}

export const getMinAndMaxOfLivingAndLotAreas = (
  _listingDtos
) => {
  return _listingDtos.reduce((_result, _listingDto) => {
    if (_listingDto.livingArea < _result.minLivingArea) {
      _result.minLivingArea = _listingDto.livingArea
    }
    if (_listingDto.livingArea > _result.maxLivingArea) {
      _result.maxLivingArea = _listingDto.livingArea
    }
    if (_listingDto.lotArea < _result.minLotArea) {
      _result.minLotArea = _listingDto.lotArea
    }
    if (_listingDto.lotArea > _result.maxLotArea) {
      _result.maxLotArea = _listingDto.lotArea
    }

    return _result
  }, {
    minLivingArea: _listingDtos[0].livingArea ?? Number.POSITIVE_INFINITY,
    maxLivingArea: _listingDtos[0].livingArea ?? Number.NEGATIVE_INFINITY,
    minLotArea: _listingDtos[0].lotArea ?? Number.POSITIVE_INFINITY,
    maxLotArea: _listingDtos[0].lotArea ?? Number.NEGATIVE_INFINITY
  })
}

const getListingIconBackgroundColorByPropertyType = (_propertyType) => {
  switch (_propertyType) {
    case propertyTypeConstant.singleFamily:
      return 'bg-red-600'
    case propertyTypeConstant.multiFamily:
      return 'bg-fuchsia-600'
    case propertyTypeConstant.townhouse:
      return 'bg-yellow-500'
    case propertyTypeConstant.condo:
      return 'bg-sky-600'
    case propertyTypeConstant.apartment:
      return 'bg-slate-600'
    case propertyTypeConstant.manufactured:
      return 'bg-orange-600'
    default: // land
      return 'bg-green-600' // ''
  }
}

const getListingIconByPropertyType = (_propertyType) => {
  switch (_propertyType) {
    case propertyTypeConstant.singleFamily:
      return Home09Icon //
    case propertyTypeConstant.multiFamily:
      return DuplexIcon //
    case propertyTypeConstant.townhouse:
      return House01Icon //
    case propertyTypeConstant.condo:
      return Building02Icon //
    case propertyTypeConstant.apartment:
      return ApartmentIcon //
    case propertyTypeConstant.manufactured:
      return Settings01Icon //
    default: // land
      return Leaf01Icon //
  }
}

export const renderListingIconByPropertyType = (_propertyType) => {
  return <div className={clsx([
    'flex items-center justify-center rounded-full p-1.5 text-light',
    getListingIconBackgroundColorByPropertyType(_propertyType)
  ])}>
    {<HugeiconsIcon
      icon={getListingIconByPropertyType(_propertyType)}
      className={'size-5 lg:size-6'} />}
  </div>
}