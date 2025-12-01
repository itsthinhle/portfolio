'use client'
import GoogleMap from '@/components/maps/google'
import BoundaryFit from '@/components/maps/google/boundary-fit'
import {Home01Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker} from '@vis.gl/react-google-maps'
import {useActionState} from 'react'

export default function MapAndPanels({
  initialListingDtos = []
}) {
  const [listingDtos, action] = useActionState(() => {}, initialListingDtos)
  console.log(listingDtos)

  // Or a custom loading skeleton component
  return <div className={'flex flex-col xl:flex-row'}>
    {/* Panels */}
    <div className={'basis-xs'}>
      <p>a</p>
      <p>a</p>
      <p>a</p>
    </div>
    {/* Google Map */}
    <div className={'rounded-xl overflow-hidden aspect-video 2xl:aspect-4/3 grow'}>
      <GoogleMap
        apiKey={'AIzaSyB7Fo6ScHtkROD9JmzCsgofLbxby_nshZg'}
        mapId={'5ca2440ce3ae6b176d832d83'}>
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
    </div>
  </div>
}