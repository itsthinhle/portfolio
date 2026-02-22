'use client'
import {ColorScheme, Map, useMap} from '@vis.gl/react-google-maps'
import {memo, useEffect} from 'react'

// Note: APIProvider must be placed outside of this component
// for the useMap hook to run
const GoogleMap = memo(({
  mapId,
  defaultZoom = 6,
  defaultCenter = {lat: 38.986, lng: -100.363},
  mapClassName = '',
  gestureHandling = 'cooperates',
  onIdle,
  children,
  locations = [],
  latKeyName = 'test',
  longKeyName='test',
}) => {
  const map = useMap()

  useEffect(() => {
    if (map && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()

      locations.forEach(_location => bounds.extend({
        lat: _location[latKeyName], lng: _location[longKeyName]
      }))

      map.fitBounds(bounds)
    }
  }, [map, locations, latKeyName, longKeyName])

  return <Map
    // onCameraChanged={(e) => console.log(e.detail.zoom)}
    defaultZoom={defaultZoom}
    defaultCenter={defaultCenter}
    // Required for AdvancedMarker
    mapId={mapId}
    className={mapClassName}
    gestureHandling={gestureHandling}
    colorScheme={ColorScheme.FOLLOW_SYSTEM}
    onIdle={onIdle}>
    {children}
  </Map>

})

export default GoogleMap
