import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/propertyType'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import GoogleMap from '@/components/maps/google'
import {Home01Icon, Home12Icon, Search01Icon} from '@hugeicons-pro/core-stroke-rounded'
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

  const getListingIconBackgroundColorByPrice = (_locationPrice) => {
    switch (_locationPrice) {
      case listingDtos[0].price: // min
        return 'bg-emerald-600'
      case listingDtos[listingDtos.length - 1].price: // max
        return 'bg-red-600'
      default: // 'maximumPrice'
        return 'bg-pink-200'
    }
  }

  const getListingIcon = (_propertyType) => {
    switch (_propertyType) {
      case propertyTypeConstant.singleFamily:
        return Home01Icon
      case propertyTypeConstant.multiFamily:
      case propertyTypeConstant.condo:
      case propertyTypeConstant.townhouse:
      case propertyTypeConstant.apartment:
      case propertyTypeConstant.manufactured:
      default: // land
        return Home01Icon
    }
  }

  const renderListingIcon = (_locationDto) => {
    return <div className={clsx([
      'flex items-center justify-center rounded-full p-1.5 text-white',
      'bg-red-200'
      //getListingIconBackgroundColorByPrice(_locationDto.price)
    ])}>
      {<HugeiconsIcon
        icon={getListingIcon(_locationDto.propertyType)}
        className={'size-6 lg:size-7'} />}
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