import {promises as fs} from 'fs'

function toListingDto(listing) {
  const result = {
    fullAddress: listing.formattedAddress,
    lat: listing.latitude,
    lng: listing.longitude,
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

export async function getInitialListingDtos() {
  try {
    const file = await fs.readFile(
      process.cwd() + '/data/projects/sale-and-rental-listings/init-rental.json'
      , 'utf8')

    return JSON.parse(file).map(_listings => toListingDto(_listings))
  } catch (error) {
    throw new Error('Failed to get initial listings data. Error: ' + error)
  }
}