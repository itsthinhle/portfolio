export const toListingDto = (listing) => {
  const result = {
    fullAddress: listing.formattedAddress,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.propertyType,
    listingType: listing.listingType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    livingArea: listing.squareFootage,
    lotArea: listing.lotSize,
    yearBuilt: listing.yearBuilt,
    price: listing.price,
    daysOnMarket: listing.daysOnMarket,
    status: listing.status
  }

  if (listing.hoa) {
    result.hoaFee = listing.hoa.fee
  }

  if (listing.listingOffice) {
    result.listingOfficeName = listing.listingOffice.name
    result.listingOfficePhone = listing.listingOffice.phone
    result.listingOfficeEmail = listing.listingOffice.email
  }

  if (listing.listingAgent) {
    result.listingAgentName = listing.listingAgent.name
    result.listingAgentPhone = listing.listingAgent.phone
    result.listingAgentEmail = listing.listingAgent.email
  }

  if (listing.history) {
    result.history = Object.entries(listing.history).map(([_date, _event]) => {
      return {
        date: _date,
        event: _event.event,
        price: _event.price,
        daysOnMarket: _event.daysOnMarket
      }
    })
  }

  return result
}

export const getMinAndMaxOfLivingAndLotAreas = (
  _listingDtos
) => {
  return _listingDtos.reduce((_result, _listingDto) => {
    if (_listingDto.livingArea < _result.minLivingArea) {
      _result.minLivingArea = _listingDto.livingArea
    }
    if (_listingDto.livingArea > _result.maxLivingArea) {
      _result.maxLivingArea = _listingDto.livingArea
    }
    if (_listingDto.lotArea < _result.minLotArea) {
      _result.minLotArea = _listingDto.lotArea
    }
    if (_listingDto.lotArea > _result.maxLotArea) {
      _result.maxLotArea = _listingDto.lotArea
    }

    return _result
  }, {
    minLivingArea: _listingDtos[0].livingArea ?? Number.POSITIVE_INFINITY,
    maxLivingArea: _listingDtos[0].livingArea ?? Number.NEGATIVE_INFINITY,
    minLotArea: _listingDtos[0].lotArea ?? Number.POSITIVE_INFINITY,
    maxLotArea: _listingDtos[0].lotArea ?? Number.NEGATIVE_INFINITY
  })
}