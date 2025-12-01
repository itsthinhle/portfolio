import {useMap} from '@vis.gl/react-google-maps'
import {useEffect} from 'react'

export default function BoundaryFit({
  locations,
  latitudeKeyName,
  longitudeKeyName,
}) {
  const map = useMap()

  // Adjust the map view to fit all the markers
  useEffect(() => {
    if (!map || !locations) return

    const bounds = new window.google.maps.LatLngBounds()
    locations.forEach(_location => bounds.extend({
      lat: _location[latitudeKeyName], lng: _location[longitudeKeyName]
    }))

    map.fitBounds(bounds)
  }, [
    latitudeKeyName,
    locations,
    longitudeKeyName,
    map
  ])

  return <></>
}
