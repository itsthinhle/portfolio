import GoogleMap from '@/components/maps/google'
import BoundaryFit from '@/components/maps/google/boundary-fit'
import {Home01Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker} from '@vis.gl/react-google-maps'
import React, {memo} from 'react'

const Map = memo(({
  googleMapApiKey,
  googleMapId,
  listingDtos = []
}) => {
  console.log('map rendered')
  // Or a custom loading skeleton component
  return <GoogleMap
    apiKey={googleMapApiKey}
    mapId={googleMapId}
    mapClassName={'w-full h-full z-5'}>
    {/* Render markers */}
    {listingDtos?.map((_listingDto, _index) => <AdvancedMarker
      key={_index}
      title={_listingDto.title}
      // Format: {lat: number, lng: number}
      position={{lat: _listingDto.lat, lng: _listingDto.lng}}>
      <HugeiconsIcon className={'bg-red-500'} icon={Home01Icon} />
    </AdvancedMarker>)}
    <BoundaryFit
      locations={listingDtos}
      latitudeKeyName={'lat'}
      longitudeKeyName={'lng'} />
  </GoogleMap>
})

export default Map