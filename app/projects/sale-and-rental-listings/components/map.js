import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import GoogleMap from '@/components/maps/google'
import {Home01Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker, APIProvider} from '@vis.gl/react-google-maps'
import React, {memo, useContext} from 'react'

const Map = memo(({
  listingDtos = []
}) => {

  const {
    listingUpdateType,
    setListingUpdateType
  } = useContext(SaleAndRentalListingsContext)

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
      latKeyName={'lat'}
      longKeyName={'lng'}
      onIdle={onIdle}>
      {/* Render Markers */}
      {listingDtos?.map((_listingDto, _index) => <AdvancedMarker
        key={_index}
        title={_listingDto.title}
        // Format: {lat: number, lng: number}
        position={{lat: _listingDto.lat, lng: _listingDto.lng}}>
        <HugeiconsIcon className={'bg-red-500'} icon={Home01Icon} />
      </AdvancedMarker>)}
    </GoogleMap>
  </APIProvider>
})

export default Map