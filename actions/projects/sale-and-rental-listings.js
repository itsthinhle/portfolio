'use server'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/propertyType'
import statusConstant from '@/constants/status'
import apiUtility from '@/utilities/api'
import {promises as fs} from 'fs'
import {z} from 'zod'

function toListingDto(listing) {
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

export async function getInitialListingDtos() {
  try {
    const file = await fs.readFile(
      process.cwd() + '/data/projects/sale-and-rental-listings/init-listings.json'
      , 'utf8')

    return JSON.parse(file)
      .map(_listings => toListingDto(_listings))
      .sort((_listing1, _listing2) => _listing1.price - _listing2.price)
  } catch (error) {
    throw new Error('Failed to get initial listings data. Error: ' + error)
  }
}

export async function validateSearchForm(
  _formData) {
  // Zod: Defining a schema
  // Properties are required by default
  const SearchListingsFormSchema = z.object({
    rentCastApiKey: z
      .string()
      .trim()
      .min(1, 'Required'),
    state: z // No need to set length validation because we disabled the custom value for state
      .string()
      .optional(),
    city: z
      .string()
      .optional(),
    zipCode: z
      .string()
      .regex(/^\d{5}$/, '5 digits')
      .or(z.literal('')),
    bedrooms: z.preprocess(
      (_value) => (_value === '' ? undefined : Number(_value)),
      z.number()
        .min(0, 'Min is 0')
        .max(10, 'Max is 10')
        .optional()
    ),
    bathrooms: z.preprocess(
      (_value) => (_value === '' ? undefined : Number(_value)),
      z.number()
        .min(0, 'Min is 0')
        .max(10, 'Max is 10')
        .optional()
    )
  })
    /* refine() still runs even if some fields are invalid
superRefine() is where you do final, cross-field checks */
    .superRefine(
      (data, context) => {
        const hasState = !!data.state?.trim()
        const hasCity = !!data.city?.trim()
        const hasZip = !!data.zipCode?.trim()

        // Add more cross-field rules here

        if (!hasState && !hasZip) {
          context.addIssue({
            path: ['stateAndZipValidation'],
            message: 'Please choose at least a state or enter a zip code to search'
          })
        }

        if (hasState && !hasCity) {
          context.addIssue({
            path: ['city'],
            message: 'Required'
          })
        }
      }
    )

  // Validate form using Zod
  const validatedFields = SearchListingsFormSchema.safeParse({
    rentCastApiKey: _formData.rentCastApiKey,
    state: _formData.state,
    city: _formData.city,
    zipCode: _formData.zipCode,
    bedrooms: _formData.bedrooms,
    bathrooms: _formData.bathrooms
  })

  // If form validation fails, return errors immediately
  if (!validatedFields.success) {
    /** z.treeifyError(validatedFields.error) will return:
     {
     errors: [...],
     properties: {
     ...
     }
     }
     */
    return {
      status: statusConstant.error,
      errors: z.treeifyError(validatedFields.error).properties,
    }
  }

  return {
    status: statusConstant.success
  }
}

export async function searchListings(
  _formData) {
  const urlPrefix = 'https://api.rentcast.io/v1/listings'
  const saleUrl = `${urlPrefix}/sale`
  const rentalUrl = `${urlPrefix}/rental/long-term`
  const url =
    new URL(_formData.listingFor === 'Sale'
      ? saleUrl
      : rentalUrl)

  const urlSearchParams = new URLSearchParams()
  const unwantedKeys = ['rentCastApiKey', 'listingFor']
  const checkedPropertyTypes = []

  Object.entries(_formData).forEach(([_key, _value]) => {
    const isPropertyType = _key in propertyTypeConstant

    // Handle normal fields (Exclude undefined and some unwanted keys)
    if (!isPropertyType
      && _value
      && !unwantedKeys.includes(_key)) {
      urlSearchParams.set(_key, _value)
    }

    // Handle propertyType checkboxes
    if (isPropertyType && _value === 'on') {
      checkedPropertyTypes.push(propertyTypeConstant[_key])
    }
  })

  if (checkedPropertyTypes.length > 0) {
    urlSearchParams.set('propertyType', checkedPropertyTypes.join('|'))
  }

  urlSearchParams.set('status', 'Active')
  urlSearchParams.set('limit', 500)

  url.search = urlSearchParams.toString()

  const headers = {
    accept: 'application/json',
    'X-Api-Key': _formData.rentCastApiKey
  }

  return apiUtility.get(url, headers)

  // return [
  //   {
  //     'id': '753-Carter-St-NW,-Atlanta,-GA-30314',
  //     'formattedAddress': '753 Carter St NW, Atlanta, GA 30314',
  //     'addressLine1': '753 Carter St NW',
  //     'addressLine2': null,
  //     'city': 'Atlanta',
  //     'state': 'GA',
  //     'stateFips': '13',
  //     'zipCode': '30314',
  //     'county': 'Fulton',
  //     'countyFips': '121',
  //     'latitude': 33.756642,
  //     'longitude': -84.41212,
  //     'propertyType': 'Land',
  //     'lotSize': 3746,
  //     'status': 'Active',
  //     'price': 60000,
  //     'listingType': 'Standard',
  //     'listedDate': '2025-04-06T00:00:00.000Z',
  //     'removedDate': null,
  //     'createdDate': '2025-04-07T00:00:00.000Z',
  //     'lastSeenDate': '2026-02-14T11:27:05.692Z',
  //     'daysOnMarket': 315,
  //     'mlsName': 'GeorgiaMLS',
  //     'mlsNumber': '10494695',
  //     'listingAgent': {
  //       'name': 'Menecia Jackson',
  //       'phone': '6785259009',
  //       'email': 'meneciajackson@kw.com',
  //       'website': 'http://mj.kw.com'
  //     },
  //     'listingOffice': {
  //       'name': 'Keller Williams Realty Cityside',
  //       'phone': '7708746200',
  //       'email': 'nicole@zercherhomes.com',
  //       'website': 'http://kwcityside.com/'
  //     },
  //     'history': {
  //       '2025-04-06': {
  //         'event': 'Sale Listing',
  //         'price': 60000,
  //         'listingType': 'Standard',
  //         'listedDate': '2025-04-06T00:00:00.000Z',
  //         'removedDate': null,
  //         'daysOnMarket': 315
  //       }
  //     }
  //   },
  //   {
  //     'id': '2870-Pharr-Ct,-South-NW-Apt-1209,-Atlanta,-GA-30305',
  //     'formattedAddress': '2870 Pharr Ct, South NW Apt 1209, Atlanta, GA 30305',
  //     'addressLine1': '2870 Pharr Ct',
  //     'addressLine2': 'South NW Apt 1209',
  //     'city': 'Atlanta',
  //     'state': 'GA',
  //     'stateFips': '13',
  //     'zipCode': '30305',
  //     'county': 'Fulton',
  //     'countyFips': '121',
  //     'latitude': 33.834043,
  //     'longitude': -84.385749,
  //     'propertyType': 'Condo',
  //     'bedrooms': 1,
  //     'bathrooms': 1,
  //     'squareFootage': 807,
  //     'lotSize': 828,
  //     'yearBuilt': 1988,
  //     'hoa': {
  //       'fee': 479
  //     },
  //     'status': 'Active',
  //     'price': 249400,
  //     'listingType': 'Standard',
  //     'listedDate': '2025-04-04T00:00:00.000Z',
  //     'removedDate': null,
  //     'createdDate': '2025-04-05T00:00:00.000Z',
  //     'lastSeenDate': '2026-02-14T11:27:05.690Z',
  //     'daysOnMarket': 317,
  //     'mlsName': 'FMLS',
  //     'mlsNumber': '7553565',
  //     'listingAgent': {
  //       'name': 'Trevor Russell',
  //       'phone': '4043752180',
  //       'email': 'trevorrussell@compass.com',
  //       'website': 'https://closedwithlove.com/'
  //     },
  //     'listingOffice': {
  //       'name': 'COMPASS',
  //       'phone': '4046686621',
  //       'email': 'beth.butler@compass.com',
  //       'website': 'www.compass.com'
  //     },
  //     'history': {
  //       '2025-04-04': {
  //         'event': 'Sale Listing',
  //         'price': 249400,
  //         'listingType': 'Standard',
  //         'listedDate': '2025-04-04T00:00:00.000Z',
  //         'removedDate': null,
  //         'daysOnMarket': 317
  //       }
  //     }
  //   }
  // ].map(_listings => toListingDto(_listings))
}