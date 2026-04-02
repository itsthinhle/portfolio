'use client'
import Map from '@/app/projects/sale-and-rental-listings/components/map'
import FilterListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/filter-listings-panel'
import SearchListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/search-listings-panel'
import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import panelConstant from '@/app/projects/sale-and-rental-listings/constants/panel'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/property-type'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import {renderListingIconByPropertyType} from '@/app/projects/sale-and-rental-listings/utilities'
import InGroupButton from '@/components/buttons/in-group'
import LoadingIcon from '@/components/icons/loading'
import Heading2 from '@/components/texts/headings/2'
import NormalText from '@/components/texts/normal'
import {
  Search01Icon,
  FilterHorizontalIcon
} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import {APIProvider} from '@vis.gl/react-google-maps'
import clsx from 'clsx'
import React, {useEffect, useRef, useState} from 'react'

export default function MapSection({
  initialListingDtos = []
}) {
  const [listingDtos, setListingDtos] = useState(initialListingDtos)
  const [filteredListingDtos, setFilteredListingDtos] = useState(initialListingDtos)
  const [listingUpdateType, setListingUpdateType] = useState()

  /* -------------------- Panels -------------------- */
  // Used useRef to not rerender the panels
  const backdropRef = useRef(undefined)
  const searchListingsPanelRef = useRef(null)
  const filterListingsPanelRef = useRef(null)
  const activePanel = useRef(undefined)

  const getPanelByName = (_panelName) => {
    switch (_panelName) {
      case panelConstant.search:
        return searchListingsPanelRef
      default: // 'filter'
        return filterListingsPanelRef
    }
  }

  const showPanelByName = (_panelName) => {
    const panelElement = getPanelByName(_panelName)
    panelElement.current?.classList.remove('hidden')
    activePanel.current = _panelName
  }

  const hidePanelByName = (_panelName) => {
    const panelElement = getPanelByName(_panelName)
    panelElement.current?.classList.add('hidden')
    activePanel.current = undefined
  }

  const showBackdrop = () => {
    backdropRef.current?.classList.remove('hidden')
  }

  const hideBackdrop = () => {
    backdropRef.current?.classList.add('hidden')
  }

  const hideBackdropAndActivePanel = () => {
    hideBackdrop()
    hidePanelByName(activePanel.current)
  }

  // While changing between the panels, we can keep the backdrop
  const togglePanel = (_panelName) => {
    if (activePanel.current) {
      // Panel is already active => hide backdrop + panel, set active panel to undefined
      if (activePanel.current === _panelName) {
        hideBackdropAndActivePanel()
      } else {
        // Keep backdrop UNCHANGED, hide current panel and display the other panel
        hidePanelByName(activePanel.current)
        showPanelByName(_panelName)
      }
    } else {
      // Show the backdrop, the panel and update active panel name
      showBackdrop()
      showPanelByName(_panelName)
    }
  }

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    setFilteredListingDtos(listingDtos)
  }, [listingDtos])

  return <>
    <div className={'heading-2-my flex items-center justify-between gap-x-4'}>
      <Heading2>Map</Heading2>
      <span className="isolate inline-flex rounded-md shadow-xs shadow-dark/25 dark:shadow-light/25">
        <InGroupButton
          ariaLabel={'Search listings button'}
          onClick={() => togglePanel(panelConstant.search)}
          className={'rounded-l-md'}
          isDisabled={listingUpdateType === listingUpdateTypeConstant.search}>
          {listingUpdateType === listingUpdateTypeConstant.search ?
              <LoadingIcon className={'size-5 lg:size-6'} />
            : <HugeiconsIcon icon={Search01Icon} className={'size-5 lg:size-6'} />}
          <span className={'ml-2 hidden sm:inline'}>Search</span>
        </InGroupButton>
        <InGroupButton
          ariaLabel={'Filter listings button'}
          onClick={() => togglePanel(panelConstant.filter)}
          className={'-ml-px rounded-r-md'}
          isDisabled={listingUpdateType === listingUpdateTypeConstant.filter}>
          {listingUpdateType === listingUpdateTypeConstant.filter ?
              <LoadingIcon className={'size-5 lg:size-6'} />
            : <HugeiconsIcon icon={FilterHorizontalIcon} className={'size-5 lg:size-6'} />}
          <span className={'ml-2 hidden sm:inline'}>Filter</span>
        </InGroupButton>
      </span>
    </div>
    <div className={clsx(
      'relative rounded-lg',
      'h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-auto lg:aspect-video',
      'shadow-sm shadow-dark/25 dark:shadow-light/25 mb-8'
    )}>
      <SaleAndRentalListingsContext.Provider value={{
        listingDtos,
        setListingDtos,
        setFilteredListingDtos,
        listingUpdateType,
        setListingUpdateType,
        hideBackdropAndActivePanel
      }}>
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}>
          <Map
            listingDtos={filteredListingDtos}>
          </Map>
        </APIProvider>
        {/* Panel backdrop */}
        <div
          ref={backdropRef}
          onPointerDown={() => {
            backdropRef.current?.classList.add('hidden')
            hidePanelByName(activePanel.current)
          }}
          className={clsx(
            'hidden absolute inset-0 flex justify-center items-center',
            'px-4 py-8 bg-light-backdrop/75 dark:bg-dark-backdrop/50 z-1'
          )}>
          <SearchListingsPanel
            ref={searchListingsPanelRef} />
          <FilterListingsPanel
            ref={filterListingsPanelRef} />
        </div>
        {listingUpdateType !== listingUpdateTypeConstant.none && <div
          className={clsx(
            'absolute inset-0 flex justify-center items-center',
            'bg-light-backdrop/75 dark:bg-dark-backdrop/50 opacity-75 z-2'
          )}>
          <LoadingIcon className={'size-12 lg:size-14'} />
        </div>}
      </SaleAndRentalListingsContext.Provider>
    </div>
    <NormalText className={'mb-2'}>
      Map annotation:
    </NormalText>
    <div className={'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'}>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.singleFamily)}
        Single Family
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.multiFamily)}
        Multi-Family
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.condo)}
        Condo
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.townhouse)}
        Townhouse
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.apartment)}
        Apartment
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.manufactured)}
        Manufactured
      </div>
      <div className={'flex align-middle gap-2'}>
        {renderListingIconByPropertyType(propertyTypeConstant.land)}
        Land
      </div>
    </div>
  </>
}