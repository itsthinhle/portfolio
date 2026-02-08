'use client'
import {APIProvider, ColorScheme, Map} from '@vis.gl/react-google-maps'
import {memo} from 'react'


const GoogleMap = memo(({
  apiKey,
  mapId,
  defaultZoom = 6,
  defaultCenter = {lat: 38.986, lng: -100.363},
  mapClassName = '',
  gestureHandling = 'cooperative',
  children
}) => {
  return <APIProvider apiKey={apiKey}>
    <Map
      // onCameraChanged={(e) => console.log(e.detail.zoom)}
      defaultZoom={defaultZoom}
      defaultCenter={defaultCenter}
      // Required for AdvancedMarker
      mapId={mapId}
      className={mapClassName}
      gestureHandling={gestureHandling}
      colorScheme={ColorScheme.FOLLOW_SYSTEM}>
      {children}
    </Map>
  </APIProvider>
})

export default GoogleMap
