'use client'
import Map from '@/app/projects/sale-and-rental-listings/components/map'
import FilterListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/filter-listings-panel'
import SearchListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/search-listings-panel'
import listingUpdateTypeConstant from '@/app/projects/sale-and-rental-listings/constants/listings-update-status'
import panelConstant from '@/app/projects/sale-and-rental-listings/constants/panel'
import SaleAndRentalListingsContext from '@/app/projects/sale-and-rental-listings/context'
import InGroupButton from '@/components/buttons/in-group'
import Heading2 from '@/components/texts/headings/2'
import {
  Search01Icon,
  FilterHorizontalIcon,
  Loading03Icon
} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
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
              <HugeiconsIcon icon={Loading03Icon} className={'size-5 lg:size-6 animate-spin'} />
            : <HugeiconsIcon icon={Search01Icon} className={'size-5 lg:size-6'} />}

          <span className={'ml-2 hidden sm:inline'}>Search</span>
        </InGroupButton>
        <InGroupButton
          ariaLabel={'Filter listings button'}
          onClick={() => togglePanel(panelConstant.filter)}
          className={'-ml-px rounded-r-md'}>
          <HugeiconsIcon icon={FilterHorizontalIcon} className={'size-5 lg:size-6'} />
          <span className={'ml-2 hidden sm:inline'}>Filter</span>
        </InGroupButton>
      </span>
    </div>
    <div className={clsx(
      'relative rounded-lg',
      'h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-auto lg:aspect-video',
      'shadow-sm shadow-dark/25 dark:shadow-light/25'
    )}>
      <SaleAndRentalListingsContext.Provider value={{
        setListingDtos,
        listingUpdateType,
        setListingUpdateType,
        hideBackdropAndActivePanel
      }}>
        <Map
          listingDtos={filteredListingDtos}>
        </Map>
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
        <div
          className={clsx(
            'absolute inset-0 flex justify-center items-center',
            'px-4 py-8 bg-red-500 opacity-75 z-1'
          )}>
          <FilterListingsPanel
            ref={filterListingsPanelRef} />
        </div>
      </SaleAndRentalListingsContext.Provider>
    </div>
  </>
}