'use client'
import {APIProvider, Map} from '@vis.gl/react-google-maps'


export default function GoogleMap ({
  apiKey,
  mapId,
  defaultZoom = 6,
  defaultCenter = {lat: 38.986, lng: -100.363},
  mapClassName = '',
  gestureHandling = 'greedy',
  children
}) {

  return <APIProvider apiKey={apiKey}>
    <Map
      // onCameraChanged={(e) => console.log(e.detail.zoom)}
      defaultZoom={defaultZoom}
      defaultCenter={defaultCenter}
      // Required for AdvancedMarker
      mapId={mapId}
      className={mapClassName}
      gestureHandling={gestureHandling}>
      {children}
    </Map>
  </APIProvider>
}
