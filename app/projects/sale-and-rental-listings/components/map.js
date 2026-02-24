import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/propertyType'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import GoogleMap from '@/components/maps/google'
import {formatPhoneNumber} from '@/utilities/phone-number'
import {useMap} from '@vis.gl/react-google-maps'
import {
  Building02Icon,
  Settings01Icon,
  Leaf01Icon,
  DuplexIcon,
  ApartmentIcon,
  House01Icon,
  Home09Icon
} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker} from '@vis.gl/react-google-maps'
import clsx from 'clsx'
import React, {memo, useCallback, useContext, useEffect, useMemo, useState} from 'react'


const Map = memo(({
  listingDtos = []
}) => {
  const [selectedListingDto, setSelectedListingDto] = useState(undefined)
  const map = useMap()
  
  const {
    listingUpdateType,
    setListingUpdateType
  } = useContext(SaleAndRentalListingsContext)

  const getListingIconBackgroundColor = (_propertyType) => {
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

  const getListingIcon = (_propertyType) => {
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
  const renderListingIcon = useCallback((_locationDto) => {
    return <div className={clsx([
      'flex items-center justify-center rounded-full p-1.5 text-light',
      getListingIconBackgroundColor(_locationDto.propertyType)
    ])}>
      {<HugeiconsIcon
        icon={getListingIcon(_locationDto.propertyType)}
        className={'size-5 lg:size-6'} />}
    </div>
  }, [])

  const onIdle = () => {
    if (listingUpdateType !== listingUpdateTypeConstant.none) {
      setListingUpdateType(listingUpdateTypeConstant.none)
    }
  }

  useEffect(() => {
    if (!map || !selectedListingDto) return

    // shift the center of the map view to a specific geographical coordinate
    // without changing the zoom level
    map.panTo({
      lat: selectedListingDto.latitude,
      lng: selectedListingDto.longitude
    })

  }, [selectedListingDto, map])

  const markers = useMemo(() => {
    console.log('markers created')
    return listingDtos?.map((_listingDto, _index) => <AdvancedMarker
      key={_index}
      title={_listingDto.title}
      // Format: {lat: number, lng: number}
      position={{lat: _listingDto.latitude, lng: _listingDto.longitude}}
      onClick={() => setSelectedListingDto(_listingDto)}>
      {renderListingIcon(_listingDto)}
    </AdvancedMarker>)
  }, [listingDtos, renderListingIcon])

  return <GoogleMap
    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
    mapClassName={'w-full h-full'}
    locations={listingDtos}
    latKeyName={'latitude'}
    longKeyName={'longitude'}
    onIdle={onIdle}>
    {/* Render Markers */}
    {markers}

    {selectedListingDto && (
      <AdvancedMarker
        className={clsx(
          'bg-white max-w-sm px-3 py-2 rounded-md',
          'text-xs lg:text-sm text-dark',
          'transform -translate-y-11.5 relative',
          'after:content-[""] after:absolute',
          'after:left-1/2 after:-translate-x-1/2 after:top-full',
          'after:border-8 after:border-transparent after:border-t-white')}
        position={{
          lat: selectedListingDto.latitude,
          lng: selectedListingDto.longitude
        }}
        zIndex={501}
      >
        <div className={'flex justify-between'}>
          <p className={'font-medium mb-2'}>{selectedListingDto.propertyType}</p>
          <button
            className={'cursor-pointer'}
            onClick={(_event) => {
              _event.stopPropagation()
              setSelectedListingDto(null)
            }}>
            X
          </button>
        </div>
        <div className="grid grid-cols-2 gap-y-0.5">
          {selectedListingDto.fullAddress && <p className={'col-span-2'}>
            <span className={'font-semibold'}>Address</span>: {selectedListingDto.fullAddress}
          </p>}
          {selectedListingDto.price !== undefined && <p className={'col-span-2'}>
            <span className={'font-semibold'}>Price</span>: ${selectedListingDto.price.toLocaleString()}
          </p>}
          {selectedListingDto.bedrooms !== undefined && <p>
            <span className={'font-semibold'}>Bedrooms</span>: {selectedListingDto.bedrooms}
          </p>}
          {selectedListingDto.bathrooms !== undefined && <p>
            <span className={'font-semibold'}>Bathrooms</span>: {selectedListingDto.bathrooms}
          </p>}
          {selectedListingDto.livingArea !== undefined && <p>
            <span className={'font-semibold'}>Living area</span>: {selectedListingDto.livingArea}
          </p>}
          {selectedListingDto.lotArea !== undefined && <p>
            <span className={'font-semibold'}>Lot area</span>: {selectedListingDto.lotArea}
          </p>}
          {selectedListingDto.hoaFee !== undefined && <p className={'col-span-2'}>
            <span className={'font-semibold'}>HOA fee</span>: {selectedListingDto.hoaFee}
          </p>}
          {selectedListingDto.listingOfficeName && <p className={'col-span-2'}>
            <span className={'font-semibold'}>Agent company</span>: {selectedListingDto.listingOfficeName}
          </p>}
          {selectedListingDto.listingAgentName && <p className={'col-span-2'}>
            <span
              className={'font-semibold'}>Agent contact</span>: {selectedListingDto.listingAgentName}, {formatPhoneNumber(selectedListingDto.listingAgentPhone) ?? 'Unknown agent phone number'}
          </p>}
        </div>
      </AdvancedMarker>
    )}
  </GoogleMap>
})

export default Map