import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/propertyType'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import GoogleMap from '@/components/maps/google'
import {
  RealEstate02Icon,
  Settings01Icon,
  Leaf01Icon,
  DuplexIcon,
  ApartmentIcon,
  House01Icon,
  House04Icon
} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker, APIProvider} from '@vis.gl/react-google-maps'
import clsx from 'clsx'
import React, {memo, useContext} from 'react'

const Map = memo(({
  listingDtos = []
}) => {
  const {
    listingUpdateType,
    setListingUpdateType
  } = useContext(SaleAndRentalListingsContext)

  const getListingIconBackgroundColor = (_propertyType) => {
    switch (_propertyType) {
      case propertyTypeConstant.singleFamily:
        return 'bg-pink-300 dark:bg-pink-600'
      case propertyTypeConstant.multiFamily:
        return 'bg-amber-300 dark:bg-amber-600'
      case propertyTypeConstant.townhouse:
        return 'bg-purple-300 dark:bg-purple-600'
      case propertyTypeConstant.condo:
        return 'bg-sky-300 dark:bg-sky-600'
      case propertyTypeConstant.apartment:
        return 'bg-emerald-300 dark:bg-emerald-600'
      case propertyTypeConstant.manufactured:
        return 'bg-slate-300 dark:bg-slate-600'
      default: // land
        return 'bg-stone-300 dark:bg-stone-600'
    }
  }

  const getListingIcon = (_propertyType) => {
    switch (_propertyType) {
      case propertyTypeConstant.singleFamily:
        return House04Icon //
      case propertyTypeConstant.multiFamily:
        return DuplexIcon //
      case propertyTypeConstant.townhouse:
        return House01Icon //
      case propertyTypeConstant.condo:
        return RealEstate02Icon //
      case propertyTypeConstant.apartment:
        return ApartmentIcon //
      case propertyTypeConstant.manufactured:
        return Settings01Icon //
      default: // land
        return Leaf01Icon //
    }
  }

  const renderListingIcon = (_locationDto) => {
    return <div className={clsx([
      'flex items-center justify-center rounded-full p-1.5 text-gray-600 dark:text-gray-200',
      getListingIconBackgroundColor(_locationDto.propertyType)
    ])}>
      {<HugeiconsIcon
        icon={getListingIcon(_locationDto.propertyType)}
        className={'size-5 lg:size-6'} />}
    </div>

  }

  const onIdle = () => {
    if (listingUpdateType !== listingUpdateTypeConstant.none) {
      setListingUpdateType(listingUpdateTypeConstant.none)
    }
  }

  return <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}>
    <GoogleMap
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
      mapClassName={'w-full h-full'}
      locations={listingDtos}
      latKeyName={'latitude'}
      longKeyName={'longitude'}
      onIdle={onIdle}>
      {/* Render Markers */}
      {listingDtos?.map((_listingDto, _index) => <AdvancedMarker
        key={_index}
        title={_listingDto.title}
        // Format: {lat: number, lng: number}
        position={{lat: _listingDto.latitude, lng: _listingDto.longitude}}>
        {renderListingIcon(_listingDto)}
      </AdvancedMarker>)}
    </GoogleMap>
  </APIProvider>
})

export default Map