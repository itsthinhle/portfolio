'use client'
import Map from '@/app/projects/sale-and-rental-listings/components/map'
import FilterListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/filter-listings-panel'
import SearchListingsPanel from '@/app/projects/sale-and-rental-listings/components/panels/search-listings-panel'
import panelConstant from '@/app/projects/sale-and-rental-listings/constants/panel'
import InGroupButton from '@/components/buttons/in-group'
import Heading2 from '@/components/texts/headings/2'
import {Search01Icon, FilterHorizontalIcon, Home01Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import React, {useActionState, useRef} from 'react'

export default function MapSection({
  initialListingDtos = [],
  googleMapApiKey,
  googleMapId
}) {
  const [listingDtos, action] = useActionState(() => {
  }, initialListingDtos)

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
  }

  const hidePanelByName = (_panelName) => {
    const panelElement = getPanelByName(_panelName)
    panelElement.current?.classList.add('hidden')
  }

  // While changing between the panels, we can keep the backdrop
  const togglePanel = (_panelName) => {
    if (activePanel.current) {
      // Panel is already active => hide backdrop + panel, set active panel to undefined
      if (activePanel.current === _panelName) {
        backdropRef.current?.classList.add('hidden')
        hidePanelByName(_panelName)
        activePanel.current = undefined
      } else {
        // Keep backdrop UNCHANGED, hide current panel and display the other panel
        hidePanelByName(activePanel.current)
        showPanelByName(_panelName)
        activePanel.current = _panelName
      }
    } else {
      // Show the backdrop, the panel and update active panel name
      backdropRef.current?.classList.remove('hidden')
      showPanelByName(_panelName)
      activePanel.current = _panelName
    }
  }


  return <>
    <div className={'heading-2-my flex items-center justify-between gap-x-4'}>
      <Heading2>Map</Heading2>
      <span className="isolate inline-flex rounded-md shadow-xs shadow-dark/25 dark:shadow-light/25">
        <InGroupButton
          ariaLabel={'Search listings button'}
          onClick={() => togglePanel(panelConstant.search)}
          className={'rounded-l-md'}>
          <HugeiconsIcon icon={Search01Icon} className={'size-5 lg:size-6'} />
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
      {/* Panel backdrop */}
      <div
        ref={backdropRef}
        onPointerDown={() => {
          backdropRef.current?.classList.add('hidden')
          hidePanelByName(activePanel.current)
          activePanel.current = undefined
        }}
        className={clsx(
          'hidden absolute inset-0 z-1 flex justify-center items-center',
          'px-4 py-8 bg-light-backdrop/75 dark:bg-dark-backdrop/50'
        )}>
        <SearchListingsPanel
          ref={searchListingsPanelRef} />
        <FilterListingsPanel
          ref={filterListingsPanelRef} />
      </div>
      <Map
        googleMapApiKey={googleMapApiKey}
        googleMapId={googleMapId}
        listingDtos={listingDtos}>
      </Map>
    </div>
  </>
}