import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import {renderListingIconByPropertyType} from '@/app/projects/sale-and-rental-listings/utilities'
import GoogleMap from '@/components/maps/google'
import {toCurrencyFormat} from '@/utilities/number'
import {formatPhoneNumber} from '@/utilities/phone-number'
import {useMap} from '@vis.gl/react-google-maps'
import {
  Cancel01Icon
} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import {AdvancedMarker} from '@vis.gl/react-google-maps'
import clsx from 'clsx'
import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'


const Map = memo(({
  listingDtos = []
}) => {
  const [selectedListingDto, setSelectedListingDto] = useState(undefined)
  const [listingInfoPopupSize, setListingInfoPopupSize] = useState({ width: 0, height: 0 })
  const listingInfoPopupRef = useRef(null)
  const map = useMap()

  const {
    listingUpdateType,
    setListingUpdateType
  } = useContext(SaleAndRentalListingsContext)

  const onIdle = () => {
    if (listingUpdateType !== listingUpdateTypeConstant.none) {
      setListingUpdateType(listingUpdateTypeConstant.none)
    }
  }

  useEffect(() => {
    setSelectedListingDto(undefined)
  }, [listingDtos])

  useEffect(() => {
    if (!map || !selectedListingDto) return

    // shift the center of the map view to a specific geographical coordinate
    // without changing the zoom level
    map.panTo({
      lat: selectedListingDto?.latitude,
      lng: selectedListingDto?.longitude
    })

    map.panBy(0, -map.getDiv().clientHeight / 6)

  }, [selectedListingDto])

  // fires before the browser repaints the screen
  useEffect(() => {
    if (!listingInfoPopupRef.current) return

    setListingInfoPopupSize({
      width: listingInfoPopupRef.current.offsetWidth,
      height: listingInfoPopupRef.current.offsetHeight
    })

  }, [selectedListingDto])

  const markers = useMemo(() => {
    return listingDtos?.map((_listingDto, _index) => <AdvancedMarker
      key={_index}
      title={_listingDto.title}
      // Format: {lat: number, lng: number}
      position={{lat: _listingDto.latitude, lng: _listingDto.longitude}}
      onClick={() => setSelectedListingDto(_listingDto)}>
      {renderListingIconByPropertyType(_listingDto.propertyType)}
    </AdvancedMarker>)
  }, [listingDtos])

  return <GoogleMap
    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
    mapClassName={'w-full h-full'}
    locations={listingDtos}
    latKeyName={'latitude'}
    longKeyName={'longitude'}
    onIdle={onIdle}>
    {/* Render Markers */}
    {markers}

    <AdvancedMarker
      ref={listingInfoPopupRef}
      className={clsx(
        'bg-white max-w-sm px-3 py-2 rounded-md relative',
        'text-xs lg:text-sm text-dark',
        'after:content-[""] after:absolute',
        'after:left-1/2 after:-translate-x-1/2 after:top-full',
        'after:border-8 after:border-transparent after:border-t-white')}
      position={selectedListingDto ? {
        lat: selectedListingDto.latitude,
        lng: selectedListingDto.longitude
      }: undefined}
      anchorTop={`-${listingInfoPopupSize.height + 48}px`}
      zIndex={selectedListingDto ? 501 : -1} // max 500 items in total
    >
      <div className={'flex justify-between mb-2'}>
        <p className={'font-medium'}>{selectedListingDto?.propertyType}</p>
        <button
          className={'cursor-pointer text-center'}
          onClick={(_event) => {
            _event.stopPropagation()
            setSelectedListingDto(null)
          }}>
          <HugeiconsIcon className={'size-4'} icon={Cancel01Icon} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-0.5">
        <p className={'col-span-2'}>
          <span className={'font-semibold'}>Address</span>: {selectedListingDto?.fullAddress}
        </p>
        <p className={'col-span-2'}>
          <span className={'font-semibold'}>Price</span>: {toCurrencyFormat(selectedListingDto?.price)}
        </p>
        <p>
          <span className={'font-semibold'}>Bedrooms</span>: {selectedListingDto?.bedrooms ?? 'N/A'}
        </p>
        <p>
          <span className={'font-semibold'}>Bathrooms</span>: {selectedListingDto?.bathrooms ?? 'N/A'}
        </p>
        <p>
          <span className={'font-semibold'}>Living area</span>: {selectedListingDto?.livingArea ?? 'N/A'}
        </p>
        <p>
          <span className={'font-semibold'}>Lot area</span>: {selectedListingDto?.lotArea ?? 'N/A'}
        </p>
        <p className={'col-span-2'}>
          <span className={'font-semibold'}>HOA fee</span>: {selectedListingDto?.hoaFee ?? 'N/A'}
        </p>
        <p className={'col-span-2'}>
          <span className={'font-semibold'}>Agent company</span>: {selectedListingDto?.listingOfficeName ?? 'N/A'}
        </p>
        <p className={'col-span-2'}>
          <span
            className={'font-semibold'}>Agent contact</span>:  {
            !selectedListingDto?.listingAgentName || selectedListingDto?.listingAgentPhone
              ? 'N/A'
              : `${selectedListingDto?.listingAgentName}, ${formatPhoneNumber(selectedListingDto?.listingAgentPhone)}`
          }
        </p>
      </div>
    </AdvancedMarker>
  </GoogleMap>
})

export default Map