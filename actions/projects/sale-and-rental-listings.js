'use server'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/propertyType'
import statusConstant from '@/constants/status'
import apiUtility from '@/utilities/api'
import {promises as fs} from 'fs'
import {z} from 'zod'

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

  //return apiUtility.get(url, headers)

  return [
    {
      'id': '753-Carter-St-NW,-Atlanta,-GA-30314',
      'formattedAddress': '753 Carter St NW, Atlanta, GA 30314',
      'addressLine1': '753 Carter St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.756642,
      'longitude': -84.41212,
      'propertyType': 'Land',
      'lotSize': 3746,
      'status': 'Active',
      'price': 60000,
      'listingType': 'Standard',
      'listedDate': '2025-04-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.692Z',
      'daysOnMarket': 315,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10494695',
      'listingAgent': {
        'name': 'Menecia Jackson',
        'phone': '6785259009',
        'email': 'meneciajackson@kw.com',
        'website': 'http://mj.kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Cityside',
        'phone': '7708746200',
        'email': 'nicole@zercherhomes.com',
        'website': 'http://kwcityside.com/'
      },
      'history': {
        '2025-04-06': {
          'event': 'Sale Listing',
          'price': 60000,
          'listingType': 'Standard',
          'listedDate': '2025-04-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 315
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-1209,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 1209, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 1209',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 807,
      'lotSize': 828,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 479
      },
      'status': 'Active',
      'price': 249400,
      'listingType': 'Standard',
      'listedDate': '2025-04-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.690Z',
      'daysOnMarket': 317,
      'mlsName': 'FMLS',
      'mlsNumber': '7553565',
      'listingAgent': {
        'name': 'Trevor Russell',
        'phone': '4043752180',
        'email': 'trevorrussell@compass.com',
        'website': 'https://closedwithlove.com/'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-04-04': {
          'event': 'Sale Listing',
          'price': 249400,
          'listingType': 'Standard',
          'listedDate': '2025-04-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 317
        }
      }
    },
    {
      'id': '94-Moury-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '94 Moury Ave SE, Atlanta, GA 30315',
      'addressLine1': '94 Moury Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.712422,
      'longitude': -84.387265,
      'propertyType': 'Multi-Family',
      'bedrooms': 6,
      'bathrooms': 4,
      'squareFootage': 2430,
      'lotSize': 9749,
      'yearBuilt': 2003,
      'status': 'Active',
      'price': 599000,
      'listingType': 'Standard',
      'listedDate': '2025-04-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.689Z',
      'daysOnMarket': 313,
      'mlsName': 'FMLS',
      'mlsNumber': '7555889',
      'listingOffice': {
        'name': 'The Collective Real Estate',
        'phone': '4708338616',
        'email': 'brc@thecollectivere.net',
        'website': 'www.thecollectivere.net'
      },
      'history': {
        '2025-04-08': {
          'event': 'Sale Listing',
          'price': 599000,
          'listingType': 'Standard',
          'listedDate': '2025-04-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 313
        }
      }
    },
    {
      'id': '219-Little-John-Trl-NE,-Atlanta,-GA-30309',
      'formattedAddress': '219 Little John Trl NE, Atlanta, GA 30309',
      'addressLine1': '219 Little John Trl NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.803698,
      'longitude': -84.380427,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 5.5,
      'squareFootage': 5488,
      'lotSize': 20290,
      'yearBuilt': 1997,
      'status': 'Active',
      'price': 2995000,
      'listingType': 'Standard',
      'listedDate': '2025-04-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.688Z',
      'daysOnMarket': 318,
      'mlsName': 'FMLS',
      'mlsNumber': '7552888',
      'listingAgent': {
        'name': 'David J. Glassco',
        'phone': '4048880991'
      },
      'listingOffice': {
        'name': 'RE MAX Around Atlanta Realty',
        'phone': '4042527500',
        'email': 'brokerteam@aroundatlanta.com',
        'website': 'http://www.movearoundatlanta.com'
      },
      'history': {
        '2025-04-03': {
          'event': 'Sale Listing',
          'price': 2995000,
          'listingType': 'Standard',
          'listedDate': '2025-04-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 318
        }
      }
    },
    {
      'id': '250-Pharr-Rd-NE,-Apt-405,-Atlanta,-GA-30305',
      'formattedAddress': '250 Pharr Rd NE, Apt 405, Atlanta, GA 30305',
      'addressLine1': '250 Pharr Rd NE',
      'addressLine2': 'Apt 405',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.837184,
      'longitude': -84.378964,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1274,
      'lotSize': 1002,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 64
      },
      'status': 'Active',
      'price': 380000,
      'listingType': 'Standard',
      'listedDate': '2025-04-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-05-18T14:02:55.836Z',
      'lastSeenDate': '2026-02-14T11:27:05.686Z',
      'daysOnMarket': 316,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10494545',
      'listingAgent': {
        'name': 'Cindie Phanhmixay',
        'phone': '4048432500',
        'email': 'cindie.phanhmixay@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-04-05': {
          'event': 'Sale Listing',
          'price': 380000,
          'listingType': 'Standard',
          'listedDate': '2025-04-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 316
        }
      }
    },
    {
      'id': '3481-Lakeside-Dr-NE,-Apt-2203,-Atlanta,-GA-30326',
      'formattedAddress': '3481 Lakeside Dr NE, Apt 2203, Atlanta, GA 30326',
      'addressLine1': '3481 Lakeside Dr NE',
      'addressLine2': 'Apt 2203',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.849076,
      'longitude': -84.35714,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1265,
      'lotSize': 1263,
      'yearBuilt': 1990,
      'hoa': {
        'fee': 758
      },
      'status': 'Active',
      'price': 385000,
      'listingType': 'Standard',
      'listedDate': '2025-04-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.685Z',
      'daysOnMarket': 318,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10492897',
      'listingAgent': {
        'name': 'Celine Higgins',
        'phone': '6789159422',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'simplylistatlanta.com'
      },
      'listingOffice': {
        'name': 'Simply List',
        'phone': '4703091545',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'http://www.simplylistatlanta.com'
      },
      'history': {
        '2025-04-03': {
          'event': 'Sale Listing',
          'price': 385000,
          'listingType': 'Standard',
          'listedDate': '2025-04-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 318
        }
      }
    },
    {
      'id': '2152-Martin-Luther-King-Jr-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '2152 Martin Luther King Jr Dr SW, Atlanta, GA 30310',
      'addressLine1': '2152 Martin Luther King Jr Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.750825,
      'longitude': -84.459894,
      'propertyType': 'Land',
      'lotSize': 9365,
      'status': 'Active',
      'price': 105000,
      'listingType': 'Standard',
      'listedDate': '2025-04-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-09-27T08:51:15.918Z',
      'lastSeenDate': '2026-02-14T11:27:05.683Z',
      'daysOnMarket': 317,
      'mlsName': 'FMLS',
      'mlsNumber': '7553809',
      'listingAgent': {
        'name': 'Joy Cutts',
        'phone': '4048432500',
        'email': 'joy.cutts@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-04-04': {
          'event': 'Sale Listing',
          'price': 105000,
          'listingType': 'Standard',
          'listedDate': '2025-04-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 317
        }
      }
    },
    {
      'id': '115-Mount-Paran-Rdg,-Atlanta,-GA-30327',
      'formattedAddress': '115 Mount Paran Rdg, Atlanta, GA 30327',
      'addressLine1': '115 Mount Paran Rdg',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.885664,
      'longitude': -84.405095,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 7.5,
      'squareFootage': 7506,
      'lotSize': 47045,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 21
      },
      'status': 'Active',
      'price': 3250000,
      'listingType': 'Standard',
      'listedDate': '2025-04-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.680Z',
      'daysOnMarket': 314,
      'mlsName': 'FMLS',
      'mlsNumber': '7555003',
      'listingAgent': {
        'name': 'Sherwan Saraf',
        'phone': '4044056605',
        'email': 'sherwan.saraf@gmail.com'
      },
      'listingOffice': {
        'name': 'Domain Realty, Inc.',
        'phone': '7705003835',
        'email': 'tposeyt@aol.com',
        'website': 'www.domainrealtyinc.com'
      },
      'history': {
        '2025-04-07': {
          'event': 'Sale Listing',
          'price': 3250000,
          'listingType': 'Standard',
          'listedDate': '2025-04-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 314
        }
      }
    },
    {
      'id': '2146-Martin-Luther-King-Jr-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '2146 Martin Luther King Jr Dr SW, Atlanta, GA 30310',
      'addressLine1': '2146 Martin Luther King Jr Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.750626,
      'longitude': -84.459386,
      'propertyType': 'Land',
      'lotSize': 8364,
      'status': 'Active',
      'price': 100000,
      'listingType': 'Standard',
      'listedDate': '2025-04-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-09-27T08:51:15.918Z',
      'lastSeenDate': '2026-02-14T11:27:05.679Z',
      'daysOnMarket': 317,
      'mlsName': 'FMLS',
      'mlsNumber': '7553807',
      'listingAgent': {
        'name': 'Joy Cutts',
        'phone': '4048432500',
        'email': 'joy.cutts@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-04-04': {
          'event': 'Sale Listing',
          'price': 100000,
          'listingType': 'Standard',
          'listedDate': '2025-04-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 317
        }
      }
    },
    {
      'id': '380-Amal-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '380 Amal Dr SW, Atlanta, GA 30315',
      'addressLine1': '380 Amal Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.707321,
      'longitude': -84.398544,
      'propertyType': 'Single Family',
      'bedrooms': 7,
      'bathrooms': 2,
      'squareFootage': 3350,
      'lotSize': 26641,
      'yearBuilt': 1951,
      'status': 'Active',
      'price': 705000,
      'listingType': 'Standard',
      'listedDate': '2025-04-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.679Z',
      'daysOnMarket': 313,
      'mlsName': 'FMLS',
      'mlsNumber': '7556255',
      'listingOffice': {
        'name': 'The Collective Real Estate',
        'phone': '4708338616',
        'email': 'brc@thecollectivere.net',
        'website': 'www.thecollectivere.net'
      },
      'history': {
        '2025-04-08': {
          'event': 'Sale Listing',
          'price': 705000,
          'listingType': 'Standard',
          'listedDate': '2025-04-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 313
        }
      }
    },
    {
      'id': '3324-Peachtree-Rd-NE,-Unit-905,-Atlanta,-GA-30326',
      'formattedAddress': '3324 Peachtree Rd NE, Unit 905, Atlanta, GA 30326',
      'addressLine1': '3324 Peachtree Rd NE',
      'addressLine2': 'Unit 905',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84597,
      'longitude': -84.369381,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1238,
      'lotSize': 1237,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 780
      },
      'status': 'Active',
      'price': 439000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:38:22.751Z',
      'lastSeenDate': '2026-02-14T11:27:05.678Z',
      'daysOnMarket': 312,
      'mlsName': 'FMLS',
      'mlsNumber': '7556251',
      'listingAgent': {
        'name': 'Piyusha Zope',
        'phone': '4045429391',
        'email': 'piyushazope@gmail.com',
        'website': 'https://www.realtor.com/realestateagents/piyusha-zope_duluth_ga_784758_021384596'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-04-09': {
          'event': 'Sale Listing',
          'price': 439000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 312
        }
      }
    },
    {
      'id': '3578-Sherbrooke-Way-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3578 Sherbrooke Way SW, Atlanta, GA 30331',
      'addressLine1': '3578 Sherbrooke Way SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.672061,
      'longitude': -84.505704,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1185,
      'lotSize': 13199,
      'yearBuilt': 1965,
      'status': 'Active',
      'price': 217000,
      'listingType': 'Standard',
      'listedDate': '2025-04-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.675Z',
      'daysOnMarket': 313,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10495706',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-08': {
          'event': 'Sale Listing',
          'price': 217000,
          'listingType': 'Standard',
          'listedDate': '2025-04-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 313
        }
      }
    },
    {
      'id': '451-Pomona-Cir-SW,-Atlanta,-GA-30315',
      'formattedAddress': '451 Pomona Cir SW, Atlanta, GA 30315',
      'addressLine1': '451 Pomona Cir SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.687708,
      'longitude': -84.404429,
      'propertyType': 'Land',
      'lotSize': 31842,
      'status': 'Active',
      'price': 110000,
      'listingType': 'Standard',
      'listedDate': '2025-04-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.674Z',
      'daysOnMarket': 311,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10497131',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-04-10': {
          'event': 'Sale Listing',
          'price': 110000,
          'listingType': 'Standard',
          'listedDate': '2025-04-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 311
        }
      }
    },
    {
      'id': '3074-Delowe-Dr,-Atlanta,-GA-30344',
      'formattedAddress': '3074 Delowe Dr, Atlanta, GA 30344',
      'addressLine1': '3074 Delowe Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.671735,
      'longitude': -84.457479,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 1210,
      'lotSize': 9757,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 115000,
      'listingType': 'Standard',
      'listedDate': '2025-04-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-11-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.673Z',
      'daysOnMarket': 311,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10497526',
      'listingAgent': {
        'name': 'Justin Landis',
        'phone': '4048601816',
        'email': 'hello@justinlandisgroup.com',
        'website': 'http://www.justinlandisgroup.com'
      },
      'listingOffice': {
        'name': 'Bolst, Inc.',
        'phone': '4044822293',
        'email': 'cathryn@bolst.homes'
      },
      'history': {
        '2025-04-10': {
          'event': 'Sale Listing',
          'price': 115000,
          'listingType': 'Standard',
          'listedDate': '2025-04-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 311
        }
      }
    },
    {
      'id': '52-25th-St-NW,-Atlanta,-GA-30309',
      'formattedAddress': '52 25th St NW, Atlanta, GA 30309',
      'addressLine1': '52 25th St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.800587,
      'longitude': -84.395226,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4.5,
      'squareFootage': 3816,
      'lotSize': 10411,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 1998500,
      'listingType': 'New Construction',
      'listedDate': '2025-04-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-24T16:39:41.493Z',
      'lastSeenDate': '2026-02-14T11:27:05.607Z',
      'daysOnMarket': 320,
      'mlsName': 'FMLS',
      'mlsNumber': '7551326',
      'listingAgent': {
        'name': 'Chad Polazzo',
        'phone': '4042267199',
        'email': 'chadpolazzo@remax.net',
        'website': 'http://www.chadsells.com'
      },
      'listingOffice': {
        'name': 'RE MAX Metro Atlanta Cityside',
        'phone': '4043213123',
        'email': 'darmstrong@remax.net',
        'website': 'http://www.realestateofatlanta.com'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 1998500,
          'listingType': 'New Construction',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 320
        }
      }
    },
    {
      'id': '400-W-Peachtree-St-NW,-Unit-2403,-Atlanta,-GA-30308',
      'formattedAddress': '400 W Peachtree St NW, Unit 2403, Atlanta, GA 30308',
      'addressLine1': '400 W Peachtree St NW',
      'addressLine2': 'Unit 2403',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765128,
      'longitude': -84.388189,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 743,
      'lotSize': 741,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 392
      },
      'status': 'Active',
      'price': 299900,
      'listingType': 'Standard',
      'listedDate': '2025-04-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-05-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.606Z',
      'daysOnMarket': 320,
      'mlsName': 'FMLS',
      'mlsNumber': '7551496',
      'listingAgent': {
        'name': 'Cathy Cobb',
        'phone': '7042581391',
        'email': 'cathy.cobb@harrynorman.com',
        'website': 'www.cathycobbwebb.harrynorman.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '7704750505',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 320
        }
      }
    },
    {
      'id': '2566-Nw-Santa-Barbara-Dr,-Atlanta,-GA-30318',
      'formattedAddress': '2566 Nw Santa Barbara Dr, Atlanta, GA 30318',
      'addressLine1': '2566 Nw Santa Barbara Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765098,
      'longitude': -84.471708,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 850,
      'lotSize': 7536,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 186000,
      'listingType': 'Standard',
      'listedDate': '2025-04-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.606Z',
      'daysOnMarket': 320,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10490756',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 186000,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 320
        }
      }
    },
    {
      'id': '554-Mcgill-Pl-NE,-Atlanta,-GA-30312',
      'formattedAddress': '554 Mcgill Pl NE, Atlanta, GA 30312',
      'addressLine1': '554 Mcgill Pl NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765272,
      'longitude': -84.376773,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 960,
      'lotSize': 958,
      'yearBuilt': 1987,
      'hoa': {
        'fee': 33
      },
      'status': 'Active',
      'price': 249900,
      'listingType': 'Standard',
      'listedDate': '2025-04-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-10-09T14:47:27.476Z',
      'lastSeenDate': '2026-02-14T11:27:05.605Z',
      'daysOnMarket': 319,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10491149',
      'listingAgent': {
        'name': 'Jon Dabney',
        'phone': '7705602005',
        'email': 'thedeltarealestateteam@gmail.com'
      },
      'listingOffice': {
        'name': 'Jason Mitchell Real Estate of Georgia, LLC',
        'phone': '7702846772',
        'email': 'whardy@jasonmitchellgroup.com',
        'website': 'jasonmitchellgroup.com'
      },
      'history': {
        '2025-04-02': {
          'event': 'Sale Listing',
          'price': 249900,
          'listingType': 'Standard',
          'listedDate': '2025-04-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 319
        }
      }
    },
    {
      'id': '3566-Fairlane-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3566 Fairlane Dr NW, Atlanta, GA 30331',
      'addressLine1': '3566 Fairlane Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.7665,
      'longitude': -84.504264,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 875,
      'lotSize': 8276,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 200000,
      'listingType': 'Standard',
      'listedDate': '2025-04-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.604Z',
      'daysOnMarket': 319,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10490765',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-02': {
          'event': 'Sale Listing',
          'price': 200000,
          'listingType': 'Standard',
          'listedDate': '2025-04-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 319
        }
      }
    },
    {
      'id': '710-Thomasville-Blvd-SE,-Atlanta,-GA-30315',
      'formattedAddress': '710 Thomasville Blvd SE, Atlanta, GA 30315',
      'addressLine1': '710 Thomasville Blvd SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.7037,
      'longitude': -84.365466,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1084,
      'lotSize': 7754,
      'yearBuilt': 1992,
      'status': 'Active',
      'price': 233000,
      'listingType': 'Standard',
      'listedDate': '2025-04-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.604Z',
      'daysOnMarket': 319,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10490863',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-02': {
          'event': 'Sale Listing',
          'price': 233000,
          'listingType': 'Standard',
          'listedDate': '2025-04-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 319
        }
      }
    },
    {
      'id': '3410-Nw-Adkins-Rd,-Atlanta,-GA-30331',
      'formattedAddress': '3410 Nw Adkins Rd, Atlanta, GA 30331',
      'addressLine1': '3410 Nw Adkins Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.772677,
      'longitude': -84.50298,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1000,
      'lotSize': 10890,
      'yearBuilt': 1961,
      'status': 'Active',
      'price': 214000,
      'listingType': 'Standard',
      'listedDate': '2025-04-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.603Z',
      'daysOnMarket': 319,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10491977',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-02': {
          'event': 'Sale Listing',
          'price': 214000,
          'listingType': 'Standard',
          'listedDate': '2025-04-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 319
        }
      }
    },
    {
      'id': '2146M-L-King-Jr-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '2146M L King Jr Dr SW, Atlanta, GA 30310',
      'addressLine1': '2146M L King Jr Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.750626,
      'longitude': -84.459386,
      'propertyType': 'Land',
      'lotSize': 8364,
      'status': 'Active',
      'price': 100000,
      'listingType': 'Standard',
      'listedDate': '2025-04-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.602Z',
      'daysOnMarket': 318,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10492149',
      'listingAgent': {
        'name': 'Joy Cutts',
        'phone': '4048432500',
        'email': 'joy.cutts@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-04-03': {
          'event': 'Sale Listing',
          'price': 100000,
          'listingType': 'Standard',
          'listedDate': '2025-04-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 318
        }
      }
    },
    {
      'id': '2152M-L-King-Jr-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '2152M L King Jr Dr SW, Atlanta, GA 30310',
      'addressLine1': '2152M L King Jr Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.750825,
      'longitude': -84.459894,
      'propertyType': 'Land',
      'lotSize': 9365,
      'status': 'Active',
      'price': 105000,
      'listingType': 'Standard',
      'listedDate': '2025-04-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.601Z',
      'daysOnMarket': 318,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10492150',
      'listingAgent': {
        'name': 'Joy Cutts',
        'phone': '4048432500',
        'email': 'joy.cutts@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-04-03': {
          'event': 'Sale Listing',
          'price': 105000,
          'listingType': 'Standard',
          'listedDate': '2025-04-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 318
        }
      }
    },
    {
      'id': '120-Gran-De-Ct,-Atlanta,-GA-30349',
      'formattedAddress': '120 Gran De Ct, Atlanta, GA 30349',
      'addressLine1': '120 Gran De Ct',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.584339,
      'longitude': -84.493794,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 2,
      'squareFootage': 1652,
      'lotSize': 19166,
      'yearBuilt': 1971,
      'status': 'Active',
      'price': 284000,
      'listingType': 'Standard',
      'listedDate': '2025-04-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.597Z',
      'daysOnMarket': 307,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10491798',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-14': {
          'event': 'Sale Listing',
          'price': 284000,
          'listingType': 'Standard',
          'listedDate': '2025-04-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 307
        }
      }
    },
    {
      'id': '1144-Hubbard-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1144 Hubbard St SW, Atlanta, GA 30310',
      'addressLine1': '1144 Hubbard St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.72367,
      'longitude': -84.402217,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2179,
      'lotSize': 5576,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 699000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.596Z',
      'daysOnMarket': 310,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10498319',
      'listingAgent': {
        'name': 'Emiko Yang',
        'phone': '4044236558',
        'email': 'e@realtoremiko.com',
        'website': 'https://emikoyang.bhhsgeorgiaconnect.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-04-11': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 310
        }
      }
    },
    {
      'id': '3541-Condor-Ct-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3541 Condor Ct SW, Atlanta, GA 30331',
      'addressLine1': '3541 Condor Ct SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.686973,
      'longitude': -84.502687,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1480,
      'lotSize': 1002,
      'yearBuilt': 2023,
      'hoa': {
        'fee': 14
      },
      'status': 'Active',
      'price': 310000,
      'listingType': 'Standard',
      'listedDate': '2025-04-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.595Z',
      'daysOnMarket': 310,
      'mlsName': 'FMLS',
      'mlsNumber': '7558265',
      'listingAgent': {
        'name': 'Roshonda Long',
        'phone': '4704942242',
        'email': 'alleliteagent@gmail.com',
        'website': 'https://onereal.com/roshonda-long'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-04-11': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2025-04-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 310
        }
      }
    },
    {
      'id': '726-Eloise-St-SE,-Atlanta,-GA-30312',
      'formattedAddress': '726 Eloise St SE, Atlanta, GA 30312',
      'addressLine1': '726 Eloise St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.734521,
      'longitude': -84.362549,
      'propertyType': 'Land',
      'lotSize': 7501,
      'hoa': {
        'fee': 389
      },
      'status': 'Active',
      'price': 469000,
      'listingType': 'Standard',
      'listedDate': '2025-04-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-12-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.595Z',
      'daysOnMarket': 300,
      'mlsName': 'FMLS',
      'mlsNumber': '7563419',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-04-21': {
          'event': 'Sale Listing',
          'price': 469000,
          'listingType': 'Standard',
          'listedDate': '2025-04-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 300
        }
      }
    },
    {
      'id': '682-Shelton-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '682 Shelton Ave SW, Atlanta, GA 30310',
      'addressLine1': '682 Shelton Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.734226,
      'longitude': -84.410181,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 3704,
      'lotSize': 4922,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 599000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-11-12T10:14:38.828Z',
      'lastSeenDate': '2026-02-14T11:27:05.592Z',
      'daysOnMarket': 310,
      'mlsName': 'FMLS',
      'mlsNumber': '7558059',
      'listingAgent': {
        'name': 'Emiko Yang',
        'phone': '4044236558',
        'email': 'e@realtoremiko.com',
        'website': 'https://emikoyang.bhhsgeorgiaconnect.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-04-11': {
          'event': 'Sale Listing',
          'price': 599000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 310
        }
      }
    },
    {
      'id': '3630-Peachtree-Rd-NE,-Unit-3207,-Atlanta,-GA-30326',
      'formattedAddress': '3630 Peachtree Rd NE, Unit 3207, Atlanta, GA 30326',
      'addressLine1': '3630 Peachtree Rd NE',
      'addressLine2': 'Unit 3207',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.85446,
      'longitude': -84.358298,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2792,
      'yearBuilt': 2010,
      'hoa': {
        'fee': 232
      },
      'status': 'Active',
      'price': 2395000,
      'listingType': 'Standard',
      'listedDate': '2025-04-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.590Z',
      'daysOnMarket': 304,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10502188',
      'listingAgent': {
        'name': 'Madeleine Kotora',
        'phone': '4042778126',
        'email': 'madeleine.kotora@harrynorman.com'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Buckhead',
        'phone': '4042334142',
        'email': 'bh.office@harrynorman.com',
        'website': 'https://www.harrynorman.com/bio/buckhead'
      },
      'history': {
        '2025-04-17': {
          'event': 'Sale Listing',
          'price': 2395000,
          'listingType': 'Standard',
          'listedDate': '2025-04-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 304
        }
      }
    },
    {
      'id': '3481-Lakeside-Dr-NE,-Apt-1504,-Atlanta,-GA-30326',
      'formattedAddress': '3481 Lakeside Dr NE, Apt 1504, Atlanta, GA 30326',
      'addressLine1': '3481 Lakeside Dr NE',
      'addressLine2': 'Apt 1504',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.849076,
      'longitude': -84.35714,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 750,
      'lotSize': 7492320,
      'yearBuilt': 1990,
      'hoa': {
        'fee': 494
      },
      'status': 'Active',
      'price': 239900,
      'listingType': 'Standard',
      'listedDate': '2025-04-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.589Z',
      'daysOnMarket': 304,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10502778',
      'listingAgent': {
        'name': 'Anna Conceicao',
        'phone': '7705106961',
        'email': 'aconceicao@youneedresults.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Rlty-Ptree Rd',
        'phone': '4044193500',
        'email': 'lynnlecraw@kw.com',
        'website': 'peachtreeroad.yourkwoffice.com/mcj/user/homepagegetaction.do'
      },
      'history': {
        '2025-04-17': {
          'event': 'Sale Listing',
          'price': 239900,
          'listingType': 'Standard',
          'listedDate': '2025-04-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 304
        }
      }
    },
    {
      'id': '1140-Hubbard-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1140 Hubbard St SW, Atlanta, GA 30310',
      'addressLine1': '1140 Hubbard St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723883,
      'longitude': -84.402214,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2179,
      'lotSize': 5532,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 699000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-10-21T11:49:54.213Z',
      'lastSeenDate': '2026-02-14T11:27:05.587Z',
      'daysOnMarket': 310,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10498243',
      'listingAgent': {
        'name': 'Emiko Yang',
        'phone': '4044236558',
        'email': 'e@realtoremiko.com',
        'website': 'https://emikoyang.bhhsgeorgiaconnect.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-04-11': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 310
        }
      }
    },
    {
      'id': '2983-Habersham-Ct-NW,-Atlanta,-GA-30305',
      'formattedAddress': '2983 Habersham Ct NW, Atlanta, GA 30305',
      'addressLine1': '2983 Habersham Ct NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.8369,
      'longitude': -84.390122,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 8,
      'squareFootage': 9668,
      'lotSize': 30056,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 6450000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.587Z',
      'daysOnMarket': 303,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10503309',
      'listingAgent': {
        'name': 'Bonneau Ansley',
        'phone': '4049063161',
        'email': 'bonneau@ansleyatlanta.com',
        'website': 'http://www.bonneauansley.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyre.com',
        'website': 'www.ansleyatlanta.com'
      },
      'history': {
        '2025-04-18': {
          'event': 'Sale Listing',
          'price': 6450000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 303
        }
      }
    },
    {
      'id': '2965-Pharr-Ct,-South-NW-Apt-502,-Atlanta,-GA-30305',
      'formattedAddress': '2965 Pharr Ct, South NW Apt 502, Atlanta, GA 30305',
      'addressLine1': '2965 Pharr Ct',
      'addressLine2': 'South NW Apt 502',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.836062,
      'longitude': -84.384606,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 976,
      'lotSize': 958,
      'yearBuilt': 1958,
      'hoa': {
        'fee': 395
      },
      'status': 'Active',
      'price': 158000,
      'listingType': 'Standard',
      'listedDate': '2025-04-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-16T19:12:09.133Z',
      'lastSeenDate': '2026-02-14T11:27:05.585Z',
      'daysOnMarket': 303,
      'mlsName': 'FMLS',
      'mlsNumber': '7562430',
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2024-12-03': {
          'event': 'Sale Listing',
          'price': 178000,
          'listingType': 'Standard',
          'listedDate': '2024-12-03T00:00:00.000Z',
          'removedDate': '2025-02-01T00:00:00.000Z',
          'daysOnMarket': 60
        },
        '2025-04-18': {
          'event': 'Sale Listing',
          'price': 158000,
          'listingType': 'Standard',
          'listedDate': '2025-04-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 303
        }
      }
    },
    {
      'id': '441-Lynnhaven-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '441 Lynnhaven Dr SW, Atlanta, GA 30310',
      'addressLine1': '441 Lynnhaven Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.716073,
      'longitude': -84.402309,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 1800,
      'lotSize': 8712,
      'yearBuilt': 1965,
      'status': 'Active',
      'price': 360000,
      'listingType': 'Standard',
      'listedDate': '2025-04-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-02-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.584Z',
      'daysOnMarket': 305,
      'mlsName': 'MIDGAMLS',
      'mlsNumber': '179303',
      'listingAgent': {
        'name': 'Daylon Martin'
      },
      'listingOffice': {
        'name': 'Daylon Martin And Associates,Llc',
        'phone': '4782569832',
        'email': 'daylonm@hotmail.com'
      },
      'history': {
        '2024-08-21': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2024-08-21T00:00:00.000Z',
          'removedDate': '2025-01-08T00:00:00.000Z',
          'daysOnMarket': 140
        },
        '2025-04-16': {
          'event': 'Sale Listing',
          'price': 360000,
          'listingType': 'Standard',
          'listedDate': '2025-04-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 305
        }
      }
    },
    {
      'id': '3811-Crosby-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3811 Crosby Dr NW, Atlanta, GA 30331',
      'addressLine1': '3811 Crosby Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.773025,
      'longitude': -84.512437,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1687,
      'lotSize': 23087,
      'yearBuilt': 1958,
      'status': 'Active',
      'price': 299900,
      'listingType': 'Standard',
      'listedDate': '2025-04-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-04-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.583Z',
      'daysOnMarket': 307,
      'mlsName': 'FMLS',
      'mlsNumber': '7559387',
      'listingAgent': {
        'name': 'Carolina Sena',
        'phone': '6786658653',
        'email': 'carolinasena@kw.com',
        'website': 'http://www.coldwellbankeratlanta.com/carolina.senasbresso'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty ',
        'phone': '7704955050',
        'email': 'jabarnhart@vpradmin.com'
      },
      'history': {
        '2024-01-02': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2024-01-02T00:00:00.000Z',
          'removedDate': '2024-11-03T00:00:00.000Z',
          'daysOnMarket': 306
        },
        '2025-04-14': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-04-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 307
        }
      }
    },
    {
      'id': '6990-Old-National-Hwy,-Atlanta,-GA-30349',
      'formattedAddress': '6990 Old National Hwy, Atlanta, GA 30349',
      'addressLine1': '6990 Old National Hwy',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.563487,
      'longitude': -84.467895,
      'propertyType': 'Land',
      'lotSize': 97139,
      'status': 'Active',
      'price': 400000,
      'listingType': 'Standard',
      'listedDate': '2025-04-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:19:31.785Z',
      'lastSeenDate': '2026-02-14T11:27:05.582Z',
      'daysOnMarket': 294,
      'mlsName': 'FMLS',
      'mlsNumber': '7567450',
      'listingAgent': {
        'name': 'Tam Chu',
        'phone': '4043840405',
        'email': 'tamchu0102@gmail.com'
      },
      'listingOffice': {
        'name': 'Homestar Realty Corporation',
        'phone': '4049183441',
        'email': 'bruceng24@yahoo.com'
      },
      'history': {
        '2024-09-20': {
          'event': 'Sale Listing',
          'price': 340000,
          'listingType': 'Standard',
          'listedDate': '2024-09-20T00:00:00.000Z',
          'removedDate': '2025-03-21T00:00:00.000Z',
          'daysOnMarket': 182
        },
        '2025-04-27': {
          'event': 'Sale Listing',
          'price': 400000,
          'listingType': 'Standard',
          'listedDate': '2025-04-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 294
        }
      }
    },
    {
      'id': 'Hollywood-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': 'Hollywood Rd NW, Atlanta, GA 30318',
      'addressLine1': 'Hollywood Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.799563,
      'longitude': -84.469046,
      'propertyType': 'Land',
      'lotSize': 114998,
      'yearBuilt': 2022,
      'status': 'Active',
      'price': 247250,
      'listingType': 'Standard',
      'listedDate': '2025-04-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-30T13:56:58.753Z',
      'lastSeenDate': '2026-02-14T11:27:05.580Z',
      'daysOnMarket': 306,
      'mlsName': 'FMLS',
      'mlsNumber': '7525127',
      'listingAgent': {
        'name': 'Greg Todey',
        'phone': '7705969443',
        'email': 'gregtodey@gmail.com'
      },
      'listingOffice': {
        'name': 'Bellwood Brokers, LLC',
        'phone': '4049775801',
        'email': 'gregtodey@gmail.com'
      },
      'history': {
        '2024-11-01': {
          'event': 'Sale Listing',
          'price': 17000,
          'listingType': 'Standard',
          'listedDate': '2024-11-01T00:00:00.000Z',
          'removedDate': '2025-04-15T00:00:00.000Z',
          'daysOnMarket': 165
        },
        '2025-04-15': {
          'event': 'Sale Listing',
          'price': 247250,
          'listingType': 'Standard',
          'listedDate': '2025-04-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 306
        }
      }
    },
    {
      'id': '971-Peeples-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '971 Peeples St SW, Atlanta, GA 30310',
      'addressLine1': '971 Peeples St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728776,
      'longitude': -84.423184,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 640,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 196713,
      'listingType': 'New Construction',
      'listedDate': '2025-04-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.580Z',
      'daysOnMarket': 293,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10509851',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-04-28': {
          'event': 'Sale Listing',
          'price': 196713,
          'listingType': 'New Construction',
          'listedDate': '2025-04-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 293
        }
      }
    },
    {
      'id': '3798-Bakers-Ferry-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3798 Bakers Ferry Rd SW, Atlanta, GA 30331',
      'addressLine1': '3798 Bakers Ferry Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.7596,
      'longitude': -84.513825,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 2,
      'squareFootage': 1040,
      'lotSize': 24786,
      'yearBuilt': 1964,
      'status': 'Active',
      'price': 249000,
      'listingType': 'Standard',
      'listedDate': '2025-04-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.579Z',
      'daysOnMarket': 300,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10504339',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-21': {
          'event': 'Sale Listing',
          'price': 249000,
          'listingType': 'Standard',
          'listedDate': '2025-04-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 300
        }
      }
    },
    {
      'id': '253-Sydney-St-SE,-Atlanta,-GA-30312',
      'formattedAddress': '253 Sydney St SE, Atlanta, GA 30312',
      'addressLine1': '253 Sydney St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.740945,
      'longitude': -84.379405,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 4400,
      'lotSize': 13800,
      'yearBuilt': 1881,
      'status': 'Active',
      'price': 1998000,
      'listingType': 'Standard',
      'listedDate': '2025-04-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-10-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.578Z',
      'daysOnMarket': 305,
      'mlsName': 'FMLS',
      'mlsNumber': '7560287',
      'listingAgent': {
        'name': 'Carole King Moss',
        'phone': '4044512688',
        'email': 'king0920@comcast.net'
      },
      'listingOffice': {
        'name': 'Monarch Realtors',
        'phone': '4046598888',
        'email': 'king0920@comcast.net'
      },
      'history': {
        '2023-09-30': {
          'event': 'Sale Listing',
          'price': 2200000,
          'listingType': 'Standard',
          'listedDate': '2023-09-30T00:00:00.000Z',
          'removedDate': '2025-01-01T00:00:00.000Z',
          'daysOnMarket': 459
        },
        '2025-04-16': {
          'event': 'Sale Listing',
          'price': 1998000,
          'listingType': 'Standard',
          'listedDate': '2025-04-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 305
        }
      }
    },
    {
      'id': '3475-Oak-Valley-Rd-NE,-Apt-650,-Atlanta,-GA-30326',
      'formattedAddress': '3475 Oak Valley Rd NE, Apt 650, Atlanta, GA 30326',
      'addressLine1': '3475 Oak Valley Rd NE',
      'addressLine2': 'Apt 650',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.850152,
      'longitude': -84.359261,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1012,
      'lotSize': 1002,
      'yearBuilt': 1992,
      'hoa': {
        'fee': 536
      },
      'status': 'Active',
      'price': 280000,
      'listingType': 'Standard',
      'listedDate': '2025-04-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-10-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.578Z',
      'daysOnMarket': 303,
      'mlsName': 'FMLS',
      'mlsNumber': '7562203',
      'listingAgent': {
        'name': 'Izabella Odabi',
        'phone': '6788517861',
        'email': 'izabellaodabi@gmail.com',
        'website': 'https://izabellaodabi.exprealty.com/'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2024-10-14': {
          'event': 'Sale Listing',
          'price': 320000,
          'listingType': 'Standard',
          'listedDate': '2024-10-14T00:00:00.000Z',
          'removedDate': '2025-04-06T00:00:00.000Z',
          'daysOnMarket': 174
        },
        '2025-04-18': {
          'event': 'Sale Listing',
          'price': 280000,
          'listingType': 'Standard',
          'listedDate': '2025-04-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 303
        }
      }
    },
    {
      'id': '726-Cedar-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '726 Cedar Ave NW, Atlanta, GA 30318',
      'addressLine1': '726 Cedar Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.774783,
      'longitude': -84.465241,
      'propertyType': 'Land',
      'lotSize': 16988,
      'status': 'Active',
      'price': 42500,
      'listingType': 'Standard',
      'listedDate': '2025-04-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.575Z',
      'daysOnMarket': 294,
      'mlsName': 'FMLS',
      'mlsNumber': '7522068',
      'listingAgent': {
        'name': 'Greg Todey',
        'phone': '7705969443',
        'email': 'gregtodey@gmail.com'
      },
      'listingOffice': {
        'name': 'Bellwood Brokers, LLC',
        'phone': '4049775801',
        'email': 'gregtodey@gmail.com'
      },
      'history': {
        '2025-04-27': {
          'event': 'Sale Listing',
          'price': 42500,
          'listingType': 'Standard',
          'listedDate': '2025-04-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 294
        }
      }
    },
    {
      'id': '6851-Roswell-Rd,-Apt-O10,-Atlanta,-GA-30328',
      'formattedAddress': '6851 Roswell Rd, Apt O10, Atlanta, GA 30328',
      'addressLine1': '6851 Roswell Rd',
      'addressLine2': 'Apt O10',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.941298,
      'longitude': -84.371289,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 797,
      'lotSize': 797,
      'yearBuilt': 1964,
      'hoa': {
        'fee': 311
      },
      'status': 'Active',
      'price': 157500,
      'listingType': 'Standard',
      'listedDate': '2025-04-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.574Z',
      'daysOnMarket': 303,
      'mlsName': 'FMLS',
      'mlsNumber': '7560657',
      'listingAgent': {
        'name': 'David Hagan',
        'phone': '7708264606',
        'email': 'davidwhagan@gmail.com',
        'website': 'www.trendatlantarealty.com'
      },
      'listingOffice': {
        'name': 'Trend Atlanta Realty, Inc.',
        'phone': '7707771321',
        'email': 'trendatlanta@comcast.net',
        'website': 'www.trendatlantarealty.com'
      },
      'history': {
        '2025-04-18': {
          'event': 'Sale Listing',
          'price': 157500,
          'listingType': 'Standard',
          'listedDate': '2025-04-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 303
        }
      }
    },
    {
      'id': '973-Peeples-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '973 Peeples St SW, Atlanta, GA 30310',
      'addressLine1': '973 Peeples St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728776,
      'longitude': -84.423184,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 640,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 196713,
      'listingType': 'New Construction',
      'listedDate': '2025-04-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.573Z',
      'daysOnMarket': 298,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10506241',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-04-23': {
          'event': 'Sale Listing',
          'price': 196713,
          'listingType': 'New Construction',
          'listedDate': '2025-04-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 298
        }
      }
    },
    {
      'id': '958-Lawton-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '958 Lawton St SW, Atlanta, GA 30310',
      'addressLine1': '958 Lawton St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728776,
      'longitude': -84.423184,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 640,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 200
      },
      'status': 'Active',
      'price': 165000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.573Z',
      'daysOnMarket': 293,
      'mlsName': 'FMLS',
      'mlsNumber': '7569039',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-04-28': {
          'event': 'Sale Listing',
          'price': 165000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 293
        }
      }
    },
    {
      'id': '962-Lawton-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '962 Lawton St SW, Atlanta, GA 30310',
      'addressLine1': '962 Lawton St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728776,
      'longitude': -84.423184,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 640,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 165000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.571Z',
      'daysOnMarket': 293,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10509899',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-04-28': {
          'event': 'Sale Listing',
          'price': 165000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 293
        }
      }
    },
    {
      'id': '419-Lanier-St-NW,-Atlanta,-GA-30318',
      'formattedAddress': '419 Lanier St NW, Atlanta, GA 30318',
      'addressLine1': '419 Lanier St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.766546,
      'longitude': -84.439289,
      'propertyType': 'Single Family',
      'bedrooms': 0,
      'squareFootage': 7500,
      'lotSize': 7501,
      'yearBuilt': 1965,
      'status': 'Active',
      'price': 70000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-21T12:14:08.663Z',
      'lastSeenDate': '2026-02-14T11:27:05.570Z',
      'daysOnMarket': 300,
      'mlsName': 'FMLS',
      'mlsNumber': '7563991',
      'listingAgent': {
        'name': 'Tiffany Prewitt',
        'phone': '8187417438',
        'email': 'dreamhomesbytiff@gmail.com'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-04-21': {
          'event': 'Sale Listing',
          'price': 70000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 300
        }
      }
    },
    {
      'id': '2710-Hedgewood-Dr-NW,-Atlanta,-GA-30311',
      'formattedAddress': '2710 Hedgewood Dr NW, Atlanta, GA 30311',
      'addressLine1': '2710 Hedgewood Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.757013,
      'longitude': -84.476549,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4,
      'squareFootage': 1928,
      'lotSize': 27752,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 419000,
      'listingType': 'Standard',
      'listedDate': '2025-04-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-10-23T16:55:18.245Z',
      'lastSeenDate': '2026-02-14T11:27:05.569Z',
      'daysOnMarket': 292,
      'mlsName': 'FMLS',
      'mlsNumber': '7569910',
      'listingAgent': {
        'name': 'John Attaway',
        'phone': '4707797297',
        'email': 'john@simpleshowing.com',
        'website': 'http://www.johnattaway.com'
      },
      'listingOffice': {
        'name': 'Simple Showing, Inc',
        'phone': '4709466499',
        'email': 'fred@simpleshowing.com'
      },
      'history': {
        '2025-04-29': {
          'event': 'Sale Listing',
          'price': 419000,
          'listingType': 'Standard',
          'listedDate': '2025-04-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 292
        }
      }
    },
    {
      'id': '1994-Marvin-Ln-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1994 Marvin Ln SW, Atlanta, GA 30311',
      'addressLine1': '1994 Marvin Ln SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.70061,
      'longitude': -84.472736,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1053,
      'lotSize': 10716,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 204000,
      'listingType': 'Standard',
      'listedDate': '2025-04-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.564Z',
      'daysOnMarket': 299,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10505095',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-22': {
          'event': 'Sale Listing',
          'price': 204000,
          'listingType': 'Standard',
          'listedDate': '2025-04-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 299
        }
      }
    },
    {
      'id': '1011-Hubbard-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1011 Hubbard St SW, Atlanta, GA 30310',
      'addressLine1': '1011 Hubbard St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727415,
      'longitude': -84.402627,
      'propertyType': 'Land',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 990,
      'lotSize': 5009,
      'yearBuilt': 2004,
      'status': 'Active',
      'price': 95000,
      'listingType': 'Standard',
      'listedDate': '2025-04-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-16T17:14:58.980Z',
      'lastSeenDate': '2026-02-14T11:27:05.563Z',
      'daysOnMarket': 300,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10505015',
      'listingAgent': {
        'name': 'The Harris Team',
        'phone': '7706308723',
        'email': 'billsellsatl@gmail.com',
        'website': 'http://www.theharristeamrealty.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-04-21': {
          'event': 'Sale Listing',
          'price': 95000,
          'listingType': 'Standard',
          'listedDate': '2025-04-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 300
        }
      }
    },
    {
      'id': '1267-Lyle-Pl-NW,-Unit-1267,-Atlanta,-GA-30318',
      'formattedAddress': '1267 Lyle Pl NW, Unit 1267, Atlanta, GA 30318',
      'addressLine1': '1267 Lyle Pl NW',
      'addressLine2': 'Unit 1267',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.78936,
      'longitude': -84.394995,
      'propertyType': 'Multi-Family',
      'lotSize': 2701,
      'yearBuilt': 1935,
      'status': 'Active',
      'price': 550000,
      'listingType': 'Standard',
      'listedDate': '2025-04-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.562Z',
      'daysOnMarket': 291,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10511496',
      'listingAgent': {
        'name': 'Tanya Oursler',
        'phone': '6789077400',
        'email': 'toursler@bellsouth.net',
        'website': 'http://tanyaoursler.atlantagahomes.com/'
      },
      'listingOffice': {
        'name': 'REALTY ASSOCIATES OF ATLANTA LLC',
        'phone': '4042358900',
        'email': 'kwright@realtyassociatesofatlanta.com',
        'website': 'www.realtyassociatesofatlanta.com'
      },
      'history': {
        '2025-04-30': {
          'event': 'Sale Listing',
          'price': 550000,
          'listingType': 'Standard',
          'listedDate': '2025-04-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 291
        }
      }
    },
    {
      'id': '6405-Beaver-Creek-Trl,-Atlanta,-GA-30349',
      'formattedAddress': '6405 Beaver Creek Trl, Atlanta, GA 30349',
      'addressLine1': '6405 Beaver Creek Trl',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.580458,
      'longitude': -84.488595,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3,
      'squareFootage': 2067,
      'lotSize': 6460,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 28
      },
      'status': 'Active',
      'price': 300000,
      'listingType': 'Standard',
      'listedDate': '2025-05-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.562Z',
      'daysOnMarket': 289,
      'mlsName': 'FMLS',
      'mlsNumber': '7572116',
      'listingAgent': {
        'name': 'Tanya Pickens',
        'phone': '7706564242',
        'email': 'tanyasmortgage@yahoo.com'
      },
      'listingOffice': {
        'name': 'Opendoor Brokerage, LLC',
        'phone': '18883527075',
        'email': 'homes@opendoor.com',
        'website': 'https://www.opendoor.com'
      },
      'history': {
        '2025-01-31': {
          'event': 'Sale Listing',
          'price': 357900,
          'listingType': 'Standard',
          'listedDate': '2025-01-31T00:00:00.000Z',
          'removedDate': '2025-04-10T00:00:00.000Z',
          'daysOnMarket': 69
        },
        '2025-05-02': {
          'event': 'Sale Listing',
          'price': 300000,
          'listingType': 'Standard',
          'listedDate': '2025-05-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 289
        }
      }
    },
    {
      'id': '960-Lawton-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '960 Lawton St SW, Atlanta, GA 30310',
      'addressLine1': '960 Lawton St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728897,
      'longitude': -84.422852,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1326,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 600
      },
      'status': 'Active',
      'price': 250000,
      'listingType': 'New Construction',
      'listedDate': '2025-04-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.560Z',
      'daysOnMarket': 298,
      'mlsName': 'FMLS',
      'mlsNumber': '7564555',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-04-23': {
          'event': 'Sale Listing',
          'price': 250000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 298
        }
      }
    },
    {
      'id': '310-Oak-Dr-SE,-Atlanta,-GA-30354',
      'formattedAddress': '310 Oak Dr SE, Atlanta, GA 30354',
      'addressLine1': '310 Oak Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.668719,
      'longitude': -84.383198,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 1.5,
      'squareFootage': 1325,
      'lotSize': 14201,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 199000,
      'listingType': 'Standard',
      'listedDate': '2025-04-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.558Z',
      'daysOnMarket': 292,
      'mlsName': 'FMLS',
      'mlsNumber': '7563992',
      'listingAgent': {
        'name': 'Robert Salmons',
        'phone': '8882166364',
        'email': 'rsgl@enterarealty.com',
        'website': 'www.enterarealty.com'
      },
      'listingOffice': {
        'name': 'Entera Realty, LLC',
        'phone': '8882166364',
        'email': 'rsgl@enterarealty.com',
        'website': 'www.entera.ai'
      },
      'history': {
        '2025-04-29': {
          'event': 'Sale Listing',
          'price': 199000,
          'listingType': 'Standard',
          'listedDate': '2025-04-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 292
        }
      }
    },
    {
      'id': '3475-Oak-Valley-Rd-NE,-Apt-2940,-Atlanta,-GA-30326',
      'formattedAddress': '3475 Oak Valley Rd NE, Apt 2940, Atlanta, GA 30326',
      'addressLine1': '3475 Oak Valley Rd NE',
      'addressLine2': 'Apt 2940',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.850152,
      'longitude': -84.359261,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2900,
      'lotSize': 2100,
      'yearBuilt': 1992,
      'hoa': {
        'fee': 1540
      },
      'status': 'Active',
      'price': 1049000,
      'listingType': 'Standard',
      'listedDate': '2025-04-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-10-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.557Z',
      'daysOnMarket': 294,
      'mlsName': 'FMLS',
      'mlsNumber': '7565766',
      'listingAgent': {
        'name': 'Marci G Robinson',
        'phone': '4044788495'
      },
      'listingOffice': {
        'name': 'Hirsh Real Estate Sandy Springs',
        'phone': '4048702189',
        'email': 'wendy03@bellsouth.net',
        'website': 'http://www.georgiareoteam.com'
      },
      'history': {
        '2024-10-07': {
          'event': 'Sale Listing',
          'price': 1399000,
          'listingType': 'Standard',
          'listedDate': '2024-10-07T00:00:00.000Z',
          'removedDate': '2025-03-25T00:00:00.000Z',
          'daysOnMarket': 169
        },
        '2025-04-27': {
          'event': 'Sale Listing',
          'price': 1049000,
          'listingType': 'Standard',
          'listedDate': '2025-04-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 294
        }
      }
    },
    {
      'id': '660-Thomasville-Blvd-SE,-Atlanta,-GA-30315',
      'formattedAddress': '660 Thomasville Blvd SE, Atlanta, GA 30315',
      'addressLine1': '660 Thomasville Blvd SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.704561,
      'longitude': -84.365982,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1.5,
      'squareFootage': 1464,
      'lotSize': 11587,
      'yearBuilt': 1986,
      'status': 'Active',
      'price': 242000,
      'listingType': 'Standard',
      'listedDate': '2025-05-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.557Z',
      'daysOnMarket': 290,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10511663',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-01': {
          'event': 'Sale Listing',
          'price': 242000,
          'listingType': 'Standard',
          'listedDate': '2025-05-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 290
        }
      }
    },
    {
      'id': '997-Boulevard-SE,-Atlanta,-GA-30312',
      'formattedAddress': '997 Boulevard SE, Atlanta, GA 30312',
      'addressLine1': '997 Boulevard SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727197,
      'longitude': -84.368793,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 4,
      'squareFootage': 1350,
      'lotSize': 9148,
      'yearBuilt': 1929,
      'status': 'Active',
      'price': 615000,
      'listingType': 'Standard',
      'listedDate': '2025-04-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.556Z',
      'daysOnMarket': 292,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10510702',
      'listingAgent': {
        'name': 'Nadia Riddock',
        'phone': '8649169769',
        'email': 'nadia.riddock@bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'Midland Real Estate Services',
        'phone': '4049631314',
        'email': 'mresllc@gmail.com'
      },
      'history': {
        '2025-04-29': {
          'event': 'Sale Listing',
          'price': 615000,
          'listingType': 'Standard',
          'listedDate': '2025-04-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 292
        }
      }
    },
    {
      'id': '1417-Lavender-Dr-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1417 Lavender Dr NW, Atlanta, GA 30314',
      'addressLine1': '1417 Lavender Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.761527,
      'longitude': -84.434261,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1.5,
      'squareFootage': 1206,
      'lotSize': 6490,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 219000,
      'listingType': 'Standard',
      'listedDate': '2025-04-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.556Z',
      'daysOnMarket': 291,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10510865',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-04-30': {
          'event': 'Sale Listing',
          'price': 219000,
          'listingType': 'Standard',
          'listedDate': '2025-04-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 291
        }
      }
    },
    {
      'id': '1267-Lyle-Pl-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1267 Lyle Pl NW, Atlanta, GA 30318',
      'addressLine1': '1267 Lyle Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.78936,
      'longitude': -84.394995,
      'propertyType': 'Multi-Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 598,
      'lotSize': 2701,
      'yearBuilt': 1935,
      'status': 'Active',
      'price': 550000,
      'listingType': 'Standard',
      'listedDate': '2025-04-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.555Z',
      'daysOnMarket': 291,
      'mlsName': 'FMLS',
      'mlsNumber': '7570774',
      'listingAgent': {
        'name': 'Tanya Oursler',
        'phone': '6789077400',
        'email': 'toursler@bellsouth.net',
        'website': 'http://tanyaoursler.atlantagahomes.com/'
      },
      'listingOffice': {
        'name': 'REALTY ASSOCIATES OF ATLANTA LLC',
        'phone': '4042358900',
        'email': 'kwright@realtyassociatesofatlanta.com',
        'website': 'www.realtyassociatesofatlanta.com'
      },
      'history': {
        '2025-04-30': {
          'event': 'Sale Listing',
          'price': 550000,
          'listingType': 'Standard',
          'listedDate': '2025-04-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 291
        }
      }
    },
    {
      'id': '5735-Old-Bill-Cook-Rd,-Atlanta,-GA-30349',
      'formattedAddress': '5735 Old Bill Cook Rd, Atlanta, GA 30349',
      'addressLine1': '5735 Old Bill Cook Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.599964,
      'longitude': -84.489022,
      'propertyType': 'Land',
      'bedrooms': 2,
      'bathrooms': 1,
      'lotSize': 313153,
      'yearBuilt': 1946,
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-04-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.553Z',
      'daysOnMarket': 293,
      'mlsName': 'FMLS',
      'mlsNumber': '7564740',
      'listingAgent': {
        'name': 'Willie Arnold',
        'phone': '4045783281',
        'email': 'warnold@keeandwill.com',
        'website': 'http://www.keeandwill.com'
      },
      'listingOffice': {
        'name': 'Norluxe Realty Atlanta',
        'phone': '4702231981',
        'email': 'reo@normanliving.com',
        'website': 'http://www.normanliving.com/'
      },
      'history': {
        '2025-04-28': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-04-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 293
        }
      }
    },
    {
      'id': 'Birch-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': 'Birch St SW, Atlanta, GA 30310',
      'addressLine1': 'Birch St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.705784,
      'longitude': -84.424061,
      'propertyType': 'Land',
      'lotSize': 9670,
      'status': 'Active',
      'price': 150000,
      'listingType': 'Standard',
      'listedDate': '2025-04-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.553Z',
      'daysOnMarket': 291,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10510978',
      'listingAgent': {
        'name': 'Jennifer Butler',
        'phone': '6789208466',
        'email': 'jbinatlanta@gmail.com',
        'website': 'http://www.jenniferbutler.phpatl.com'
      },
      'listingOffice': {
        'name': 'NorthGroup Real Estate',
        'phone': '9804471771',
        'email': 'lindy@northgroupre.com',
        'website': 'www.northgroupre.com'
      },
      'history': {
        '2025-04-30': {
          'event': 'Sale Listing',
          'price': 150000,
          'listingType': 'Standard',
          'listedDate': '2025-04-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 291
        }
      }
    },
    {
      'id': '2479-Peachtree-Rd-NE,-Apt-601,-Atlanta,-GA-30305',
      'formattedAddress': '2479 Peachtree Rd NE, Apt 601, Atlanta, GA 30305',
      'addressLine1': '2479 Peachtree Rd NE',
      'addressLine2': 'Apt 601',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.822471,
      'longitude': -84.38646,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 837,
      'lotSize': 828,
      'yearBuilt': 1967,
      'hoa': {
        'fee': 851
      },
      'status': 'Active',
      'price': 159700,
      'listingType': 'Standard',
      'listedDate': '2025-05-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.552Z',
      'daysOnMarket': 290,
      'mlsName': 'FMLS',
      'mlsNumber': '7571070',
      'listingAgent': {
        'name': 'George Chong',
        'phone': '4045238818',
        'email': 'george@golleyteam.com'
      },
      'listingOffice': {
        'name': 'GOLLEY REALTY GROUP',
        'phone': '4043774216',
        'email': 'frank@golleyrealty.com',
        'website': 'http://www.golleyrealty.com'
      },
      'history': {
        '2025-05-01': {
          'event': 'Sale Listing',
          'price': 159700,
          'listingType': 'Standard',
          'listedDate': '2025-05-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 290
        }
      }
    },
    {
      'id': '788-W-Marietta-St-NW,-Unit-905,-Atlanta,-GA-30318',
      'formattedAddress': '788 W Marietta St NW, Unit 905, Atlanta, GA 30318',
      'addressLine1': '788 W Marietta St NW',
      'addressLine2': 'Unit 905',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.779748,
      'longitude': -84.414056,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1345,
      'lotSize': 1346,
      'yearBuilt': 2020,
      'hoa': {
        'fee': 664
      },
      'status': 'Active',
      'price': 680000,
      'listingType': 'Standard',
      'listedDate': '2025-05-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.551Z',
      'daysOnMarket': 290,
      'mlsName': 'FMLS',
      'mlsNumber': '7571748',
      'listingAgent': {
        'name': 'Kun Wang',
        'phone': '3472004480',
        'email': 'aileenwangrealtor@gmail.com'
      },
      'listingOffice': {
        'name': 'Aileen Realty, LLC',
        'phone': '3472004480',
        'email': 'aileenwangrealtor@gmail.com'
      },
      'history': {
        '2025-05-01': {
          'event': 'Sale Listing',
          'price': 680000,
          'listingType': 'Standard',
          'listedDate': '2025-05-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 290
        }
      }
    },
    {
      'id': '2881-Peachtree-Rd-NE,-Apt-2304,-Atlanta,-GA-30305',
      'formattedAddress': '2881 Peachtree Rd NE, Apt 2304, Atlanta, GA 30305',
      'addressLine1': '2881 Peachtree Rd NE',
      'addressLine2': 'Apt 2304',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.833096,
      'longitude': -84.383172,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 4778,
      'lotSize': 4779,
      'yearBuilt': 2001,
      'status': 'Active',
      'price': 2500000,
      'listingType': 'Standard',
      'listedDate': '2025-05-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.549Z',
      'daysOnMarket': 286,
      'mlsName': 'FMLS',
      'mlsNumber': '7571932',
      'listingAgent': {
        'name': 'Bobbie Schmitt',
        'phone': '4049644662',
        'email': 'bobbieschmitt@ansleyre.com',
        'website': 'http://www.bobbieschmitt.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate | Christie\'s International Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyatlanta.com'
      },
      'history': {
        '2025-05-05': {
          'event': 'Sale Listing',
          'price': 2500000,
          'listingType': 'Standard',
          'listedDate': '2025-05-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 286
        }
      }
    },
    {
      'id': '2930-Waters-Rd-SW,-Atlanta,-GA-30354',
      'formattedAddress': '2930 Waters Rd SW, Atlanta, GA 30354',
      'addressLine1': '2930 Waters Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.675126,
      'longitude': -84.394621,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1.5,
      'squareFootage': 1008,
      'lotSize': 10019,
      'yearBuilt': 1969,
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-05-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.548Z',
      'daysOnMarket': 290,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10511656',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-01': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-05-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 290
        }
      }
    },
    {
      'id': '830-Mercury-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '830 Mercury Dr NW, Atlanta, GA 30331',
      'addressLine1': '830 Mercury Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.776951,
      'longitude': -84.509389,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 925,
      'lotSize': 18295,
      'yearBuilt': 1961,
      'status': 'Active',
      'price': 193000,
      'listingType': 'Standard',
      'listedDate': '2025-05-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.547Z',
      'daysOnMarket': 290,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10511679',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-01': {
          'event': 'Sale Listing',
          'price': 193000,
          'listingType': 'Standard',
          'listedDate': '2025-05-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 290
        }
      }
    },
    {
      'id': '686-Exchange-St-SE,-Atlanta,-GA-30315',
      'formattedAddress': '686 Exchange St SE, Atlanta, GA 30315',
      'addressLine1': '686 Exchange St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.736039,
      'longitude': -84.386827,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1232,
      'lotSize': 871,
      'yearBuilt': 2021,
      'hoa': {
        'fee': 185
      },
      'status': 'Active',
      'price': 479900,
      'listingType': 'Standard',
      'listedDate': '2025-05-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.547Z',
      'daysOnMarket': 289,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10513804',
      'listingAgent': {
        'name': 'Ciara Pardee',
        'email': 'ciarapardee@kw.com'
      },
      'listingOffice': {
        'name': 'Atlantic Real Estate Brks, Llc',
        'phone': '4046263467',
        'email': 'atlanticrealestatebrokers@gmail.com'
      },
      'history': {
        '2024-06-14': {
          'event': 'Sale Listing',
          'price': 519900,
          'listingType': 'Standard',
          'listedDate': '2024-06-14T00:00:00.000Z',
          'removedDate': '2024-10-04T00:00:00.000Z',
          'daysOnMarket': 112
        },
        '2024-11-01': {
          'event': 'Sale Listing',
          'price': 499999,
          'listingType': 'Standard',
          'listedDate': '2024-11-01T00:00:00.000Z',
          'removedDate': '2025-01-17T00:00:00.000Z',
          'daysOnMarket': 77
        },
        '2025-01-17': {
          'event': 'Sale Listing',
          'price': 515000,
          'listingType': 'Standard',
          'listedDate': '2025-01-17T00:00:00.000Z',
          'removedDate': '2025-05-02T00:00:00.000Z',
          'daysOnMarket': 105
        },
        '2025-05-02': {
          'event': 'Sale Listing',
          'price': 479900,
          'listingType': 'Standard',
          'listedDate': '2025-05-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 289
        }
      }
    },
    {
      'id': '3640-Union-Rd-SW,-Atlanta,-GA-30349',
      'formattedAddress': '3640 Union Rd SW, Atlanta, GA 30349',
      'addressLine1': '3640 Union Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.656078,
      'longitude': -84.565267,
      'propertyType': 'Land',
      'lotSize': 51401,
      'status': 'Active',
      'price': 125000,
      'listingType': 'Standard',
      'listedDate': '2025-05-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:27:05.546Z',
      'daysOnMarket': 286,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10514989',
      'listingAgent': {
        'name': 'Elaine Bryant',
        'phone': '7702522266',
        'email': 'elainebryant@kw.com',
        'website': 'http://www.buyitfrombryant.com'
      },
      'listingOffice': {
        'name': 'Southern Real Estate Properties',
        'phone': '6787251516',
        'email': 'maryannsheltonrealtor@gmail.com'
      },
      'history': {
        '2025-05-05': {
          'event': 'Sale Listing',
          'price': 125000,
          'listingType': 'Standard',
          'listedDate': '2025-05-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 286
        }
      }
    },
    {
      'id': '455-Lynch-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '455 Lynch Ave NW, Atlanta, GA 30318',
      'addressLine1': '455 Lynch Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.782396,
      'longitude': -84.402026,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1336,
      'lotSize': 4400,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 600000,
      'listingType': 'Standard',
      'listedDate': '2025-05-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-09-08T15:22:06.989Z',
      'lastSeenDate': '2026-02-14T11:27:05.543Z',
      'daysOnMarket': 289,
      'mlsName': 'FMLS',
      'mlsNumber': '7572571',
      'listingAgent': {
        'name': 'Square Real Estate Consultants',
        'phone': '4044527681',
        'email': 'square.re.consultants@gmail.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7709939200',
        'email': 'caroline.wilson@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/roswell/office/north-fulton/oid_3280/'
      },
      'history': {
        '2025-05-02': {
          'event': 'Sale Listing',
          'price': 600000,
          'listingType': 'Standard',
          'listedDate': '2025-05-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 289
        }
      }
    },
    {
      'id': '20-Marietta-St-NW,-Apt-10F,-Atlanta,-GA-30303',
      'formattedAddress': '20 Marietta St NW, Apt 10F, Atlanta, GA 30303',
      'addressLine1': '20 Marietta St NW',
      'addressLine2': 'Apt 10F',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30303',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.754574,
      'longitude': -84.390623,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 543,
      'lotSize': 566,
      'yearBuilt': 1995,
      'hoa': {
        'fee': 389
      },
      'status': 'Active',
      'price': 138000,
      'listingType': 'Standard',
      'listedDate': '2025-05-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-16T19:12:04.768Z',
      'lastSeenDate': '2026-02-14T11:26:08.552Z',
      'daysOnMarket': 276,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10519944',
      'listingAgent': {
        'name': 'Henriette Wilhelm',
        'phone': '4703269302',
        'email': 'hennysellseverything@gmail.com'
      },
      'listingOffice': {
        'name': 'CHAPMAN HALL REALTORS PROF.',
        'phone': '6787300080',
        'email': 'admin@chapmanhallprofessionals.com',
        'website': 'www.chapmanhallprofessionals.com'
      },
      'history': {
        '2025-05-15': {
          'event': 'Sale Listing',
          'price': 138000,
          'listingType': 'Standard',
          'listedDate': '2025-05-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 276
        }
      }
    },
    {
      'id': '950-W-Peachtree-St-NW,-Unit-1613,-Atlanta,-GA-30309',
      'formattedAddress': '950 W Peachtree St NW, Unit 1613, Atlanta, GA 30309',
      'addressLine1': '950 W Peachtree St NW',
      'addressLine2': 'Unit 1613',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780059,
      'longitude': -84.388114,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 828,
      'lotSize': 828,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 403
      },
      'status': 'Active',
      'price': 319900,
      'listingType': 'Standard',
      'listedDate': '2025-05-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.551Z',
      'daysOnMarket': 276,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10522542',
      'listingAgent': {
        'name': 'Todd Hale',
        'phone': '4048220230',
        'email': 'cthale@aol.com'
      },
      'listingOffice': {
        'name': 'Ansley RE|Christie\'s Int\'l RE',
        'phone': '4043136331',
        'email': 'lane@ansleyre.com',
        'website': 'https://www.ansleyatlanta.com'
      },
      'history': {
        '2025-05-15': {
          'event': 'Sale Listing',
          'price': 319900,
          'listingType': 'Standard',
          'listedDate': '2025-05-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 276
        }
      }
    },
    {
      'id': '3324-Peachtree-Rd-NE,-Unit-3001,-Atlanta,-GA-30326',
      'formattedAddress': '3324 Peachtree Rd NE, Unit 3001, Atlanta, GA 30326',
      'addressLine1': '3324 Peachtree Rd NE',
      'addressLine2': 'Unit 3001',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84597,
      'longitude': -84.369381,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1920,
      'lotSize': 1917,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 1166
      },
      'status': 'Active',
      'price': 899000,
      'listingType': 'Standard',
      'listedDate': '2025-05-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.550Z',
      'daysOnMarket': 286,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10515026',
      'listingAgent': {
        'name': 'Celine Higgins',
        'phone': '6789159422',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'simplylistatlanta.com'
      },
      'listingOffice': {
        'name': 'Simply List',
        'phone': '4703091545',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'http://www.simplylistatlanta.com'
      },
      'history': {
        '2025-05-05': {
          'event': 'Sale Listing',
          'price': 899000,
          'listingType': 'Standard',
          'listedDate': '2025-05-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 286
        }
      }
    },
    {
      'id': '390-17th-St-NW,-Unit-5008,-Atlanta,-GA-30363',
      'formattedAddress': '390 17th St NW, Unit 5008, Atlanta, GA 30363',
      'addressLine1': '390 17th St NW',
      'addressLine2': 'Unit 5008',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30363',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.790317,
      'longitude': -84.3995,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 978,
      'lotSize': 1002,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 500
      },
      'status': 'Active',
      'price': 210000,
      'listingType': 'Standard',
      'listedDate': '2025-05-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.549Z',
      'daysOnMarket': 286,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10515449',
      'listingAgent': {
        'name': 'Mike Hinton',
        'phone': '4043171032',
        'email': 'mike.hinton1@yahoo.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'kpalmer@phpatlanta.com',
        'website': 'https://www.palmerhouseproperties.com'
      },
      'history': {
        '2025-05-05': {
          'event': 'Sale Listing',
          'price': 210000,
          'listingType': 'Standard',
          'listedDate': '2025-05-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 286
        }
      }
    },
    {
      'id': '502-Pryor-St-SW,-Unit-125,-Atlanta,-GA-30312',
      'formattedAddress': '502 Pryor St SW, Unit 125, Atlanta, GA 30312',
      'addressLine1': '502 Pryor St SW',
      'addressLine2': 'Unit 125',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.741281,
      'longitude': -84.394001,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1200,
      'lotSize': 1307,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 370
      },
      'status': 'Active',
      'price': 199900,
      'listingType': 'Standard',
      'listedDate': '2025-05-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-12-28T11:42:23.737Z',
      'lastSeenDate': '2026-02-14T11:26:08.547Z',
      'daysOnMarket': 285,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10515534',
      'listingAgent': {
        'name': 'Regina Gray',
        'phone': '7706703032',
        'email': 'regina@regalrealtyllc.com'
      },
      'listingOffice': {
        'name': 'Regal Realty Group Llc',
        'phone': '7706703032',
        'email': 'reginamcdaniel@aol.com'
      },
      'history': {
        '2025-05-06': {
          'event': 'Sale Listing',
          'price': 199900,
          'listingType': 'Standard',
          'listedDate': '2025-05-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 285
        }
      }
    },
    {
      'id': '478-Emily-Reed-Ln,-Atlanta,-GA-30342',
      'formattedAddress': '478 Emily Reed Ln, Atlanta, GA 30342',
      'addressLine1': '478 Emily Reed Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.86407,
      'longitude': -84.374578,
      'propertyType': 'Land',
      'bedrooms': 5,
      'bathrooms': 5.5,
      'squareFootage': 7286,
      'lotSize': 18295,
      'yearBuilt': 2026,
      'hoa': {
        'fee': 104
      },
      'status': 'Active',
      'price': 799900,
      'listingType': 'Standard',
      'listedDate': '2025-05-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-11-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.543Z',
      'daysOnMarket': 284,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10516576',
      'listingAgent': {
        'name': 'Kelly Loudermilk',
        'phone': '4042360043',
        'email': 'roaneloudermilk@hotmail.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY BUCKHEAD',
        'phone': '4046043800',
        'email': 'klrw261@kw.com',
        'website': 'http://261.yourkwoffice.com/'
      },
      'history': {
        '2025-01-02': {
          'event': 'Sale Listing',
          'price': 799900,
          'listingType': 'Standard',
          'listedDate': '2025-01-02T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 119
        },
        '2025-05-07': {
          'event': 'Sale Listing',
          'price': 799900,
          'listingType': 'Standard',
          'listedDate': '2025-05-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 284
        }
      }
    },
    {
      'id': 'Elizabeth-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': 'Elizabeth Ave SW, Atlanta, GA 30310',
      'addressLine1': 'Elizabeth Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.719384,
      'longitude': -84.435838,
      'propertyType': 'Land',
      'lotSize': 6011,
      'status': 'Active',
      'price': 74900,
      'listingType': 'Standard',
      'listedDate': '2025-05-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.539Z',
      'daysOnMarket': 284,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10517097',
      'listingAgent': {
        'name': 'Noelle Foster',
        'phone': '6785596140',
        'email': 'team@stewartbrokers.com'
      },
      'listingOffice': {
        'name': 'STEWART BROKERS',
        'phone': '7704399999',
        'email': 'paul@stewartbrokers.com',
        'website': 'www.sellhomesfast.com'
      },
      'history': {
        '2025-05-07': {
          'event': 'Sale Listing',
          'price': 74900,
          'listingType': 'Standard',
          'listedDate': '2025-05-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 284
        }
      }
    },
    {
      'id': '3735-Boulder-Park-Dr-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3735 Boulder Park Dr SW, Atlanta, GA 30331',
      'addressLine1': '3735 Boulder Park Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.749533,
      'longitude': -84.509876,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3,
      'squareFootage': 1715,
      'lotSize': 30144,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 240000,
      'listingType': 'Standard',
      'listedDate': '2025-05-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-21T19:51:56.916Z',
      'lastSeenDate': '2026-02-14T11:26:08.538Z',
      'daysOnMarket': 283,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10517316',
      'listingAgent': {
        'name': 'Kerry Kretchmer',
        'phone': '6024836828',
        'email': 'kerry.kretchmer@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-05-08': {
          'event': 'Sale Listing',
          'price': 240000,
          'listingType': 'Standard',
          'listedDate': '2025-05-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 283
        }
      }
    },
    {
      'id': '45-Ivan-Allen-Jr-Blvd-NW,-Unit-1702,-Atlanta,-GA-30308',
      'formattedAddress': '45 Ivan Allen Jr Blvd NW, Unit 1702, Atlanta, GA 30308',
      'addressLine1': '45 Ivan Allen Jr Blvd NW',
      'addressLine2': 'Unit 1702',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765108,
      'longitude': -84.389219,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 1823,
      'lotSize': 1830,
      'yearBuilt': 2010,
      'hoa': {
        'fee': 1566
      },
      'status': 'Active',
      'price': 699900,
      'listingType': 'Standard',
      'listedDate': '2025-05-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-10-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.536Z',
      'daysOnMarket': 283,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10517870',
      'listingAgent': {
        'name': 'Marc Castillo',
        'phone': '4042621234',
        'email': 'marc.castillo@coldwellbankeratlanta.com',
        'website': 'http://marccastillo.com/'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4042621234',
        'email': 'debra.bradley@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/buckhead/oid_3218/'
      },
      'history': {
        '2023-10-13': {
          'event': 'Sale Listing',
          'price': 799000,
          'listingType': 'Standard',
          'listedDate': '2023-10-13T00:00:00.000Z',
          'removedDate': '2024-10-14T00:00:00.000Z',
          'daysOnMarket': 367
        },
        '2025-05-08': {
          'event': 'Sale Listing',
          'price': 699900,
          'listingType': 'Standard',
          'listedDate': '2025-05-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 283
        }
      }
    },
    {
      'id': '172-Haynes-St-SW,-Unit-105,-Atlanta,-GA-30313',
      'formattedAddress': '172 Haynes St SW, Unit 105, Atlanta, GA 30313',
      'addressLine1': '172 Haynes St SW',
      'addressLine2': 'Unit 105',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.749781,
      'longitude': -84.400103,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1460,
      'lotSize': 741,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 214500,
      'listingType': 'Standard',
      'listedDate': '2025-05-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.536Z',
      'daysOnMarket': 283,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10518010',
      'listingAgent': {
        'name': 'Chevel Brown',
        'phone': '4045094120',
        'email': 'cbrown@limitlessholdingsrev.com'
      },
      'listingOffice': {
        'name': 'Limitless Holdings RE Brokerage',
        'phone': '4045094120',
        'email': 'cbrown@limitlessholdingsrev.com'
      },
      'history': {
        '2024-06-07': {
          'event': 'Sale Listing',
          'price': 199900,
          'listingType': 'Standard',
          'listedDate': '2024-06-07T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 328
        },
        '2025-05-08': {
          'event': 'Sale Listing',
          'price': 214500,
          'listingType': 'Standard',
          'listedDate': '2025-05-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 283
        }
      }
    },
    {
      'id': '488-Vine-St-NW,-Atlanta,-GA-30318',
      'formattedAddress': '488 Vine St NW, Atlanta, GA 30318',
      'addressLine1': '488 Vine St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.767872,
      'longitude': -84.407929,
      'propertyType': 'Land',
      'lotSize': 3006,
      'status': 'Active',
      'price': 89900,
      'listingType': 'Standard',
      'listedDate': '2025-05-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-11-10T10:20:37.257Z',
      'lastSeenDate': '2026-02-14T11:26:08.534Z',
      'daysOnMarket': 283,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10518166',
      'listingAgent': {
        'name': 'Shery Bailey',
        'phone': '6786445820',
        'email': 'sherrybailey68@gmail.com',
        'website': 'http://www.sherrybailey.info'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4042621234',
        'email': 'debra.bradley@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/buckhead/oid_3218/'
      },
      'history': {
        '2024-07-22': {
          'event': 'Sale Listing',
          'price': 115000,
          'listingType': 'Standard',
          'listedDate': '2024-07-22T00:00:00.000Z',
          'removedDate': '2025-01-02T00:00:00.000Z',
          'daysOnMarket': 164
        },
        '2025-05-08': {
          'event': 'Sale Listing',
          'price': 89900,
          'listingType': 'Standard',
          'listedDate': '2025-05-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 283
        }
      }
    },
    {
      'id': '477-Emily-Reed-Ln,-Atlanta,-GA-30342',
      'formattedAddress': '477 Emily Reed Ln, Atlanta, GA 30342',
      'addressLine1': '477 Emily Reed Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.863506,
      'longitude': -84.374992,
      'propertyType': 'Land',
      'bedrooms': 5,
      'bathrooms': 5.5,
      'squareFootage': 4500,
      'lotSize': 19602,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 104
      },
      'status': 'Active',
      'price': 814900,
      'listingType': 'Standard',
      'listedDate': '2025-05-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-11-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.532Z',
      'daysOnMarket': 282,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10518792',
      'listingAgent': {
        'name': 'Kelly Loudermilk',
        'phone': '4042360043',
        'email': 'roaneloudermilk@hotmail.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY BUCKHEAD',
        'phone': '4046043800',
        'email': 'klrw261@kw.com',
        'website': 'http://261.yourkwoffice.com/'
      },
      'history': {
        '2025-01-02': {
          'event': 'Sale Listing',
          'price': 814900,
          'listingType': 'Standard',
          'listedDate': '2025-01-02T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 119
        },
        '2025-05-09': {
          'event': 'Sale Listing',
          'price': 814900,
          'listingType': 'Standard',
          'listedDate': '2025-05-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 282
        }
      }
    },
    {
      'id': '100-Sheridan-Dr-NE,-Atlanta,-GA-30305',
      'formattedAddress': '100 Sheridan Dr NE, Atlanta, GA 30305',
      'addressLine1': '100 Sheridan Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.832218,
      'longitude': -84.380768,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3.5,
      'squareFootage': 3070,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 288
      },
      'status': 'Active',
      'price': 2052419,
      'listingType': 'New Construction',
      'listedDate': '2025-05-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.531Z',
      'daysOnMarket': 282,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10519015',
      'listingAgent': {
        'name': 'Allyson Golightly',
        'phone': '4042345989',
        'email': 'golightlyally@gmail.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'adminatlanta@compass.com'
      },
      'history': {
        '2025-05-09': {
          'event': 'Sale Listing',
          'price': 2052419,
          'listingType': 'New Construction',
          'listedDate': '2025-05-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 282
        }
      }
    },
    {
      'id': '542-Ralph-Mcgill-Blvd-NE,-Apt-7,-Atlanta,-GA-30312',
      'formattedAddress': '542 Ralph Mcgill Blvd NE, Apt 7, Atlanta, GA 30312',
      'addressLine1': '542 Ralph Mcgill Blvd NE',
      'addressLine2': 'Apt 7',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.764232,
      'longitude': -84.36959,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 722,
      'lotSize': 7230960,
      'yearBuilt': 1955,
      'hoa': {
        'fee': 29
      },
      'status': 'Active',
      'price': 324500,
      'listingType': 'Standard',
      'listedDate': '2025-05-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-03-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.528Z',
      'daysOnMarket': 280,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10519798',
      'listingAgent': {
        'name': 'Melissa Horbelt',
        'phone': '7067019011',
        'email': 'mhorbelt@yatesestatesga.com',
        'website': 'http://melissa_yates-estates.mailchimpsites.com'
      },
      'listingOffice': {
        'name': '1st Class RE Lanier Group',
        'phone': '7067019011',
        'email': 'warren.horbelt@1stclassagents.com',
        'website': 'https://laniergroup.1stclassrealestate.com/'
      },
      'history': {
        '2025-05-11': {
          'event': 'Sale Listing',
          'price': 324500,
          'listingType': 'Standard',
          'listedDate': '2025-05-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 280
        }
      }
    },
    {
      'id': '1130-Angelo-Ct-NE,-Atlanta,-GA-30319',
      'formattedAddress': '1130 Angelo Ct NE, Atlanta, GA 30319',
      'addressLine1': '1130 Angelo Ct NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30319',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.881638,
      'longitude': -84.350287,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4.5,
      'squareFootage': 3363,
      'lotSize': 27343,
      'yearBuilt': 1962,
      'status': 'Active',
      'price': 1295000,
      'listingType': 'Standard',
      'listedDate': '2025-05-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.527Z',
      'daysOnMarket': 280,
      'mlsName': 'FMLS',
      'mlsNumber': '7575978',
      'listingAgent': {
        'name': 'Cathy Boston',
        'phone': '4048145468',
        'email': 'cgboston@yahoo.com',
        'website': 'http://www.cathyboston.com'
      },
      'listingOffice': {
        'name': 'Home Real Estate, LLC',
        'phone': '4043834663',
        'website': 'www.homegeorgia.com'
      },
      'history': {
        '2025-05-11': {
          'event': 'Sale Listing',
          'price': 1295000,
          'listingType': 'Standard',
          'listedDate': '2025-05-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 280
        }
      }
    },
    {
      'id': '145-15th-St-NE,-Apt-1015,-Atlanta,-GA-30309',
      'formattedAddress': '145 15th St NE, Apt 1015, Atlanta, GA 30309',
      'addressLine1': '145 15th St NE',
      'addressLine2': 'Apt 1015',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.788339,
      'longitude': -84.382561,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 862,
      'lotSize': 862,
      'yearBuilt': 1972,
      'hoa': {
        'fee': 835
      },
      'status': 'Active',
      'price': 310000,
      'listingType': 'Standard',
      'listedDate': '2025-05-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.526Z',
      'daysOnMarket': 279,
      'mlsName': 'FMLS',
      'mlsNumber': '7557629',
      'listingAgent': {
        'name': 'Kathy Olmstead',
        'phone': '4045505203',
        'email': 'kathy.olmstead@harrynorman.com',
        'website': 'http://www.harrynorman.com'
      },
      'listingOffice': {
        'name': 'Home Real Estate, LLC',
        'phone': '4043834663',
        'website': 'www.homegeorgia.com'
      },
      'history': {
        '2025-05-12': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2025-05-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 279
        }
      }
    },
    {
      'id': '485-Emily-Reed-Ln,-Atlanta,-GA-30342',
      'formattedAddress': '485 Emily Reed Ln, Atlanta, GA 30342',
      'addressLine1': '485 Emily Reed Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.863341,
      'longitude': -84.374722,
      'propertyType': 'Land',
      'bedrooms': 5,
      'bathrooms': 5.5,
      'squareFootage': 6000,
      'lotSize': 21780,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 104
      },
      'status': 'Active',
      'price': 749900,
      'listingType': 'Standard',
      'listedDate': '2025-05-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-11-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.525Z',
      'daysOnMarket': 278,
      'mlsName': 'FMLS',
      'mlsNumber': '7576726',
      'listingAgent': {
        'name': 'Null The Loudermilk Group',
        'phone': '4046043800',
        'email': 'roane@loudermilk-designs.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY BUCKHEAD',
        'phone': '4046043800',
        'email': 'klrw261@kw.com',
        'website': 'http://261.yourkwoffice.com/'
      },
      'history': {
        '2025-01-02': {
          'event': 'Sale Listing',
          'price': 749900,
          'listingType': 'Standard',
          'listedDate': '2025-01-02T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 119
        },
        '2025-05-13': {
          'event': 'Sale Listing',
          'price': 749900,
          'listingType': 'Standard',
          'listedDate': '2025-05-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 278
        }
      }
    },
    {
      'id': '2440-Peachtree-Rd-NW,-Unit-9,-Atlanta,-GA-30305',
      'formattedAddress': '2440 Peachtree Rd NW, Unit 9, Atlanta, GA 30305',
      'addressLine1': '2440 Peachtree Rd NW',
      'addressLine2': 'Unit 9',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.821433,
      'longitude': -84.389107,
      'propertyType': 'Townhouse',
      'bedrooms': 5,
      'bathrooms': 5,
      'squareFootage': 4827,
      'lotSize': 1307,
      'yearBuilt': 2008,
      'status': 'Active',
      'price': 2995000,
      'listingType': 'Standard',
      'listedDate': '2025-05-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.525Z',
      'daysOnMarket': 278,
      'mlsName': 'FMLS',
      'mlsNumber': '7577879',
      'listingAgent': {
        'name': 'Diane Arnold',
        'phone': '4046263113',
        'email': 'dianearn@bellsouth.net',
        'website': 'http://www.dorseyalston.com'
      },
      'listingOffice': {
        'name': 'Dorsey Alston Realtors',
        'phone': '4043522010',
        'email': 'customerservice@dorseyalston.com',
        'website': 'www.dorseyalston.com'
      },
      'history': {
        '2025-05-13': {
          'event': 'Sale Listing',
          'price': 2995000,
          'listingType': 'Standard',
          'listedDate': '2025-05-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 278
        }
      }
    },
    {
      'id': '2102-Bolton-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2102 Bolton Rd NW, Atlanta, GA 30318',
      'addressLine1': '2102 Bolton Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.813288,
      'longitude': -84.471368,
      'propertyType': 'Land',
      'bedrooms': 1,
      'lotSize': 18295,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 500000,
      'listingType': 'Standard',
      'listedDate': '2025-05-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.524Z',
      'daysOnMarket': 278,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10521408',
      'listingAgent': {
        'name': 'Keith Sharp',
        'phone': '6787788774',
        'email': 'oksharp@kw.com',
        'website': 'http://www.keithsharp.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY BUCKHEAD',
        'phone': '4046043800',
        'email': 'klrw261@kw.com',
        'website': 'http://261.yourkwoffice.com/'
      },
      'history': {
        '2025-05-13': {
          'event': 'Sale Listing',
          'price': 500000,
          'listingType': 'Standard',
          'listedDate': '2025-05-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 278
        }
      }
    },
    {
      'id': '141-Nathan-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '141 Nathan Rd SW, Atlanta, GA 30331',
      'addressLine1': '141 Nathan Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.752927,
      'longitude': -84.502314,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1246,
      'lotSize': 9583,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 195000,
      'listingType': 'Standard',
      'listedDate': '2025-05-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-15T18:39:56.016Z',
      'lastSeenDate': '2026-02-14T11:26:08.523Z',
      'daysOnMarket': 278,
      'mlsName': 'FMLS',
      'mlsNumber': '7578878',
      'listingAgent': {
        'name': 'Jason Hatcher',
        'phone': '4048740300',
        'email': 'jasonhatcher@atlantafinehomes.com',
        'website': 'www.jasonhatcheratlanta.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-05-13': {
          'event': 'Sale Listing',
          'price': 195000,
          'listingType': 'Standard',
          'listedDate': '2025-05-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 278
        }
      }
    },
    {
      'id': 'Landrum-Dr-SW,-Atlanta,-GA-30311',
      'formattedAddress': 'Landrum Dr SW, Atlanta, GA 30311',
      'addressLine1': 'Landrum Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.706424,
      'longitude': -84.474999,
      'propertyType': 'Land',
      'lotSize': 18121,
      'status': 'Active',
      'price': 50000,
      'listingType': 'Standard',
      'listedDate': '2025-05-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-04-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.521Z',
      'daysOnMarket': 277,
      'mlsName': 'FMLS',
      'mlsNumber': '7579239',
      'listingAgent': {
        'name': 'Atlanta Propert Matchmakers',
        'phone': '4703771220',
        'email': 'jalicardi@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Consultants',
        'phone': '6782874800',
        'email': 'klrw367@kw.com',
        'website': 'http://www.kwroswell.com'
      },
      'history': {
        '2024-04-11': {
          'event': 'Sale Listing',
          'price': 50000,
          'listingType': 'Standard',
          'listedDate': '2024-04-11T00:00:00.000Z',
          'removedDate': '2025-04-04T00:00:00.000Z',
          'daysOnMarket': 358
        },
        '2025-05-14': {
          'event': 'Sale Listing',
          'price': 50000,
          'listingType': 'Standard',
          'listedDate': '2025-05-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 277
        }
      }
    },
    {
      'id': '3593-Adkins-Rd-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3593 Adkins Rd NW, Atlanta, GA 30331',
      'addressLine1': '3593 Adkins Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.771996,
      'longitude': -84.506713,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1000,
      'lotSize': 10067,
      'yearBuilt': 1961,
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-05-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-12-16T08:19:59.018Z',
      'lastSeenDate': '2026-02-14T11:26:08.519Z',
      'daysOnMarket': 277,
      'mlsName': 'FMLS',
      'mlsNumber': '7579158',
      'listingAgent': {
        'name': 'Rasheda Randle',
        'phone': '6782521900',
        'email': 'rashedarandle@kw.com'
      },
      'listingOffice': {
        'name': 'CENTURY 21 Connect Realty',
        'phone': '7706406800',
        'email': 'mikep@c21connectrealty.com',
        'website': 'http://www.c21connectrealty.com/'
      },
      'history': {
        '2025-05-14': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-05-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 277
        }
      }
    },
    {
      'id': '4183-May-Apple-Ln,-Atlanta,-GA-30349',
      'formattedAddress': '4183 May Apple Ln, Atlanta, GA 30349',
      'addressLine1': '4183 May Apple Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.650566,
      'longitude': -84.524945,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 2300,
      'lotSize': 3572,
      'yearBuilt': 2018,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 318000,
      'listingType': 'Standard',
      'listedDate': '2025-05-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-02-11T14:11:44.308Z',
      'lastSeenDate': '2026-02-14T11:26:08.501Z',
      'daysOnMarket': 276,
      'mlsName': 'FMLS',
      'mlsNumber': '7577784',
      'listingAgent': {
        'name': 'Janeequa Townsend',
        'phone': '8324027957',
        'email': 'oxlistings@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-05-15': {
          'event': 'Sale Listing',
          'price': 318000,
          'listingType': 'Standard',
          'listedDate': '2025-05-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 276
        }
      }
    },
    {
      'id': '192-Electric-Ave-NW,-Atlanta,-GA-30314',
      'formattedAddress': '192 Electric Ave NW, Atlanta, GA 30314',
      'addressLine1': '192 Electric Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.75989,
      'longitude': -84.404475,
      'propertyType': 'Land',
      'lotSize': 7802,
      'status': 'Active',
      'price': 629000,
      'listingType': 'Standard',
      'listedDate': '2025-05-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-09-30T15:30:26.711Z',
      'lastSeenDate': '2026-02-14T11:26:08.501Z',
      'daysOnMarket': 275,
      'mlsName': 'FMLS',
      'mlsNumber': '7580735',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-16': {
          'event': 'Sale Listing',
          'price': 629000,
          'listingType': 'Standard',
          'listedDate': '2025-05-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 275
        }
      }
    },
    {
      'id': '1150-Garibaldi-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1150 Garibaldi St SW, Atlanta, GA 30310',
      'addressLine1': '1150 Garibaldi St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723499,
      'longitude': -84.399011,
      'propertyType': 'Land',
      'lotSize': 5001,
      'status': 'Active',
      'price': 155000,
      'listingType': 'Standard',
      'listedDate': '2025-05-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.500Z',
      'daysOnMarket': 275,
      'mlsName': 'FMLS',
      'mlsNumber': '7580733',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-16': {
          'event': 'Sale Listing',
          'price': 155000,
          'listingType': 'Standard',
          'listedDate': '2025-05-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 275
        }
      }
    },
    {
      'id': '290-Joseph-E-Lowery-Blvd-NW,-Atlanta,-GA-30314',
      'formattedAddress': '290 Joseph E Lowery Blvd NW, Atlanta, GA 30314',
      'addressLine1': '290 Joseph E Lowery Blvd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.762738,
      'longitude': -84.417789,
      'propertyType': 'Land',
      'lotSize': 7000,
      'status': 'Active',
      'price': 150000,
      'listingType': 'Standard',
      'listedDate': '2025-05-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.500Z',
      'daysOnMarket': 274,
      'mlsName': 'FMLS',
      'mlsNumber': '7581683',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-17': {
          'event': 'Sale Listing',
          'price': 150000,
          'listingType': 'Standard',
          'listedDate': '2025-05-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 274
        }
      }
    },
    {
      'id': '1162-Mcdaniel-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1162 Mcdaniel St SW, Atlanta, GA 30310',
      'addressLine1': '1162 Mcdaniel St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723258,
      'longitude': -84.401415,
      'propertyType': 'Land',
      'lotSize': 3311,
      'status': 'Active',
      'price': 99000,
      'listingType': 'Standard',
      'listedDate': '2025-05-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-03-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.499Z',
      'daysOnMarket': 276,
      'mlsName': 'FMLS',
      'mlsNumber': '7580464',
      'listingAgent': {
        'name': 'Kelly King',
        'phone': '7709939200',
        'email': 'kelly.king3@cbrealty.com',
        'website': 'http://kellykinghomes.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7709939200',
        'email': 'caroline.wilson@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/roswell/office/north-fulton/oid_3280/'
      },
      'history': {
        '2024-02-29': {
          'event': 'Sale Listing',
          'price': 150000,
          'listingType': 'Standard',
          'listedDate': '2024-02-29T00:00:00.000Z',
          'removedDate': '2024-10-31T00:00:00.000Z',
          'daysOnMarket': 245
        },
        '2025-05-15': {
          'event': 'Sale Listing',
          'price': 99000,
          'listingType': 'Standard',
          'listedDate': '2025-05-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 276
        }
      }
    },
    {
      'id': '373-Delevan-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '373 Delevan St SW, Atlanta, GA 30310',
      'addressLine1': '373 Delevan St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727013,
      'longitude': -84.400335,
      'propertyType': 'Land',
      'lotSize': 2500,
      'status': 'Active',
      'price': 85000,
      'listingType': 'Standard',
      'listedDate': '2025-05-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.499Z',
      'daysOnMarket': 275,
      'mlsName': 'FMLS',
      'mlsNumber': '7580727',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-16': {
          'event': 'Sale Listing',
          'price': 85000,
          'listingType': 'Standard',
          'listedDate': '2025-05-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 275
        }
      }
    },
    {
      'id': '796-Pond-St-NW,-Atlanta,-GA-30314',
      'formattedAddress': '796 Pond St NW, Atlanta, GA 30314',
      'addressLine1': '796 Pond St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.761677,
      'longitude': -84.413426,
      'propertyType': 'Land',
      'bedrooms': 0,
      'lotSize': 4704,
      'status': 'Active',
      'price': 150000,
      'listingType': 'Standard',
      'listedDate': '2025-05-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-12-23T07:23:23.025Z',
      'lastSeenDate': '2026-02-14T11:26:08.498Z',
      'daysOnMarket': 273,
      'mlsName': 'FMLS',
      'mlsNumber': '7581706',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-18': {
          'event': 'Sale Listing',
          'price': 150000,
          'listingType': 'Standard',
          'listedDate': '2025-05-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 273
        }
      }
    },
    {
      'id': '995-Smith-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '995 Smith St SW, Atlanta, GA 30310',
      'addressLine1': '995 Smith St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727667,
      'longitude': -84.401035,
      'propertyType': 'Land',
      'lotSize': 5149,
      'status': 'Active',
      'price': 155000,
      'listingType': 'Standard',
      'listedDate': '2025-05-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-04-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.498Z',
      'daysOnMarket': 273,
      'mlsName': 'FMLS',
      'mlsNumber': '7581707',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-18': {
          'event': 'Sale Listing',
          'price': 155000,
          'listingType': 'Standard',
          'listedDate': '2025-05-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 273
        }
      }
    },
    {
      'id': '1330-Twelve-Oaks-Cir-NW,-Atlanta,-GA-30327',
      'formattedAddress': '1330 Twelve Oaks Cir NW, Atlanta, GA 30327',
      'addressLine1': '1330 Twelve Oaks Cir NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834228,
      'longitude': -84.432773,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4,
      'squareFootage': 5700,
      'lotSize': 21388,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 2850000,
      'listingType': 'New Construction',
      'listedDate': '2025-05-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-01-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.496Z',
      'daysOnMarket': 275,
      'mlsName': 'FMLS',
      'mlsNumber': '7581311',
      'listingAgent': {
        'name': 'George Heery',
        'phone': '4042375000',
        'email': 'george.heery@atlantafinehomes.com',
        'website': 'http://www.heerybrothers.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-05-16': {
          'event': 'Sale Listing',
          'price': 2850000,
          'listingType': 'New Construction',
          'listedDate': '2025-05-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 275
        }
      }
    },
    {
      'id': '1039-Hubbard-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1039 Hubbard St SW, Atlanta, GA 30310',
      'addressLine1': '1039 Hubbard St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726522,
      'longitude': -84.402629,
      'propertyType': 'Land',
      'lotSize': 5998,
      'status': 'Active',
      'price': 149000,
      'listingType': 'Standard',
      'listedDate': '2025-05-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-19T09:35:42.296Z',
      'lastSeenDate': '2026-02-14T11:26:08.495Z',
      'daysOnMarket': 270,
      'mlsName': 'FMLS',
      'mlsNumber': '7583687',
      'listingAgent': {
        'name': 'Yasmin Benichay Biton',
        'phone': '6782334957',
        'email': 'yasmin1215@gmail.com',
        'website': 'www.hmyrealty.com'
      },
      'listingOffice': {
        'name': 'Hmy Realty Group, Llc',
        'phone': '6786941612',
        'email': 'yasmin@hmyrealty.com',
        'website': 'www.hmyrealty.com'
      },
      'history': {
        '2025-05-21': {
          'event': 'Sale Listing',
          'price': 149000,
          'listingType': 'Standard',
          'listedDate': '2025-05-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 270
        }
      }
    },
    {
      'id': 'Mayland-Cir-SW,-Atlanta,-GA-30310',
      'formattedAddress': 'Mayland Cir SW, Atlanta, GA 30310',
      'addressLine1': 'Mayland Cir SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723747,
      'longitude': -84.405582,
      'propertyType': 'Land',
      'lotSize': 15298,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 165000,
      'listingType': 'Standard',
      'listedDate': '2025-05-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-02-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.494Z',
      'daysOnMarket': 273,
      'mlsName': 'FMLS',
      'mlsNumber': '7581860',
      'listingAgent': {
        'name': 'Avi  Shemesh',
        'phone': '4046633735',
        'email': 'shemeshavi@aol.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty',
        'phone': '4042524512',
        'email': 'chapman@chapmanhallrealtors.com',
        'website': 'www.chapmanhallrealty.biz'
      },
      'history': {
        '2025-05-18': {
          'event': 'Sale Listing',
          'price': 165000,
          'listingType': 'Standard',
          'listedDate': '2025-05-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 273
        }
      }
    },
    {
      'id': '3481-Lakeside-Dr-NE,-Apt-1107,-Atlanta,-GA-30326',
      'formattedAddress': '3481 Lakeside Dr NE, Apt 1107, Atlanta, GA 30326',
      'addressLine1': '3481 Lakeside Dr NE',
      'addressLine2': 'Apt 1107',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.849076,
      'longitude': -84.35714,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1230,
      'lotSize': 1220,
      'yearBuilt': 1990,
      'hoa': {
        'fee': 758
      },
      'status': 'Active',
      'price': 350000,
      'listingType': 'Standard',
      'listedDate': '2025-05-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-04-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.494Z',
      'daysOnMarket': 268,
      'mlsName': 'FMLS',
      'mlsNumber': '7585405',
      'listingAgent': {
        'name': 'Bob  Sowers',
        'phone': '6784714843',
        'email': 'bobsowers@kw.com',
        'website': 'http://www.bobsowers.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Rlty-Ptree Rd',
        'phone': '4044193500',
        'email': 'lynnlecraw@kw.com',
        'website': 'peachtreeroad.yourkwoffice.com/mcj/user/homepagegetaction.do'
      },
      'history': {
        '2024-08-13': {
          'event': 'Sale Listing',
          'price': 379900,
          'listingType': 'Standard',
          'listedDate': '2024-08-13T00:00:00.000Z',
          'removedDate': '2025-01-14T00:00:00.000Z',
          'daysOnMarket': 154
        },
        '2025-05-23': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2025-05-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 268
        }
      }
    },
    {
      'id': '1310-Monroe-Dr-NE,-Atlanta,-GA-30306',
      'formattedAddress': '1310 Monroe Dr NE, Atlanta, GA 30306',
      'addressLine1': '1310 Monroe Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30306',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.790413,
      'longitude': -84.367519,
      'propertyType': 'Land',
      'lotSize': 10890,
      'status': 'Active',
      'price': 825000,
      'listingType': 'Standard',
      'listedDate': '2025-05-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.493Z',
      'daysOnMarket': 272,
      'mlsName': 'FMLS',
      'mlsNumber': '7580423',
      'listingAgent': {
        'name': 'Pauline M. Miller',
        'phone': '4046043310',
        'email': 'paulinemiller@kw.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-05-19': {
          'event': 'Sale Listing',
          'price': 825000,
          'listingType': 'Standard',
          'listedDate': '2025-05-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 272
        }
      }
    },
    {
      'id': '951-Metropolitan-Pkwy-SW,-Atlanta,-GA-30310',
      'formattedAddress': '951 Metropolitan Pkwy SW, Atlanta, GA 30310',
      'addressLine1': '951 Metropolitan Pkwy SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728937,
      'longitude': -84.408404,
      'propertyType': 'Land',
      'lotSize': 9801,
      'status': 'Active',
      'price': 249000,
      'listingType': 'Standard',
      'listedDate': '2025-05-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-23T08:43:02.348Z',
      'lastSeenDate': '2026-02-14T11:26:08.493Z',
      'daysOnMarket': 270,
      'mlsName': 'FMLS',
      'mlsNumber': '7583647',
      'listingAgent': {
        'name': 'Yasmin Benichay Biton',
        'phone': '6782334957',
        'email': 'yasmin1215@gmail.com',
        'website': 'www.hmyrealty.com'
      },
      'listingOffice': {
        'name': 'Hmy Realty Group, Llc',
        'phone': '6786941612',
        'email': 'yasmin@hmyrealty.com',
        'website': 'www.hmyrealty.com'
      },
      'history': {
        '2025-05-21': {
          'event': 'Sale Listing',
          'price': 249000,
          'listingType': 'Standard',
          'listedDate': '2025-05-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 270
        }
      }
    },
    {
      'id': '4106-Chastain-Park-Ct-NE,-Atlanta,-GA-30342',
      'formattedAddress': '4106 Chastain Park Ct NE, Atlanta, GA 30342',
      'addressLine1': '4106 Chastain Park Ct NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.877355,
      'longitude': -84.383348,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 690,
      'lotSize': 697,
      'yearBuilt': 1987,
      'hoa': {
        'fee': 27
      },
      'status': 'Active',
      'price': 190000,
      'listingType': 'Standard',
      'listedDate': '2025-05-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.492Z',
      'daysOnMarket': 272,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10525394',
      'listingAgent': {
        'name': 'Heather Macbride',
        'phone': '4043534520',
        'email': 'heather@heathermacbriderealty.com',
        'website': 'http://heathermacbride.kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Partners- South Forsyth',
        'phone': '6783412900',
        'email': 'frontdesk344@kw.com;agentservices344@gmail.com',
        'website': 'http://www.kellerwilliamsjohnscreek.com'
      },
      'history': {
        '2025-05-19': {
          'event': 'Sale Listing',
          'price': 190000,
          'listingType': 'Standard',
          'listedDate': '2025-05-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 272
        }
      }
    },
    {
      'id': '1652-Detroit-Ave-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1652 Detroit Ave NW, Atlanta, GA 30314',
      'addressLine1': '1652 Detroit Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765456,
      'longitude': -84.446158,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 3258,
      'lotSize': 10846,
      'yearBuilt': 1959,
      'status': 'Active',
      'price': 395000,
      'listingType': 'Standard',
      'listedDate': '2025-05-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.491Z',
      'daysOnMarket': 268,
      'mlsName': 'FMLS',
      'mlsNumber': '7563759',
      'listingAgent': {
        'name': 'Taylor Bryan',
        'phone': '4046701824',
        'email': 'taylor@spaldingbrokers.com',
        'website': 'https://www.facebook.com/taylorbryan-realtor'
      },
      'listingOffice': {
        'name': 'Haven Real Estate Brokers',
        'phone': '7702177561',
        'email': 'casey@havenbrokers.com',
        'website': 'www.havenbrokers.com'
      },
      'history': {
        '2025-05-23': {
          'event': 'Sale Listing',
          'price': 395000,
          'listingType': 'Standard',
          'listedDate': '2025-05-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 268
        }
      }
    },
    {
      'id': 'Springside-Dr,-Atlanta,-GA-30354',
      'formattedAddress': 'Springside Dr, Atlanta, GA 30354',
      'addressLine1': 'Springside Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.677468,
      'longitude': -84.375358,
      'propertyType': 'Land',
      'lotSize': 62901,
      'status': 'Active',
      'price': 75000,
      'listingType': 'Standard',
      'listedDate': '2025-05-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.490Z',
      'daysOnMarket': 273,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10524853',
      'listingAgent': {
        'name': 'Zena Gray',
        'phone': '7708828315',
        'email': 'zenagray778@aol.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-05-18': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'Standard',
          'listedDate': '2025-05-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 273
        }
      }
    },
    {
      'id': 'Old-Bill-Cook-Rd,-Atlanta,-GA-30349',
      'formattedAddress': 'Old Bill Cook Rd, Atlanta, GA 30349',
      'addressLine1': 'Old Bill Cook Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.596704,
      'longitude': -84.492693,
      'propertyType': 'Land',
      'lotSize': 196020,
      'status': 'Active',
      'price': 55000,
      'listingType': 'Standard',
      'listedDate': '2025-05-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-11-13T09:41:35.162Z',
      'lastSeenDate': '2026-02-14T11:26:08.490Z',
      'daysOnMarket': 267,
      'mlsName': 'FMLS',
      'mlsNumber': '7585524',
      'listingAgent': {
        'name': 'Carol Ellis',
        'phone': '4043080389',
        'email': 'carol@carolsellsatlanta.com',
        'website': 'http://www.carolsellsatlanta.com'
      },
      'listingOffice': {
        'name': 'City Limits Realty, Llc',
        'phone': '4045975506',
        'email': 'blkdr1@bellsouth.net',
        'website': 'http://www.citylimitsrealty.georgiamls.com'
      },
      'history': {
        '2024-05-22': {
          'event': 'Sale Listing',
          'price': 130000,
          'listingType': 'Standard',
          'listedDate': '2024-05-22T00:00:00.000Z',
          'removedDate': '2024-10-05T00:00:00.000Z',
          'daysOnMarket': 136
        },
        '2025-05-24': {
          'event': 'Sale Listing',
          'price': 55000,
          'listingType': 'Standard',
          'listedDate': '2025-05-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 267
        }
      }
    },
    {
      'id': '840-United-Ave-SE,-Unit-408,-Atlanta,-GA-30312',
      'formattedAddress': '840 United Ave SE, Unit 408, Atlanta, GA 30312',
      'addressLine1': '840 United Ave SE',
      'addressLine2': 'Unit 408',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.729947,
      'longitude': -84.364259,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1026,
      'lotSize': 1028,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 515
      },
      'status': 'Active',
      'price': 366000,
      'listingType': 'Standard',
      'listedDate': '2025-05-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-01T13:38:49.306Z',
      'lastSeenDate': '2026-02-14T11:26:08.488Z',
      'daysOnMarket': 269,
      'mlsName': 'FMLS',
      'mlsNumber': '7584838',
      'listingAgent': {
        'name': 'Calvin Bolden',
        'phone': '6787556115',
        'email': 'boldenca@bellsouth.net'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 366000,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 269
        }
      }
    },
    {
      'id': '5415-Twin-Lakes-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '5415 Twin Lakes Dr, Atlanta, GA 30349',
      'addressLine1': '5415 Twin Lakes Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.603785,
      'longitude': -84.478229,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1516,
      'lotSize': 4800,
      'yearBuilt': 1999,
      'status': 'Active',
      'price': 188000,
      'listingType': 'Standard',
      'listedDate': '2025-05-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.488Z',
      'daysOnMarket': 269,
      'mlsName': 'FMLS',
      'mlsNumber': '7583515',
      'listingAgent': {
        'name': 'Summer Brady',
        'phone': '4047906671',
        'email': 'summertime@kw.com',
        'website': 'http://www.summertimerealty.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 188000,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 269
        }
      }
    },
    {
      'id': '2239-Nelms-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2239 Nelms Dr SW, Atlanta, GA 30315',
      'addressLine1': '2239 Nelms Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.693266,
      'longitude': -84.401127,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 925,
      'lotSize': 12197,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 170000,
      'listingType': 'Standard',
      'listedDate': '2025-05-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.487Z',
      'daysOnMarket': 268,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10528421',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-23': {
          'event': 'Sale Listing',
          'price': 170000,
          'listingType': 'Standard',
          'listedDate': '2025-05-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 268
        }
      }
    },
    {
      'id': '2479-Peachtree-Rd-NE,-Apt-902,-Atlanta,-GA-30305',
      'formattedAddress': '2479 Peachtree Rd NE, Apt 902, Atlanta, GA 30305',
      'addressLine1': '2479 Peachtree Rd NE',
      'addressLine2': 'Apt 902',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.822468,
      'longitude': -84.386459,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 837,
      'lotSize': 828,
      'yearBuilt': 1967,
      'hoa': {
        'fee': 71
      },
      'status': 'Active',
      'price': 170000,
      'listingType': 'Standard',
      'listedDate': '2025-06-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-09-01T09:21:13.599Z',
      'lastSeenDate': '2026-02-14T11:26:08.487Z',
      'daysOnMarket': 259,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10533911',
      'listingAgent': {
        'name': 'Deborah Douglin',
        'phone': '6785221314',
        'email': 'deborah@deborahyouragent.com'
      },
      'listingOffice': {
        'name': 'MAXIMUM ONE REALTY EXECUTIVES',
        'phone': '6785017900',
        'email': 'tina@stagesrealtors.com',
        'website': 'www.truenorthrepros.com'
      },
      'history': {
        '2025-06-01': {
          'event': 'Sale Listing',
          'price': 170000,
          'listingType': 'Standard',
          'listedDate': '2025-06-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 259
        }
      }
    },
    {
      'id': '310-Flagstone-Dr-SW,-Atlanta,-GA-30331',
      'formattedAddress': '310 Flagstone Dr SW, Atlanta, GA 30331',
      'addressLine1': '310 Flagstone Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.745848,
      'longitude': -84.515792,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1875,
      'lotSize': 14636,
      'yearBuilt': 1965,
      'status': 'Active',
      'price': 256000,
      'listingType': 'Standard',
      'listedDate': '2025-05-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.485Z',
      'daysOnMarket': 269,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10527255',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 256000,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 269
        }
      }
    },
    {
      'id': '3179-Dogwood-Dr,-Atlanta,-GA-30344',
      'formattedAddress': '3179 Dogwood Dr, Atlanta, GA 30344',
      'addressLine1': '3179 Dogwood Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.669409,
      'longitude': -84.486394,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1412,
      'lotSize': 16470,
      'yearBuilt': 1962,
      'status': 'Active',
      'price': 167500,
      'listingType': 'Standard',
      'listedDate': '2025-05-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.484Z',
      'daysOnMarket': 269,
      'mlsName': 'FMLS',
      'mlsNumber': '7581689',
      'listingAgent': {
        'name': 'William Keys',
        'phone': '6785579533',
        'email': 'keys4bill@yahoo.com;williamkeys22@gmail.com'
      },
      'listingOffice': {
        'name': 'Atlas Real Estate',
        'phone': '3032428980',
        'email': 'michael@realatlas.com'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 167500,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 269
        }
      }
    },
    {
      'id': '1700-Devon-Dr-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1700 Devon Dr SW, Atlanta, GA 30311',
      'addressLine1': '1700 Devon Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.708746,
      'longitude': -84.483674,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1334,
      'lotSize': 871,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 250
      },
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-05-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.483Z',
      'daysOnMarket': 268,
      'mlsName': 'FMLS',
      'mlsNumber': '7578593',
      'listingAgent': {
        'name': 'Michelle Brewer',
        'phone': '7705090265',
        'email': 'michelle@kingandarcher.com',
        'website': 'sellectrealty.com'
      },
      'listingOffice': {
        'name': 'Sanders RE, LLC',
        'phone': '6788883438',
        'email': 'greg@sandersteamrealty.com',
        'website': 'https://www.sandersteamrealty.com'
      },
      'history': {
        '2025-05-23': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-05-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 268
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-1405,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 1405, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 1405',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1228,
      'lotSize': 1220,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 856
      },
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-05-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.483Z',
      'daysOnMarket': 268,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10529038',
      'listingAgent': {
        'name': 'Marwan Karaa',
        'phone': '4042334633',
        'email': 'mkaraa@hotmail.com'
      },
      'listingOffice': {
        'name': 'RE MAX Metro Atlanta Cityside',
        'phone': '4043213123',
        'email': 'darmstrong@remax.net',
        'website': 'http://www.realestateofatlanta.com'
      },
      'history': {
        '2025-05-23': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-05-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 268
        }
      }
    },
    {
      'id': '1065-Peachtree-St-NE,-Unit-3504,-Atlanta,-GA-30309',
      'formattedAddress': '1065 Peachtree St NE, Unit 3504, Atlanta, GA 30309',
      'addressLine1': '1065 Peachtree St NE',
      'addressLine2': 'Unit 3504',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.783638,
      'longitude': -84.382825,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2819,
      'yearBuilt': 2015,
      'status': 'Active',
      'price': 2600000,
      'listingType': 'Standard',
      'listedDate': '2025-05-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.482Z',
      'daysOnMarket': 264,
      'mlsName': 'FMLS',
      'mlsNumber': '7585386',
      'listingAgent': {
        'name': 'Carol Copeland',
        'phone': '7706348474',
        'email': 'carolcopeland@atlantafinehomes.com',
        'website': 'http://www.carolcopeland.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-05-27': {
          'event': 'Sale Listing',
          'price': 2600000,
          'listingType': 'Standard',
          'listedDate': '2025-05-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 264
        }
      }
    },
    {
      'id': '2067-Telfair-Cir-NE,-Unit-A,-Atlanta,-GA-30324',
      'formattedAddress': '2067 Telfair Cir NE, Unit A, Atlanta, GA 30324',
      'addressLine1': '2067 Telfair Cir NE',
      'addressLine2': 'Unit A',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.811504,
      'longitude': -84.362923,
      'propertyType': 'Townhouse',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 3854,
      'lotSize': 871,
      'yearBuilt': 2015,
      'hoa': {
        'fee': 250
      },
      'status': 'Active',
      'price': 1220000,
      'listingType': 'Standard',
      'listedDate': '2025-05-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.482Z',
      'daysOnMarket': 263,
      'mlsName': 'FMLS',
      'mlsNumber': '7587232',
      'listingAgent': {
        'name': 'Michael Williams',
        'phone': '7702414163',
        'email': 'michael@exitwestmidtown.com'
      },
      'listingOffice': {
        'name': 'EXIT REALTY WEST MIDTOWN',
        'phone': '4707499378',
        'email': 'admin@exitwestmidtown.com',
        'website': 'http://exitwestmidtown.com'
      },
      'history': {
        '2025-05-28': {
          'event': 'Sale Listing',
          'price': 1220000,
          'listingType': 'Standard',
          'listedDate': '2025-05-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 263
        }
      }
    },
    {
      'id': '1101-Juniper-St-NE,-Apt-1216,-Atlanta,-GA-30309',
      'formattedAddress': '1101 Juniper St NE, Apt 1216, Atlanta, GA 30309',
      'addressLine1': '1101 Juniper St NE',
      'addressLine2': 'Apt 1216',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.784762,
      'longitude': -84.381853,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 764,
      'lotSize': 762,
      'yearBuilt': 1999,
      'hoa': {
        'fee': 411
      },
      'status': 'Active',
      'price': 274000,
      'listingType': 'Standard',
      'listedDate': '2025-05-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.481Z',
      'daysOnMarket': 264,
      'mlsName': 'FMLS',
      'mlsNumber': '7586223',
      'listingAgent': {
        'name': 'Bailey Fabricius',
        'phone': '9545548028',
        'email': 'bailey.fabricius@compass.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-05-27': {
          'event': 'Sale Listing',
          'price': 274000,
          'listingType': 'Standard',
          'listedDate': '2025-05-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 264
        }
      }
    },
    {
      'id': '2855-Peachtree-Rd-NE,-Unit-106,-Atlanta,-GA-30305',
      'formattedAddress': '2855 Peachtree Rd NE, Unit 106, Atlanta, GA 30305',
      'addressLine1': '2855 Peachtree Rd NE',
      'addressLine2': 'Unit 106',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.83261,
      'longitude': -84.383759,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1160,
      'lotSize': 1163,
      'yearBuilt': 1928,
      'hoa': {
        'fee': 498
      },
      'status': 'Active',
      'price': 229000,
      'listingType': 'Standard',
      'listedDate': '2025-05-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-08-12T15:37:24.698Z',
      'lastSeenDate': '2026-02-14T11:26:08.478Z',
      'daysOnMarket': 262,
      'mlsName': 'FMLS',
      'mlsNumber': '7587474',
      'listingAgent': {
        'name': 'Daisy M Barnum',
        'phone': '7703137376',
        'email': 'daisy.barnum@exposure-realestate.com',
        'website': 'http://www.exposure-realestate.com'
      },
      'listingOffice': {
        'name': 'Exposure Realty, Llc',
        'phone': '7703137376',
        'email': 'dbarnum@bellsouth.net',
        'website': 'ww.exposure-realestate.com'
      },
      'history': {
        '2025-05-29': {
          'event': 'Sale Listing',
          'price': 229000,
          'listingType': 'Standard',
          'listedDate': '2025-05-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 262
        }
      }
    },
    {
      'id': '1707-Taylor-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '1707 Taylor Ave, Atlanta, GA 30344',
      'addressLine1': '1707 Taylor Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.673556,
      'longitude': -84.444636,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2100,
      'lotSize': 3049,
      'yearBuilt': 2005,
      'status': 'Active',
      'price': 221000,
      'listingType': 'Standard',
      'listedDate': '2025-05-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.476Z',
      'daysOnMarket': 262,
      'mlsName': 'FMLS',
      'mlsNumber': '7588300',
      'listingAgent': {
        'name': 'Livian Ascend',
        'phone': '4702019056',
        'email': 'livianascens@livian.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-05-29': {
          'event': 'Sale Listing',
          'price': 221000,
          'listingType': 'Standard',
          'listedDate': '2025-05-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 262
        }
      }
    },
    {
      'id': '4938-Wewatta-St-SW,-Atlanta,-GA-30331',
      'formattedAddress': '4938 Wewatta St SW, Atlanta, GA 30331',
      'addressLine1': '4938 Wewatta St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.658348,
      'longitude': -84.548676,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3,
      'squareFootage': 3414,
      'lotSize': 17999,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 31
      },
      'status': 'Active',
      'price': 365000,
      'listingType': 'Standard',
      'listedDate': '2025-05-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.476Z',
      'daysOnMarket': 261,
      'mlsName': 'FMLS',
      'mlsNumber': '7587409',
      'listingAgent': {
        'name': 'Teresa Homan',
        'phone': '6784773578',
        'email': 'teresa.homan@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-05-30': {
          'event': 'Sale Listing',
          'price': 365000,
          'listingType': 'Standard',
          'listedDate': '2025-05-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 261
        }
      }
    },
    {
      'id': '3530-Piedmont-Rd-NE,-Apt-2I,-Atlanta,-GA-30305',
      'formattedAddress': '3530 Piedmont Rd NE, Apt 2I, Atlanta, GA 30305',
      'addressLine1': '3530 Piedmont Rd NE',
      'addressLine2': 'Apt 2I',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.849169,
      'longitude': -84.379491,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1527,
      'yearBuilt': 1976,
      'hoa': {
        'fee': 64
      },
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-05-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-26T14:28:20.752Z',
      'lastSeenDate': '2026-02-14T11:26:08.475Z',
      'daysOnMarket': 263,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10531254',
      'listingAgent': {
        'name': 'David Hollingshead',
        'phone': '2128516393',
        'email': 'davidhollingshead@ansleyatlanta.com'
      },
      'listingOffice': {
        'name': 'Engel & Volkers Atlanta',
        'phone': '4048457724',
        'email': 'atlanta@engelvoelkers.com',
        'website': 'https://evatlanta.evrealestate.com'
      },
      'history': {
        '2025-05-28': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-05-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 263
        }
      }
    },
    {
      'id': '123-Mcgill-Park-Ave,-Unit-123,-Atlanta,-GA-30312',
      'formattedAddress': '123 Mcgill Park Ave, Unit 123, Atlanta, GA 30312',
      'addressLine1': '123 Mcgill Park Ave',
      'addressLine2': 'Unit 123',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.761959,
      'longitude': -84.377269,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 971,
      'lotSize': 14375,
      'yearBuilt': 1994,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 214000,
      'listingType': 'Standard',
      'listedDate': '2025-05-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-07-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.475Z',
      'daysOnMarket': 261,
      'mlsName': 'FMLS',
      'mlsNumber': '7586996',
      'listingAgent': {
        'name': 'Chris Ashkouti',
        'phone': '4048040860',
        'email': 'chris@heritagecapital.com',
        'website': 'heritageselecthomes.com'
      },
      'listingOffice': {
        'name': 'First Guaranty Realty Corp.',
        'phone': '4042526111',
        'email': 'chrisashkouti@gmail.com'
      },
      'history': {
        '2025-05-30': {
          'event': 'Sale Listing',
          'price': 214000,
          'listingType': 'Standard',
          'listedDate': '2025-05-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 261
        }
      }
    },
    {
      'id': '4039-Codel-St-NW,-Atlanta,-GA-30331',
      'formattedAddress': '4039 Codel St NW, Atlanta, GA 30331',
      'addressLine1': '4039 Codel St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.752775,
      'longitude': -84.519749,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1000,
      'lotSize': 7841,
      'yearBuilt': 1973,
      'status': 'Active',
      'price': 174000,
      'listingType': 'Standard',
      'listedDate': '2025-05-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.474Z',
      'daysOnMarket': 263,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10531049',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-28': {
          'event': 'Sale Listing',
          'price': 174000,
          'listingType': 'Standard',
          'listedDate': '2025-05-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 263
        }
      }
    },
    {
      'id': '1255-Plaza-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1255 Plaza Ave SW, Atlanta, GA 30310',
      'addressLine1': '1255 Plaza Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728363,
      'longitude': -84.429025,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2350,
      'lotSize': 13983,
      'yearBuilt': 2024,
      'status': 'Active',
      'price': 484900,
      'listingType': 'New Construction',
      'listedDate': '2025-05-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-07-23T16:31:59.307Z',
      'lastSeenDate': '2026-02-14T11:26:08.473Z',
      'daysOnMarket': 267,
      'mlsName': 'FMLS',
      'mlsNumber': '7585521',
      'listingAgent': {
        'name': 'Kenneth Wilber',
        'phone': '4042463745',
        'email': 'kennethwilberjr@gmail.com',
        'website': 'homekeyrealty@att.net'
      },
      'listingOffice': {
        'name': 'Home Key Realty, Inc.',
        'phone': '6789854269',
        'email': 'homekeyrealty@bellsouth.net',
        'website': 'http://www.homekeyrealty.net'
      },
      'history': {
        '2024-10-05': {
          'event': 'Sale Listing',
          'price': 485000,
          'listingType': 'New Construction',
          'listedDate': '2024-10-05T00:00:00.000Z',
          'removedDate': '2024-11-13T00:00:00.000Z',
          'daysOnMarket': 39
        },
        '2025-05-24': {
          'event': 'Sale Listing',
          'price': 484900,
          'listingType': 'New Construction',
          'listedDate': '2025-05-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 267
        }
      }
    },
    {
      'id': '2425-Peachtree-Rd-NE,-Unit-1503,-Atlanta,-GA-30305',
      'formattedAddress': '2425 Peachtree Rd NE, Unit 1503, Atlanta, GA 30305',
      'addressLine1': '2425 Peachtree Rd NE',
      'addressLine2': 'Unit 1503',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.820849,
      'longitude': -84.387597,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 3754,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 2115
      },
      'status': 'Active',
      'price': 6495999,
      'listingType': 'New Construction',
      'listedDate': '2025-06-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.472Z',
      'daysOnMarket': 258,
      'mlsName': 'FMLS',
      'mlsNumber': '7587044',
      'listingAgent': {
        'name': 'Betsy Akers',
        'phone': '4042375000',
        'email': 'betsy@atlantafinehomes.com',
        'website': 'http://betsyakers.atlantafinehomes.com/'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-06-02': {
          'event': 'Sale Listing',
          'price': 6495999,
          'listingType': 'New Construction',
          'listedDate': '2025-06-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 258
        }
      }
    },
    {
      'id': 'Benjamin-E-Mays-Dr-SW,-Atlanta,-GA-30331',
      'formattedAddress': 'Benjamin E Mays Dr SW, Atlanta, GA 30331',
      'addressLine1': 'Benjamin E Mays Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.737972,
      'longitude': -84.501403,
      'propertyType': 'Land',
      'lotSize': 683892,
      'status': 'Active',
      'price': 600000,
      'listingType': 'Standard',
      'listedDate': '2025-05-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.471Z',
      'daysOnMarket': 262,
      'mlsName': 'FMLS',
      'mlsNumber': '7588232',
      'listingAgent': {
        'name': 'Angela Halan',
        'phone': '4044562066',
        'email': 'angelahalan@gmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Consultants',
        'phone': '6782874800',
        'email': 'klrw367@kw.com',
        'website': 'http://www.kwroswell.com'
      },
      'history': {
        '2025-05-29': {
          'event': 'Sale Listing',
          'price': 600000,
          'listingType': 'Standard',
          'listedDate': '2025-05-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 262
        }
      }
    },
    {
      'id': '2827-Summit-Pkwy-SW,-Atlanta,-GA-30331',
      'formattedAddress': '2827 Summit Pkwy SW, Atlanta, GA 30331',
      'addressLine1': '2827 Summit Pkwy SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.676856,
      'longitude': -84.598146,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'lotSize': 10106,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 46
      },
      'status': 'Active',
      'price': 389000,
      'listingType': 'Standard',
      'listedDate': '2025-05-31T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.471Z',
      'daysOnMarket': 260,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10533415',
      'listingAgent': {
        'name': 'Gretchen Eugere',
        'phone': '4046919497',
        'email': 'geugere@gmail.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-05-31': {
          'event': 'Sale Listing',
          'price': 389000,
          'listingType': 'Standard',
          'listedDate': '2025-05-31T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 260
        }
      }
    },
    {
      'id': '474-Boxelder-Rd,-Atlanta,-GA-30349',
      'formattedAddress': '474 Boxelder Rd, Atlanta, GA 30349',
      'addressLine1': '474 Boxelder Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.618419,
      'longitude': -84.58463,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 2451,
      'lotSize': 47480,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 35
      },
      'status': 'Active',
      'price': 313000,
      'listingType': 'Standard',
      'listedDate': '2025-05-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-09-23T09:02:39.743Z',
      'lastSeenDate': '2026-02-14T11:26:08.470Z',
      'daysOnMarket': 263,
      'mlsName': 'FMLS',
      'mlsNumber': '7586990',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-05-28': {
          'event': 'Sale Listing',
          'price': 313000,
          'listingType': 'Standard',
          'listedDate': '2025-05-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 263
        }
      }
    },
    {
      'id': '567-Ponce-De-Leon-Ave-NE,-Unit-606,-Atlanta,-GA-30308',
      'formattedAddress': '567 Ponce De Leon Ave NE, Unit 606, Atlanta, GA 30308',
      'addressLine1': '567 Ponce De Leon Ave NE',
      'addressLine2': 'Unit 606',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.773392,
      'longitude': -84.368408,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 630,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 299
      },
      'status': 'Active',
      'price': 464000,
      'listingType': 'New Construction',
      'listedDate': '2025-06-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.469Z',
      'daysOnMarket': 256,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10536449',
      'listingAgent': {
        'name': 'Megan Broom',
        'phone': '4042259514',
        'email': 'megan.broom@compass.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-06-04': {
          'event': 'Sale Listing',
          'price': 464000,
          'listingType': 'New Construction',
          'listedDate': '2025-06-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 256
        }
      }
    },
    {
      'id': '211-Colonial-Homes-Dr-NW,-Apt-2304,-Atlanta,-GA-30309',
      'formattedAddress': '211 Colonial Homes Dr NW, Apt 2304, Atlanta, GA 30309',
      'addressLine1': '211 Colonial Homes Dr NW',
      'addressLine2': 'Apt 2304',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.814456,
      'longitude': -84.3942,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1325,
      'lotSize': 1307,
      'yearBuilt': 1997,
      'hoa': {
        'fee': 724
      },
      'status': 'Active',
      'price': 414495,
      'listingType': 'Standard',
      'listedDate': '2025-06-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-05-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.468Z',
      'daysOnMarket': 256,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10535156',
      'listingAgent': {
        'name': 'Mark Stockwell',
        'phone': '4044473853',
        'email': 'stockwellrealty@gmail.com'
      },
      'listingOffice': {
        'name': 'UC Premier Properties',
        'phone': '8338865263',
        'email': 'info@ucgeorgia.com'
      },
      'history': {
        '2024-07-19': {
          'event': 'Sale Listing',
          'price': 414500,
          'listingType': 'Standard',
          'listedDate': '2024-07-19T00:00:00.000Z',
          'removedDate': '2025-05-23T00:00:00.000Z',
          'daysOnMarket': 308
        },
        '2025-06-04': {
          'event': 'Sale Listing',
          'price': 414495,
          'listingType': 'Standard',
          'listedDate': '2025-06-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 256
        }
      }
    },
    {
      'id': '2469-Baywood-Dr-SE,-Atlanta,-GA-30315',
      'formattedAddress': '2469 Baywood Dr SE, Atlanta, GA 30315',
      'addressLine1': '2469 Baywood Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.687074,
      'longitude': -84.388589,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1148,
      'lotSize': 13504,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 210000,
      'listingType': 'Standard',
      'listedDate': '2025-05-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.467Z',
      'daysOnMarket': 261,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10532985',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-05-30': {
          'event': 'Sale Listing',
          'price': 210000,
          'listingType': 'Standard',
          'listedDate': '2025-05-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 261
        }
      }
    },
    {
      'id': '881-Mercury-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '881 Mercury Dr NW, Atlanta, GA 30331',
      'addressLine1': '881 Mercury Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.778186,
      'longitude': -84.508676,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 925,
      'lotSize': 9309,
      'yearBuilt': 1962,
      'status': 'Active',
      'price': 185000,
      'listingType': 'Standard',
      'listedDate': '2025-05-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.465Z',
      'daysOnMarket': 261,
      'mlsName': 'FMLS',
      'mlsNumber': '7584547',
      'listingAgent': {
        'name': 'Edgar Chavez',
        'phone': '6026917367',
        'email': 'edgar.chavez@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-05-30': {
          'event': 'Sale Listing',
          'price': 185000,
          'listingType': 'Standard',
          'listedDate': '2025-05-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 261
        }
      }
    },
    {
      'id': '577-Reed-St-SE,-Atlanta,-GA-30312',
      'formattedAddress': '577 Reed St SE, Atlanta, GA 30312',
      'addressLine1': '577 Reed St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.738605,
      'longitude': -84.385736,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1282,
      'lotSize': 1281,
      'yearBuilt': 2003,
      'hoa': {
        'fee': 210
      },
      'status': 'Active',
      'price': 386800,
      'listingType': 'Standard',
      'listedDate': '2025-06-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.464Z',
      'daysOnMarket': 258,
      'mlsName': 'FMLS',
      'mlsNumber': '7590174',
      'listingAgent': {
        'name': 'Jeffrey Taylor',
        'phone': '4048827987',
        'email': 'jefftaylor@teamjtreg.com',
        'website': 'http://teamjtreg.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4048742262',
        'email': 'rcarter@cbrealty.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/intown/oid_3222/'
      },
      'history': {
        '2025-06-02': {
          'event': 'Sale Listing',
          'price': 386800,
          'listingType': 'Standard',
          'listedDate': '2025-06-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 258
        }
      }
    },
    {
      'id': '115-W-Peachtree-Pl-NW,-Unit-702,-Atlanta,-GA-30313',
      'formattedAddress': '115 W Peachtree Pl NW, Unit 702, Atlanta, GA 30313',
      'addressLine1': '115 W Peachtree Pl NW',
      'addressLine2': 'Unit 702',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.764259,
      'longitude': -84.390896,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 2760,
      'lotSize': 2744,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 1150
      },
      'status': 'Active',
      'price': 599900,
      'listingType': 'Standard',
      'listedDate': '2025-06-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-08-19T18:21:04.187Z',
      'lastSeenDate': '2026-02-14T11:26:08.463Z',
      'daysOnMarket': 257,
      'mlsName': 'FMLS',
      'mlsNumber': '7590927',
      'listingAgent': {
        'name': 'John Sherwood',
        'phone': '7704047180',
        'email': 'jsherwood@worthmoorerealty.com'
      },
      'listingOffice': {
        'name': 'WORTHMOORE REALTY',
        'phone': '7704382411',
        'email': 'jsherwood@worthmoorerealty.com',
        'website': 'www.worthmoorerealty.com'
      },
      'history': {
        '2025-06-03': {
          'event': 'Sale Listing',
          'price': 599900,
          'listingType': 'Standard',
          'listedDate': '2025-06-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 257
        }
      }
    },
    {
      'id': '212-Little-St-SE,-Atlanta,-GA-30315',
      'formattedAddress': '212 Little St SE, Atlanta, GA 30315',
      'addressLine1': '212 Little St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.73329,
      'longitude': -84.38083,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1650,
      'lotSize': 3485,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 420000,
      'listingType': 'Standard',
      'listedDate': '2025-06-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.461Z',
      'daysOnMarket': 256,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10534036',
      'listingAgent': {
        'name': 'Nikita Dale',
        'phone': '4047193740',
        'email': 'nikitad@ndehometeam.com',
        'website': 'http://www.ndehometeam.com'
      },
      'listingOffice': {
        'name': 'Jason Mitchell Real Estate of Georgia, LLC',
        'phone': '7702846772',
        'email': 'whardy@jasonmitchellgroup.com',
        'website': 'jasonmitchellgroup.com'
      },
      'history': {
        '2024-06-10': {
          'event': 'Sale Listing',
          'price': 420000,
          'listingType': 'Standard',
          'listedDate': '2024-06-10T00:00:00.000Z',
          'removedDate': '2025-06-01T00:00:00.000Z',
          'daysOnMarket': 356
        },
        '2025-06-04': {
          'event': 'Sale Listing',
          'price': 420000,
          'listingType': 'Standard',
          'listedDate': '2025-06-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 256
        }
      }
    },
    {
      'id': '933-Capitol-View-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '933 Capitol View Ave NW, Atlanta, GA 30318',
      'addressLine1': '933 Capitol View Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780463,
      'longitude': -84.467076,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 950,
      'lotSize': 6273,
      'yearBuilt': 1969,
      'status': 'Active',
      'price': 190000,
      'listingType': 'Standard',
      'listedDate': '2025-06-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.461Z',
      'daysOnMarket': 256,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10535850',
      'listingAgent': {
        'name': 'Edgar Chavez',
        'phone': '8005832914',
        'email': 'oxlistings@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-04': {
          'event': 'Sale Listing',
          'price': 190000,
          'listingType': 'Standard',
          'listedDate': '2025-06-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 256
        }
      }
    },
    {
      'id': '280-Blackland-Rd-NW,-Atlanta,-GA-30342',
      'formattedAddress': '280 Blackland Rd NW, Atlanta, GA 30342',
      'addressLine1': '280 Blackland Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.858734,
      'longitude': -84.396475,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 6,
      'squareFootage': 6819,
      'lotSize': 98271,
      'yearBuilt': 1935,
      'status': 'Active',
      'price': 4195000,
      'listingType': 'Standard',
      'listedDate': '2025-06-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.456Z',
      'daysOnMarket': 255,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10537526',
      'listingAgent': {
        'name': 'Bonneau Ansley',
        'phone': '4049063161',
        'email': 'bonneau@ansleyatlanta.com',
        'website': 'http://www.bonneauansley.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyre.com',
        'website': 'www.ansleyatlanta.com'
      },
      'history': {
        '2025-06-05': {
          'event': 'Sale Listing',
          'price': 4195000,
          'listingType': 'Standard',
          'listedDate': '2025-06-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 255
        }
      }
    },
    {
      'id': '914-Mercury-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '914 Mercury Dr NW, Atlanta, GA 30331',
      'addressLine1': '914 Mercury Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.779408,
      'longitude': -84.50936,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1065,
      'lotSize': 13504,
      'yearBuilt': 1961,
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-06-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.456Z',
      'daysOnMarket': 255,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10537604',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-06-05': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-06-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 255
        }
      }
    },
    {
      'id': '821-Beckwith-St-SW,-Atlanta,-GA-30314',
      'formattedAddress': '821 Beckwith St SW, Atlanta, GA 30314',
      'addressLine1': '821 Beckwith St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.752368,
      'longitude': -84.414475,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 2,
      'squareFootage': 1700,
      'lotSize': 3049,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-06-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-09-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:08.455Z',
      'daysOnMarket': 255,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10536990',
      'listingAgent': {
        'name': 'Beycome',
        'phone': '8046565007',
        'email': 'realtor@beycome.com',
        'website': 'https://www.beycome.com'
      },
      'listingOffice': {
        'name': 'Beycome Brokerage Realty Llc',
        'phone': '8046565007',
        'email': 'ctribusrea@cox.net',
        'website': 'http://www.beycome.com'
      },
      'history': {
        '2025-06-05': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-06-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 255
        }
      }
    },
    {
      'id': '476-Cleveland-Ave-SW,-Atlanta,-GA-30315',
      'formattedAddress': '476 Cleveland Ave SW, Atlanta, GA 30315',
      'addressLine1': '476 Cleveland Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.680993,
      'longitude': -84.404169,
      'propertyType': 'Land',
      'lotSize': 43996,
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-06-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:38:32.721Z',
      'lastSeenDate': '2026-02-14T11:26:03.079Z',
      'daysOnMarket': 244,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10544352',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2025-06-16': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-06-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 244
        }
      }
    },
    {
      'id': 'Constitution-Rd,-Atlanta,-GA-30315',
      'formattedAddress': 'Constitution Rd, Atlanta, GA 30315',
      'addressLine1': 'Constitution Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.692623,
      'longitude': -84.359459,
      'propertyType': 'Land',
      'lotSize': 195149,
      'status': 'Active',
      'price': 2500000,
      'listingType': 'Standard',
      'listedDate': '2025-06-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-19T17:41:45.510Z',
      'lastSeenDate': '2026-02-14T11:26:03.077Z',
      'daysOnMarket': 244,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10544317',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2024-08-14': {
          'event': 'Sale Listing',
          'price': 2750000,
          'listingType': 'Standard',
          'listedDate': '2024-08-14T00:00:00.000Z',
          'removedDate': '2025-04-01T00:00:00.000Z',
          'daysOnMarket': 230
        },
        '2025-06-16': {
          'event': 'Sale Listing',
          'price': 2500000,
          'listingType': 'Standard',
          'listedDate': '2025-06-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 244
        }
      }
    },
    {
      'id': 'SE-Margaret-St,-Atlanta,-GA-30315',
      'formattedAddress': 'SE Margaret St, Atlanta, GA 30315',
      'addressLine1': 'SE Margaret St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.711441,
      'longitude': -84.379239,
      'propertyType': 'Land',
      'lotSize': 153723,
      'status': 'Active',
      'price': 3500000,
      'listingType': 'Standard',
      'listedDate': '2025-06-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-25T17:32:14.763Z',
      'lastSeenDate': '2026-02-14T11:26:03.077Z',
      'daysOnMarket': 244,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10544323',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2025-06-16': {
          'event': 'Sale Listing',
          'price': 3500000,
          'listingType': 'Standard',
          'listedDate': '2025-06-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 244
        }
      }
    },
    {
      'id': '465-Glenn-St-SW,-Atlanta,-GA-30312',
      'formattedAddress': '465 Glenn St SW, Atlanta, GA 30312',
      'addressLine1': '465 Glenn St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.738662,
      'longitude': -84.403319,
      'propertyType': 'Land',
      'lotSize': 12632,
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-06-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-07-19T14:37:05.318Z',
      'lastSeenDate': '2026-02-14T11:26:03.076Z',
      'daysOnMarket': 254,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10537817',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 254
        }
      }
    },
    {
      'id': '870-Mayson-Turner-Rd-NW,-Unit-1207,-Atlanta,-GA-30314',
      'formattedAddress': '870 Mayson Turner Rd NW, Unit 1207, Atlanta, GA 30314',
      'addressLine1': '870 Mayson Turner Rd NW',
      'addressLine2': 'Unit 1207',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.755891,
      'longitude': -84.417102,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1089,
      'lotSize': 1089,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 451
      },
      'status': 'Active',
      'price': 145000,
      'listingType': 'Standard',
      'listedDate': '2025-06-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-03-26T08:52:15.848Z',
      'lastSeenDate': '2026-02-14T11:26:03.075Z',
      'daysOnMarket': 254,
      'mlsName': 'FMLS',
      'mlsNumber': '7593019',
      'listingAgent': {
        'name': 'Taqqeea Waters',
        'phone': '4709205560',
        'email': 'sold@thesolutionrealtor.com',
        'website': 'http://www.solutionrealtor.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 145000,
          'listingType': 'Standard',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 254
        }
      }
    },
    {
      'id': '2660-Peachtree-Rd-NW,-Apt-10H,-Atlanta,-GA-30305',
      'formattedAddress': '2660 Peachtree Rd NW, Apt 10H, Atlanta, GA 30305',
      'addressLine1': '2660 Peachtree Rd NW',
      'addressLine2': 'Apt 10H',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.827469,
      'longitude': -84.388166,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 2,
      'squareFootage': 1600,
      'lotSize': 1599,
      'yearBuilt': 1987,
      'hoa': {
        'fee': 1175
      },
      'status': 'Active',
      'price': 629000,
      'listingType': 'Standard',
      'listedDate': '2025-06-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.074Z',
      'daysOnMarket': 254,
      'mlsName': 'FMLS',
      'mlsNumber': '7592736',
      'listingAgent': {
        'name': 'Jolynne Szymanski',
        'phone': '4042717167',
        'email': 'jolynne@intownere.com',
        'website': 'http://intownere.com'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 629000,
          'listingType': 'Standard',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 254
        }
      }
    },
    {
      'id': '258-Pineland-Rd-NW,-Atlanta,-GA-30342',
      'formattedAddress': '258 Pineland Rd NW, Atlanta, GA 30342',
      'addressLine1': '258 Pineland Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.864973,
      'longitude': -84.395388,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 8.5,
      'squareFootage': 10469,
      'lotSize': 34412,
      'yearBuilt': 2019,
      'status': 'Active',
      'price': 6995000,
      'listingType': 'Standard',
      'listedDate': '2025-06-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.073Z',
      'daysOnMarket': 254,
      'mlsName': 'FMLS',
      'mlsNumber': '7593214',
      'listingAgent': {
        'name': 'Joy Myrick',
        'phone': '4048740300',
        'email': 'joymyrick@atlantafinehomes.com',
        'website': 'https://joymyrick.atlantafinehomes.com/eng'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 6995000,
          'listingType': 'Standard',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 254
        }
      }
    },
    {
      'id': '567-Ponce-De-Leon-Ave-NE,-Unit-321,-Atlanta,-GA-30308',
      'formattedAddress': '567 Ponce De Leon Ave NE, Unit 321, Atlanta, GA 30308',
      'addressLine1': '567 Ponce De Leon Ave NE',
      'addressLine2': 'Unit 321',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.773136,
      'longitude': -84.368574,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 636,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 302
      },
      'status': 'Active',
      'price': 414000,
      'listingType': 'New Construction',
      'listedDate': '2025-06-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.071Z',
      'daysOnMarket': 254,
      'mlsName': 'FMLS',
      'mlsNumber': '7592670',
      'listingAgent': {
        'name': 'Carlton Rebeiz',
        'phone': '4046686621',
        'email': 'carlton.rebeiz@compass.com',
        'website': 'http://carltonrebeiz.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 414000,
          'listingType': 'New Construction',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 254
        }
      }
    },
    {
      'id': '1127-Metropolitan-Pkwy-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1127 Metropolitan Pkwy SW, Atlanta, GA 30310',
      'addressLine1': '1127 Metropolitan Pkwy SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.724135,
      'longitude': -84.408302,
      'propertyType': 'Multi-Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'lotSize': 9749,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 350000,
      'listingType': 'Standard',
      'listedDate': '2025-06-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-12-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.068Z',
      'daysOnMarket': 252,
      'mlsName': 'FMLS',
      'mlsNumber': '7594077',
      'listingAgent': {
        'name': 'Maclovio Nunez',
        'phone': '4042299718',
        'email': 'macnunez06@msn.com'
      },
      'listingOffice': {
        'name': 'US Realty Hub, LLC',
        'phone': '8889001801',
        'email': 'georgia.broker@usrealtyhub.com',
        'website': 'www.usrealtyhub.com'
      },
      'history': {
        '2025-06-08': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2025-06-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 252
        }
      }
    },
    {
      'id': '1126-Montreat-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1126 Montreat Ave SW, Atlanta, GA 30310',
      'addressLine1': '1126 Montreat Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.729341,
      'longitude': -84.424702,
      'propertyType': 'Multi-Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'lotSize': 7501,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 299900,
      'listingType': 'Standard',
      'listedDate': '2025-06-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-05-25T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.068Z',
      'daysOnMarket': 252,
      'mlsName': 'FMLS',
      'mlsNumber': '7594078',
      'listingAgent': {
        'name': 'Maclovio Nunez',
        'phone': '4042299718',
        'email': 'macnunez06@msn.com'
      },
      'listingOffice': {
        'name': 'US Realty Hub, LLC',
        'phone': '8889001801',
        'email': 'georgia.broker@usrealtyhub.com',
        'website': 'www.usrealtyhub.com'
      },
      'history': {
        '2025-06-08': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-06-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 252
        }
      }
    },
    {
      'id': '1280-W-Peachtree-St-NW,-Apt-3514,-Atlanta,-GA-30309',
      'formattedAddress': '1280 W Peachtree St NW, Apt 3514, Atlanta, GA 30309',
      'addressLine1': '1280 W Peachtree St NW',
      'addressLine2': 'Apt 3514',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.789679,
      'longitude': -84.3888,
      'propertyType': 'Condo',
      'bedrooms': 0,
      'bathrooms': 1,
      'squareFootage': 457,
      'lotSize': 457,
      'yearBuilt': 1989,
      'hoa': {
        'fee': 270
      },
      'status': 'Active',
      'price': 149900,
      'listingType': 'Standard',
      'listedDate': '2025-06-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-10-24T09:53:11.189Z',
      'lastSeenDate': '2026-02-14T11:26:03.067Z',
      'daysOnMarket': 251,
      'mlsName': 'FMLS',
      'mlsNumber': '7591188',
      'listingAgent': {
        'name': 'Temi Alexander',
        'phone': '6788867642',
        'email': 'temialexander@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Cityside',
        'phone': '7708746200',
        'email': 'nicole@zercherhomes.com',
        'website': 'http://kwcityside.com/'
      },
      'history': {
        '2025-06-09': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-06-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 251
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-804,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 804, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 804',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.759979,
      'longitude': -84.382002,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 631,
      'lotSize': 632,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 651
      },
      'status': 'Active',
      'price': 150000,
      'listingType': 'Standard',
      'listedDate': '2025-06-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.066Z',
      'daysOnMarket': 251,
      'mlsName': 'FMLS',
      'mlsNumber': '7590624',
      'listingAgent': {
        'name': 'The Zac Team',
        'phone': '4045647200',
        'email': 'listingagents@zac.biz'
      },
      'listingOffice': {
        'name': 'RE MAX Metro Atlanta Cityside',
        'phone': '4043213123',
        'email': 'darmstrong@remax.net',
        'website': 'http://www.realestateofatlanta.com'
      },
      'history': {
        '2024-12-10': {
          'event': 'Sale Listing',
          'price': 199850,
          'listingType': 'Standard',
          'listedDate': '2024-12-10T00:00:00.000Z',
          'removedDate': '2025-05-31T00:00:00.000Z',
          'daysOnMarket': 172
        },
        '2025-06-09': {
          'event': 'Sale Listing',
          'price': 150000,
          'listingType': 'Standard',
          'listedDate': '2025-06-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 251
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-1001,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 1001, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 1001',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760268,
      'longitude': -84.381242,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 1075,
      'lotSize': 1076,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 1099
      },
      'status': 'Active',
      'price': 180000,
      'listingType': 'Standard',
      'listedDate': '2025-06-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.066Z',
      'daysOnMarket': 251,
      'mlsName': 'FMLS',
      'mlsNumber': '7590655',
      'listingAgent': {
        'name': 'The Zac Team',
        'phone': '4045647200',
        'email': 'listingagents@zac.biz'
      },
      'listingOffice': {
        'name': 'RE MAX Metro Atlanta Cityside',
        'phone': '4043213123',
        'email': 'darmstrong@remax.net',
        'website': 'http://www.realestateofatlanta.com'
      },
      'history': {
        '2024-12-11': {
          'event': 'Sale Listing',
          'price': 225000,
          'listingType': 'Standard',
          'listedDate': '2024-12-11T00:00:00.000Z',
          'removedDate': '2025-05-31T00:00:00.000Z',
          'daysOnMarket': 171
        },
        '2025-06-09': {
          'event': 'Sale Listing',
          'price': 180000,
          'listingType': 'Standard',
          'listedDate': '2025-06-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 251
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-1406,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 1406, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 1406',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760139,
      'longitude': -84.381301,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1256,
      'lotSize': 1255,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 1301
      },
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-06-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.064Z',
      'daysOnMarket': 251,
      'mlsName': 'FMLS',
      'mlsNumber': '7590732',
      'listingAgent': {
        'name': 'The Zac Team',
        'phone': '4045647200',
        'email': 'listingagents@zac.biz'
      },
      'listingOffice': {
        'name': 'RE MAX Metro Atlanta Cityside',
        'phone': '4043213123',
        'email': 'darmstrong@remax.net',
        'website': 'http://www.realestateofatlanta.com'
      },
      'history': {
        '2024-12-10': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2024-12-10T00:00:00.000Z',
          'removedDate': '2025-05-31T00:00:00.000Z',
          'daysOnMarket': 172
        },
        '2025-06-09': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-06-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 251
        }
      }
    },
    {
      'id': '3286-Northside-Pkwy-NW,-Ph-2,-Atlanta,-GA-30327',
      'formattedAddress': '3286 Northside Pkwy NW, Ph 2, Atlanta, GA 30327',
      'addressLine1': '3286 Northside Pkwy NW',
      'addressLine2': 'Ph 2',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.844237,
      'longitude': -84.426364,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 3983,
      'lotSize': 3964,
      'yearBuilt': 2001,
      'status': 'Active',
      'price': 3450000,
      'listingType': 'Standard',
      'listedDate': '2025-06-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-09-28T16:17:26.857Z',
      'lastSeenDate': '2026-02-14T11:26:03.062Z',
      'daysOnMarket': 251,
      'mlsName': 'FMLS',
      'mlsNumber': '7594319',
      'listingAgent': {
        'name': 'Cathy Davis Hall',
        'phone': '4042375000',
        'email': 'cathy@atlantafinehomes.com',
        'website': 'http://www.cathydavishall.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-06-09': {
          'event': 'Sale Listing',
          'price': 3450000,
          'listingType': 'Standard',
          'listedDate': '2025-06-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 251
        }
      }
    },
    {
      'id': '1766-Ware-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '1766 Ware Ave, Atlanta, GA 30344',
      'addressLine1': '1766 Ware Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.683629,
      'longitude': -84.446411,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1238,
      'lotSize': 7501,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-06-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.062Z',
      'daysOnMarket': 250,
      'mlsName': 'FMLS',
      'mlsNumber': '7595324',
      'listingAgent': {
        'name': 'Susan Ayers',
        'phone': '6783441600',
        'email': 'info@clickitrealtyinc.com',
        'website': 'http://www.clickitrealty.com'
      },
      'listingOffice': {
        'name': 'Clickit Realty',
        'phone': '8888754218',
        'email': 'info@clickitrealty.com',
        'website': 'http://www.clickitrealtyinc.com'
      },
      'history': {
        '2025-06-10': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-06-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 250
        }
      }
    },
    {
      'id': '2455-Dodson-Dr,-Atlanta,-GA-30344',
      'formattedAddress': '2455 Dodson Dr, Atlanta, GA 30344',
      'addressLine1': '2455 Dodson Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.688931,
      'longitude': -84.476307,
      'propertyType': 'Land',
      'lotSize': 144619,
      'status': 'Active',
      'price': 120000,
      'listingType': 'Standard',
      'listedDate': '2025-06-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-03-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.061Z',
      'daysOnMarket': 250,
      'mlsName': 'FMLS',
      'mlsNumber': '7595361',
      'listingAgent': {
        'name': 'John Thur',
        'phone': '7704290600',
        'email': 'john.thur@coldwellbankeratlanta.com',
        'website': 'http://johnthur.cbintouch.com/'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7704290600',
        'email': 'jenny.skeens@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/marietta/office/marietta-cobb/oid_3275/'
      },
      'history': {
        '2025-06-10': {
          'event': 'Sale Listing',
          'price': 120000,
          'listingType': 'Standard',
          'listedDate': '2025-06-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 250
        }
      }
    },
    {
      'id': '3541-Roswell-Rd-NE,-Unit-20,-Atlanta,-GA-30305',
      'formattedAddress': '3541 Roswell Rd NE, Unit 20, Atlanta, GA 30305',
      'addressLine1': '3541 Roswell Rd NE',
      'addressLine2': 'Unit 20',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.85214,
      'longitude': -84.38248,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1910,
      'lotSize': 1908,
      'yearBuilt': 2000,
      'hoa': {
        'fee': 175
      },
      'status': 'Active',
      'price': 619000,
      'listingType': 'Standard',
      'listedDate': '2025-06-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.059Z',
      'daysOnMarket': 250,
      'mlsName': 'FMLS',
      'mlsNumber': '7595082',
      'listingAgent': {
        'name': 'Anjanette Fountain',
        'email': 'afountain@dmshomes.com',
        'website': 'http://www.newhomesgeorgia.net/comdetails.asp'
      },
      'listingOffice': {
        'name': 'Sellect Realty, Llc',
        'phone': '7705090265',
        'email': 'suzanne@simplylistatlanta.com',
        'website': 'www.sellectrealty.com'
      },
      'history': {
        '2025-06-10': {
          'event': 'Sale Listing',
          'price': 619000,
          'listingType': 'Standard',
          'listedDate': '2025-06-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 250
        }
      }
    },
    {
      'id': '2828-Peachtree-Rd-NW,-Unit-P3300,-Atlanta,-GA-30305',
      'formattedAddress': '2828 Peachtree Rd NW, Unit P3300, Atlanta, GA 30305',
      'addressLine1': '2828 Peachtree Rd NW',
      'addressLine2': 'Unit P3300',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.832857,
      'longitude': -84.38535,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 3266,
      'lotSize': 2788,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 2132
      },
      'status': 'Active',
      'price': 3250000,
      'listingType': 'Standard',
      'listedDate': '2025-06-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.058Z',
      'daysOnMarket': 249,
      'mlsName': 'FMLS',
      'mlsNumber': '7595787',
      'listingAgent': {
        'name': 'Lalon Haygood',
        'phone': '4045571570',
        'email': 'laylon.haygood@bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-06-11': {
          'event': 'Sale Listing',
          'price': 3250000,
          'listingType': 'Standard',
          'listedDate': '2025-06-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 249
        }
      }
    },
    {
      'id': '2667-Peyton-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2667 Peyton Rd NW, Atlanta, GA 30318',
      'addressLine1': '2667 Peyton Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.808374,
      'longitude': -84.475524,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1322,
      'lotSize': 30623,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 699000,
      'listingType': 'Standard',
      'listedDate': '2025-06-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-05T10:44:36.399Z',
      'lastSeenDate': '2026-02-14T11:26:03.056Z',
      'daysOnMarket': 249,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10541403',
      'listingAgent': {
        'name': 'Mike Price',
        'phone': '6785597826',
        'email': 'mike@mikepriceteam.com',
        'website': 'www.mikepriceteam.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-06-11': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'Standard',
          'listedDate': '2025-06-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 249
        }
      }
    },
    {
      'id': '3211-Hollydale-Dr-SW,-Atlanta,-GA-30311',
      'formattedAddress': '3211 Hollydale Dr SW, Atlanta, GA 30311',
      'addressLine1': '3211 Hollydale Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.734015,
      'longitude': -84.493245,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1751,
      'lotSize': 24394,
      'yearBuilt': 1956,
      'status': 'Active',
      'price': 270000,
      'listingType': 'Standard',
      'listedDate': '2025-06-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.055Z',
      'daysOnMarket': 249,
      'mlsName': 'FMLS',
      'mlsNumber': '7596246',
      'listingAgent': {
        'name': 'Michael Williams',
        'phone': '7702414163',
        'email': 'michael@exitwestmidtown.com'
      },
      'listingOffice': {
        'name': 'EXIT REALTY WEST MIDTOWN',
        'phone': '4707499378',
        'email': 'admin@exitwestmidtown.com',
        'website': 'http://exitwestmidtown.com'
      },
      'history': {
        '2025-06-11': {
          'event': 'Sale Listing',
          'price': 270000,
          'listingType': 'Standard',
          'listedDate': '2025-06-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 249
        }
      }
    },
    {
      'id': '758-Saint-Charles-Ave-NE,-Atlanta,-GA-30306',
      'formattedAddress': '758 Saint Charles Ave NE, Atlanta, GA 30306',
      'addressLine1': '758 Saint Charles Ave NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30306',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.775772,
      'longitude': -84.362518,
      'propertyType': 'Multi-Family',
      'lotSize': 9496,
      'yearBuilt': 1953,
      'status': 'Active',
      'price': 1050000,
      'listingType': 'Standard',
      'listedDate': '2025-06-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.054Z',
      'daysOnMarket': 249,
      'mlsName': 'FMLS',
      'mlsNumber': '7596274',
      'listingAgent': {
        'name': 'Branagan Dunn',
        'phone': '4042462122',
        'email': 'therentalgroup@hotmail.com'
      },
      'listingOffice': {
        'name': 'REALTY ASSOCIATES OF ATLANTA LLC',
        'phone': '4042358900',
        'email': 'kwright@realtyassociatesofatlanta.com',
        'website': 'www.realtyassociatesofatlanta.com'
      },
      'history': {
        '2025-06-11': {
          'event': 'Sale Listing',
          'price': 1050000,
          'listingType': 'Standard',
          'listedDate': '2025-06-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 249
        }
      }
    },
    {
      'id': '3262-Cascade-Parc-Blvd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '3262 Cascade Parc Blvd SW, Atlanta, GA 30311',
      'addressLine1': '3262 Cascade Parc Blvd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.699321,
      'longitude': -84.496238,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2614,
      'lotSize': 1307,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 195
      },
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-06-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-02T12:52:17.982Z',
      'lastSeenDate': '2026-02-14T11:26:03.053Z',
      'daysOnMarket': 248,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10536623',
      'listingAgent': {
        'name': 'Eric Helm',
        'phone': '4047322195',
        'email': 'eric.helm@hotmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty - W Atl',
        'phone': '4709078266',
        'email': 'klrw1176@kw.com'
      },
      'history': {
        '2024-12-05': {
          'event': 'Sale Listing',
          'price': 253000,
          'listingType': 'Standard',
          'listedDate': '2024-12-05T00:00:00.000Z',
          'removedDate': '2025-02-11T00:00:00.000Z',
          'daysOnMarket': 68
        },
        '2025-06-12': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-06-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 248
        }
      }
    },
    {
      'id': '460-E-Kildare-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '460 E Kildare Ave NW, Atlanta, GA 30318',
      'addressLine1': '460 E Kildare Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76814,
      'longitude': -84.48724,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1605,
      'lotSize': 16000,
      'yearBuilt': 1967,
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-06-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.050Z',
      'daysOnMarket': 248,
      'mlsName': 'FMLS',
      'mlsNumber': '7596301',
      'listingAgent': {
        'name': 'Summer Brady',
        'phone': '4047906671',
        'email': 'summertime@kw.com',
        'website': 'http://www.summertimerealty.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-12': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-06-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 248
        }
      }
    },
    {
      'id': '5987-Westchase-St,-Atlanta,-GA-30336',
      'formattedAddress': '5987 Westchase St, Atlanta, GA 30336',
      'addressLine1': '5987 Westchase St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30336',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.722815,
      'longitude': -84.578292,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1772,
      'lotSize': 5009,
      'yearBuilt': 2017,
      'hoa': {
        'fee': 9
      },
      'status': 'Active',
      'price': 269900,
      'listingType': 'Standard',
      'listedDate': '2025-06-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-03T14:23:55.678Z',
      'lastSeenDate': '2026-02-14T11:26:03.048Z',
      'daysOnMarket': 247,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10542427',
      'listingAgent': {
        'name': 'Regina Newton',
        'phone': '6786648075',
        'email': 'regina.newton@bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2024-06-14': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2024-06-14T00:00:00.000Z',
          'removedDate': '2024-10-27T00:00:00.000Z',
          'daysOnMarket': 135
        },
        '2025-03-02': {
          'event': 'Sale Listing',
          'price': 270000,
          'listingType': 'Standard',
          'listedDate': '2025-03-02T00:00:00.000Z',
          'removedDate': '2025-06-10T00:00:00.000Z',
          'daysOnMarket': 100
        },
        '2025-06-13': {
          'event': 'Sale Listing',
          'price': 269900,
          'listingType': 'Standard',
          'listedDate': '2025-06-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 247
        }
      }
    },
    {
      'id': '390-17th-St-NW,-Unit-6055,-Atlanta,-GA-30363',
      'formattedAddress': '390 17th St NW, Unit 6055, Atlanta, GA 30363',
      'addressLine1': '390 17th St NW',
      'addressLine2': 'Unit 6055',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30363',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.790317,
      'longitude': -84.3995,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1263,
      'lotSize': 1263,
      'yearBuilt': 2007,
      'status': 'Active',
      'price': 394500,
      'listingType': 'Standard',
      'listedDate': '2025-06-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-10-30T14:17:08.055Z',
      'lastSeenDate': '2026-02-14T11:26:03.046Z',
      'daysOnMarket': 247,
      'mlsName': 'FMLS',
      'mlsNumber': '7597840',
      'listingAgent': {
        'name': 'Raphael Andrades'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta - Sugarloaf',
        'phone': '6787752600',
        'email': 'agentservices152@gmail.com',
        'website': 'http://kwsugarloaf.com/'
      },
      'history': {
        '2025-06-13': {
          'event': 'Sale Listing',
          'price': 394500,
          'listingType': 'Standard',
          'listedDate': '2025-06-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 247
        }
      }
    },
    {
      'id': '435-Johnson-Ferry-Rd-NW,-Atlanta,-GA-30328',
      'formattedAddress': '435 Johnson Ferry Rd NW, Atlanta, GA 30328',
      'addressLine1': '435 Johnson Ferry Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.93884,
      'longitude': -84.394835,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 3.5,
      'squareFootage': 4513,
      'lotSize': 70349,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 1200000,
      'listingType': 'Standard',
      'listedDate': '2025-06-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.044Z',
      'daysOnMarket': 247,
      'mlsName': 'FMLS',
      'mlsNumber': '7597917',
      'listingAgent': {
        'name': 'Shahin Banaeian',
        'phone': '4043538100',
        'email': 'shahinjaan@aol.com',
        'website': 'http://shahinbanaeianhomesmart.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2024-08-19': {
          'event': 'Sale Listing',
          'price': 1350000,
          'listingType': 'Standard',
          'listedDate': '2024-08-19T00:00:00.000Z',
          'removedDate': '2025-04-01T00:00:00.000Z',
          'daysOnMarket': 225
        },
        '2025-06-13': {
          'event': 'Sale Listing',
          'price': 1200000,
          'listingType': 'Standard',
          'listedDate': '2025-06-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 247
        }
      }
    },
    {
      'id': 'Claire-Dr-SE,-Atlanta,-GA-30315',
      'formattedAddress': 'Claire Dr SE, Atlanta, GA 30315',
      'addressLine1': 'Claire Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.704466,
      'longitude': -84.385699,
      'propertyType': 'Land',
      'lotSize': 69260,
      'status': 'Active',
      'price': 149000,
      'listingType': 'Standard',
      'listedDate': '2025-06-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-05T11:35:23.681Z',
      'lastSeenDate': '2026-02-14T11:26:03.038Z',
      'daysOnMarket': 244,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10544349',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2024-08-15': {
          'event': 'Sale Listing',
          'price': 199900,
          'listingType': 'Standard',
          'listedDate': '2024-08-15T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 259
        },
        '2025-06-16': {
          'event': 'Sale Listing',
          'price': 149000,
          'listingType': 'Standard',
          'listedDate': '2025-06-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 244
        }
      }
    },
    {
      'id': '450-Central-Ave-SW,-Atlanta,-GA-30312',
      'formattedAddress': '450 Central Ave SW, Atlanta, GA 30312',
      'addressLine1': '450 Central Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.742404,
      'longitude': -84.393094,
      'propertyType': 'Land',
      'bedrooms': 0,
      'lotSize': 14418,
      'status': 'Active',
      'price': 750000,
      'listingType': 'Standard',
      'listedDate': '2025-06-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T02:01:03.186Z',
      'lastSeenDate': '2026-02-14T11:26:03.037Z',
      'daysOnMarket': 243,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10545109',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2025-06-17': {
          'event': 'Sale Listing',
          'price': 750000,
          'listingType': 'Standard',
          'listedDate': '2025-06-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 243
        }
      }
    },
    {
      'id': '2436-Clarissa-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2436 Clarissa Dr NW, Atlanta, GA 30318',
      'addressLine1': '2436 Clarissa Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.79699,
      'longitude': -84.460927,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1150,
      'lotSize': 9496,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 223771,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-02-18T12:56:13.237Z',
      'lastSeenDate': '2026-02-14T11:26:03.036Z',
      'daysOnMarket': 229,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10554570',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 248634,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 223771,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '4185-Post-Oak-Grv,-Atlanta,-GA-30349',
      'formattedAddress': '4185 Post Oak Grv, Atlanta, GA 30349',
      'addressLine1': '4185 Post Oak Grv',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.639633,
      'longitude': -84.599218,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2686,
      'lotSize': 11408,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 44
      },
      'status': 'Active',
      'price': 286000,
      'listingType': 'Standard',
      'listedDate': '2025-06-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.035Z',
      'daysOnMarket': 242,
      'mlsName': 'FMLS',
      'mlsNumber': '7598848',
      'listingAgent': {
        'name': 'Joelle Ballariel',
        'phone': '2817537308',
        'email': 'joelle.ballariel@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-18': {
          'event': 'Sale Listing',
          'price': 286000,
          'listingType': 'Standard',
          'listedDate': '2025-06-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 242
        }
      }
    },
    {
      'id': '469-Mellview-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '469 Mellview Ave SW, Atlanta, GA 30310',
      'addressLine1': '469 Mellview Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.718015,
      'longitude': -84.403075,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1750,
      'lotSize': 7492,
      'yearBuilt': 1939,
      'status': 'Active',
      'price': 425000,
      'listingType': 'Standard',
      'listedDate': '2025-06-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-02-11T14:01:05.191Z',
      'lastSeenDate': '2026-02-14T11:26:03.032Z',
      'daysOnMarket': 243,
      'mlsName': 'FMLS',
      'mlsNumber': '7597457',
      'listingAgent': {
        'name': 'Jason Topping',
        'phone': '4043140117',
        'email': 'jason@toppingrealty.com',
        'website': 'http://kellerknapprealty.com/author/jtopping/'
      },
      'listingOffice': {
        'name': 'KELLER KNAPP INC',
        'phone': '6783584321',
        'email': 'wesleeknapp@bellsouth.net'
      },
      'history': {
        '2025-06-17': {
          'event': 'Sale Listing',
          'price': 425000,
          'listingType': 'Standard',
          'listedDate': '2025-06-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 243
        }
      }
    },
    {
      'id': '459-Paines-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '459 Paines Ave NW, Atlanta, GA 30318',
      'addressLine1': '459 Paines Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.767264,
      'longitude': -84.414441,
      'propertyType': 'Land',
      'lotSize': 5445,
      'status': 'Active',
      'price': 120000,
      'listingType': 'Standard',
      'listedDate': '2025-06-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-04-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.030Z',
      'daysOnMarket': 242,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10546423',
      'listingAgent': {
        'name': 'Sherine Loudermilk',
        'phone': '7706406800',
        'email': 'sherinel@c21connectrealty.com'
      },
      'listingOffice': {
        'name': 'CENTURY 21 Connect Realty',
        'phone': '7706406800',
        'email': 'mikep@c21connectrealty.com',
        'website': 'http://www.c21connectrealty.com/'
      },
      'history': {
        '2024-04-11': {
          'event': 'Sale Listing',
          'price': 160000,
          'listingType': 'Standard',
          'listedDate': '2024-04-11T00:00:00.000Z',
          'removedDate': '2025-01-10T00:00:00.000Z',
          'daysOnMarket': 274
        },
        '2025-01-15': {
          'event': 'Sale Listing',
          'price': 145000,
          'listingType': 'Standard',
          'listedDate': '2025-01-15T00:00:00.000Z',
          'removedDate': '2025-06-16T00:00:00.000Z',
          'daysOnMarket': 152
        },
        '2025-06-18': {
          'event': 'Sale Listing',
          'price': 120000,
          'listingType': 'Standard',
          'listedDate': '2025-06-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 242
        }
      }
    },
    {
      'id': '2245-Dauphine-St,-Atlanta,-GA-30344',
      'formattedAddress': '2245 Dauphine St, Atlanta, GA 30344',
      'addressLine1': '2245 Dauphine St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.693734,
      'longitude': -84.436993,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1171,
      'lotSize': 7492,
      'yearBuilt': 1922,
      'status': 'Active',
      'price': 195000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.019Z',
      'daysOnMarket': 241,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10546573',
      'listingAgent': {
        'name': 'Teresa Homan',
        'phone': '6784773578',
        'email': 'teresa.homan@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 195000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': 'Pryor-St,-Atlanta,-GA-30312',
      'formattedAddress': 'Pryor St, Atlanta, GA 30312',
      'addressLine1': 'Pryor St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.74174,
      'longitude': -84.395135,
      'propertyType': 'Land',
      'lotSize': 64469,
      'status': 'Active',
      'price': 3750000,
      'listingType': 'Standard',
      'listedDate': '2025-06-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-03-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.017Z',
      'daysOnMarket': 244,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10544319',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2024-08-14': {
          'event': 'Sale Listing',
          'price': 4000000,
          'listingType': 'Standard',
          'listedDate': '2024-08-14T00:00:00.000Z',
          'removedDate': '2025-04-01T00:00:00.000Z',
          'daysOnMarket': 230
        },
        '2025-06-16': {
          'event': 'Sale Listing',
          'price': 3750000,
          'listingType': 'Standard',
          'listedDate': '2025-06-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 244
        }
      }
    },
    {
      'id': '525-Parkway-Dr-NE,-Apt-306,-Atlanta,-GA-30308',
      'formattedAddress': '525 Parkway Dr NE, Apt 306, Atlanta, GA 30308',
      'addressLine1': '525 Parkway Dr NE',
      'addressLine2': 'Apt 306',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.768639,
      'longitude': -84.372505,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 648,
      'yearBuilt': 2020,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-06-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.016Z',
      'daysOnMarket': 245,
      'mlsName': 'FMLS',
      'mlsNumber': '7598288',
      'listingAgent': {
        'name': 'Xianli Wang',
        'phone': '7703809307',
        'email': 'fchrxw@gmail.com',
        'website': 'https://fionawang.georgiamls.com/'
      },
      'listingOffice': {
        'name': 'First Choice Homes Realty',
        'phone': '7703809307',
        'email': 'fchrxw@gmail.com'
      },
      'history': {
        '2024-12-09': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2024-12-09T00:00:00.000Z',
          'removedDate': '2025-06-01T00:00:00.000Z',
          'daysOnMarket': 174
        },
        '2025-06-15': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-06-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 245
        }
      }
    },
    {
      'id': '799-Hammond-Dr,-Unit-409,-Atlanta,-GA-30328',
      'formattedAddress': '799 Hammond Dr, Unit 409, Atlanta, GA 30328',
      'addressLine1': '799 Hammond Dr',
      'addressLine2': 'Unit 409',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.917488,
      'longitude': -84.359401,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1252,
      'lotSize': 1250,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 525
      },
      'status': 'Active',
      'price': 299900,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-03-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.014Z',
      'daysOnMarket': 241,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10546344',
      'listingAgent': {
        'name': 'Charita Allen',
        'phone': '4044227241',
        'email': 'charitaallen@hotmail.com',
        'website': 'http://www.charitaallen.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'kpalmer@phpatlanta.com',
        'website': 'https://www.palmerhouseproperties.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '1908-W-Kimberly-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '1908 W Kimberly Rd SW, Atlanta, GA 30331',
      'addressLine1': '1908 W Kimberly Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.702706,
      'longitude': -84.52363,
      'propertyType': 'Land',
      'lotSize': 47960,
      'status': 'Active',
      'price': 112000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.014Z',
      'daysOnMarket': 233,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10552257',
      'listingAgent': {
        'name': 'Chiniqua L. Carter',
        'phone': '4049351599',
        'email': 'chiniqua529@yahoo.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty - Peachtree City',
        'phone': '7706321112',
        'email': 'frontdesk213@kw.com',
        'website': 'http://peachtreecity.yourkwoffice.com'
      },
      'history': {
        '2024-12-30': {
          'event': 'Sale Listing',
          'price': 113000,
          'listingType': 'Standard',
          'listedDate': '2024-12-30T00:00:00.000Z',
          'removedDate': '2025-03-25T00:00:00.000Z',
          'daysOnMarket': 85
        },
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 112000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '2991-Springdale-Rd-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2991 Springdale Rd SW, Atlanta, GA 30315',
      'addressLine1': '2991 Springdale Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.673429,
      'longitude': -84.417334,
      'propertyType': 'Land',
      'lotSize': 439956,
      'status': 'Active',
      'price': 5990000,
      'listingType': 'Standard',
      'listedDate': '2025-06-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-05-12T16:40:50.146Z',
      'lastSeenDate': '2026-02-14T11:26:03.013Z',
      'daysOnMarket': 243,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10545008',
      'listingAgent': {
        'name': 'Jessica Lieu',
        'phone': '4049345204',
        'email': 'jessica@yourkeytoatlanta.com',
        'website': 'https://yourkeytoatlanta.com'
      },
      'listingOffice': {
        'name': 'Brick and Bloom Property Management, LLC',
        'phone': '4048069144',
        'email': 'help@brickandbloompm.com'
      },
      'history': {
        '2024-08-15': {
          'event': 'Sale Listing',
          'price': 3350000,
          'listingType': 'Standard',
          'listedDate': '2024-08-15T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 259
        },
        '2025-06-17': {
          'event': 'Sale Listing',
          'price': 5990000,
          'listingType': 'Standard',
          'listedDate': '2025-06-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 243
        }
      }
    },
    {
      'id': '788-W-Marietta-St-NW,-Unit-308,-Atlanta,-GA-30318',
      'formattedAddress': '788 W Marietta St NW, Unit 308, Atlanta, GA 30318',
      'addressLine1': '788 W Marietta St NW',
      'addressLine2': 'Unit 308',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.779748,
      'longitude': -84.414044,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1246,
      'lotSize': 1246,
      'yearBuilt': 2020,
      'hoa': {
        'fee': 615
      },
      'status': 'Active',
      'price': 545000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-05-20T15:55:26.453Z',
      'lastSeenDate': '2026-02-14T11:26:03.012Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7600689',
      'listingAgent': {
        'name': 'Garrett Fulton',
        'phone': '7037276123',
        'email': 'garrett.fulton@bhhsgeorgia.com',
        'website': 'https://garrettfulton.bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Rlty-Ptree Rd',
        'phone': '4044193500',
        'email': 'lynnlecraw@kw.com',
        'website': 'peachtreeroad.yourkwoffice.com/mcj/user/homepagegetaction.do'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 545000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '6851-Roswell-Rd,-Apt-H18,-Atlanta,-GA-30328',
      'formattedAddress': '6851 Roswell Rd, Apt H18, Atlanta, GA 30328',
      'addressLine1': '6851 Roswell Rd',
      'addressLine2': 'Apt H18',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.941298,
      'longitude': -84.371289,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1469,
      'lotSize': 1481,
      'yearBuilt': 1964,
      'hoa': {
        'fee': 557
      },
      'status': 'Active',
      'price': 279750,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.012Z',
      'daysOnMarket': 241,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10537627',
      'listingAgent': {
        'name': 'Donna Kantak',
        'phone': '6786123044',
        'email': 'donna.kantak@cbrealty.com',
        'website': 'http://donnasellsgahomes.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4042524908',
        'email': 'mike.wright@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/sandy-springs-perimeter/oid_3223/'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 279750,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '1053M-L-King-Jr-Dr-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1053M L King Jr Dr NW, Atlanta, GA 30314',
      'addressLine1': '1053M L King Jr Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.755095,
      'longitude': -84.422367,
      'propertyType': 'Land',
      'lotSize': 6186,
      'yearBuilt': 1935,
      'status': 'Active',
      'price': 169000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.011Z',
      'daysOnMarket': 241,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10546989',
      'listingAgent': {
        'name': 'The Sly Team',
        'phone': '4043494888',
        'email': 'majasly@gmail.com',
        'website': 'http://www.theslyteam.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Perimeter',
        'phone': '6782981600',
        'email': 'bradfeiman@kw.com',
        'website': 'http://www.kwdunwoody.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 169000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '3344-Peachtree-Rd-NE,-Unit-3504,-Atlanta,-GA-30326',
      'formattedAddress': '3344 Peachtree Rd NE, Unit 3504, Atlanta, GA 30326',
      'addressLine1': '3344 Peachtree Rd NE',
      'addressLine2': 'Unit 3504',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.847092,
      'longitude': -84.36857,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2494,
      'lotSize': 3180,
      'yearBuilt': 2008,
      'hoa': {
        'fee': 237
      },
      'status': 'Active',
      'price': 1499000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.010Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7600732',
      'listingAgent': {
        'name': 'Kimberly Ayers',
        'phone': '4042819301',
        'email': 'kimberlyayers@ansleyatlanta.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 1499000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '3798-King-Henry-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3798 King Henry Rd SW, Atlanta, GA 30331',
      'addressLine1': '3798 King Henry Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.701698,
      'longitude': -84.512605,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1412,
      'lotSize': 19998,
      'yearBuilt': 1964,
      'status': 'Active',
      'price': 179000,
      'listingType': 'Standard',
      'listedDate': '2025-06-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.010Z',
      'daysOnMarket': 239,
      'mlsName': 'FMLS',
      'mlsNumber': '7602269',
      'listingAgent': {
        'name': 'Frank Edmondson',
        'phone': '7709939200',
        'email': 'frank.edmondson@cbrealty.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-06-21': {
          'event': 'Sale Listing',
          'price': 179000,
          'listingType': 'Standard',
          'listedDate': '2025-06-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 239
        }
      }
    },
    {
      'id': '805-Peachtree-St-NE,-Unit-411,-Atlanta,-GA-30308',
      'formattedAddress': '805 Peachtree St NE, Unit 411, Atlanta, GA 30308',
      'addressLine1': '805 Peachtree St NE',
      'addressLine2': 'Unit 411',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.776452,
      'longitude': -84.383851,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1330,
      'lotSize': 1350,
      'yearBuilt': 1951,
      'hoa': {
        'fee': 735
      },
      'status': 'Active',
      'price': 474500,
      'listingType': 'Standard',
      'listedDate': '2025-06-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-02-25T14:24:51.605Z',
      'lastSeenDate': '2026-02-14T11:26:03.009Z',
      'daysOnMarket': 240,
      'mlsName': 'FMLS',
      'mlsNumber': '7601887',
      'listingAgent': {
        'name': 'Shannon Williams',
        'phone': '4046432013',
        'email': 'shannon@elementsatlanta.com',
        'website': 'http://www.elementsatlanta.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Intown',
        'phone': '4045413500',
        'email': 'klrw226@kw.com',
        'website': 'https://kwintown.com/'
      },
      'history': {
        '2025-06-20': {
          'event': 'Sale Listing',
          'price': 474500,
          'listingType': 'Standard',
          'listedDate': '2025-06-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 240
        }
      }
    },
    {
      'id': '2965-Pharr-Ct,-South-NW-Apt-817,-Atlanta,-GA-30305',
      'formattedAddress': '2965 Pharr Ct, South NW Apt 817, Atlanta, GA 30305',
      'addressLine1': '2965 Pharr Ct',
      'addressLine2': 'South NW Apt 817',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.836062,
      'longitude': -84.384606,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 742,
      'lotSize': 741,
      'yearBuilt': 1958,
      'hoa': {
        'fee': 416
      },
      'status': 'Active',
      'price': 185000,
      'listingType': 'Standard',
      'listedDate': '2025-06-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-11-03T14:07:03.988Z',
      'lastSeenDate': '2026-02-14T11:26:03.008Z',
      'daysOnMarket': 240,
      'mlsName': 'FMLS',
      'mlsNumber': '7597793',
      'listingAgent': {
        'name': 'Shaka Walker',
        'phone': '2567705321',
        'email': 'shaka.walker@compass.com',
        'website': 'sellingatl.homes'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-06-20': {
          'event': 'Sale Listing',
          'price': 185000,
          'listingType': 'Standard',
          'listedDate': '2025-06-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 240
        }
      }
    },
    {
      'id': '2009-Baker-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2009 Baker Rd NW, Atlanta, GA 30318',
      'addressLine1': '2009 Baker Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.770273,
      'longitude': -84.45282,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 1.5,
      'squareFootage': 1088,
      'lotSize': 10367,
      'yearBuilt': 1948,
      'status': 'Active',
      'price': 259995,
      'listingType': 'Standard',
      'listedDate': '2025-06-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.008Z',
      'daysOnMarket': 240,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10546959',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-06-20': {
          'event': 'Sale Listing',
          'price': 259995,
          'listingType': 'Standard',
          'listedDate': '2025-06-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 240
        }
      }
    },
    {
      'id': '1117-Cordia-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1117 Cordia Ave NW, Atlanta, GA 30318',
      'addressLine1': '1117 Cordia Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.813328,
      'longitude': -84.422346,
      'propertyType': 'Townhouse',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 3972,
      'lotSize': 1568,
      'yearBuilt': 2015,
      'status': 'Active',
      'price': 950000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-10-16T17:47:49.338Z',
      'lastSeenDate': '2026-02-14T11:26:03.007Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7600971',
      'listingAgent': {
        'name': 'Briana Singleton',
        'phone': '3106940970'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 950000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '238-Walker-St-SW,-Unit-22,-Atlanta,-GA-30313',
      'formattedAddress': '238 Walker St SW, Unit 22, Atlanta, GA 30313',
      'addressLine1': '238 Walker St SW',
      'addressLine2': 'Unit 22',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.748316,
      'longitude': -84.402176,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 956,
      'lotSize': 784,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 154
      },
      'status': 'Active',
      'price': 179000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.006Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7600532',
      'listingAgent': {
        'name': 'Kenyatta Bleckley',
        'phone': '6786877502',
        'email': 'kenyattableckley@att.net',
        'website': 'http://www.kenyattableckley.com'
      },
      'listingOffice': {
        'name': 'NorthGroup Real Estate',
        'phone': '9804471771',
        'email': 'lindy@northgroupre.com',
        'website': 'www.northgroupre.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 179000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '183-Cleveland-St-SE,-Unit-B,-Atlanta,-GA-30316',
      'formattedAddress': '183 Cleveland St SE, Unit B, Atlanta, GA 30316',
      'addressLine1': '183 Cleveland St SE',
      'addressLine2': 'Unit B',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.748676,
      'longitude': -84.350777,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1924,
      'lotSize': 4356,
      'yearBuilt': 2017,
      'status': 'Active',
      'price': 775000,
      'listingType': 'Standard',
      'listedDate': '2025-06-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.006Z',
      'daysOnMarket': 234,
      'mlsName': 'FMLS',
      'mlsNumber': '7604477',
      'listingAgent': {
        'name': 'Michael Schultz',
        'phone': '2197417449',
        'email': 'michaelsellsatl@gmail.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '7704427300',
        'email': 'info@atlantafinehomes.com',
        'website': 'www.sothebysrealty.com/atlantafinehomessir/eng'
      },
      'history': {
        '2025-06-26': {
          'event': 'Sale Listing',
          'price': 775000,
          'listingType': 'Standard',
          'listedDate': '2025-06-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 234
        }
      }
    },
    {
      'id': '322-Peters-St-SW,-Unit-2,-Atlanta,-GA-30313',
      'formattedAddress': '322 Peters St SW, Unit 2, Atlanta, GA 30313',
      'addressLine1': '322 Peters St SW',
      'addressLine2': 'Unit 2',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.745879,
      'longitude': -84.403175,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 1535,
      'lotSize': 1525,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 285
      },
      'status': 'Active',
      'price': 350000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.005Z',
      'daysOnMarket': 233,
      'mlsName': 'FMLS',
      'mlsNumber': '7602350',
      'listingAgent': {
        'name': 'Pamela Oldaker',
        'phone': '7707838896',
        'email': 'pam@powerofpam.com',
        'website': 'http://www.powerofpam.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - East Cobb',
        'phone': '7702402001',
        'email': 'eastcobb@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '85-Ollie-St-NW,-Atlanta,-GA-30314',
      'formattedAddress': '85 Ollie St NW, Atlanta, GA 30314',
      'addressLine1': '85 Ollie St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.757128,
      'longitude': -84.421067,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1433,
      'lotSize': 3920,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 380000,
      'listingType': 'Standard',
      'listedDate': '2025-06-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.004Z',
      'daysOnMarket': 237,
      'mlsName': 'FMLS',
      'mlsNumber': '7602820',
      'listingAgent': {
        'name': 'Jeremiah Peters',
        'phone': '7064108978',
        'email': 'jeremiahjustinpeters@gmail.com',
        'website': 'www.jpsoldit.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-06-23': {
          'event': 'Sale Listing',
          'price': 380000,
          'listingType': 'Standard',
          'listedDate': '2025-06-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 237
        }
      }
    },
    {
      'id': '1422-Boulevard-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1422 Boulevard SE, Atlanta, GA 30315',
      'addressLine1': '1422 Boulevard SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.715458,
      'longitude': -84.368151,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1300,
      'lotSize': 9749,
      'yearBuilt': 1939,
      'status': 'Active',
      'price': 270000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-21T21:56:37.912Z',
      'lastSeenDate': '2026-02-14T11:26:03.003Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7601104',
      'listingAgent': {
        'name': 'Phong Huynh',
        'phone': '6784691415',
        'email': 'pth.sells@gmail.com',
        'website': 'http://www.donhuynhassociates.com'
      },
      'listingOffice': {
        'name': 'Atl Realty Star',
        'phone': '6785108288',
        'email': 'atlrealtystar@gmail.com',
        'website': 'http://www.atlrealtystar.com'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 270000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '40-Dunwoody-Springs-Dr,-Atlanta,-GA-30328',
      'formattedAddress': '40 Dunwoody Springs Dr, Atlanta, GA 30328',
      'addressLine1': '40 Dunwoody Springs Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.922183,
      'longitude': -84.356221,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1900,
      'lotSize': 1917,
      'yearBuilt': 1985,
      'hoa': {
        'fee': 450
      },
      'status': 'Active',
      'price': 315000,
      'listingType': 'Standard',
      'listedDate': '2025-06-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.002Z',
      'daysOnMarket': 239,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10548592',
      'listingAgent': {
        'name': 'Kelly Coquerel',
        'phone': '6786530508',
        'email': 'realestate@kellycoquerel.com'
      },
      'listingOffice': {
        'name': 'KDH Realty, LLC',
        'phone': '6785419733',
        'email': 'offers@kdhrealty.com',
        'website': 'http://www.kdhrealty.com'
      },
      'history': {
        '2025-06-21': {
          'event': 'Sale Listing',
          'price': 315000,
          'listingType': 'Standard',
          'listedDate': '2025-06-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 239
        }
      }
    },
    {
      'id': '2443-Abner-Pl-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2443 Abner Pl NW, Atlanta, GA 30318',
      'addressLine1': '2443 Abner Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.800272,
      'longitude': -84.466629,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1321,
      'lotSize': 10977,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 259900,
      'listingType': 'Standard',
      'listedDate': '2025-06-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-04-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:03.000Z',
      'daysOnMarket': 237,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10549676',
      'listingAgent': {
        'name': 'Stephen Lytle',
        'phone': '4045364567',
        'email': 'lytle@vestaholdings.com'
      },
      'listingOffice': {
        'name': 'Gps Property Management, Llc.',
        'phone': '4049493855',
        'email': 'lytle@investaservices.com'
      },
      'history': {
        '2024-07-03': {
          'event': 'Sale Listing',
          'price': 304900,
          'listingType': 'Standard',
          'listedDate': '2024-07-03T00:00:00.000Z',
          'removedDate': '2024-11-01T00:00:00.000Z',
          'daysOnMarket': 121
        },
        '2024-11-14': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2024-11-14T00:00:00.000Z',
          'removedDate': '2025-02-15T00:00:00.000Z',
          'daysOnMarket': 93
        },
        '2025-06-18': {
          'event': 'Sale Listing',
          'price': 269900,
          'listingType': 'Standard',
          'listedDate': '2025-06-18T00:00:00.000Z',
          'removedDate': '2025-06-23T00:00:00.000Z',
          'daysOnMarket': 5
        },
        '2025-06-23': {
          'event': 'Sale Listing',
          'price': 259900,
          'listingType': 'Standard',
          'listedDate': '2025-06-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 237
        }
      }
    },
    {
      'id': '2878-Wesley-Heath-NW,-Atlanta,-GA-30327',
      'formattedAddress': '2878 Wesley Heath NW, Atlanta, GA 30327',
      'addressLine1': '2878 Wesley Heath NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.835578,
      'longitude': -84.435257,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 5.5,
      'squareFootage': 4575,
      'lotSize': 16248,
      'yearBuilt': 1989,
      'status': 'Active',
      'price': 1895000,
      'listingType': 'Standard',
      'listedDate': '2025-06-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.999Z',
      'daysOnMarket': 241,
      'mlsName': 'FMLS',
      'mlsNumber': '7601116',
      'listingAgent': {
        'name': 'Alex Mclean',
        'phone': '4042375000',
        'email': 'alexmclean@atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 1895000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 241
        }
      }
    },
    {
      'id': '1446-Westmont-Rd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1446 Westmont Rd SW, Atlanta, GA 30311',
      'addressLine1': '1446 Westmont Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.715827,
      'longitude': -84.43736,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3.5,
      'squareFootage': 2143,
      'lotSize': 7492,
      'yearBuilt': 1952,
      'status': 'Active',
      'price': 389900,
      'listingType': 'Standard',
      'listedDate': '2025-06-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-05-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.999Z',
      'daysOnMarket': 236,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10550393',
      'listingAgent': {
        'name': 'Donald Exler',
        'phone': '6787022247',
        'email': 'exlerdonald@gmail.com'
      },
      'listingOffice': {
        'name': 'SOUTHERN CLASSIC REALTORS',
        'phone': '6786358877',
        'email': 'jameshamby@alltel.net',
        'website': 'www.southernclassicrealtors.com'
      },
      'history': {
        '2024-08-09': {
          'event': 'Sale Listing',
          'price': 399000,
          'listingType': 'Standard',
          'listedDate': '2024-08-09T00:00:00.000Z',
          'removedDate': '2024-10-31T00:00:00.000Z',
          'daysOnMarket': 83
        },
        '2025-06-24': {
          'event': 'Sale Listing',
          'price': 389900,
          'listingType': 'Standard',
          'listedDate': '2025-06-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 236
        }
      }
    },
    {
      'id': '1597-Joseph-E-Boone-Blvd-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1597 Joseph E Boone Blvd NW, Atlanta, GA 30314',
      'addressLine1': '1597 Joseph E Boone Blvd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.763933,
      'longitude': -84.440176,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 1186,
      'lotSize': 14810,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 249000,
      'listingType': 'Standard',
      'listedDate': '2025-06-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-25T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.998Z',
      'daysOnMarket': 236,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10550111',
      'listingAgent': {
        'name': 'Keron Feliciano',
        'phone': '8889599461',
        'email': 'keron.feliciano@exprealty.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-06-24': {
          'event': 'Sale Listing',
          'price': 249000,
          'listingType': 'Standard',
          'listedDate': '2025-06-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 236
        }
      }
    },
    {
      'id': '3769-Amber-Rd-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3769 Amber Rd NW, Atlanta, GA 30331',
      'addressLine1': '3769 Amber Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.778465,
      'longitude': -84.510656,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1668,
      'lotSize': 9100,
      'yearBuilt': 1959,
      'status': 'Active',
      'price': 225000,
      'listingType': 'Standard',
      'listedDate': '2025-06-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.998Z',
      'daysOnMarket': 235,
      'mlsName': 'FMLS',
      'mlsNumber': '7604452',
      'listingAgent': {
        'name': 'Keith Eatmon',
        'phone': '4044523131'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-06-25': {
          'event': 'Sale Listing',
          'price': 225000,
          'listingType': 'Standard',
          'listedDate': '2025-06-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 235
        }
      }
    },
    {
      'id': '57-Forsyth-St-NW,-Ste-16G,-Atlanta,-GA-30303',
      'formattedAddress': '57 Forsyth St NW, Ste 16G, Atlanta, GA 30303',
      'addressLine1': '57 Forsyth St NW',
      'addressLine2': 'Ste 16G',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30303',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.755881,
      'longitude': -84.389697,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 998,
      'lotSize': 1002,
      'yearBuilt': 1913,
      'hoa': {
        'fee': 700
      },
      'status': 'Active',
      'price': 280000,
      'listingType': 'Standard',
      'listedDate': '2025-06-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-12T16:29:22.412Z',
      'lastSeenDate': '2026-02-14T11:26:02.996Z',
      'daysOnMarket': 232,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10553325',
      'listingAgent': {
        'name': 'Vanessa Machado',
        'phone': '5855091271',
        'email': 'vmachadoga@gmail.com'
      },
      'listingOffice': {
        'name': 'Royalty Brokers Real Estate',
        'phone': '4705966935',
        'email': 'acolesie@aol.com'
      },
      'history': {
        '2025-06-28': {
          'event': 'Sale Listing',
          'price': 280000,
          'listingType': 'Standard',
          'listedDate': '2025-06-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 232
        }
      }
    },
    {
      'id': '1493-Vesta-Ave,-Atlanta,-GA-30337',
      'formattedAddress': '1493 Vesta Ave, Atlanta, GA 30337',
      'addressLine1': '1493 Vesta Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30337',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.667046,
      'longitude': -84.437714,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1703,
      'lotSize': 14462,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 389900,
      'listingType': 'Standard',
      'listedDate': '2025-06-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.995Z',
      'daysOnMarket': 235,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10550863',
      'listingAgent': {
        'name': 'Donald Exler',
        'phone': '6787022247',
        'email': 'exlerdonald@gmail.com'
      },
      'listingOffice': {
        'name': 'SOUTHERN CLASSIC REALTORS',
        'phone': '6786358877',
        'email': 'jameshamby@alltel.net',
        'website': 'www.southernclassicrealtors.com'
      },
      'history': {
        '2024-08-09': {
          'event': 'Sale Listing',
          'price': 429000,
          'listingType': 'Standard',
          'listedDate': '2024-08-09T00:00:00.000Z',
          'removedDate': '2024-10-31T00:00:00.000Z',
          'daysOnMarket': 83
        },
        '2025-06-25': {
          'event': 'Sale Listing',
          'price': 389900,
          'listingType': 'Standard',
          'listedDate': '2025-06-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 235
        }
      }
    },
    {
      'id': '1301-Peachtree-St-NE,-Unit-4L,-Atlanta,-GA-30309',
      'formattedAddress': '1301 Peachtree St NE, Unit 4L, Atlanta, GA 30309',
      'addressLine1': '1301 Peachtree St NE',
      'addressLine2': 'Unit 4L',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.79011,
      'longitude': -84.383987,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 4,
      'squareFootage': 4840,
      'lotSize': 4835,
      'yearBuilt': 2017,
      'hoa': {
        'fee': 251
      },
      'status': 'Active',
      'price': 3995000,
      'listingType': 'Standard',
      'listedDate': '2025-06-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-11-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.994Z',
      'daysOnMarket': 237,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10549451',
      'listingAgent': {
        'name': 'Nicholas Daniel Brown',
        'phone': '7706305430',
        'email': 'nicholas.brown@compass.com',
        'website': 'https://browndanielgroup.com/'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2024-11-11': {
          'event': 'Sale Listing',
          'price': 4495000,
          'listingType': 'Standard',
          'listedDate': '2024-11-11T00:00:00.000Z',
          'removedDate': '2025-06-01T00:00:00.000Z',
          'daysOnMarket': 202
        },
        '2025-06-23': {
          'event': 'Sale Listing',
          'price': 3995000,
          'listingType': 'Standard',
          'listedDate': '2025-06-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 237
        }
      }
    },
    {
      'id': '2425-Peachtree-Rd-NE,-Unit-1505,-Atlanta,-GA-30305',
      'formattedAddress': '2425 Peachtree Rd NE, Unit 1505, Atlanta, GA 30305',
      'addressLine1': '2425 Peachtree Rd NE',
      'addressLine2': 'Unit 1505',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.820849,
      'longitude': -84.387597,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2985,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 1685
      },
      'status': 'Active',
      'price': 5600000,
      'listingType': 'New Construction',
      'listedDate': '2025-06-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.994Z',
      'daysOnMarket': 234,
      'mlsName': 'FMLS',
      'mlsNumber': '7605112',
      'listingAgent': {
        'name': 'Denise Joiner',
        'phone': '4042616300',
        'email': 'denisejoiner@beacham.com',
        'website': 'http://www.luxuryhomes-atlanta.com'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-06-26': {
          'event': 'Sale Listing',
          'price': 5600000,
          'listingType': 'New Construction',
          'listedDate': '2025-06-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 234
        }
      }
    },
    {
      'id': '482-Tarragon-Way-SW,-Atlanta,-GA-30331',
      'formattedAddress': '482 Tarragon Way SW, Atlanta, GA 30331',
      'addressLine1': '482 Tarragon Way SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.749729,
      'longitude': -84.51808,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1166,
      'lotSize': 8499,
      'yearBuilt': 1986,
      'status': 'Active',
      'price': 250000,
      'listingType': 'Standard',
      'listedDate': '2025-06-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.993Z',
      'daysOnMarket': 239,
      'mlsName': 'FMLS',
      'mlsNumber': '7596530',
      'listingAgent': {
        'name': 'Edgar Chavez',
        'phone': '6026917367',
        'email': 'edgar.chavez@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-21': {
          'event': 'Sale Listing',
          'price': 250000,
          'listingType': 'Standard',
          'listedDate': '2025-06-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 239
        }
      }
    },
    {
      'id': '1279-Kenilworth-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1279 Kenilworth Dr SW, Atlanta, GA 30310',
      'addressLine1': '1279 Kenilworth Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.720139,
      'longitude': -84.434547,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 2,
      'squareFootage': 2072,
      'lotSize': 11500,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 239610,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-05-16T15:52:00.754Z',
      'lastSeenDate': '2026-02-14T11:26:02.992Z',
      'daysOnMarket': 229,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10554562',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 266233,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 239610,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '2083-Meador-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '2083 Meador Ave SE, Atlanta, GA 30315',
      'addressLine1': '2083 Meador Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.697389,
      'longitude': -84.380667,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1285,
      'lotSize': 9409,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 235000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.990Z',
      'daysOnMarket': 233,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10552905',
      'listingAgent': {
        'name': 'Robert Salmons',
        'phone': '7132489869',
        'email': 'mkay@greenletinv.com'
      },
      'listingOffice': {
        'name': 'Entera Realty',
        'phone': '7132489869',
        'email': 'rsgl@enterarealty.com',
        'website': 'http://www.enterarealty.com'
      },
      'history': {
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 235000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '3645-Croft-Pl-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3645 Croft Pl NW, Atlanta, GA 30331',
      'addressLine1': '3645 Croft Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.775501,
      'longitude': -84.506785,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1025,
      'lotSize': 9017,
      'yearBuilt': 1959,
      'status': 'Active',
      'price': 211000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.989Z',
      'daysOnMarket': 233,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10551773',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 211000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '1321-Mcclelland-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '1321 Mcclelland Ave, Atlanta, GA 30344',
      'addressLine1': '1321 Mcclelland Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.698829,
      'longitude': -84.432065,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 1,
      'squareFootage': 1108,
      'lotSize': 6900,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-04-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.989Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607268',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 227121,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1089-Indale-Pl-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1089 Indale Pl SW, Atlanta, GA 30310',
      'addressLine1': '1089 Indale Pl SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.725359,
      'longitude': -84.428901,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1290,
      'lotSize': 9496,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 301500,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-07-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.988Z',
      'daysOnMarket': 229,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10554559',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-11': {
          'event': 'Sale Listing',
          'price': 335000,
          'listingType': 'Standard',
          'listedDate': '2024-12-11T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 202
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 301500,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '878-Ne-Peachtree-St,-Unit-326,-Atlanta,-GA-30309',
      'formattedAddress': '878 Ne Peachtree St, Unit 326, Atlanta, GA 30309',
      'addressLine1': '878 Ne Peachtree St',
      'addressLine2': 'Unit 326',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.778855,
      'longitude': -84.384653,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1694,
      'lotSize': 523,
      'yearBuilt': 1951,
      'hoa': {
        'fee': 19
      },
      'status': 'Active',
      'price': 220000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.986Z',
      'daysOnMarket': 233,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10552975',
      'listingAgent': {
        'name': 'Elsa Domenzain-realtor®',
        'phone': '7704955050',
        'email': 'elsad.realestate@gmail.com',
        'website': 'http://www.elsadomenzainrealestate.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '132-Brownlee-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '132 Brownlee Rd SW, Atlanta, GA 30331',
      'addressLine1': '132 Brownlee Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.753116,
      'longitude': -84.500247,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1320,
      'lotSize': 6970,
      'yearBuilt': 2005,
      'status': 'Active',
      'price': 183000,
      'listingType': 'Standard',
      'listedDate': '2025-06-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:26:02.985Z',
      'daysOnMarket': 234,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10552121',
      'listingAgent': {
        'name': 'Adam Woodring',
        'phone': '9318017210',
        'email': 'adam.woodring@opendoor.com'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-06-26': {
          'event': 'Sale Listing',
          'price': 183000,
          'listingType': 'Standard',
          'listedDate': '2025-06-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 234
        }
      }
    },
    {
      'id': '878-Peachtree-St-NE,-Apt-326,-Atlanta,-GA-30309',
      'formattedAddress': '878 Peachtree St NE, Apt 326, Atlanta, GA 30309',
      'addressLine1': '878 Peachtree St NE',
      'addressLine2': 'Apt 326',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.778855,
      'longitude': -84.384653,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 515,
      'lotSize': 523,
      'yearBuilt': 1951,
      'hoa': {
        'fee': 232
      },
      'status': 'Active',
      'price': 220000,
      'listingType': 'Standard',
      'listedDate': '2025-06-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-12-02T13:46:46.458Z',
      'lastSeenDate': '2026-02-14T11:26:02.983Z',
      'daysOnMarket': 233,
      'mlsName': 'FMLS',
      'mlsNumber': '7593317',
      'listingAgent': {
        'name': 'Elsa Domenzain-realtor®',
        'phone': '7704955050',
        'email': 'elsad.realestate@gmail.com',
        'website': 'http://www.elsadomenzainrealestate.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-06-27': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-06-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 233
        }
      }
    },
    {
      'id': '1055-Westmont-Rd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1055 Westmont Rd SW, Atlanta, GA 30311',
      'addressLine1': '1055 Westmont Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726109,
      'longitude': -84.437905,
      'propertyType': 'Land',
      'lotSize': 217800,
      'status': 'Active',
      'price': 799000,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-10-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.523Z',
      'daysOnMarket': 221,
      'mlsName': 'FMLS',
      'mlsNumber': '7611769',
      'listingAgent': {
        'name': 'Lindsay Allen',
        'phone': '3232511570'
      },
      'listingOffice': {
        'name': 'Swartz Co Residential Real Estate',
        'phone': '6789732776',
        'email': 'rswartzberg@swartzcocre.com'
      },
      'history': {
        '2024-10-31': {
          'event': 'Sale Listing',
          'price': 1400000,
          'listingType': 'Standard',
          'listedDate': '2024-10-31T00:00:00.000Z',
          'removedDate': '2025-05-01T00:00:00.000Z',
          'daysOnMarket': 182
        },
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 799000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '1688-Richland-Rd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1688 Richland Rd SW, Atlanta, GA 30311',
      'addressLine1': '1688 Richland Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.731161,
      'longitude': -84.443055,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 3000,
      'lotSize': 8233,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 525000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-10-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.522Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560258',
      'listingAgent': {
        'name': 'Talitha Campbell',
        'phone': '6788529801',
        'email': 'c45@leadgen.reliancenetwork.com',
        'website': 'http://www.talithacampbell.bhhsgeorgia.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '7704750505',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2024-10-08': {
          'event': 'Sale Listing',
          'price': 565900,
          'listingType': 'Standard',
          'listedDate': '2024-10-08T00:00:00.000Z',
          'removedDate': '2025-07-09T00:00:00.000Z',
          'daysOnMarket': 274
        },
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 525000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': '2026-01-16T00:00:00.000Z',
          'daysOnMarket': 191
        },
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 525000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '56-17th-St-NE,-Atlanta,-GA-30309',
      'formattedAddress': '56 17th St NE, Atlanta, GA 30309',
      'addressLine1': '56 17th St NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.793115,
      'longitude': -84.385601,
      'propertyType': 'Land',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 3613,
      'lotSize': 5009,
      'yearBuilt': 1914,
      'status': 'Active',
      'price': 1985000,
      'listingType': 'Standard',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-09-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.521Z',
      'daysOnMarket': 219,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10562141',
      'listingAgent': {
        'name': 'Angela Beck',
        'phone': '4042375000',
        'email': 'angelabeck@atlantafinehomes.com',
        'website': 'http://angelabeck.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'adminatlanta@compass.com'
      },
      'history': {
        '2024-09-23': {
          'event': 'Sale Listing',
          'price': 1980000,
          'listingType': 'Standard',
          'listedDate': '2024-09-23T00:00:00.000Z',
          'removedDate': '2025-04-16T00:00:00.000Z',
          'daysOnMarket': 205
        },
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 1985000,
          'listingType': 'Standard',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': '3530-Fairlane-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3530 Fairlane Dr NW, Atlanta, GA 30331',
      'addressLine1': '3530 Fairlane Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.766666,
      'longitude': -84.502823,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1620,
      'lotSize': 9200,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 223776,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.519Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607273',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 248629,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 223776,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1417-Graymont-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1417 Graymont Dr SW, Atlanta, GA 30310',
      'addressLine1': '1417 Graymont Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.71555,
      'longitude': -84.436877,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1393,
      'lotSize': 7501,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 239204,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-12T09:13:15.294Z',
      'lastSeenDate': '2026-02-14T11:25:02.518Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607275',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 265782,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 239204,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1324-Almont-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1324 Almont Dr SW, Atlanta, GA 30310',
      'addressLine1': '1324 Almont Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.725662,
      'longitude': -84.431263,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1690,
      'lotSize': 8773,
      'yearBuilt': 1948,
      'status': 'Active',
      'price': 289362,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-08-08T15:57:56.442Z',
      'lastSeenDate': '2026-02-14T11:25:02.517Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607278',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 321513,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 289362,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '501-Aberdeen-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '501 Aberdeen Dr NW, Atlanta, GA 30318',
      'addressLine1': '501 Aberdeen Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.768845,
      'longitude': -84.458765,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1177,
      'lotSize': 9074,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 270067,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-20T19:11:40.648Z',
      'lastSeenDate': '2026-02-14T11:25:02.516Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607279',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2024-12-12': {
          'event': 'Sale Listing',
          'price': 300075,
          'listingType': 'Standard',
          'listedDate': '2024-12-12T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 201
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 270067,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1116-Northwest-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1116 Northwest Dr NW, Atlanta, GA 30318',
      'addressLine1': '1116 Northwest Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.785545,
      'longitude': -84.474985,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 2,
      'squareFootage': 1816,
      'lotSize': 10019,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 235040,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-14T13:31:47.772Z',
      'lastSeenDate': '2026-02-14T11:25:02.515Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607282',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-01-08': {
          'event': 'Sale Listing',
          'price': 261155,
          'listingType': 'Standard',
          'listedDate': '2025-01-08T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 174
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 235040,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '685-Bolton-Rd-NW,-Atlanta,-GA-30331',
      'formattedAddress': '685 Bolton Rd NW, Atlanta, GA 30331',
      'addressLine1': '685 Bolton Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.772966,
      'longitude': -84.506878,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1100,
      'lotSize': 10794,
      'yearBuilt': 1959,
      'status': 'Active',
      'price': 224996,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-10-25T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.515Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607287',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 249995,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 91
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 224996,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1171-Wedgewood-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1171 Wedgewood Dr NW, Atlanta, GA 30318',
      'addressLine1': '1171 Wedgewood Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.787122,
      'longitude': -84.475495,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1224,
      'lotSize': 7000,
      'yearBuilt': 1971,
      'status': 'Active',
      'price': 260996,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.514Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607289',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 289995,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 91
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 260996,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '3346-Delmar-Ln-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3346 Delmar Ln NW, Atlanta, GA 30331',
      'addressLine1': '3346 Delmar Ln NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.756221,
      'longitude': -84.497473,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 1.5,
      'squareFootage': 1180,
      'lotSize': 13064,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 233996,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.514Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607288',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 259995,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 91
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 233996,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '474-Center-Hill-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '474 Center Hill Ave NW, Atlanta, GA 30318',
      'addressLine1': '474 Center Hill Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.768273,
      'longitude': -84.464156,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1188,
      'lotSize': 13987,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 287996,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.513Z',
      'daysOnMarket': 229,
      'mlsName': 'FMLS',
      'mlsNumber': '7607291',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 319995,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 91
        },
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 287996,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '4209-Resheemah-St,-Atlanta,-GA-30349',
      'formattedAddress': '4209 Resheemah St, Atlanta, GA 30349',
      'addressLine1': '4209 Resheemah St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.605151,
      'longitude': -84.57485,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1406,
      'lotSize': 6098,
      'yearBuilt': 1999,
      'status': 'Active',
      'price': 310000,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.507Z',
      'daysOnMarket': 229,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10554753',
      'listingAgent': {
        'name': 'Terracia Brown',
        'phone': '4049062484',
        'email': 'terraciabrown@gmail.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'kpalmer@phpatlanta.com',
        'website': 'https://www.palmerhouseproperties.com'
      },
      'history': {
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1126-Village-Ct-SE,-Atlanta,-GA-30316',
      'formattedAddress': '1126 Village Ct SE, Atlanta, GA 30316',
      'addressLine1': '1126 Village Ct SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.744196,
      'longitude': -84.350835,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 3,
      'squareFootage': 1600,
      'lotSize': 1220,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 356
      },
      'status': 'Active',
      'price': 375000,
      'listingType': 'Standard',
      'listedDate': '2025-07-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-10-13T15:31:46.289Z',
      'lastSeenDate': '2026-02-14T11:25:02.506Z',
      'daysOnMarket': 229,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10554760',
      'listingAgent': {
        'name': 'David Mceachern',
        'phone': '6785421948',
        'email': 'dmceachern@kw.com',
        'website': 'http://dmceachern.yourkwagent.com/home'
      },
      'listingOffice': {
        'name': 'Keller Williams Chattahoochee North',
        'phone': '6785782700',
        'email': 'mikemoulder@kw.com',
        'website': 'http://chattahoocheenorth.yourkwoffice.com/home'
      },
      'history': {
        '2025-07-01': {
          'event': 'Sale Listing',
          'price': 375000,
          'listingType': 'Standard',
          'listedDate': '2025-07-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 229
        }
      }
    },
    {
      'id': '1058-Sanders-Ave-SE,-Atlanta,-GA-30316',
      'formattedAddress': '1058 Sanders Ave SE, Atlanta, GA 30316',
      'addressLine1': '1058 Sanders Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.742262,
      'longitude': -84.352855,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3.5,
      'squareFootage': 2728,
      'lotSize': 7000,
      'yearBuilt': 2021,
      'status': 'Active',
      'price': 959990,
      'listingType': 'Standard',
      'listedDate': '2025-07-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-25T16:09:18.660Z',
      'lastSeenDate': '2026-02-14T11:25:02.503Z',
      'daysOnMarket': 228,
      'mlsName': 'FMLS',
      'mlsNumber': '7608312',
      'listingAgent': {
        'name': 'Bernard Green',
        'phone': '8032432071',
        'email': 'bernardg@1stclassre.com'
      },
      'listingOffice': {
        'name': 'Dalton Wade, Inc.',
        'phone': '8886688283',
        'email': 'kevin@daltonwade.com'
      },
      'history': {
        '2025-07-02': {
          'event': 'Sale Listing',
          'price': 959990,
          'listingType': 'Standard',
          'listedDate': '2025-07-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 228
        }
      }
    },
    {
      'id': '1381-Sharon-St-SW,-Atlanta,-GA-30314',
      'formattedAddress': '1381 Sharon St SW, Atlanta, GA 30314',
      'addressLine1': '1381 Sharon St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.754852,
      'longitude': -84.432697,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1138,
      'lotSize': 6403,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 249900,
      'listingType': 'Standard',
      'listedDate': '2025-07-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.503Z',
      'daysOnMarket': 228,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10555761',
      'listingAgent': {
        'name': 'Isabella Frazier',
        'phone': '4043830700',
        'email': 'southeastteam@trelora.com'
      },
      'listingOffice': {
        'name': 'Trelora Realty, LLC',
        'phone': '6514980203',
        'email': 'ironwoodgroup@trelora.com',
        'website': 'http://www.trelora.com'
      },
      'history': {
        '2025-07-02': {
          'event': 'Sale Listing',
          'price': 249900,
          'listingType': 'Standard',
          'listedDate': '2025-07-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 228
        }
      }
    },
    {
      'id': '5622-Laurel-Ridge-Dr,-Atlanta,-GA-30344',
      'formattedAddress': '5622 Laurel Ridge Dr, Atlanta, GA 30344',
      'addressLine1': '5622 Laurel Ridge Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.648068,
      'longitude': -84.493796,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2110,
      'lotSize': 8712,
      'yearBuilt': 2018,
      'status': 'Active',
      'price': 285000,
      'listingType': 'Standard',
      'listedDate': '2025-07-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.502Z',
      'daysOnMarket': 228,
      'mlsName': 'FMLS',
      'mlsNumber': '7608283',
      'listingAgent': {
        'name': 'Daniel Jackson',
        'phone': '5855523650',
        'email': 'daniel-jackson@kw.com',
        'website': 'http://daniel.agentship.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Atl. Classic',
        'phone': '4045649500',
        'email': 'araenee@gmail.com',
        'website': 'https://www.facebook.com/kwatlantaclassic'
      },
      'history': {
        '2025-07-02': {
          'event': 'Sale Listing',
          'price': 285000,
          'listingType': 'Standard',
          'listedDate': '2025-07-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 228
        }
      }
    },
    {
      'id': '1441-Monteel-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1441 Monteel Dr NW, Atlanta, GA 30318',
      'addressLine1': '1441 Monteel Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.795007,
      'longitude': -84.482114,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1800,
      'lotSize': 9718,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-07-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-02-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.501Z',
      'daysOnMarket': 227,
      'mlsName': 'FMLS',
      'mlsNumber': '7608884',
      'listingAgent': {
        'name': 'Daniel Jackson',
        'phone': '5855523650',
        'email': 'daniel-jackson@kw.com',
        'website': 'http://daniel.agentship.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Atl. Classic',
        'phone': '4045649500',
        'email': 'araenee@gmail.com',
        'website': 'https://www.facebook.com/kwatlantaclassic'
      },
      'history': {
        '2025-07-03': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-07-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 227
        }
      }
    },
    {
      'id': '400-W-Peachtree-St-NW,-Unit-2713,-Atlanta,-GA-30308',
      'formattedAddress': '400 W Peachtree St NW, Unit 2713, Atlanta, GA 30308',
      'addressLine1': '400 W Peachtree St NW',
      'addressLine2': 'Unit 2713',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765128,
      'longitude': -84.388189,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1127,
      'lotSize': 1128,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 593
      },
      'status': 'Active',
      'price': 375000,
      'listingType': 'Standard',
      'listedDate': '2025-07-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:19:31.796Z',
      'lastSeenDate': '2026-02-14T11:25:02.499Z',
      'daysOnMarket': 227,
      'mlsName': 'FMLS',
      'mlsNumber': '7609122',
      'listingAgent': {
        'name': 'Jackie Nix',
        'phone': '4044901965',
        'email': 'jackiesnix@gmail.com',
        'website': 'https://nixjacquelin.georgiamls.com/'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - West Cobb',
        'phone': '7702402004',
        'email': 'westcobb@atlantacommunities.net',
        'website': 'www.atlantacommunities.net'
      },
      'history': {
        '2025-07-03': {
          'event': 'Sale Listing',
          'price': 375000,
          'listingType': 'Standard',
          'listedDate': '2025-07-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 227
        }
      }
    },
    {
      'id': '1974-Lois-Pl-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1974 Lois Pl NW, Atlanta, GA 30318',
      'addressLine1': '1974 Lois Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.784182,
      'longitude': -84.452203,
      'propertyType': 'Multi-Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 884,
      'lotSize': 7492,
      'yearBuilt': 1988,
      'status': 'Active',
      'price': 95900,
      'listingType': 'Standard',
      'listedDate': '2025-07-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-05-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.497Z',
      'daysOnMarket': 226,
      'mlsName': 'FMLS',
      'mlsNumber': '7609675',
      'listingAgent': {
        'name': 'Dion Bartley',
        'phone': '7068531507',
        'email': 'dionbartley@dnegotiatorteam.com',
        'website': 'http://www.dnegotiatorteam.com'
      },
      'listingOffice': {
        'name': 'Maximum One Greater Atlanta Realtors',
        'phone': '7709198825',
        'email': 'maximum-one-realty-greater-atlanta@inbound.opcity.com',
        'website': 'www.maximumonerealty.com'
      },
      'history': {
        '2024-05-31': {
          'event': 'Sale Listing',
          'price': 125500,
          'listingType': 'Standard',
          'listedDate': '2024-05-31T00:00:00.000Z',
          'removedDate': '2025-05-17T00:00:00.000Z',
          'daysOnMarket': 351
        },
        '2025-07-04': {
          'event': 'Sale Listing',
          'price': 95900,
          'listingType': 'Standard',
          'listedDate': '2025-07-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 226
        }
      }
    },
    {
      'id': '6260-Trickle-Bnd,-Atlanta,-GA-30349',
      'formattedAddress': '6260 Trickle Bnd, Atlanta, GA 30349',
      'addressLine1': '6260 Trickle Bnd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.588419,
      'longitude': -84.502816,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1339,
      'lotSize': 2178,
      'yearBuilt': 2022,
      'hoa': {
        'fee': 50
      },
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-07-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-03-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.497Z',
      'daysOnMarket': 225,
      'mlsName': 'FMLS',
      'mlsNumber': '7609893',
      'listingAgent': {
        'name': 'Ava Davenport',
        'phone': '6782556961',
        'email': 'avadavenport1@icloud.com',
        'website': 'http://avadavenport.com'
      },
      'listingOffice': {
        'name': 'Dynasty Realty, LLC',
        'phone': '4043886025',
        'email': 'donna@dynastyrealtyllc.net',
        'website': 'www.dynastyrealtyllc.net'
      },
      'history': {
        '2025-07-05': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-07-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 225
        }
      }
    },
    {
      'id': '3187-Sable-Run-Rd,-Atlanta,-GA-30349',
      'formattedAddress': '3187 Sable Run Rd, Atlanta, GA 30349',
      'addressLine1': '3187 Sable Run Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.602048,
      'longitude': -84.496022,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2166,
      'lotSize': 6795,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 35
      },
      'status': 'Active',
      'price': 299900,
      'listingType': 'Standard',
      'listedDate': '2025-07-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-05-05T13:15:44.475Z',
      'lastSeenDate': '2026-02-14T11:25:02.495Z',
      'daysOnMarket': 225,
      'mlsName': 'FMLS',
      'mlsNumber': '7610053',
      'listingAgent': {
        'name': 'Joe Weathers',
        'phone': '7706911560',
        'email': 'joe@momentumteam.com',
        'website': 'http://www.momentumteam.com'
      },
      'listingOffice': {
        'name': 'Relate Realty, LLC',
        'phone': '6783891079',
        'email': 'tanner@relaterealty.com'
      },
      'history': {
        '2025-07-05': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-07-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 225
        }
      }
    },
    {
      'id': '1431-Andrews-St-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1431 Andrews St NW, Atlanta, GA 30314',
      'addressLine1': '1431 Andrews St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760577,
      'longitude': -84.43479,
      'propertyType': 'Single Family',
      'bedrooms': 0,
      'bathrooms': 2.5,
      'squareFootage': 7850,
      'lotSize': 7850,
      'yearBuilt': 2020,
      'status': 'Active',
      'price': 79000,
      'listingType': 'New Construction',
      'listedDate': '2025-07-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:26:10.490Z',
      'lastSeenDate': '2026-02-14T11:25:02.492Z',
      'daysOnMarket': 223,
      'mlsName': 'FMLS',
      'mlsNumber': '7608809',
      'listingAgent': {
        'name': 'Lindsay Allen',
        'phone': '3232511570'
      },
      'listingOffice': {
        'name': 'Swartz Co Residential Real Estate',
        'phone': '6789732776',
        'email': 'rswartzberg@swartzcocre.com'
      },
      'history': {
        '2024-06-12': {
          'event': 'Sale Listing',
          'price': 120000,
          'listingType': 'Standard',
          'listedDate': '2024-06-12T00:00:00.000Z',
          'removedDate': '2025-01-02T00:00:00.000Z',
          'daysOnMarket': 204
        },
        '2025-07-07': {
          'event': 'Sale Listing',
          'price': 79000,
          'listingType': 'New Construction',
          'listedDate': '2025-07-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 223
        }
      }
    },
    {
      'id': '2318-Browns-Mill-Rd-SE,-Atlanta,-GA-30315',
      'formattedAddress': '2318 Browns Mill Rd SE, Atlanta, GA 30315',
      'addressLine1': '2318 Browns Mill Rd SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.690336,
      'longitude': -84.373538,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1.5,
      'squareFootage': 1175,
      'lotSize': 11426,
      'yearBuilt': 1970,
      'status': 'Active',
      'price': 149900,
      'listingType': 'Standard',
      'listedDate': '2025-07-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.492Z',
      'daysOnMarket': 223,
      'mlsName': 'FMLS',
      'mlsNumber': '7610319',
      'listingAgent': {
        'name': 'Stew Team',
        'phone': '7704399999'
      },
      'listingOffice': {
        'name': 'STEWART BROKERS',
        'phone': '7704399999',
        'email': 'paul@stewartbrokers.com',
        'website': 'www.sellhomesfast.com'
      },
      'history': {
        '2025-07-07': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-07-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 223
        }
      }
    },
    {
      'id': '1823M-L-King-Jr-Dr,-Atlanta,-GA-30318',
      'formattedAddress': '1823M L King Jr Dr, Atlanta, GA 30318',
      'addressLine1': '1823M L King Jr Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.750833,
      'longitude': -84.446824,
      'propertyType': 'Land',
      'lotSize': 7100,
      'status': 'Active',
      'price': 449000,
      'listingType': 'Standard',
      'listedDate': '2025-07-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.489Z',
      'daysOnMarket': 223,
      'mlsName': 'FMLS',
      'mlsNumber': '7610843',
      'listingAgent': {
        'name': 'Lindsay Allen',
        'phone': '3232511570'
      },
      'listingOffice': {
        'name': 'Swartz Co Residential Real Estate',
        'phone': '6789732776',
        'email': 'rswartzberg@swartzcocre.com'
      },
      'history': {
        '2025-07-07': {
          'event': 'Sale Listing',
          'price': 449000,
          'listingType': 'Standard',
          'listedDate': '2025-07-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 223
        }
      }
    },
    {
      'id': '166-Maribeau-Sq-NW,-Atlanta,-GA-30327',
      'formattedAddress': '166 Maribeau Sq NW, Atlanta, GA 30327',
      'addressLine1': '166 Maribeau Sq NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.819084,
      'longitude': -84.425143,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1200,
      'lotSize': 1198,
      'yearBuilt': 1970,
      'hoa': {
        'fee': 612
      },
      'status': 'Active',
      'price': 209000,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.477Z',
      'daysOnMarket': 221,
      'mlsName': 'FMLS',
      'mlsNumber': '7612318',
      'listingAgent': {
        'name': 'Denise Joiner',
        'phone': '4042616300',
        'email': 'denisejoiner@beacham.com',
        'website': 'http://www.luxuryhomes-atlanta.com'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 209000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '1314-Camelot-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '1314 Camelot Dr, Atlanta, GA 30349',
      'addressLine1': '1314 Camelot Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.601167,
      'longitude': -84.475503,
      'propertyType': 'Condo',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 2334,
      'lotSize': 2352,
      'yearBuilt': 1970,
      'status': 'Active',
      'price': 45000,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.472Z',
      'daysOnMarket': 221,
      'mlsName': 'FMLS',
      'mlsNumber': '7606325',
      'listingAgent': {
        'name': 'Joseph Nelson',
        'phone': '7708733946',
        'email': 'j.nelson.a1realtygroup@gmail.com'
      },
      'listingOffice': {
        'name': 'A 1 Realty Group',
        'phone': '7708733946',
        'email': 'aonerealtygroupllc@gmail.com'
      },
      'history': {
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 45000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '340-River-Knoll-Dr,-Atlanta,-GA-30328',
      'formattedAddress': '340 River Knoll Dr, Atlanta, GA 30328',
      'addressLine1': '340 River Knoll Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.946263,
      'longitude': -84.392997,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3,
      'squareFootage': 2297,
      'lotSize': 32439,
      'yearBuilt': 1973,
      'hoa': {
        'fee': 6
      },
      'status': 'Active',
      'price': 659000,
      'listingType': 'Standard',
      'listedDate': '2025-07-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.471Z',
      'daysOnMarket': 222,
      'mlsName': 'FMLS',
      'mlsNumber': '7611545',
      'listingAgent': {
        'name': 'Candis Conley - Your Home Sold Guaranteed',
        'phone': '4043014340',
        'email': 'info.highfiverealty@gmail.com',
        'website': 'http://www.high5atl.com/'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2024-08-14': {
          'event': 'Sale Listing',
          'price': 729000,
          'listingType': 'Standard',
          'listedDate': '2024-08-14T00:00:00.000Z',
          'removedDate': '2024-12-09T00:00:00.000Z',
          'daysOnMarket': 117
        },
        '2025-07-08': {
          'event': 'Sale Listing',
          'price': 659000,
          'listingType': 'Standard',
          'listedDate': '2025-07-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 222
        }
      }
    },
    {
      'id': '75-Bisbee-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '75 Bisbee Ave SE, Atlanta, GA 30315',
      'addressLine1': '75 Bisbee Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.71612,
      'longitude': -84.38576,
      'propertyType': 'Land',
      'lotSize': 22477,
      'status': 'Active',
      'price': 90000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-11-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.471Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560805',
      'listingAgent': {
        'name': 'Barbara Henderson',
        'phone': '6785168478',
        'email': 'bwrighth7@bellsouth.net'
      },
      'listingOffice': {
        'name': 'The Brinkley Realty Group Llc',
        'phone': '6789350887',
        'email': 'percy@brinkleyrealtygroup.com',
        'website': 'www.brinkleyrealtygroup.com'
      },
      'history': {
        '2024-09-21': {
          'event': 'Sale Listing',
          'price': 90000,
          'listingType': 'Standard',
          'listedDate': '2024-09-21T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 283
        },
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 90000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '4-Whatley-St-SE,-Atlanta,-GA-30315',
      'formattedAddress': '4 Whatley St SE, Atlanta, GA 30315',
      'addressLine1': '4 Whatley St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.707096,
      'longitude': -84.379233,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1380,
      'lotSize': 5750,
      'yearBuilt': 2005,
      'status': 'Active',
      'price': 152500,
      'listingType': 'Standard',
      'listedDate': '2025-07-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.470Z',
      'daysOnMarket': 223,
      'mlsName': 'FMLS',
      'mlsNumber': '7610975',
      'listingAgent': {
        'name': 'The Kurzner Group',
        'phone': '6788699000',
        'email': 'greg@kurznergroup.com'
      },
      'listingOffice': {
        'name': 'Era Atlantic Realty',
        'phone': '6788699000',
        'email': 'greg@kurznergroup.com'
      },
      'history': {
        '2025-07-07': {
          'event': 'Sale Listing',
          'price': 152500,
          'listingType': 'Standard',
          'listedDate': '2025-07-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 223
        }
      }
    },
    {
      'id': '1485-Norris-Pl-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1485 Norris Pl NW, Atlanta, GA 30314',
      'addressLine1': '1485 Norris Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.759434,
      'longitude': -84.436818,
      'propertyType': 'Land',
      'lotSize': 26572,
      'status': 'Active',
      'price': 139000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.470Z',
      'daysOnMarket': 220,
      'mlsName': 'FMLS',
      'mlsNumber': '7612761',
      'listingAgent': {
        'name': 'Viviana Martinez',
        'phone': '6789162126',
        'email': 'viviana.martinez@redfin.com',
        'website': 'www.networthrealtyusa.com'
      },
      'listingOffice': {
        'name': 'Hester & Associates, LLC',
        'phone': '4044958392',
        'email': 'broker@matthesterhomes.com'
      },
      'history': {
        '2025-03-20': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-03-20T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 103
        },
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 139000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': 'Northridge-Crossing-Dr,-Atlanta,-GA-30350',
      'formattedAddress': 'Northridge Crossing Dr, Atlanta, GA 30350',
      'addressLine1': 'Northridge Crossing Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30350',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.977042,
      'longitude': -84.351001,
      'propertyType': 'Land',
      'lotSize': 20560,
      'status': 'Active',
      'price': 479900,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.469Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10561670',
      'listingAgent': {
        'name': 'Jackiand Kristiteam',
        'phone': '4044411659',
        'email': 'info@jackiandkristi.com'
      },
      'listingOffice': {
        'name': 'RE MAX Around Atlanta Realty',
        'phone': '4042527500',
        'email': 'brokerteam@aroundatlanta.com',
        'website': 'http://www.movearoundatlanta.com'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 479900,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '615-Camelot-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '615 Camelot Dr, Atlanta, GA 30349',
      'addressLine1': '615 Camelot Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.603159,
      'longitude': -84.475875,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1282,
      'lotSize': 1263,
      'yearBuilt': 1970,
      'hoa': {
        'fee': 250
      },
      'status': 'Active',
      'price': 45000,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-11-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.468Z',
      'daysOnMarket': 221,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560015',
      'listingAgent': {
        'name': 'Joseph Nelson',
        'phone': '7708733946',
        'email': 'j.nelson.a1realtygroup@gmail.com'
      },
      'listingOffice': {
        'name': 'A-1 Realty Group',
        'phone': '7708733946',
        'email': 'aonerealtygroupllc@gmail.com'
      },
      'history': {
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 45000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '3025-Washington-Rd,-Atlanta,-GA-30344',
      'formattedAddress': '3025 Washington Rd, Atlanta, GA 30344',
      'addressLine1': '3025 Washington Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.673089,
      'longitude': -84.456406,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1731,
      'lotSize': 7057,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.467Z',
      'daysOnMarket': 221,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10559820',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '2840-Peachtree-Rd-NW,-Apt-406,-Atlanta,-GA-30305',
      'formattedAddress': '2840 Peachtree Rd NW, Apt 406, Atlanta, GA 30305',
      'addressLine1': '2840 Peachtree Rd NW',
      'addressLine2': 'Apt 406',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.832869,
      'longitude': -84.384648,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 615,
      'lotSize': 614,
      'yearBuilt': 1925,
      'hoa': {
        'fee': 595
      },
      'status': 'Active',
      'price': 189900,
      'listingType': 'Standard',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-08-19T13:25:48.320Z',
      'lastSeenDate': '2026-02-14T11:25:02.466Z',
      'daysOnMarket': 219,
      'mlsName': 'FMLS',
      'mlsNumber': '7612447',
      'listingAgent': {
        'name': 'Pam Stanford',
        'phone': '7706866859',
        'email': 'pamstanford@kw.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - InTown',
        'phone': '4048444977',
        'email': 'intown@atlantacommunities.net',
        'website': 'www.atlantacommunities.net'
      },
      'history': {
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 189900,
          'listingType': 'Standard',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': '2739-Carriage-Ln,-Atlanta,-GA-30349',
      'formattedAddress': '2739 Carriage Ln, Atlanta, GA 30349',
      'addressLine1': '2739 Carriage Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.592069,
      'longitude': -84.47884,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1160,
      'lotSize': 9757,
      'yearBuilt': 1969,
      'status': 'Active',
      'price': 180900,
      'listingType': 'Standard',
      'listedDate': '2025-07-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.465Z',
      'daysOnMarket': 222,
      'mlsName': 'FMLS',
      'mlsNumber': '7611438',
      'listingAgent': {
        'name': 'Allison Ambrose',
        'phone': '4044313915',
        'email': 'allisona@argrealty360.com',
        'website': 'askalli.co'
      },
      'listingOffice': {
        'name': 'ARG Realty & Property Management',
        'phone': '8669195253',
        'email': 'contactus@argrealty360.com'
      },
      'history': {
        '2025-07-08': {
          'event': 'Sale Listing',
          'price': 180900,
          'listingType': 'Standard',
          'listedDate': '2025-07-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 222
        }
      }
    },
    {
      'id': '145-Sewanee-Ave-NW,-Atlanta,-GA-30314',
      'formattedAddress': '145 Sewanee Ave NW, Atlanta, GA 30314',
      'addressLine1': '145 Sewanee Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.757957,
      'longitude': -84.464736,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 912,
      'lotSize': 11021,
      'yearBuilt': 1968,
      'status': 'Active',
      'price': 174900,
      'listingType': 'Standard',
      'listedDate': '2025-07-09T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.465Z',
      'daysOnMarket': 221,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10559350',
      'listingAgent': {
        'name': 'Isabella Frazier',
        'phone': '4043830700',
        'email': 'southeastteam@trelora.com'
      },
      'listingOffice': {
        'name': 'Trelora Realty, LLC',
        'phone': '6514980203',
        'email': 'ironwoodgroup@trelora.com',
        'website': 'http://www.trelora.com'
      },
      'history': {
        '2025-07-09': {
          'event': 'Sale Listing',
          'price': 174900,
          'listingType': 'Standard',
          'listedDate': '2025-07-09T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 221
        }
      }
    },
    {
      'id': '1698-Kenmore-St-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1698 Kenmore St SW, Atlanta, GA 30311',
      'addressLine1': '1698 Kenmore St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726812,
      'longitude': -84.443741,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1833,
      'lotSize': 9017,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 389900,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.464Z',
      'daysOnMarket': 220,
      'mlsName': 'FMLS',
      'mlsNumber': '7612108',
      'listingAgent': {
        'name': 'Melissa Bailey',
        'phone': '9802545313',
        'email': 'mbailey.estates@gmail.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7704290600',
        'email': 'jenny.skeens@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/marietta/office/marietta-cobb/oid_3275/'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 389900,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '2199-Wingate-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '2199 Wingate St SW, Atlanta, GA 30310',
      'addressLine1': '2199 Wingate St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.749062,
      'longitude': -84.460069,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 910,
      'lotSize': 10019,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 130000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.463Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560472',
      'listingAgent': {
        'name': 'Alonzo Hunter',
        'phone': '4048432500',
        'email': 'al.hunter@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Community Realty, LLC',
        'phone': '6787916844',
        'email': 'al.hunter@metrobrokers.com',
        'website': 'http://www.communityrealtyatl.com'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 130000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '1074-Peachtree-Walk-NE,-Unit-B114,-Atlanta,-GA-30309',
      'formattedAddress': '1074 Peachtree Walk NE, Unit B114, Atlanta, GA 30309',
      'addressLine1': '1074 Peachtree Walk NE',
      'addressLine2': 'Unit B114',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.783937,
      'longitude': -84.385956,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1119,
      'yearBuilt': 1996,
      'hoa': {
        'fee': 436
      },
      'status': 'Active',
      'price': 350000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.463Z',
      'daysOnMarket': 220,
      'mlsName': 'FMLS',
      'mlsNumber': '7612791',
      'listingAgent': {
        'name': 'Deshawn Snow',
        'phone': '7704427300',
        'email': 'deshawnsnow@atlantafinehomes.com',
        'website': 'http://deshawnsnow.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '7704427300',
        'email': 'info@atlantafinehomes.com',
        'website': 'www.sothebysrealty.com/atlantafinehomessir/eng'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '1700-W-Paces-Ferry-Rd-NW,-Atlanta,-GA-30327',
      'formattedAddress': '1700 W Paces Ferry Rd NW, Atlanta, GA 30327',
      'addressLine1': '1700 W Paces Ferry Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.843927,
      'longitude': -84.44393,
      'propertyType': 'Land',
      'bedrooms': 2,
      'bathrooms': 3,
      'lotSize': 128502,
      'yearBuilt': 1949,
      'hoa': {
        'fee': 25
      },
      'status': 'Active',
      'price': 1700000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T02:13:39.464Z',
      'lastSeenDate': '2026-02-14T11:25:02.462Z',
      'daysOnMarket': 220,
      'mlsName': 'FMLS',
      'mlsNumber': '7609308',
      'listingAgent': {
        'name': 'Maria Espinosa',
        'phone': '4044058022',
        'email': 'maria.espinosa@bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '7703798040',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2024-09-25': {
          'event': 'Sale Listing',
          'price': 1950000,
          'listingType': 'Standard',
          'listedDate': '2024-09-25T00:00:00.000Z',
          'removedDate': '2025-01-22T00:00:00.000Z',
          'daysOnMarket': 119
        },
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 1700000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '898-Oak-St-SW,-Unit-1105,-Atlanta,-GA-30310',
      'formattedAddress': '898 Oak St SW, Unit 1105, Atlanta, GA 30310',
      'addressLine1': '898 Oak St SW',
      'addressLine2': 'Unit 1105',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.739066,
      'longitude': -84.417217,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 696,
      'lotSize': 697,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 496
      },
      'status': 'Active',
      'price': 144800,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-16T12:33:26.489Z',
      'lastSeenDate': '2026-02-14T11:25:02.461Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560362',
      'listingAgent': {
        'name': 'Levi Ohanenye, Mba',
        'phone': '6784660818',
        'email': 'realtorleviohanenye@gmail.com',
        'website': 'http://www.leviohanenye.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 144800,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '3286-Northside-Pkwy-NW,-Apt-506,-Atlanta,-GA-30327',
      'formattedAddress': '3286 Northside Pkwy NW, Apt 506, Atlanta, GA 30327',
      'addressLine1': '3286 Northside Pkwy NW',
      'addressLine2': 'Apt 506',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.844237,
      'longitude': -84.426364,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1835,
      'lotSize': 1830,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 1888
      },
      'status': 'Active',
      'price': 595000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.459Z',
      'daysOnMarket': 220,
      'mlsName': 'FMLS',
      'mlsNumber': '7612782',
      'listingAgent': {
        'name': 'Cathy Davis Hall',
        'phone': '4042375000',
        'email': 'cathy@atlantafinehomes.com',
        'website': 'http://www.cathydavishall.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 595000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '825-Bolton-Pl-NW,-Atlanta,-GA-30331',
      'formattedAddress': '825 Bolton Pl NW, Atlanta, GA 30331',
      'addressLine1': '825 Bolton Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.777825,
      'longitude': -84.502036,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1000,
      'lotSize': 10542,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 215996,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.458Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10561444',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 215996,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': 'Crogman-St-SE,-Atlanta,-GA-30315',
      'formattedAddress': 'Crogman St SE, Atlanta, GA 30315',
      'addressLine1': 'Crogman St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.716359,
      'longitude': -84.385976,
      'propertyType': 'Land',
      'lotSize': 22477,
      'status': 'Active',
      'price': 100000,
      'listingType': 'Standard',
      'listedDate': '2025-07-10T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-09-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.456Z',
      'daysOnMarket': 220,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10560811',
      'listingAgent': {
        'name': 'Barbara Henderson',
        'phone': '6785168478',
        'email': 'bwrighth7@bellsouth.net'
      },
      'listingOffice': {
        'name': 'The Brinkley Realty Group Llc',
        'phone': '6789350887',
        'email': 'percy@brinkleyrealtygroup.com',
        'website': 'www.brinkleyrealtygroup.com'
      },
      'history': {
        '2024-09-21': {
          'event': 'Sale Listing',
          'price': 100000,
          'listingType': 'Standard',
          'listedDate': '2024-09-21T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 283
        },
        '2025-07-10': {
          'event': 'Sale Listing',
          'price': 100000,
          'listingType': 'Standard',
          'listedDate': '2025-07-10T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 220
        }
      }
    },
    {
      'id': '3445-Stratford-Rd-NE,-Apt-3703,-Atlanta,-GA-30326',
      'formattedAddress': '3445 Stratford Rd NE, Apt 3703, Atlanta, GA 30326',
      'addressLine1': '3445 Stratford Rd NE',
      'addressLine2': 'Apt 3703',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.850838,
      'longitude': -84.367676,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1868,
      'lotSize': 1699,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 1036
      },
      'status': 'Active',
      'price': 659900,
      'listingType': 'Standard',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-14T14:39:52.981Z',
      'lastSeenDate': '2026-02-14T11:25:02.454Z',
      'daysOnMarket': 219,
      'mlsName': 'FMLS',
      'mlsNumber': '7612181',
      'listingAgent': {
        'name': 'Giuseppina V Terrazza',
        'phone': '6784696775',
        'email': 'pina4homes@gmail.com'
      },
      'listingOffice': {
        'name': 'Call It Closed International Realty',
        'phone': '4073383339',
        'email': 'chad@callitclosed.com',
        'website': 'www.callitclosed.com'
      },
      'history': {
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 659900,
          'listingType': 'Standard',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': '597-Broadview-Pl-NE,-Atlanta,-GA-30324',
      'formattedAddress': '597 Broadview Pl NE, Atlanta, GA 30324',
      'addressLine1': '597 Broadview Pl NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.821984,
      'longitude': -84.363654,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2724,
      'lotSize': 2004,
      'yearBuilt': 2022,
      'hoa': {
        'fee': 150
      },
      'status': 'Active',
      'price': 667000,
      'listingType': 'Standard',
      'listedDate': '2025-07-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-02-11T14:57:22.615Z',
      'lastSeenDate': '2026-02-14T11:25:02.453Z',
      'daysOnMarket': 216,
      'mlsName': 'FMLS',
      'mlsNumber': '7614760',
      'listingAgent': {
        'name': 'Hallie Chasen',
        'phone': '4042714635',
        'email': 'hallie.chasen@gmail.com',
        'website': 'http://www.coldwellbankeratlanta.com/hallie.chasen'
      },
      'listingOffice': {
        'name': 'Chapman Hall Premier, Realtors',
        'phone': '7704547840',
        'email': 'charlotte@chapmanhallrealtors.com',
        'website': 'www.chrpremier.com'
      },
      'history': {
        '2025-07-14': {
          'event': 'Sale Listing',
          'price': 667000,
          'listingType': 'Standard',
          'listedDate': '2025-07-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 216
        }
      }
    },
    {
      'id': '1095-Northwest-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1095 Northwest Dr NW, Atlanta, GA 30318',
      'addressLine1': '1095 Northwest Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.785032,
      'longitude': -84.473753,
      'propertyType': 'Single Family',
      'bedrooms': 0,
      'lotSize': 8472,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 95900,
      'listingType': 'New Construction',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.451Z',
      'daysOnMarket': 219,
      'mlsName': 'FMLS',
      'mlsNumber': '7612655',
      'listingAgent': {
        'name': 'Michael Williams',
        'phone': '7702414163',
        'email': 'michael@exitwestmidtown.com'
      },
      'listingOffice': {
        'name': 'EXIT REALTY WEST MIDTOWN',
        'phone': '4707499378',
        'email': 'admin@exitwestmidtown.com',
        'website': 'http://exitwestmidtown.com'
      },
      'history': {
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 95900,
          'listingType': 'New Construction',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': 'Audubon-Cir-SW,-Atlanta,-GA-30311',
      'formattedAddress': 'Audubon Cir SW, Atlanta, GA 30311',
      'addressLine1': 'Audubon Cir SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.725137,
      'longitude': -84.472331,
      'propertyType': 'Land',
      'lotSize': 35371,
      'status': 'Active',
      'price': 53000,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-02-07T05:50:28.860Z',
      'lastSeenDate': '2026-02-14T11:25:02.450Z',
      'daysOnMarket': 212,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10567383',
      'listingAgent': {
        'name': 'Kendra Dobbins',
        'phone': '6787103320',
        'email': 'kendra.dobbins@exprealty.com',
        'website': 'https://yourgeorgiahomegirl.com/'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 53000,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '390-17th-St-NW,-Unit-6013,-Atlanta,-GA-30363',
      'formattedAddress': '390 17th St NW, Unit 6013, Atlanta, GA 30363',
      'addressLine1': '390 17th St NW',
      'addressLine2': 'Unit 6013',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30363',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.790317,
      'longitude': -84.3995,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1338,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 808
      },
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-07-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.448Z',
      'daysOnMarket': 217,
      'mlsName': 'FMLS',
      'mlsNumber': '7614493',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-07-13': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-07-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 217
        }
      }
    },
    {
      'id': '1735-Peachtree-St-NE,-Unit-216,-Atlanta,-GA-30309',
      'formattedAddress': '1735 Peachtree St NE, Unit 216, Atlanta, GA 30309',
      'addressLine1': '1735 Peachtree St NE',
      'addressLine2': 'Unit 216',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.80134,
      'longitude': -84.390261,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1693,
      'lotSize': 2875,
      'yearBuilt': 2000,
      'hoa': {
        'fee': 66
      },
      'status': 'Active',
      'price': 425000,
      'listingType': 'Standard',
      'listedDate': '2025-07-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.448Z',
      'daysOnMarket': 216,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10563922',
      'listingAgent': {
        'name': 'Gary Silverman',
        'phone': '7706175658',
        'email': 'gary.silverman@bhhsgeorgia.com',
        'website': 'http://www.misterintownatlanta.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4042668100',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-07-14': {
          'event': 'Sale Listing',
          'price': 425000,
          'listingType': 'Standard',
          'listedDate': '2025-07-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 216
        }
      }
    },
    {
      'id': '3655-Peachtree-Rd-NE,-Unit-401,-Atlanta,-GA-30319',
      'formattedAddress': '3655 Peachtree Rd NE, Unit 401, Atlanta, GA 30319',
      'addressLine1': '3655 Peachtree Rd NE',
      'addressLine2': 'Unit 401',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30319',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.85371,
      'longitude': -84.356501,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1449,
      'lotSize': 1437,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 843
      },
      'status': 'Active',
      'price': 399000,
      'listingType': 'Standard',
      'listedDate': '2025-07-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.448Z',
      'daysOnMarket': 213,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10566086',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-07-17': {
          'event': 'Sale Listing',
          'price': 399000,
          'listingType': 'Standard',
          'listedDate': '2025-07-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 213
        }
      }
    },
    {
      'id': '633-Langston-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '633 Langston Dr SW, Atlanta, GA 30315',
      'addressLine1': '633 Langston Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.695513,
      'longitude': -84.409141,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1414,
      'lotSize': 7405,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 289000,
      'listingType': 'Standard',
      'listedDate': '2025-07-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.446Z',
      'daysOnMarket': 216,
      'mlsName': 'FMLS',
      'mlsNumber': '7614920',
      'listingAgent': {
        'name': 'Manny Zambrano',
        'phone': '7708074750',
        'email': 'manny@arirealtygroup.com',
        'website': 'http://www.arirealtygroup.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Realty Atlanta North',
        'phone': '7702182624',
        'email': 'chapmanhallrea@bellsouth.net',
        'website': 'chapmanhallrealtyatlantanorth.com'
      },
      'history': {
        '2025-02-21': {
          'event': 'Sale Listing',
          'price': 119000,
          'listingType': 'Standard',
          'listedDate': '2025-02-21T00:00:00.000Z',
          'removedDate': '2025-05-31T00:00:00.000Z',
          'daysOnMarket': 99
        },
        '2025-07-14': {
          'event': 'Sale Listing',
          'price': 289000,
          'listingType': 'Standard',
          'listedDate': '2025-07-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 216
        }
      }
    },
    {
      'id': '1080-Peachtree-St-NE,-Unit-2003,-Atlanta,-GA-30309',
      'formattedAddress': '1080 Peachtree St NE, Unit 2003, Atlanta, GA 30309',
      'addressLine1': '1080 Peachtree St NE',
      'addressLine2': 'Unit 2003',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.783833,
      'longitude': -84.383862,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1505,
      'lotSize': 1507,
      'yearBuilt': 2008,
      'hoa': {
        'fee': 946
      },
      'status': 'Active',
      'price': 809000,
      'listingType': 'Standard',
      'listedDate': '2025-07-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-09-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.443Z',
      'daysOnMarket': 214,
      'mlsName': 'FMLS',
      'mlsNumber': '7615535',
      'listingAgent': {
        'name': 'John Attaway',
        'phone': '4707797297',
        'email': 'john@simpleshowing.com',
        'website': 'http://www.johnattaway.com'
      },
      'listingOffice': {
        'name': 'Simple Showing, Inc',
        'phone': '4709466499',
        'email': 'fred@simpleshowing.com'
      },
      'history': {
        '2024-04-04': {
          'event': 'Sale Listing',
          'price': 829000,
          'listingType': 'Standard',
          'listedDate': '2024-04-04T00:00:00.000Z',
          'removedDate': '2024-09-27T00:00:00.000Z',
          'daysOnMarket': 176
        },
        '2024-09-27': {
          'event': 'Sale Listing',
          'price': 824900,
          'listingType': 'Standard',
          'listedDate': '2024-09-27T00:00:00.000Z',
          'removedDate': '2024-12-31T00:00:00.000Z',
          'daysOnMarket': 95
        },
        '2025-01-06': {
          'event': 'Sale Listing',
          'price': 824900,
          'listingType': 'Standard',
          'listedDate': '2025-01-06T00:00:00.000Z',
          'removedDate': '2025-02-26T00:00:00.000Z',
          'daysOnMarket': 51
        },
        '2025-04-01': {
          'event': 'Sale Listing',
          'price': 844900,
          'listingType': 'Standard',
          'listedDate': '2025-04-01T00:00:00.000Z',
          'removedDate': '2025-06-06T00:00:00.000Z',
          'daysOnMarket': 66
        },
        '2025-07-16': {
          'event': 'Sale Listing',
          'price': 809000,
          'listingType': 'Standard',
          'listedDate': '2025-07-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 214
        }
      }
    },
    {
      'id': '1981-Lois-Pl-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1981 Lois Pl NW, Atlanta, GA 30318',
      'addressLine1': '1981 Lois Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.784506,
      'longitude': -84.452766,
      'propertyType': 'Single Family',
      'bedrooms': 0,
      'lotSize': 7405,
      'yearBuilt': 1974,
      'status': 'Active',
      'price': 95900,
      'listingType': 'New Construction',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.442Z',
      'daysOnMarket': 219,
      'mlsName': 'FMLS',
      'mlsNumber': '7612587',
      'listingAgent': {
        'name': 'Michael Williams',
        'phone': '7702414163',
        'email': 'michael@exitwestmidtown.com'
      },
      'listingOffice': {
        'name': 'EXIT REALTY WEST MIDTOWN',
        'phone': '4707499378',
        'email': 'admin@exitwestmidtown.com',
        'website': 'http://exitwestmidtown.com'
      },
      'history': {
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 95900,
          'listingType': 'New Construction',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': '3101-Howell-Mill-Rd-NW,-Unit-227,-Atlanta,-GA-30327',
      'formattedAddress': '3101 Howell Mill Rd NW, Unit 227, Atlanta, GA 30327',
      'addressLine1': '3101 Howell Mill Rd NW',
      'addressLine2': 'Unit 227',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.840439,
      'longitude': -84.426116,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2420,
      'lotSize': 2422,
      'yearBuilt': 1999,
      'hoa': {
        'fee': 1222
      },
      'status': 'Active',
      'price': 615000,
      'listingType': 'Standard',
      'listedDate': '2025-07-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-07-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.442Z',
      'daysOnMarket': 216,
      'mlsName': 'FMLS',
      'mlsNumber': '7610538',
      'listingAgent': {
        'name': 'Laurie Berard',
        'phone': '7704290600',
        'email': 'laurie.berard@coldwellbankeratlanta.com',
        'website': 'http://www.kennesawmariettaproperties.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7704290600',
        'email': 'jenny.skeens@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/marietta/office/marietta-cobb/oid_3275/'
      },
      'history': {
        '2024-07-11': {
          'event': 'Sale Listing',
          'price': 635000,
          'listingType': 'Standard',
          'listedDate': '2024-07-11T00:00:00.000Z',
          'removedDate': '2025-01-01T00:00:00.000Z',
          'daysOnMarket': 174
        },
        '2025-07-14': {
          'event': 'Sale Listing',
          'price': 615000,
          'listingType': 'Standard',
          'listedDate': '2025-07-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 216
        }
      }
    },
    {
      'id': '490-Marietta-St-NW,-Ste-101,-Atlanta,-GA-30313',
      'formattedAddress': '490 Marietta St NW, Ste 101, Atlanta, GA 30313',
      'addressLine1': '490 Marietta St NW',
      'addressLine2': 'Ste 101',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.766685,
      'longitude': -84.397939,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2144,
      'lotSize': 2134,
      'yearBuilt': 1945,
      'hoa': {
        'fee': 59
      },
      'status': 'Active',
      'price': 599000,
      'listingType': 'Standard',
      'listedDate': '2025-07-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-12-02T14:58:49.502Z',
      'lastSeenDate': '2026-02-14T11:25:02.441Z',
      'daysOnMarket': 219,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10562784',
      'listingAgent': {
        'name': 'Kase Ellers',
        'phone': '4074639315',
        'email': 'kase@kaseellers.com',
        'website': 'http://ellerhausre.com'
      },
      'listingOffice': {
        'name': 'Bolst, Inc.',
        'phone': '4044822293',
        'email': 'cathryn@bolst.homes'
      },
      'history': {
        '2025-03-26': {
          'event': 'Sale Listing',
          'price': 685000,
          'listingType': 'Standard',
          'listedDate': '2025-03-26T00:00:00.000Z',
          'removedDate': '2025-05-21T00:00:00.000Z',
          'daysOnMarket': 56
        },
        '2025-07-11': {
          'event': 'Sale Listing',
          'price': 599000,
          'listingType': 'Standard',
          'listedDate': '2025-07-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 219
        }
      }
    },
    {
      'id': '6601-Cadence-Blvd,-Atlanta,-GA-30328',
      'formattedAddress': '6601 Cadence Blvd, Atlanta, GA 30328',
      'addressLine1': '6601 Cadence Blvd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.936868,
      'longitude': -84.362884,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 4.5,
      'squareFootage': 3011,
      'lotSize': 958,
      'yearBuilt': 2017,
      'hoa': {
        'fee': 417
      },
      'status': 'Active',
      'price': 944000,
      'listingType': 'Standard',
      'listedDate': '2025-07-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.439Z',
      'daysOnMarket': 213,
      'mlsName': 'FMLS',
      'mlsNumber': '7617309',
      'listingAgent': {
        'name': 'Nina Corya',
        'phone': '6786995825',
        'email': 'ninacorya@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta - East Cobb',
        'phone': '7705090700',
        'email': 'klrw178@kw.com;jima@kw.com',
        'website': 'http://www.atlantanorthkw.com/'
      },
      'history': {
        '2025-07-17': {
          'event': 'Sale Listing',
          'price': 944000,
          'listingType': 'Standard',
          'listedDate': '2025-07-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 213
        }
      }
    },
    {
      'id': '285-Centennial-Olympic-Park-Dr-NW,-Unit-1106,-Atlanta,-GA-30313',
      'formattedAddress': '285 Centennial Olympic Park Dr NW, Unit 1106, Atlanta, GA 30313',
      'addressLine1': '285 Centennial Olympic Park Dr NW',
      'addressLine2': 'Unit 1106',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.762578,
      'longitude': -84.391657,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 1104,
      'lotSize': 1089,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 680
      },
      'status': 'Active',
      'price': 299500,
      'listingType': 'Standard',
      'listedDate': '2025-07-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.438Z',
      'daysOnMarket': 211,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10567185',
      'listingAgent': {
        'name': 'Artiom Fadin',
        'phone': '4043861679',
        'email': 'art@atlanticwestproperties.com',
        'website': 'http://atlanticwestproperties.com'
      },
      'listingOffice': {
        'name': 'Atlantic West Properties Llc',
        'phone': '4048471267',
        'email': 'management@atlanticwestgroup.com'
      },
      'history': {
        '2025-07-19': {
          'event': 'Sale Listing',
          'price': 299500,
          'listingType': 'Standard',
          'listedDate': '2025-07-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 211
        }
      }
    },
    {
      'id': '3025-Margaret-Mitchell-Dr-NW,-Atlanta,-GA-30327',
      'formattedAddress': '3025 Margaret Mitchell Dr NW, Atlanta, GA 30327',
      'addressLine1': '3025 Margaret Mitchell Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.838852,
      'longitude': -84.43172,
      'propertyType': 'Land',
      'lotSize': 23914,
      'status': 'Active',
      'price': 499000,
      'listingType': 'Standard',
      'listedDate': '2025-07-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.437Z',
      'daysOnMarket': 209,
      'mlsName': 'FMLS',
      'mlsNumber': '7618854',
      'listingAgent': {
        'name': 'Melanie Whitehead',
        'phone': '7704806058',
        'email': 'melanie.whitehead@bhhsgeorgia.com',
        'website': 'https://melaniewhitehead.bhhsgeorgia.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '7704218600',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-07-21': {
          'event': 'Sale Listing',
          'price': 499000,
          'listingType': 'Standard',
          'listedDate': '2025-07-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 209
        }
      }
    },
    {
      'id': '3530-Piedmont-Rd-NE,-Apt-12F,-Atlanta,-GA-30305',
      'formattedAddress': '3530 Piedmont Rd NE, Apt 12F, Atlanta, GA 30305',
      'addressLine1': '3530 Piedmont Rd NE',
      'addressLine2': 'Apt 12F',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.849169,
      'longitude': -84.379491,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1527,
      'lotSize': 15290,
      'yearBuilt': 1976,
      'hoa': {
        'fee': 918
      },
      'status': 'Active',
      'price': 345000,
      'listingType': 'Standard',
      'listedDate': '2025-07-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.435Z',
      'daysOnMarket': 216,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10563764',
      'listingAgent': {
        'name': 'Karen Rawls',
        'phone': '4042106474',
        'email': 'karenrawls@comcast.net',
        'website': 'karenrawls.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY FIRST ATLANTA',
        'phone': '4045315700',
        'email': 'johnfountain@kw.com',
        'website': 'http://www.kwatlanta.com'
      },
      'history': {
        '2025-07-14': {
          'event': 'Sale Listing',
          'price': 345000,
          'listingType': 'Standard',
          'listedDate': '2025-07-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 216
        }
      }
    },
    {
      'id': '426-Marietta-St-NW,-Apt-410,-Atlanta,-GA-30313',
      'formattedAddress': '426 Marietta St NW, Apt 410, Atlanta, GA 30313',
      'addressLine1': '426 Marietta St NW',
      'addressLine2': 'Apt 410',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.764561,
      'longitude': -84.39765,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 900,
      'lotSize': 915,
      'yearBuilt': 1910,
      'hoa': {
        'fee': 278
      },
      'status': 'Active',
      'price': 297500,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-02T13:54:58.549Z',
      'lastSeenDate': '2026-02-14T11:25:02.435Z',
      'daysOnMarket': 212,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10565659',
      'listingAgent': {
        'name': 'Dennis J. Trimble',
        'phone': '4049972636',
        'email': 'dennisjtrimble@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Atl. Midtown',
        'phone': '4046043101',
        'email': 'rick@rickhale.com',
        'website': 'atlantamidtown.yourkwoffice.com'
      },
      'history': {
        '2024-11-28': {
          'event': 'Sale Listing',
          'price': 304900,
          'listingType': 'Standard',
          'listedDate': '2024-11-28T00:00:00.000Z',
          'removedDate': '2025-07-02T00:00:00.000Z',
          'daysOnMarket': 216
        },
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 297500,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '2946-Carriage-Ln,-Atlanta,-GA-30349',
      'formattedAddress': '2946 Carriage Ln, Atlanta, GA 30349',
      'addressLine1': '2946 Carriage Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.589775,
      'longitude': -84.484753,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 2000,
      'lotSize': 14636,
      'yearBuilt': 1969,
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.434Z',
      'daysOnMarket': 212,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10566066',
      'listingAgent': {
        'name': 'Robert Salmons',
        'phone': '7132489869',
        'email': 'mkay@greenletinv.com'
      },
      'listingOffice': {
        'name': 'Entera Realty',
        'phone': '7132489869',
        'email': 'rsgl@enterarealty.com',
        'website': 'http://www.enterarealty.com'
      },
      'history': {
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '1735-Peachtree-St-NE,-Unit-126,-Atlanta,-GA-30309',
      'formattedAddress': '1735 Peachtree St NE, Unit 126, Atlanta, GA 30309',
      'addressLine1': '1735 Peachtree St NE',
      'addressLine2': 'Unit 126',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.80134,
      'longitude': -84.390261,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1355,
      'lotSize': 1350,
      'yearBuilt': 2000,
      'hoa': {
        'fee': 645
      },
      'status': 'Active',
      'price': 325000,
      'listingType': 'Standard',
      'listedDate': '2025-07-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.433Z',
      'daysOnMarket': 214,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10565173',
      'listingAgent': {
        'name': 'Jeff Power',
        'phone': '4048432500',
        'email': 'jeff@powersales.net'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - East Cobb',
        'phone': '7702402001',
        'email': 'eastcobb@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-07-16': {
          'event': 'Sale Listing',
          'price': 325000,
          'listingType': 'Standard',
          'listedDate': '2025-07-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 214
        }
      }
    },
    {
      'id': '1679-Altadena-Pl-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1679 Altadena Pl SW, Atlanta, GA 30311',
      'addressLine1': '1679 Altadena Pl SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.730483,
      'longitude': -84.442545,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 1.5,
      'squareFootage': 1508,
      'lotSize': 10019,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 297400,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-10-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.433Z',
      'daysOnMarket': 212,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10565231',
      'listingAgent': {
        'name': 'Teshuwah Price',
        'phone': '4049808744',
        'email': 'teshuwahprice@icloud.com'
      },
      'listingOffice': {
        'name': 'HomeSmart Realty Partners',
        'phone': '4044191004',
        'email': 'rmusto@buckheadhomerealty.com',
        'website': 'www.buckheadhomerealty.com'
      },
      'history': {
        '2024-07-15': {
          'event': 'Sale Listing',
          'price': 355000,
          'listingType': 'Standard',
          'listedDate': '2024-07-15T00:00:00.000Z',
          'removedDate': '2024-10-03T00:00:00.000Z',
          'daysOnMarket': 80
        },
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 297400,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '7470-Princeton-Trce,-Atlanta,-GA-30328',
      'formattedAddress': '7470 Princeton Trce, Atlanta, GA 30328',
      'addressLine1': '7470 Princeton Trce',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.959111,
      'longitude': -84.368345,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 2870,
      'lotSize': 24624,
      'yearBuilt': 1977,
      'hoa': {
        'fee': 61
      },
      'status': 'Active',
      'price': 645000,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.432Z',
      'daysOnMarket': 212,
      'mlsName': 'FMLS',
      'mlsNumber': '7617444',
      'listingAgent': {
        'name': 'Irene Bagiatis',
        'phone': '4046975020',
        'email': 'irene.bagiatis@harrynorman.com',
        'website': 'http://irenep.bagiatis.harrynorman.com'
      },
      'listingOffice': {
        'name': 'Dorsey Alston Realtors',
        'phone': '4043522010',
        'email': 'customerservice@dorseyalston.com',
        'website': 'www.dorseyalston.com'
      },
      'history': {
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 645000,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '250-Pharr-Rd-NE,-Apt-412,-Atlanta,-GA-30305',
      'formattedAddress': '250 Pharr Rd NE, Apt 412, Atlanta, GA 30305',
      'addressLine1': '250 Pharr Rd NE',
      'addressLine2': 'Apt 412',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.837184,
      'longitude': -84.378964,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 779,
      'lotSize': 784,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 35
      },
      'status': 'Active',
      'price': 275000,
      'listingType': 'Standard',
      'listedDate': '2025-07-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.431Z',
      'daysOnMarket': 210,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10568000',
      'listingAgent': {
        'name': 'Nirada Perry',
        'phone': '6787701133',
        'email': 'thepearyperryteam@gmail.com',
        'website': 'http://pearyperry.georgiamls.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Brookhaven/Dunwoody',
        'phone': '4048444198',
        'email': 'dunwoody@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-07-20': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2025-07-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 210
        }
      }
    },
    {
      'id': '1141-Moton-Ave-SW,-Atlanta,-GA-30315',
      'formattedAddress': '1141 Moton Ave SW, Atlanta, GA 30315',
      'addressLine1': '1141 Moton Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723694,
      'longitude': -84.396985,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3,
      'squareFootage': 1584,
      'lotSize': 4312,
      'yearBuilt': 2002,
      'status': 'Active',
      'price': 369999,
      'listingType': 'Standard',
      'listedDate': '2025-07-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-10-07T14:41:04.125Z',
      'lastSeenDate': '2026-02-14T11:25:02.428Z',
      'daysOnMarket': 213,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10566051',
      'listingAgent': {
        'name': 'Keturah Havior',
        'phone': '7708653748',
        'email': 'keturah@keyswithketurah.com',
        'website': 'http://www.keyswithketurah.com'
      },
      'listingOffice': {
        'name': 'Real Broker LLC',
        'phone': '7135613650',
        'email': 'membership@therealbrokerage.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-07-17': {
          'event': 'Sale Listing',
          'price': 369999,
          'listingType': 'Standard',
          'listedDate': '2025-07-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 213
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-2507,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 2507, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 2507',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 807,
      'lotSize': 806,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 950
      },
      'status': 'Active',
      'price': 220000,
      'listingType': 'Standard',
      'listedDate': '2025-07-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-11T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.428Z',
      'daysOnMarket': 213,
      'mlsName': 'FMLS',
      'mlsNumber': '7617445',
      'listingAgent': {
        'name': 'Giscard Walters',
        'phone': '4049097072',
        'email': 'mrgiscardwalters@gmail.com'
      },
      'listingOffice': {
        'name': 'Vylla Home',
        'phone': '8448489623',
        'email': 'adrien.bryant@vylla.com',
        'website': 'www.apreus.com'
      },
      'history': {
        '2025-06-10': {
          'event': 'Sale Listing',
          'price': 230000,
          'listingType': 'Standard',
          'listedDate': '2025-06-10T00:00:00.000Z',
          'removedDate': '2025-07-06T00:00:00.000Z',
          'daysOnMarket': 26
        },
        '2025-07-17': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-07-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 213
        }
      }
    },
    {
      'id': '250-Park-Ave-W,-Unit-302,-Atlanta,-GA-30313',
      'formattedAddress': '250 Park Ave W, Unit 302, Atlanta, GA 30313',
      'addressLine1': '250 Park Ave W',
      'addressLine2': 'Unit 302',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.761542,
      'longitude': -84.395058,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1062,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 506
      },
      'status': 'Active',
      'price': 289500,
      'listingType': 'Standard',
      'listedDate': '2025-07-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.427Z',
      'daysOnMarket': 212,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10566561',
      'listingAgent': {
        'name': 'Mark Kramer',
        'phone': '6783785615',
        'email': 'markkramer@remax.net',
        'website': 'http://www.markkramer.remax-georgia.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-07-18': {
          'event': 'Sale Listing',
          'price': 289500,
          'listingType': 'Standard',
          'listedDate': '2025-07-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 212
        }
      }
    },
    {
      'id': '481-Griffin-St-NW,-Atlanta,-GA-30318',
      'formattedAddress': '481 Griffin St NW, Atlanta, GA 30318',
      'addressLine1': '481 Griffin St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.767726,
      'longitude': -84.410945,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1080,
      'lotSize': 3598,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 324000,
      'listingType': 'Standard',
      'listedDate': '2025-07-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:25:02.426Z',
      'daysOnMarket': 213,
      'mlsName': 'FMLS',
      'mlsNumber': '7617213',
      'listingAgent': {
        'name': 'Alexandria Haertel',
        'phone': '7702421492',
        'email': 'alexandria.haertel@gmail.com'
      },
      'listingOffice': {
        'name': 'Haertel Agency, LLC',
        'email': 'jhaertel@gmail.com'
      },
      'history': {
        '2025-07-17': {
          'event': 'Sale Listing',
          'price': 324000,
          'listingType': 'Standard',
          'listedDate': '2025-07-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 213
        }
      }
    },
    {
      'id': '3598-Ingledale-Dr-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3598 Ingledale Dr SW, Atlanta, GA 30331',
      'addressLine1': '3598 Ingledale Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.704761,
      'longitude': -84.504212,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1640,
      'lotSize': 17250,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 124900,
      'listingType': 'Standard',
      'listedDate': '2025-07-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-30T12:47:46.894Z',
      'lastSeenDate': '2026-02-14T11:24:19.816Z',
      'daysOnMarket': 209,
      'mlsName': 'FMLS',
      'mlsNumber': '7618789',
      'listingAgent': {
        'name': 'Stew Team',
        'phone': '7704399999'
      },
      'listingOffice': {
        'name': 'STEWART BROKERS',
        'phone': '7704399999',
        'email': 'paul@stewartbrokers.com',
        'website': 'www.sellhomesfast.com'
      },
      'history': {
        '2024-03-30': {
          'event': 'Sale Listing',
          'price': 174900,
          'listingType': 'Standard',
          'listedDate': '2024-03-30T00:00:00.000Z',
          'removedDate': '2025-04-01T00:00:00.000Z',
          'daysOnMarket': 367
        },
        '2025-07-21': {
          'event': 'Sale Listing',
          'price': 124900,
          'listingType': 'Standard',
          'listedDate': '2025-07-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 209
        }
      }
    },
    {
      'id': '1905-Fort-Valley-Dr-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1905 Fort Valley Dr SW, Atlanta, GA 30311',
      'addressLine1': '1905 Fort Valley Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.702895,
      'longitude': -84.45062,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 3,
      'squareFootage': 1403,
      'lotSize': 13852,
      'yearBuilt': 1958,
      'status': 'Active',
      'price': 314999,
      'listingType': 'Standard',
      'listedDate': '2025-07-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.815Z',
      'daysOnMarket': 209,
      'mlsName': 'FMLS',
      'mlsNumber': '7618690',
      'listingAgent': {
        'name': 'Tigina Taylor',
        'email': 'tiginadt@gmail.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7706231900',
        'email': 'michelle.mcdaniel@cbrealty.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/johns-creek/office/johns-creek-duluth/oid_3253/'
      },
      'history': {
        '2025-02-12': {
          'event': 'Sale Listing',
          'price': 219000,
          'listingType': 'Standard',
          'listedDate': '2025-02-12T00:00:00.000Z',
          'removedDate': '2025-03-07T00:00:00.000Z',
          'daysOnMarket': 23
        },
        '2025-07-21': {
          'event': 'Sale Listing',
          'price': 314999,
          'listingType': 'Standard',
          'listedDate': '2025-07-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 209
        }
      }
    },
    {
      'id': '416-Mcgill-Pl-NE,-Atlanta,-GA-30312',
      'formattedAddress': '416 Mcgill Pl NE, Atlanta, GA 30312',
      'addressLine1': '416 Mcgill Pl NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765272,
      'longitude': -84.376773,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1266,
      'lotSize': 1263,
      'yearBuilt': 1987,
      'hoa': {
        'fee': 400
      },
      'status': 'Active',
      'price': 320000,
      'listingType': 'Standard',
      'listedDate': '2025-07-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.814Z',
      'daysOnMarket': 209,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10568414',
      'listingAgent': {
        'name': 'Robert Yancy'
      },
      'listingOffice': {
        'name': 'Platinum Real Estate, Llc.',
        'phone': '4045590332',
        'email': 'melvina.hamilton@yahoo.com',
        'website': 'www.platinumrealestate.com'
      },
      'history': {
        '2025-07-21': {
          'event': 'Sale Listing',
          'price': 320000,
          'listingType': 'Standard',
          'listedDate': '2025-07-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 209
        }
      }
    },
    {
      'id': '1581-Harbin-Rd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1581 Harbin Rd SW, Atlanta, GA 30311',
      'addressLine1': '1581 Harbin Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.712775,
      'longitude': -84.484328,
      'propertyType': 'Land',
      'lotSize': 121097,
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-07-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.813Z',
      'daysOnMarket': 209,
      'mlsName': 'FMLS',
      'mlsNumber': '7619194',
      'listingAgent': {
        'name': 'Jared Daley',
        'phone': '6785968844',
        'email': 'jared@bullrealty.com',
        'website': 'www.bullrealty.com'
      },
      'listingOffice': {
        'name': 'Bull Realty, Inc.',
        'phone': '4048761640',
        'email': 'accounting@bullrealty.com',
        'website': 'www.bullrealty.com'
      },
      'history': {
        '2025-07-21': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-07-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 209
        }
      }
    },
    {
      'id': '3475-Oak-Valley-Rd-NE,-Apt-1570,-Atlanta,-GA-30326',
      'formattedAddress': '3475 Oak Valley Rd NE, Apt 1570, Atlanta, GA 30326',
      'addressLine1': '3475 Oak Valley Rd NE',
      'addressLine2': 'Apt 1570',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.850152,
      'longitude': -84.359261,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1209,
      'lotSize': 1211,
      'yearBuilt': 1992,
      'hoa': {
        'fee': 640
      },
      'status': 'Active',
      'price': 319999,
      'listingType': 'Standard',
      'listedDate': '2025-07-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.803Z',
      'daysOnMarket': 208,
      'mlsName': 'FMLS',
      'mlsNumber': '7619156',
      'listingAgent': {
        'name': 'Susan Ayers',
        'phone': '6783441600',
        'email': 'info@clickitrealtyinc.com',
        'website': 'http://www.clickitrealty.com'
      },
      'listingOffice': {
        'name': 'Clickit Realty',
        'phone': '8888754218',
        'email': 'info@clickitrealty.com',
        'website': 'http://www.clickitrealtyinc.com'
      },
      'history': {
        '2025-07-22': {
          'event': 'Sale Listing',
          'price': 319999,
          'listingType': 'Standard',
          'listedDate': '2025-07-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 208
        }
      }
    },
    {
      'id': '3049-Clarendale-Dr-NW,-Atlanta,-GA-30327',
      'formattedAddress': '3049 Clarendale Dr NW, Atlanta, GA 30327',
      'addressLine1': '3049 Clarendale Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.838789,
      'longitude': -84.432327,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 6,
      'squareFootage': 7000,
      'lotSize': 30492,
      'yearBuilt': 2026,
      'status': 'Active',
      'price': 4200000,
      'listingType': 'New Construction',
      'listedDate': '2025-07-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T01:52:00.399Z',
      'lastSeenDate': '2026-02-14T11:24:19.801Z',
      'daysOnMarket': 208,
      'mlsName': 'FMLS',
      'mlsNumber': '7619724',
      'listingAgent': {
        'name': 'Alex Mclean',
        'phone': '4042375000',
        'email': 'alexmclean@atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-07-22': {
          'event': 'Sale Listing',
          'price': 4200000,
          'listingType': 'New Construction',
          'listedDate': '2025-07-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 208
        }
      }
    },
    {
      'id': '3690-Sulene-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '3690 Sulene Dr, Atlanta, GA 30349',
      'addressLine1': '3690 Sulene Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.624516,
      'longitude': -84.509771,
      'propertyType': 'Land',
      'lotSize': 19166,
      'status': 'Active',
      'price': 75000,
      'listingType': 'Standard',
      'listedDate': '2025-07-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.800Z',
      'daysOnMarket': 207,
      'mlsName': 'FMLS',
      'mlsNumber': '7620081',
      'listingAgent': {
        'name': 'Sharon Henry',
        'phone': '4049345566',
        'email': 'sharon@sharonhenry.com',
        'website': 'http://www.sharonhenry.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-07-23': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'Standard',
          'listedDate': '2025-07-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 207
        }
      }
    },
    {
      'id': '1008-Pine-Tree-Trl,-Atlanta,-GA-30349',
      'formattedAddress': '1008 Pine Tree Trl, Atlanta, GA 30349',
      'addressLine1': '1008 Pine Tree Trl',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.567313,
      'longitude': -84.47967,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1196,
      'lotSize': 1198,
      'yearBuilt': 1989,
      'hoa': {
        'fee': 300
      },
      'status': 'Active',
      'price': 100000,
      'listingType': 'Standard',
      'listedDate': '2025-07-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.799Z',
      'daysOnMarket': 207,
      'mlsName': 'FMLS',
      'mlsNumber': '7620100',
      'listingAgent': {
        'name': 'Elena Gist',
        'phone': '4042720812',
        'email': 'elenagist@yahoo.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY BUCKHEAD',
        'phone': '4046043800',
        'email': 'klrw261@kw.com',
        'website': 'http://261.yourkwoffice.com/'
      },
      'history': {
        '2025-07-23': {
          'event': 'Sale Listing',
          'price': 100000,
          'listingType': 'Standard',
          'listedDate': '2025-07-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 207
        }
      }
    },
    {
      'id': '1055-Johnson-Grv,-Atlanta,-GA-30318',
      'formattedAddress': '1055 Johnson Grv, Atlanta, GA 30318',
      'addressLine1': '1055 Johnson Grv',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.784652,
      'longitude': -84.447515,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2049,
      'lotSize': 3489,
      'yearBuilt': 2017,
      'hoa': {
        'fee': 117
      },
      'status': 'Active',
      'price': 515000,
      'listingType': 'Standard',
      'listedDate': '2025-07-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.798Z',
      'daysOnMarket': 207,
      'mlsName': 'FMLS',
      'mlsNumber': '7617231',
      'listingAgent': {
        'name': 'Tre Dunn',
        'phone': '5026031560',
        'email': 'tredunn@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Intown',
        'phone': '4045413500',
        'email': 'klrw226@kw.com',
        'website': 'https://kwintown.com/'
      },
      'history': {
        '2025-07-23': {
          'event': 'Sale Listing',
          'price': 515000,
          'listingType': 'Standard',
          'listedDate': '2025-07-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 207
        }
      }
    },
    {
      'id': '1647-Dupont-Commons-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1647 Dupont Commons Dr NW, Atlanta, GA 30318',
      'addressLine1': '1647 Dupont Commons Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.808496,
      'longitude': -84.447714,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 2680,
      'lotSize': 4748,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 158
      },
      'status': 'Active',
      'price': 650000,
      'listingType': 'Standard',
      'listedDate': '2025-07-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-25T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.796Z',
      'daysOnMarket': 206,
      'mlsName': 'FMLS',
      'mlsNumber': '7619036',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-07-24': {
          'event': 'Sale Listing',
          'price': 650000,
          'listingType': 'Standard',
          'listedDate': '2025-07-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 206
        }
      }
    },
    {
      'id': '400-17th-St-NW,-Unit-2322,-Atlanta,-GA-30363',
      'formattedAddress': '400 17th St NW, Unit 2322, Atlanta, GA 30363',
      'addressLine1': '400 17th St NW',
      'addressLine2': 'Unit 2322',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30363',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.789229,
      'longitude': -84.402016,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 884,
      'lotSize': 741,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 429
      },
      'status': 'Active',
      'price': 188000,
      'listingType': 'Standard',
      'listedDate': '2025-07-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-25T14:26:58.599Z',
      'lastSeenDate': '2026-02-14T11:24:19.794Z',
      'daysOnMarket': 206,
      'mlsName': 'FMLS',
      'mlsNumber': '7620952',
      'listingAgent': {
        'name': 'Stephen Clark',
        'phone': '7703751413',
        'email': 'stephenc8884@gmail.com'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Intown',
        'phone': '4048975558',
        'email': 'in.office@harrynorman.com',
        'website': 'http://www.harrynorman.com'
      },
      'history': {
        '2025-07-24': {
          'event': 'Sale Listing',
          'price': 188000,
          'listingType': 'Standard',
          'listedDate': '2025-07-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 206
        }
      }
    },
    {
      'id': '375-Atwood-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '375 Atwood St SW, Atlanta, GA 30310',
      'addressLine1': '375 Atwood St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.744781,
      'longitude': -84.429018,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1528,
      'lotSize': 5650,
      'yearBuilt': 1905,
      'status': 'Active',
      'price': 399900,
      'listingType': 'Standard',
      'listedDate': '2025-07-24T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-18T12:37:40.794Z',
      'lastSeenDate': '2026-02-14T11:24:19.794Z',
      'daysOnMarket': 206,
      'mlsName': 'FMLS',
      'mlsNumber': '7617364',
      'listingAgent': {
        'name': 'Mitch Kaminer',
        'phone': '7708514647',
        'email': 'sold@winwithmitch.com',
        'website': 'http://www.winwithmitch.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Alpharetta',
        'phone': '7706375070',
        'email': 'alpharetta@atlantacommunities.net',
        'website': 'http://alpharetta.atlcommunities.com'
      },
      'history': {
        '2025-07-24': {
          'event': 'Sale Listing',
          'price': 399900,
          'listingType': 'Standard',
          'listedDate': '2025-07-24T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 206
        }
      }
    },
    {
      'id': '846-Haven-St-SE,-Atlanta,-GA-30315',
      'formattedAddress': '846 Haven St SE, Atlanta, GA 30315',
      'addressLine1': '846 Haven St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.695589,
      'longitude': -84.36192,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 952,
      'lotSize': 9104,
      'yearBuilt': 1952,
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-07-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.791Z',
      'daysOnMarket': 205,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10571498',
      'listingAgent': {
        'name': 'Rashad Jennings',
        'phone': '4049945520',
        'email': 'rjennings@rcmre.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-07-25': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-07-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 205
        }
      }
    },
    {
      'id': '4915-Lower-Elm-St,-Atlanta,-GA-30349',
      'formattedAddress': '4915 Lower Elm St, Atlanta, GA 30349',
      'addressLine1': '4915 Lower Elm St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.62203,
      'longitude': -84.585468,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1467,
      'lotSize': 2657,
      'yearBuilt': 2019,
      'status': 'Active',
      'price': 269000,
      'listingType': 'Standard',
      'listedDate': '2025-07-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.790Z',
      'daysOnMarket': 205,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10571530',
      'listingAgent': {
        'name': 'Beycome',
        'phone': '8046565007',
        'email': 'realtor@beycome.com',
        'website': 'https://www.beycome.com'
      },
      'listingOffice': {
        'name': 'Beycome Brokerage Realty Llc',
        'phone': '8046565007',
        'email': 'ctribusrea@cox.net',
        'website': 'http://www.beycome.com'
      },
      'history': {
        '2025-07-25': {
          'event': 'Sale Listing',
          'price': 269000,
          'listingType': 'Standard',
          'listedDate': '2025-07-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 205
        }
      }
    },
    {
      'id': '710-Cosmopolitan-Dr-NE,-Unit-710,-Atlanta,-GA-30324',
      'formattedAddress': '710 Cosmopolitan Dr NE, Unit 710, Atlanta, GA 30324',
      'addressLine1': '710 Cosmopolitan Dr NE',
      'addressLine2': 'Unit 710',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.821798,
      'longitude': -84.362708,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 1536,
      'lotSize': 823,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 473
      },
      'status': 'Active',
      'price': 449500,
      'listingType': 'Standard',
      'listedDate': '2025-07-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.789Z',
      'daysOnMarket': 205,
      'mlsName': 'FMLS',
      'mlsNumber': '7620987',
      'listingAgent': {
        'name': 'Gordon Hobbs',
        'phone': '4049064503',
        'email': 'gordonhobbs@kw.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY FIRST ATLANTA',
        'phone': '4045315700',
        'email': 'johnfountain@kw.com',
        'website': 'http://www.kwatlanta.com'
      },
      'history': {
        '2025-07-25': {
          'event': 'Sale Listing',
          'price': 449500,
          'listingType': 'Standard',
          'listedDate': '2025-07-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 205
        }
      }
    },
    {
      'id': '951-Glenwood-Ave-SE,-Unit-1706,-Atlanta,-GA-30316',
      'formattedAddress': '951 Glenwood Ave SE, Unit 1706, Atlanta, GA 30316',
      'addressLine1': '951 Glenwood Ave SE',
      'addressLine2': 'Unit 1706',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.738455,
      'longitude': -84.356397,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 1792,
      'lotSize': 1790,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 377
      },
      'status': 'Active',
      'price': 570000,
      'listingType': 'Standard',
      'listedDate': '2025-07-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.787Z',
      'daysOnMarket': 205,
      'mlsName': 'FMLS',
      'mlsNumber': '7621652',
      'listingAgent': {
        'name': 'Tiana Artis',
        'phone': '4046043800',
        'email': 'tianaartis@thereassist.com'
      },
      'listingOffice': {
        'name': 'Redfin Corporation',
        'phone': '8779733346',
        'email': 'accounting@redfin.com',
        'website': 'www.redfin.com'
      },
      'history': {
        '2025-07-25': {
          'event': 'Sale Listing',
          'price': 570000,
          'listingType': 'Standard',
          'listedDate': '2025-07-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 205
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-1408,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 1408, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 1408',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 543,
      'lotSize': 544,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 179000,
      'listingType': 'Standard',
      'listedDate': '2025-07-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.786Z',
      'daysOnMarket': 204,
      'mlsName': 'FMLS',
      'mlsNumber': '7617808',
      'listingAgent': {
        'name': 'David Hutchins',
        'phone': '4045500533',
        'email': 'davidhutchins@remax.net',
        'website': 'http://www.davidhutchins.com'
      },
      'listingOffice': {
        'name': 'RE/MAX Around Atlanta',
        'phone': '4042527500',
        'email': 'connie@aroundatlanta.com'
      },
      'history': {
        '2025-07-26': {
          'event': 'Sale Listing',
          'price': 179000,
          'listingType': 'Standard',
          'listedDate': '2025-07-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 204
        }
      }
    },
    {
      'id': '1750-Lisbon-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1750 Lisbon Dr SW, Atlanta, GA 30310',
      'addressLine1': '1750 Lisbon Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.706914,
      'longitude': -84.41176,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1012,
      'lotSize': 6800,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 175400,
      'listingType': 'Standard',
      'listedDate': '2025-07-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-11-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.781Z',
      'daysOnMarket': 204,
      'mlsName': 'FMLS',
      'mlsNumber': '7622164',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2024-05-16': {
          'event': 'Sale Listing',
          'price': 215000,
          'listingType': 'Standard',
          'listedDate': '2024-05-16T00:00:00.000Z',
          'removedDate': '2024-12-02T00:00:00.000Z',
          'daysOnMarket': 200
        },
        '2025-07-26': {
          'event': 'Sale Listing',
          'price': 175400,
          'listingType': 'Standard',
          'listedDate': '2025-07-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 204
        }
      }
    },
    {
      'id': '1992-Highgrove-Ct,-Atlanta,-GA-30345',
      'formattedAddress': '1992 Highgrove Ct, Atlanta, GA 30345',
      'addressLine1': '1992 Highgrove Ct',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30345',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84127,
      'longitude': -84.267823,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 5.5,
      'squareFootage': 4700,
      'lotSize': 18731,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 1979000,
      'listingType': 'New Construction',
      'listedDate': '2025-07-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-09-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.779Z',
      'daysOnMarket': 203,
      'mlsName': 'FMLS',
      'mlsNumber': '7622297',
      'listingAgent': {
        'name': 'Ralph Harvey',
        'phone': '8554564945',
        'email': 'support@listwithfreedom.com'
      },
      'listingOffice': {
        'name': 'Listwithfreedom.Com, Inc.',
        'phone': '8554564945',
        'email': 'support@listwithfreedom.com',
        'website': 'http://www.listwithfreedom.com/'
      },
      'history': {
        '2025-07-27': {
          'event': 'Sale Listing',
          'price': 1979000,
          'listingType': 'New Construction',
          'listedDate': '2025-07-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 203
        }
      }
    },
    {
      'id': '24-Saint-Claire-Ln-NE,-Atlanta,-GA-30324',
      'formattedAddress': '24 Saint Claire Ln NE, Atlanta, GA 30324',
      'addressLine1': '24 Saint Claire Ln NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.830826,
      'longitude': -84.354497,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1550,
      'lotSize': 1568,
      'yearBuilt': 1983,
      'hoa': {
        'fee': 655
      },
      'status': 'Active',
      'price': 339000,
      'listingType': 'Standard',
      'listedDate': '2025-07-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-16T14:34:52.792Z',
      'lastSeenDate': '2026-02-14T11:24:19.778Z',
      'daysOnMarket': 203,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10572341',
      'listingAgent': {
        'name': 'Erica Jackson',
        'phone': '4156954962',
        'email': 'erica@complexlivingrealestate.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-07-27': {
          'event': 'Sale Listing',
          'price': 339000,
          'listingType': 'Standard',
          'listedDate': '2025-07-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 203
        }
      }
    },
    {
      'id': '175-River-Court-Pkwy,-Atlanta,-GA-30328',
      'formattedAddress': '175 River Court Pkwy, Atlanta, GA 30328',
      'addressLine1': '175 River Court Pkwy',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.948574,
      'longitude': -84.392422,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 3.5,
      'squareFootage': 5012,
      'lotSize': 27391,
      'yearBuilt': 1974,
      'status': 'Active',
      'price': 1199000,
      'listingType': 'Standard',
      'listedDate': '2025-07-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.777Z',
      'daysOnMarket': 203,
      'mlsName': 'FMLS',
      'mlsNumber': '7622394',
      'listingOffice': {
        'name': 'The Collective Real Estate',
        'phone': '4708338616',
        'email': 'brc@thecollectivere.net',
        'website': 'www.thecollectivere.net'
      },
      'history': {
        '2025-07-27': {
          'event': 'Sale Listing',
          'price': 1199000,
          'listingType': 'Standard',
          'listedDate': '2025-07-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 203
        }
      }
    },
    {
      'id': '57-Forsyth-St-NW,-Apt-14H,-Atlanta,-GA-30303',
      'formattedAddress': '57 Forsyth St NW, Apt 14H, Atlanta, GA 30303',
      'addressLine1': '57 Forsyth St NW',
      'addressLine2': 'Apt 14H',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30303',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.755881,
      'longitude': -84.389697,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 674,
      'lotSize': 697,
      'yearBuilt': 1913,
      'hoa': {
        'fee': 637
      },
      'status': 'Active',
      'price': 155000,
      'listingType': 'Standard',
      'listedDate': '2025-07-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.772Z',
      'daysOnMarket': 202,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10572545',
      'listingAgent': {
        'name': 'Robin Andrade',
        'phone': '4045433373',
        'email': 'robin@sellatlanta.com',
        'website': 'http://www.sellatlanta.com'
      },
      'listingOffice': {
        'name': 'Sell Atlanta',
        'phone': '4049944560',
        'email': 'robina37@gmail.com',
        'website': 'www.sellatlanta.com'
      },
      'history': {
        '2025-07-28': {
          'event': 'Sale Listing',
          'price': 155000,
          'listingType': 'Standard',
          'listedDate': '2025-07-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 202
        }
      }
    },
    {
      'id': '2744-Fairlane-Dr-SE,-Atlanta,-GA-30354',
      'formattedAddress': '2744 Fairlane Dr SE, Atlanta, GA 30354',
      'addressLine1': '2744 Fairlane Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.679829,
      'longitude': -84.38004,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1014,
      'lotSize': 11901,
      'yearBuilt': 1958,
      'status': 'Active',
      'price': 179900,
      'listingType': 'Standard',
      'listedDate': '2025-07-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.769Z',
      'daysOnMarket': 202,
      'mlsName': 'FMLS',
      'mlsNumber': '7622986',
      'listingAgent': {
        'name': 'Yibei Xu',
        'phone': '4049166518'
      },
      'listingOffice': {
        'name': 'Wepartner Realty, LLC.',
        'phone': '6788783885',
        'email': 'realty@wepartnerusa.com'
      },
      'history': {
        '2025-07-28': {
          'event': 'Sale Listing',
          'price': 179900,
          'listingType': 'Standard',
          'listedDate': '2025-07-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 202
        }
      }
    },
    {
      'id': '970-Sidney-Marcus-Blvd-NE,-Unit-2211,-Atlanta,-GA-30324',
      'formattedAddress': '970 Sidney Marcus Blvd NE, Unit 2211, Atlanta, GA 30324',
      'addressLine1': '970 Sidney Marcus Blvd NE',
      'addressLine2': 'Unit 2211',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.825326,
      'longitude': -84.356427,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 840,
      'lotSize': 828,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 230000,
      'listingType': 'Standard',
      'listedDate': '2025-07-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.763Z',
      'daysOnMarket': 201,
      'mlsName': 'FMLS',
      'mlsNumber': '7621263',
      'listingAgent': {
        'name': 'Stacy Toporoff',
        'phone': '4048740300',
        'email': 'stacytoporoff@atlantafinehomes.com',
        'website': 'stacytoporoff.atlantafinehomes.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-07-29': {
          'event': 'Sale Listing',
          'price': 230000,
          'listingType': 'Standard',
          'listedDate': '2025-07-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 201
        }
      }
    },
    {
      'id': '2909-Diana-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2909 Diana Dr SW, Atlanta, GA 30315',
      'addressLine1': '2909 Diana Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.675594,
      'longitude': -84.412207,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1000,
      'lotSize': 13939,
      'yearBuilt': 1954,
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-07-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.762Z',
      'daysOnMarket': 200,
      'mlsName': 'MyStateMLS',
      'mlsNumber': '11545875',
      'listingAgent': {
        'name': 'Harrison Turner',
        'phone': '9546464788',
        'email': 'harrison@steignet.com'
      },
      'listingOffice': {
        'name': 'Hayden Outdoors Real Estate',
        'phone': '9706741990'
      },
      'history': {
        '2025-02-27': {
          'event': 'Sale Listing',
          'price': 114900,
          'listingType': 'Standard',
          'listedDate': '2025-02-27T00:00:00.000Z',
          'removedDate': '2025-04-16T00:00:00.000Z',
          'daysOnMarket': 48
        },
        '2025-07-30': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-07-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 200
        }
      }
    },
    {
      'id': '438-James-P-Brawley-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '438 James P Brawley Dr NW, Atlanta, GA 30318',
      'addressLine1': '438 James P Brawley Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.766596,
      'longitude': -84.412803,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1246,
      'lotSize': 3899,
      'yearBuilt': 1948,
      'status': 'Active',
      'price': 165000,
      'listingType': 'Standard',
      'listedDate': '2025-07-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.761Z',
      'daysOnMarket': 201,
      'mlsName': 'FMLS',
      'mlsNumber': '7622154',
      'listingAgent': {
        'name': 'Shaun Van Orsouw',
        'phone': '6787490479',
        'email': 'shaunvanorsouw@yahoo.com',
        'website': 'https://palmerhouseproperties.com'
      },
      'listingOffice': {
        'name': 'Redfin Corporation',
        'phone': '8779733346',
        'email': 'accounting@redfin.com',
        'website': 'www.redfin.com'
      },
      'history': {
        '2025-07-29': {
          'event': 'Sale Listing',
          'price': 165000,
          'listingType': 'Standard',
          'listedDate': '2025-07-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 201
        }
      }
    },
    {
      'id': '3416-Harrison-Rd,-Atlanta,-GA-30344',
      'formattedAddress': '3416 Harrison Rd, Atlanta, GA 30344',
      'addressLine1': '3416 Harrison Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.662163,
      'longitude': -84.434135,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 2430,
      'lotSize': 7841,
      'yearBuilt': 2007,
      'status': 'Active',
      'price': 538000,
      'listingType': 'Standard',
      'listedDate': '2025-07-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.760Z',
      'daysOnMarket': 200,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10573836',
      'listingAgent': {
        'name': 'Lisa Watt',
        'phone': '4049892233',
        'email': 'lisawatt@lisaandcompany.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-05-06': {
          'event': 'Sale Listing',
          'price': 599000,
          'listingType': 'Standard',
          'listedDate': '2025-05-06T00:00:00.000Z',
          'removedDate': '2025-07-13T00:00:00.000Z',
          'daysOnMarket': 68
        },
        '2025-07-30': {
          'event': 'Sale Listing',
          'price': 538000,
          'listingType': 'Standard',
          'listedDate': '2025-07-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 200
        }
      }
    },
    {
      'id': '500-Fraser-St-SE,-Atlanta,-GA-30312',
      'formattedAddress': '500 Fraser St SE, Atlanta, GA 30312',
      'addressLine1': '500 Fraser St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.740608,
      'longitude': -84.386045,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1510,
      'lotSize': 2570,
      'yearBuilt': 1996,
      'hoa': {
        'fee': 150
      },
      'status': 'Active',
      'price': 355000,
      'listingType': 'Standard',
      'listedDate': '2025-07-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.759Z',
      'daysOnMarket': 200,
      'mlsName': 'FMLS',
      'mlsNumber': '7623321',
      'listingAgent': {
        'name': 'Danielle Palmer',
        'phone': '6788512461',
        'email': 'dani@thedanipalmer.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - InTown',
        'phone': '4048444977',
        'email': 'intown@atlantacommunities.net',
        'website': 'www.atlantacommunities.net'
      },
      'history': {
        '2025-07-30': {
          'event': 'Sale Listing',
          'price': 355000,
          'listingType': 'Standard',
          'listedDate': '2025-07-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 200
        }
      }
    },
    {
      'id': '530-Park-Valley-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '530 Park Valley Dr NW, Atlanta, GA 30318',
      'addressLine1': '530 Park Valley Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76939,
      'longitude': -84.462837,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1249,
      'lotSize': 13112,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 329000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.757Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10572818',
      'listingAgent': {
        'name': 'Keron Feliciano',
        'phone': '8889599461',
        'email': 'keron.feliciano@exprealty.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2024-08-20': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2024-08-20T00:00:00.000Z',
          'removedDate': '2024-10-11T00:00:00.000Z',
          'daysOnMarket': 52
        },
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 329000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '2881-Peachtree-Rd-NE,-Apt-1003,-Atlanta,-GA-30305',
      'formattedAddress': '2881 Peachtree Rd NE, Apt 1003, Atlanta, GA 30305',
      'addressLine1': '2881 Peachtree Rd NE',
      'addressLine2': 'Apt 1003',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.833096,
      'longitude': -84.383172,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2416,
      'lotSize': 2439,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 145
      },
      'status': 'Active',
      'price': 785000,
      'listingType': 'Standard',
      'listedDate': '2025-07-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.755Z',
      'daysOnMarket': 201,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10573124',
      'listingAgent': {
        'name': 'Bobbie Schmitt',
        'phone': '6783730739',
        'email': 'bobbie.schmitt@evusa.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyre.com',
        'website': 'www.ansleyatlanta.com'
      },
      'history': {
        '2025-07-29': {
          'event': 'Sale Listing',
          'price': 785000,
          'listingType': 'Standard',
          'listedDate': '2025-07-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 201
        }
      }
    },
    {
      'id': '2881-Peachtree-Rd-NE,-Apt-605,-Atlanta,-GA-30305',
      'formattedAddress': '2881 Peachtree Rd NE, Apt 605, Atlanta, GA 30305',
      'addressLine1': '2881 Peachtree Rd NE',
      'addressLine2': 'Apt 605',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.833096,
      'longitude': -84.383172,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1735,
      'lotSize': 1699,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 1238
      },
      'status': 'Active',
      'price': 590000,
      'listingType': 'Standard',
      'listedDate': '2025-07-31T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:38:22.751Z',
      'lastSeenDate': '2026-02-14T11:24:19.755Z',
      'daysOnMarket': 199,
      'mlsName': 'FMLS',
      'mlsNumber': '7624314',
      'listingAgent': {
        'name': 'Bobbie Schmitt',
        'phone': '4049644662',
        'email': 'bobbieschmitt@ansleyre.com',
        'website': 'http://www.bobbieschmitt.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate | Christie\'s International Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyatlanta.com'
      },
      'history': {
        '2024-03-11': {
          'event': 'Sale Listing',
          'price': 669000,
          'listingType': 'Standard',
          'listedDate': '2024-03-11T00:00:00.000Z',
          'removedDate': '2024-09-26T00:00:00.000Z',
          'daysOnMarket': 199
        },
        '2024-10-01': {
          'event': 'Sale Listing',
          'price': 669000,
          'listingType': 'Standard',
          'listedDate': '2024-10-01T00:00:00.000Z',
          'removedDate': '2024-12-10T00:00:00.000Z',
          'daysOnMarket': 70
        },
        '2025-07-31': {
          'event': 'Sale Listing',
          'price': 590000,
          'listingType': 'Standard',
          'listedDate': '2025-07-31T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 199
        }
      }
    },
    {
      'id': '2038-Liberty-Ct-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2038 Liberty Ct NW, Atlanta, GA 30318',
      'addressLine1': '2038 Liberty Ct NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.817941,
      'longitude': -84.441889,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 1326,
      'lotSize': 610,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 460
      },
      'status': 'Active',
      'price': 349999,
      'listingType': 'Standard',
      'listedDate': '2025-07-31T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.754Z',
      'daysOnMarket': 199,
      'mlsName': 'FMLS',
      'mlsNumber': '7623462',
      'listingAgent': {
        'name': 'Cinnamon Collingwood',
        'phone': '3135503603',
        'email': 'cinnamoncollingwood@gmail.com',
        'website': 'http://ccollingwood.kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Cityside',
        'phone': '7708746200',
        'email': 'nicole@zercherhomes.com',
        'website': 'http://kwcityside.com/'
      },
      'history': {
        '2025-07-31': {
          'event': 'Sale Listing',
          'price': 349999,
          'listingType': 'Standard',
          'listedDate': '2025-07-31T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 199
        }
      }
    },
    {
      'id': '250-Pharr-Rd-NE,-Apt-308,-Atlanta,-GA-30305',
      'formattedAddress': '250 Pharr Rd NE, Apt 308, Atlanta, GA 30305',
      'addressLine1': '250 Pharr Rd NE',
      'addressLine2': 'Apt 308',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.837184,
      'longitude': -84.378964,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1060,
      'lotSize': 1045,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 581
      },
      'status': 'Active',
      'price': 399000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.753Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10576162',
      'listingAgent': {
        'name': 'Joe Thompson',
        'phone': '8667551202'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 399000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '246-James-P-Brawley-Dr-NW,-Atlanta,-GA-30314',
      'formattedAddress': '246 James P Brawley Dr NW, Atlanta, GA 30314',
      'addressLine1': '246 James P Brawley Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.761385,
      'longitude': -84.412899,
      'propertyType': 'Land',
      'bedrooms': 0,
      'lotSize': 4639,
      'status': 'Active',
      'price': 160000,
      'listingType': 'Standard',
      'listedDate': '2025-08-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-01-30T13:00:12.909Z',
      'lastSeenDate': '2026-02-14T11:24:19.753Z',
      'daysOnMarket': 197,
      'mlsName': 'FMLS',
      'mlsNumber': '7626113',
      'listingAgent': {
        'name': 'Telmo Bermeo',
        'website': 'http://www.kstrealty.com'
      },
      'listingOffice': {
        'name': 'Americas Network Realty Group, Inc',
        'phone': '7705515850',
        'email': 'newhomes@bellsouth.net',
        'website': 'www.kstrealty.com'
      },
      'history': {
        '2024-05-06': {
          'event': 'Sale Listing',
          'price': 170000,
          'listingType': 'Standard',
          'listedDate': '2024-05-06T00:00:00.000Z',
          'removedDate': '2025-03-12T00:00:00.000Z',
          'daysOnMarket': 310
        },
        '2025-08-02': {
          'event': 'Sale Listing',
          'price': 160000,
          'listingType': 'Standard',
          'listedDate': '2025-08-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 197
        }
      }
    },
    {
      'id': '2520-Peachtree-Rd-NW,-Unit-903,-Atlanta,-GA-30305',
      'formattedAddress': '2520 Peachtree Rd NW, Unit 903, Atlanta, GA 30305',
      'addressLine1': '2520 Peachtree Rd NW',
      'addressLine2': 'Unit 903',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.823807,
      'longitude': -84.388213,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 3,
      'squareFootage': 2557,
      'lotSize': 2570,
      'yearBuilt': 2022,
      'status': 'Active',
      'price': 2299000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-01-24T08:20:00.782Z',
      'lastSeenDate': '2026-02-14T11:24:19.752Z',
      'daysOnMarket': 198,
      'mlsName': 'FMLS',
      'mlsNumber': '7615319',
      'listingAgent': {
        'name': 'Chase Mizell',
        'phone': '4048740300',
        'email': 'chasemizell@atlantafinehomes.com',
        'website': 'http://www.chasemizell.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2024-08-15': {
          'event': 'Sale Listing',
          'price': 2350000,
          'listingType': 'Standard',
          'listedDate': '2024-08-15T00:00:00.000Z',
          'removedDate': '2024-10-26T00:00:00.000Z',
          'daysOnMarket': 72
        },
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 2299000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '1765-Lakewood-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1765 Lakewood Ave SE, Atlanta, GA 30315',
      'addressLine1': '1765 Lakewood Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.706039,
      'longitude': -84.380623,
      'propertyType': 'Land',
      'lotSize': 104108,
      'status': 'Active',
      'price': 1495000,
      'listingType': 'Standard',
      'listedDate': '2025-07-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.751Z',
      'daysOnMarket': 201,
      'mlsName': 'FMLS',
      'mlsNumber': '7623151',
      'listingAgent': {
        'name': 'William T Adams',
        'phone': '4042730687'
      },
      'listingOffice': {
        'name': 'Adams Realtors',
        'phone': '4046881222',
        'email': 'wtadams@adamsrealtors.com',
        'website': 'www.wtadams.com'
      },
      'history': {
        '2025-07-29': {
          'event': 'Sale Listing',
          'price': 1495000,
          'listingType': 'Standard',
          'listedDate': '2025-07-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 201
        }
      }
    },
    {
      'id': '3573-Bluebird-Ct-SW,-Atlanta,-GA-30331',
      'formattedAddress': '3573 Bluebird Ct SW, Atlanta, GA 30331',
      'addressLine1': '3573 Bluebird Ct SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.687698,
      'longitude': -84.501953,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1480,
      'lotSize': 1045,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 165
      },
      'status': 'Active',
      'price': 275000,
      'listingType': 'Standard',
      'listedDate': '2025-07-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.750Z',
      'daysOnMarket': 201,
      'mlsName': 'FMLS',
      'mlsNumber': '7623595',
      'listingAgent': {
        'name': 'Sitaramaraju Atchutuni',
        'phone': '6786652219',
        'email': 'rajoos@yahoo.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-07-29': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2025-07-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 201
        }
      }
    },
    {
      'id': '2479-Peachtree-Rd-NE,-Apt-1405,-Atlanta,-GA-30305',
      'formattedAddress': '2479 Peachtree Rd NE, Apt 1405, Atlanta, GA 30305',
      'addressLine1': '2479 Peachtree Rd NE',
      'addressLine2': 'Apt 1405',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.822468,
      'longitude': -84.386459,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 837,
      'yearBuilt': 1967,
      'hoa': {
        'fee': 851
      },
      'status': 'Active',
      'price': 149900,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.750Z',
      'daysOnMarket': 198,
      'mlsName': 'FMLS',
      'mlsNumber': '7625407',
      'listingAgent': {
        'name': 'Anne Rains',
        'phone': '4043572231',
        'email': 'annerains@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Rlty Atl.Partn',
        'phone': '7706015987',
        'email': 'klrw791@kw.com',
        'website': 'barrowjackson.yourkwoffice.com'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '700-Park-Regency-Pl-NE,-Apt-1906,-Atlanta,-GA-30326',
      'formattedAddress': '700 Park Regency Pl NE, Apt 1906, Atlanta, GA 30326',
      'addressLine1': '700 Park Regency Pl NE',
      'addressLine2': 'Apt 1906',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.85451,
      'longitude': -84.36491,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1667,
      'lotSize': 1668,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 1729
      },
      'status': 'Active',
      'price': 699000,
      'listingType': 'Standard',
      'listedDate': '2025-07-31T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-02-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.748Z',
      'daysOnMarket': 199,
      'mlsName': 'FMLS',
      'mlsNumber': '7624477',
      'listingAgent': {
        'name': 'Jolynne Szymanski',
        'phone': '4042717167',
        'email': 'jolynne@intownere.com',
        'website': 'http://intownere.com'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-07-31': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'Standard',
          'listedDate': '2025-07-31T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 199
        }
      }
    },
    {
      'id': '970-Sidney-Marcus-Blvd-NE,-Unit-1217,-Atlanta,-GA-30324',
      'formattedAddress': '970 Sidney Marcus Blvd NE, Unit 1217, Atlanta, GA 30324',
      'addressLine1': '970 Sidney Marcus Blvd NE',
      'addressLine2': 'Unit 1217',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.825326,
      'longitude': -84.356427,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1165,
      'lotSize': 1176,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 450
      },
      'status': 'Active',
      'price': 258000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-15T13:55:55.733Z',
      'lastSeenDate': '2026-02-14T11:24:19.747Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10575591',
      'listingAgent': {
        'name': 'Bernice Rodriguez-liriano',
        'phone': '4045432936',
        'email': 'bernicer86@gmail.com'
      },
      'listingOffice': {
        'name': 'STRONG TOWER REALTY INC',
        'phone': '7705591321',
        'email': 'info@strongtowerrealty.com',
        'website': 'strongtowerrealty.com'
      },
      'history': {
        '2025-01-07': {
          'event': 'Sale Listing',
          'price': 280000,
          'listingType': 'Standard',
          'listedDate': '2025-01-07T00:00:00.000Z',
          'removedDate': '2025-02-07T00:00:00.000Z',
          'daysOnMarket': 31
        },
        '2025-02-07': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2025-02-07T00:00:00.000Z',
          'removedDate': '2025-04-01T00:00:00.000Z',
          'daysOnMarket': 53
        },
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 258000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '845-Spring-St-NW,-Ph-4,-Atlanta,-GA-30308',
      'formattedAddress': '845 Spring St NW, Ph 4, Atlanta, GA 30308',
      'addressLine1': '845 Spring St NW',
      'addressLine2': 'Ph 4',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.7778,
      'longitude': -84.388052,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 2116,
      'lotSize': 2004,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 1007
      },
      'status': 'Active',
      'price': 870000,
      'listingType': 'Standard',
      'listedDate': '2025-08-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-07-19T17:14:29.640Z',
      'lastSeenDate': '2026-02-14T11:24:19.746Z',
      'daysOnMarket': 195,
      'mlsName': 'FMLS',
      'mlsNumber': '7627036',
      'listingAgent': {
        'name': 'Alexander Phillips',
        'phone': '4048764901',
        'email': 'aphillips@phpatlanta.com'
      },
      'listingOffice': {
        'name': 'Engel & Volkers Atlanta',
        'phone': '4048457724',
        'email': 'atlanta@engelvoelkers.com',
        'website': 'https://evatlanta.evrealestate.com'
      },
      'history': {
        '2025-06-26': {
          'event': 'Sale Listing',
          'price': 930000,
          'listingType': 'Standard',
          'listedDate': '2025-06-26T00:00:00.000Z',
          'removedDate': '2025-08-01T00:00:00.000Z',
          'daysOnMarket': 36
        },
        '2025-08-04': {
          'event': 'Sale Listing',
          'price': 870000,
          'listingType': 'Standard',
          'listedDate': '2025-08-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 195
        }
      }
    },
    {
      'id': '346-Carpenter-Dr,-Apt-85,-Atlanta,-GA-30328',
      'formattedAddress': '346 Carpenter Dr, Apt 85, Atlanta, GA 30328',
      'addressLine1': '346 Carpenter Dr',
      'addressLine2': 'Apt 85',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.912998,
      'longitude': -84.376577,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1190,
      'lotSize': 1189,
      'yearBuilt': 1967,
      'hoa': {
        'fee': 400
      },
      'status': 'Active',
      'price': 230000,
      'listingType': 'Standard',
      'listedDate': '2025-07-31T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.745Z',
      'daysOnMarket': 199,
      'mlsName': 'FMLS',
      'mlsNumber': '7624295',
      'listingAgent': {
        'name': 'Eric Mask',
        'phone': '4042457870',
        'email': 'ericmask@atlantafinehomes.com',
        'website': 'https://ericmask.atlantafinehomes.com/eng'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-07-31': {
          'event': 'Sale Listing',
          'price': 230000,
          'listingType': 'Standard',
          'listedDate': '2025-07-31T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 199
        }
      }
    },
    {
      'id': '718-Cascade-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '718 Cascade Ave SW, Atlanta, GA 30310',
      'addressLine1': '718 Cascade Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.735741,
      'longitude': -84.436002,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 5,
      'squareFootage': 3697,
      'lotSize': 8451,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 949900,
      'listingType': 'New Construction',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.745Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10575583',
      'listingAgent': {
        'name': 'Ramon Tookes',
        'phone': '4042465930',
        'email': 'ramontookes@gmail.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-03-28': {
          'event': 'Sale Listing',
          'price': 1049900,
          'listingType': 'New Construction',
          'listedDate': '2025-03-28T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 95
        },
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 949900,
          'listingType': 'New Construction',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '502-Pryor-St-SW,-Unit-223,-Atlanta,-GA-30312',
      'formattedAddress': '502 Pryor St SW, Unit 223, Atlanta, GA 30312',
      'addressLine1': '502 Pryor St SW',
      'addressLine2': 'Unit 223',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.741281,
      'longitude': -84.394001,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1600,
      'lotSize': 784,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 15
      },
      'status': 'Active',
      'price': 140000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-16T19:12:04.768Z',
      'lastSeenDate': '2026-02-14T11:24:19.743Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10575322',
      'listingAgent': {
        'name': 'Rashad Jennings',
        'phone': '4049945520',
        'email': 'rjennings@rcmre.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 140000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '356-5th-St-NE,-Atlanta,-GA-30308',
      'formattedAddress': '356 5th St NE, Atlanta, GA 30308',
      'addressLine1': '356 5th St NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.775567,
      'longitude': -84.375698,
      'propertyType': 'Multi-Family',
      'lotSize': 5876,
      'yearBuilt': 1925,
      'status': 'Active',
      'price': 1200000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.742Z',
      'daysOnMarket': 198,
      'mlsName': 'FMLS',
      'mlsNumber': '7625516',
      'listingAgent': {
        'name': 'Andy Lundsberg',
        'phone': '4048761640',
        'email': 'andy@bullrealty.com'
      },
      'listingOffice': {
        'name': 'Bull Realty, Inc.',
        'phone': '4048761640',
        'email': 'accounting@bullrealty.com',
        'website': 'www.bullrealty.com'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 1200000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '1857-Lakewood-Ter-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1857 Lakewood Ter SE, Atlanta, GA 30315',
      'addressLine1': '1857 Lakewood Ter SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.703325,
      'longitude': -84.380357,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 1287,
      'lotSize': 12101,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 384900,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-07-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.741Z',
      'daysOnMarket': 198,
      'mlsName': 'FMLS',
      'mlsNumber': '7625599',
      'listingAgent': {
        'name': 'Jamey Waters',
        'phone': '6787304285',
        'email': 'jwaters@propertygroupga.com',
        'website': 'http://www.propertygroupga.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 384900,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '1751-N-Pelham-Rd-NE,-Atlanta,-GA-30324',
      'formattedAddress': '1751 N Pelham Rd NE, Atlanta, GA 30324',
      'addressLine1': '1751 N Pelham Rd NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.802417,
      'longitude': -84.363524,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 3193,
      'lotSize': 9757,
      'yearBuilt': 1935,
      'status': 'Active',
      'price': 1750000,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.741Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10576533',
      'listingAgent': {
        'name': 'Melody Unger',
        'phone': '7708746200',
        'email': 'melodyunger@hotmail.com',
        'website': 'http://www.melodyunger.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Cityside',
        'phone': '7708746200',
        'email': 'nicole@zercherhomes.com',
        'website': 'http://kwcityside.com/'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 1750000,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '795-Hammond-Dr,-Apt-513,-Atlanta,-GA-30328',
      'formattedAddress': '795 Hammond Dr, Apt 513, Atlanta, GA 30328',
      'addressLine1': '795 Hammond Dr',
      'addressLine2': 'Apt 513',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.917488,
      'longitude': -84.359401,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1109,
      'lotSize': 1111,
      'yearBuilt': 1990,
      'hoa': {
        'fee': 546
      },
      'status': 'Active',
      'price': 249000,
      'listingType': 'Standard',
      'listedDate': '2025-08-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-27T15:56:27.619Z',
      'lastSeenDate': '2026-02-14T11:24:19.740Z',
      'daysOnMarket': 197,
      'mlsName': 'FMLS',
      'mlsNumber': '7623994',
      'listingAgent': {
        'name': 'Teresa Redd',
        'phone': '7708230110',
        'email': 'teresaredd@comcast.net'
      },
      'listingOffice': {
        'name': 'Maximum One Greater Atlanta Realtors',
        'phone': '7709198825',
        'email': 'maximum-one-realty-greater-atlanta@inbound.opcity.com',
        'website': 'www.maximumonerealty.com'
      },
      'history': {
        '2025-08-02': {
          'event': 'Sale Listing',
          'price': 249000,
          'listingType': 'Standard',
          'listedDate': '2025-08-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 197
        }
      }
    },
    {
      'id': '4580-Ajo-Walk,-Unit-HOMESITE21,-Atlanta,-GA-30331',
      'formattedAddress': '4580 Ajo Walk, Unit HOMESITE21, Atlanta, GA 30331',
      'addressLine1': '4580 Ajo Walk',
      'addressLine2': 'Unit HOMESITE21',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.705364,
      'longitude': -84.54213,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2235,
      'lotSize': 9583,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 48
      },
      'status': 'Active',
      'price': 349990,
      'listingType': 'New Construction',
      'listedDate': '2025-08-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2026-01-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.739Z',
      'daysOnMarket': 196,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10577142',
      'listingAgent': {
        'name': 'Shavon Shavers',
        'phone': '4704585167',
        'email': 'shavonshavers@kw.com'
      },
      'listingOffice': {
        'name': 'Rockhaven Realty',
        'phone': '4707304131',
        'email': 'rockhaven.realty@rockhavenga.com'
      },
      'history': {
        '2025-08-03': {
          'event': 'Sale Listing',
          'price': 349990,
          'listingType': 'New Construction',
          'listedDate': '2025-08-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 196
        }
      }
    },
    {
      'id': '2657-Lenox-Rd-NE,-Unit-N185,-Atlanta,-GA-30324',
      'formattedAddress': '2657 Lenox Rd NE, Unit N185, Atlanta, GA 30324',
      'addressLine1': '2657 Lenox Rd NE',
      'addressLine2': 'Unit N185',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.82716,
      'longitude': -84.354244,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 950,
      'lotSize': 958,
      'yearBuilt': 1994,
      'hoa': {
        'fee': 300
      },
      'status': 'Active',
      'price': 208900,
      'listingType': 'Standard',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.738Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10576055',
      'listingAgent': {
        'name': 'Paul Summers',
        'phone': '6782679565',
        'email': 'paul.summers@charter.net'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Partners - North Gwinnett',
        'phone': '6783185000',
        'email': 'frontdesk347@kw.com',
        'website': 'http://atlantapartners-north.yourkwoffice.com/'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 208900,
          'listingType': 'Standard',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '145-15th-St-NE,-Apt-413,-Atlanta,-GA-30309',
      'formattedAddress': '145 15th St NE, Apt 413, Atlanta, GA 30309',
      'addressLine1': '145 15th St NE',
      'addressLine2': 'Apt 413',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.788339,
      'longitude': -84.382561,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1641,
      'lotSize': 1642,
      'yearBuilt': 1972,
      'hoa': {
        'fee': 1287
      },
      'status': 'Active',
      'price': 425000,
      'listingType': 'Standard',
      'listedDate': '2025-08-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.737Z',
      'daysOnMarket': 196,
      'mlsName': 'FMLS',
      'mlsNumber': '7626237',
      'listingAgent': {
        'name': 'Anna Sierdzinska',
        'phone': '6784631189',
        'email': 'zajana@gmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta - East Cobb',
        'phone': '7705090700',
        'email': 'klrw178@kw.com;jima@kw.com',
        'website': 'http://www.atlantanorthkw.com/'
      },
      'history': {
        '2025-08-03': {
          'event': 'Sale Listing',
          'price': 425000,
          'listingType': 'Standard',
          'listedDate': '2025-08-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 196
        }
      }
    },
    {
      'id': '1179-Booker-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1179 Booker Ave SW, Atlanta, GA 30310',
      'addressLine1': '1179 Booker Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.722546,
      'longitude': -84.397587,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 2055,
      'lotSize': 4400,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 599000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-01-13T10:17:26.910Z',
      'lastSeenDate': '2026-02-14T11:24:19.736Z',
      'daysOnMarket': 198,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10576114',
      'listingAgent': {
        'name': 'Emiko Yang',
        'phone': '4044236558',
        'email': 'e@realtoremiko.com',
        'website': 'https://emikoyang.bhhsgeorgiaconnect.com/'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4046375200',
        'email': 'customercare@bhhsgeorgia.com',
        'website': 'http://www.bhhsgeorgia.com'
      },
      'history': {
        '2025-08-01': {
          'event': 'Sale Listing',
          'price': 599000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 198
        }
      }
    },
    {
      'id': '3425-Harris-Dr,-Atlanta,-GA-30337',
      'formattedAddress': '3425 Harris Dr, Atlanta, GA 30337',
      'addressLine1': '3425 Harris Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30337',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.662239,
      'longitude': -84.46171,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1092,
      'lotSize': 9030,
      'yearBuilt': 1947,
      'status': 'Active',
      'price': 330000,
      'listingType': 'Standard',
      'listedDate': '2025-08-04T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.736Z',
      'daysOnMarket': 195,
      'mlsName': 'FMLS',
      'mlsNumber': '7626661',
      'listingAgent': {
        'name': 'Antonzio Taylor',
        'phone': '4045503849',
        'email': 'antontaylor@me.com',
        'website': 'http://www.antontaylor.com'
      },
      'listingOffice': {
        'name': 'ANTON Real Estate, LLC',
        'phone': '4707990779',
        'email': 'anton@thelinkatl.com',
        'website': 'www.antonre.co'
      },
      'history': {
        '2025-08-04': {
          'event': 'Sale Listing',
          'price': 330000,
          'listingType': 'Standard',
          'listedDate': '2025-08-04T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 195
        }
      }
    },
    {
      'id': '1118-Austin-Ave-NE,-Atlanta,-GA-30307',
      'formattedAddress': '1118 Austin Ave NE, Atlanta, GA 30307',
      'addressLine1': '1118 Austin Ave NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30307',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.762272,
      'longitude': -84.350971,
      'propertyType': 'Land',
      'lotSize': 9074,
      'status': 'Active',
      'price': 555000,
      'listingType': 'Standard',
      'listedDate': '2025-08-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.734Z',
      'daysOnMarket': 197,
      'mlsName': 'FMLS',
      'mlsNumber': '7623183',
      'listingAgent': {
        'name': 'Ward Bradshaw',
        'email': 'ward.bradshaw@compass.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-08-02': {
          'event': 'Sale Listing',
          'price': 555000,
          'listingType': 'Standard',
          'listedDate': '2025-08-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 197
        }
      }
    },
    {
      'id': '270-Lakemoore-Dr-NE,-Apt-B,-Atlanta,-GA-30342',
      'formattedAddress': '270 Lakemoore Dr NE, Apt B, Atlanta, GA 30342',
      'addressLine1': '270 Lakemoore Dr NE',
      'addressLine2': 'Apt B',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.865533,
      'longitude': -84.378761,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1168,
      'lotSize': 1167,
      'yearBuilt': 1952,
      'hoa': {
        'fee': 461
      },
      'status': 'Active',
      'price': 195999,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.733Z',
      'daysOnMarket': 194,
      'mlsName': 'FMLS',
      'mlsNumber': '7627501',
      'listingAgent': {
        'name': 'Patryk Skoplak',
        'phone': '8667551202',
        'email': 'patryk.skoplak@bhhsgeorgia.com'
      },
      'listingOffice': {
        'name': 'Heartland Real Estate, LLC',
        'phone': '4706551976',
        'email': 'april@heartlandrealestatega.com'
      },
      'history': {
        '2025-04-11': {
          'event': 'Sale Listing',
          'price': 214999,
          'listingType': 'Standard',
          'listedDate': '2025-04-11T00:00:00.000Z',
          'removedDate': '2025-07-23T00:00:00.000Z',
          'daysOnMarket': 103
        },
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 195999,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-10H,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 10H, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 10H',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 599,
      'lotSize': 601,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 210000,
      'listingType': 'Standard',
      'listedDate': '2025-08-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.732Z',
      'daysOnMarket': 196,
      'mlsName': 'FMLS',
      'mlsNumber': '7626386',
      'listingAgent': {
        'name': 'Rongrong Deng',
        'phone': '4048229753'
      },
      'listingOffice': {
        'name': 'R Square Realty, LLC',
        'phone': '4048229753',
        'email': 'dengrongrong115@gmail.com'
      },
      'history': {
        '2025-08-03': {
          'event': 'Sale Listing',
          'price': 210000,
          'listingType': 'Standard',
          'listedDate': '2025-08-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 196
        }
      }
    },
    {
      'id': '3182-Lake-Ave,-Atlanta,-GA-30354',
      'formattedAddress': '3182 Lake Ave, Atlanta, GA 30354',
      'addressLine1': '3182 Lake Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.66797,
      'longitude': -84.410054,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1356,
      'lotSize': 14636,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 310000,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-08-08T15:30:03.170Z',
      'lastSeenDate': '2026-02-14T11:24:19.732Z',
      'daysOnMarket': 194,
      'mlsName': 'FMLS',
      'mlsNumber': '7627412',
      'listingAgent': {
        'name': 'Christine Croce',
        'phone': '3109233539',
        'email': 'christinecroce@atlantafinehomes.com',
        'website': 'christinecroce.kw.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-02-26': {
          'event': 'Sale Listing',
          'price': 300000,
          'listingType': 'Standard',
          'listedDate': '2025-02-26T00:00:00.000Z',
          'removedDate': '2025-08-02T00:00:00.000Z',
          'daysOnMarket': 157
        },
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '711-Cosmopolitan-Dr-NE,-Unit-207,-Atlanta,-GA-30324',
      'formattedAddress': '711 Cosmopolitan Dr NE, Unit 207, Atlanta, GA 30324',
      'addressLine1': '711 Cosmopolitan Dr NE',
      'addressLine2': 'Unit 207',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.821416,
      'longitude': -84.362599,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1489,
      'lotSize': 1490,
      'yearBuilt': 2009,
      'hoa': {
        'fee': 587
      },
      'status': 'Active',
      'price': 368000,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-05-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.727Z',
      'daysOnMarket': 194,
      'mlsName': 'FMLS',
      'mlsNumber': '7623626',
      'listingAgent': {
        'name': 'Kuo Chau Yeh',
        'phone': '7068048818',
        'email': 'peteryehrealtor@gmail.com'
      },
      'listingOffice': {
        'name': 'Maximum One Catalyst Partners',
        'phone': '4704009877',
        'email': 'neal@maxonecatalyst.com',
        'website': 'www.maxonecatalyst.com'
      },
      'history': {
        '2024-02-05': {
          'event': 'Sale Listing',
          'price': 379000,
          'listingType': 'Standard',
          'listedDate': '2024-02-05T00:00:00.000Z',
          'removedDate': '2025-01-06T00:00:00.000Z',
          'daysOnMarket': 336
        },
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 368000,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '2720-Dearwood-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2720 Dearwood Dr SW, Atlanta, GA 30315',
      'addressLine1': '2720 Dearwood Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.680684,
      'longitude': -84.404717,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1100,
      'lotSize': 8407,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 217000,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.727Z',
      'daysOnMarket': 194,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10578434',
      'listingAgent': {
        'name': 'Christopher Hurd',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'listingOffice': {
        'name': 'Blue Mountain Realty GA LLC',
        'phone': '8332852583',
        'email': 'churd@bluemountainrealty.com'
      },
      'history': {
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 217000,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '1600-Glenview-Dr-SW,-Atlanta,-GA-30331',
      'formattedAddress': '1600 Glenview Dr SW, Atlanta, GA 30331',
      'addressLine1': '1600 Glenview Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.711567,
      'longitude': -84.502339,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 4403,
      'lotSize': 419483,
      'yearBuilt': 2004,
      'status': 'Active',
      'price': 1400000,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.726Z',
      'daysOnMarket': 194,
      'mlsName': 'FMLS',
      'mlsNumber': '7627590',
      'listingAgent': {
        'name': 'Linda Mcintosh',
        'phone': '4048432500',
        'email': 'linda.mcintosh@metrobrokers.com',
        'website': 'http://lindamcintosh.metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 1400000,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '2025-Moody-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2025 Moody Dr SW, Atlanta, GA 30315',
      'addressLine1': '2025 Moody Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.698731,
      'longitude': -84.400214,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 875,
      'lotSize': 10193,
      'yearBuilt': 1970,
      'status': 'Active',
      'price': 75000,
      'listingType': 'Standard',
      'listedDate': '2025-08-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-16T12:28:25.782Z',
      'lastSeenDate': '2026-02-14T11:24:19.724Z',
      'daysOnMarket': 193,
      'mlsName': 'FMLS',
      'mlsNumber': '7627719',
      'listingAgent': {
        'name': 'Kevina Howard',
        'phone': '7707442707',
        'email': 'kevinahowardrealtor@gmail.com'
      },
      'listingOffice': {
        'name': 'Create Real Estate Group, LLC',
        'phone': '7707442707',
        'email': 'kevinahowardrealtor@gmail.com'
      },
      'history': {
        '2024-07-01': {
          'event': 'Sale Listing',
          'price': 99000,
          'listingType': 'Standard',
          'listedDate': '2024-07-01T00:00:00.000Z',
          'removedDate': '2024-12-27T00:00:00.000Z',
          'daysOnMarket': 179
        },
        '2025-01-16': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'New Construction',
          'listedDate': '2025-01-16T00:00:00.000Z',
          'removedDate': '2025-07-09T00:00:00.000Z',
          'daysOnMarket': 174
        },
        '2025-08-06': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'Standard',
          'listedDate': '2025-08-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 193
        }
      }
    },
    {
      'id': '1580-Johnson-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1580 Johnson Rd NW, Atlanta, GA 30318',
      'addressLine1': '1580 Johnson Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.785746,
      'longitude': -84.443219,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2164,
      'lotSize': 5706,
      'yearBuilt': 2013,
      'hoa': {
        'fee': 117
      },
      'status': 'Active',
      'price': 545000,
      'listingType': 'Standard',
      'listedDate': '2025-08-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.723Z',
      'daysOnMarket': 193,
      'mlsName': 'FMLS',
      'mlsNumber': '7628241',
      'listingAgent': {
        'name': 'Jessica Frazer',
        'phone': '4048432500',
        'email': 'info@jessicafrazer.com',
        'website': 'www.jessicafrazer.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-05-06': {
          'event': 'Sale Listing',
          'price': 569900,
          'listingType': 'Standard',
          'listedDate': '2025-05-06T00:00:00.000Z',
          'removedDate': '2025-07-15T00:00:00.000Z',
          'daysOnMarket': 70
        },
        '2025-08-06': {
          'event': 'Sale Listing',
          'price': 545000,
          'listingType': 'Standard',
          'listedDate': '2025-08-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 193
        }
      }
    },
    {
      'id': '4580-Ajo-Walk-SW,-Atlanta,-GA-30331',
      'formattedAddress': '4580 Ajo Walk SW, Atlanta, GA 30331',
      'addressLine1': '4580 Ajo Walk SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.705364,
      'longitude': -84.54213,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2235,
      'lotSize': 9583,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 48
      },
      'status': 'Active',
      'price': 349990,
      'listingType': 'New Construction',
      'listedDate': '2025-08-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-04T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.722Z',
      'daysOnMarket': 196,
      'mlsName': 'FMLS',
      'mlsNumber': '7626265',
      'listingAgent': {
        'name': 'Shavon Shavers',
        'phone': '4704585167',
        'email': 'shavonshavers@kw.com'
      },
      'listingOffice': {
        'name': 'Rockhaven Realty, LLC',
        'phone': '4706450124',
        'email': 'kdentler@rockhavenga.com'
      },
      'history': {
        '2025-08-03': {
          'event': 'Sale Listing',
          'price': 349990,
          'listingType': 'New Construction',
          'listedDate': '2025-08-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 196
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-1002,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 1002, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 1002',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76002,
      'longitude': -84.381261,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 850,
      'lotSize': 871,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 646
      },
      'status': 'Active',
      'price': 145000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.720Z',
      'daysOnMarket': 192,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10579879',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 145000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760287,
      'longitude': -84.381655,
      'propertyType': 'Multi-Family',
      'bedrooms': 11,
      'bathrooms': 6,
      'squareFootage': 1256,
      'lotSize': 932,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 930
      },
      'status': 'Active',
      'price': 175000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-02-02T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.719Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7626590',
      'listingAgent': {
        'name': 'Null Monarch Realty Group',
        'phone': '7706966278',
        'email': 'hello@monarchrealtypartners.com'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2024-10-15': {
          'event': 'Sale Listing',
          'price': 240000,
          'listingType': 'Standard',
          'listedDate': '2024-10-15T00:00:00.000Z',
          'removedDate': '2024-11-15T00:00:00.000Z',
          'daysOnMarket': 31
        },
        '2024-11-15': {
          'event': 'Sale Listing',
          'price': 260000,
          'listingType': 'Standard',
          'listedDate': '2024-11-15T00:00:00.000Z',
          'removedDate': '2025-01-18T00:00:00.000Z',
          'daysOnMarket': 64
        },
        '2025-01-24': {
          'event': 'Sale Listing',
          'price': 229000,
          'listingType': 'Standard',
          'listedDate': '2025-01-24T00:00:00.000Z',
          'removedDate': '2025-03-30T00:00:00.000Z',
          'daysOnMarket': 65
        },
        '2025-03-30': {
          'event': 'Sale Listing',
          'price': 1519300,
          'listingType': 'Standard',
          'listedDate': '2025-03-30T00:00:00.000Z',
          'removedDate': '2025-07-21T00:00:00.000Z',
          'daysOnMarket': 113
        },
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 175000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '275-13th-St-NE,-Apt-312,-Atlanta,-GA-30309',
      'formattedAddress': '275 13th St NE, Apt 312, Atlanta, GA 30309',
      'addressLine1': '275 13th St NE',
      'addressLine2': 'Apt 312',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.784982,
      'longitude': -84.379651,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1350,
      'lotSize': 1350,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 799
      },
      'status': 'Active',
      'price': 444900,
      'listingType': 'Standard',
      'listedDate': '2025-08-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:22:33.772Z',
      'lastSeenDate': '2026-02-14T11:24:19.718Z',
      'daysOnMarket': 193,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10579211',
      'listingAgent': {
        'name': 'Kelly + Co',
        'phone': '4046206548',
        'email': 'isateam@kellycohomes.com',
        'website': 'http://www.kellycohomes.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta - East Cobb',
        'phone': '7705090700',
        'email': 'klrw178@kw.com;jima@kw.com',
        'website': 'http://www.atlantanorthkw.com/'
      },
      'history': {
        '2025-08-06': {
          'event': 'Sale Listing',
          'price': 444900,
          'listingType': 'Standard',
          'listedDate': '2025-08-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 193
        }
      }
    },
    {
      'id': '3324-Peachtree-Rd-NE,-Unit-1518,-Atlanta,-GA-30326',
      'formattedAddress': '3324 Peachtree Rd NE, Unit 1518, Atlanta, GA 30326',
      'addressLine1': '3324 Peachtree Rd NE',
      'addressLine2': 'Unit 1518',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84597,
      'longitude': -84.369381,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1223,
      'lotSize': 1224,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 743
      },
      'status': 'Active',
      'price': 419990,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.717Z',
      'daysOnMarket': 194,
      'mlsName': 'FMLS',
      'mlsNumber': '7626192',
      'listingAgent': {
        'name': 'Jigeesha Malhotra',
        'phone': '4044193500',
        'email': 'jigeesha@gmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Rlty-Ptree Rd',
        'phone': '4044193500',
        'email': 'lynnlecraw@kw.com',
        'website': 'peachtreeroad.yourkwoffice.com/mcj/user/homepagegetaction.do'
      },
      'history': {
        '2025-04-14': {
          'event': 'Sale Listing',
          'price': 450000,
          'listingType': 'Standard',
          'listedDate': '2025-04-14T00:00:00.000Z',
          'removedDate': '2025-08-01T00:00:00.000Z',
          'daysOnMarket': 109
        },
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 419990,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '2772-S-Clark-Dr,-Atlanta,-GA-30344',
      'formattedAddress': '2772 S Clark Dr, Atlanta, GA 30344',
      'addressLine1': '2772 S Clark Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.679821,
      'longitude': -84.455839,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3,
      'squareFootage': 2360,
      'lotSize': 12589,
      'yearBuilt': 1958,
      'status': 'Active',
      'price': 349999,
      'listingType': 'Standard',
      'listedDate': '2025-08-05T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.717Z',
      'daysOnMarket': 194,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10578310',
      'listingAgent': {
        'name': 'Roosevelt Robinson',
        'phone': '4048432500',
        'email': 'roosevelt.robinson@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-08-05': {
          'event': 'Sale Listing',
          'price': 349999,
          'listingType': 'Standard',
          'listedDate': '2025-08-05T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 194
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-2107,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 2107, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 2107',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760271,
      'longitude': -84.381369,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 931,
      'lotSize': 932,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 931
      },
      'status': 'Active',
      'price': 175000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-20T19:11:37.161Z',
      'lastSeenDate': '2026-02-14T11:24:19.716Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7626537',
      'listingAgent': {
        'name': 'Null Monarch Realty Group',
        'phone': '7706966278',
        'email': 'hello@monarchrealtypartners.com'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 175000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '510-Winton-Ter-NE,-Atlanta,-GA-30308',
      'formattedAddress': '510 Winton Ter NE, Atlanta, GA 30308',
      'addressLine1': '510 Winton Ter NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.768607,
      'longitude': -84.370518,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1050,
      'lotSize': 4008,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 589900,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.716Z',
      'daysOnMarket': 192,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10579830',
      'listingAgent': {
        'name': 'Antonio Nivar',
        'phone': '4048444198',
        'email': 'antonionivar@gmail.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Brookhaven/Dunwoody',
        'phone': '4048444198',
        'email': 'dunwoody@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 589900,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '215-Piedmont-Ave-NE,-Apt-2108,-Atlanta,-GA-30308',
      'formattedAddress': '215 Piedmont Ave NE, Apt 2108, Atlanta, GA 30308',
      'addressLine1': '215 Piedmont Ave NE',
      'addressLine2': 'Apt 2108',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760304,
      'longitude': -84.381896,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 850,
      'lotSize': 849,
      'yearBuilt': 1963,
      'hoa': {
        'fee': 850
      },
      'status': 'Active',
      'price': 175000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.716Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7626571',
      'listingAgent': {
        'name': 'Null Monarch Realty Group',
        'phone': '7706966278',
        'email': 'hello@monarchrealtypartners.com'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 175000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '170-Boulevard-SE,-Apt-H131,-Atlanta,-GA-30312',
      'formattedAddress': '170 Boulevard SE, Apt H131, Atlanta, GA 30312',
      'addressLine1': '170 Boulevard SE',
      'addressLine2': 'Apt H131',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.751179,
      'longitude': -84.368917,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1636,
      'lotSize': 1154,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 700
      },
      'status': 'Active',
      'price': 499000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-05-12T15:58:56.362Z',
      'lastSeenDate': '2026-02-14T11:24:19.715Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7628323',
      'listingAgent': {
        'name': 'David H. Wilson',
        'phone': '4046686621',
        'email': 'david.h.wilson@gmail.com',
        'website': 'http://www.hamiltonwilson.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2024-09-12': {
          'event': 'Sale Listing',
          'price': 519999,
          'listingType': 'Standard',
          'listedDate': '2024-09-12T00:00:00.000Z',
          'removedDate': '2024-12-12T00:00:00.000Z',
          'daysOnMarket': 91
        },
        '2025-02-16': {
          'event': 'Sale Listing',
          'price': 545000,
          'listingType': 'Standard',
          'listedDate': '2025-02-16T00:00:00.000Z',
          'removedDate': '2025-03-31T00:00:00.000Z',
          'daysOnMarket': 43
        },
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 499000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '44-Peachtree-Pl-NE,-Unit-1924,-Atlanta,-GA-30309',
      'formattedAddress': '44 Peachtree Pl NE, Unit 1924, Atlanta, GA 30309',
      'addressLine1': '44 Peachtree Pl NE',
      'addressLine2': 'Unit 1924',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780059,
      'longitude': -84.388114,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1091,
      'lotSize': 1089,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 479
      },
      'status': 'Active',
      'price': 429000,
      'listingType': 'Standard',
      'listedDate': '2025-08-06T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.714Z',
      'daysOnMarket': 193,
      'mlsName': 'FMLS',
      'mlsNumber': '7623570',
      'listingAgent': {
        'name': 'Teresa Lynne',
        'phone': '6785213040',
        'email': 'teresa@teresasellsatl.com',
        'website': 'https://www.teresasellsatl.com/'
      },
      'listingOffice': {
        'name': 'House Of Modern Realty, LLC',
        'phone': '4047694149',
        'email': 'hello@houseofmodernrealty.com'
      },
      'history': {
        '2025-08-06': {
          'event': 'Sale Listing',
          'price': 429000,
          'listingType': 'Standard',
          'listedDate': '2025-08-06T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 193
        }
      }
    },
    {
      'id': '1105-Pine-Heights-Dr-NE,-Atlanta,-GA-30324',
      'formattedAddress': '1105 Pine Heights Dr NE, Atlanta, GA 30324',
      'addressLine1': '1105 Pine Heights Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.828599,
      'longitude': -84.355424,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1504,
      'lotSize': 1503,
      'yearBuilt': 1986,
      'hoa': {
        'fee': 636
      },
      'status': 'Active',
      'price': 279900,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:24:19.712Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7628777',
      'listingAgent': {
        'name': 'Gary Li',
        'phone': '7705685270',
        'email': 'libochen@outlook.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-05-28': {
          'event': 'Sale Listing',
          'price': 289900,
          'listingType': 'Standard',
          'listedDate': '2025-05-28T00:00:00.000Z',
          'removedDate': '2025-07-31T00:00:00.000Z',
          'daysOnMarket': 64
        },
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 279900,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': 'County-Line-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': 'County Line Rd SW, Atlanta, GA 30331',
      'addressLine1': 'County Line Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.685389,
      'longitude': -84.535212,
      'propertyType': 'Land',
      'lotSize': 37462,
      'status': 'Active',
      'price': 55000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-12-31T10:42:15.954Z',
      'lastSeenDate': '2026-02-14T11:22:49.061Z',
      'daysOnMarket': 192,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10579951',
      'listingAgent': {
        'name': 'Sharon Spencer',
        'phone': '6788949744',
        'email': 'welladdressedrealestate@gmail.com',
        'website': 'http://welladdressedhomes.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'kpalmer@phpatlanta.com',
        'website': 'https://www.palmerhouseproperties.com'
      },
      'history': {
        '2021-12-31': {
          'event': 'Sale Listing',
          'price': 64000,
          'listingType': 'Standard',
          'listedDate': '2021-12-31T00:00:00.000Z',
          'removedDate': '2025-05-13T00:00:00.000Z',
          'daysOnMarket': 1229
        },
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 55000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '1985-Handley-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1985 Handley Ave SW, Atlanta, GA 30310',
      'addressLine1': '1985 Handley Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.735224,
      'longitude': -84.453247,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1144,
      'lotSize': 7501,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 209000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.061Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7627025',
      'listingAgent': {
        'name': 'Joelle Ballariel',
        'phone': '2817537308',
        'email': 'joelle.ballariel@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 209000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '4503-Rio-Grande-Rd-SW,-Atlanta,-GA-30331',
      'formattedAddress': '4503 Rio Grande Rd SW, Atlanta, GA 30331',
      'addressLine1': '4503 Rio Grande Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.692267,
      'longitude': -84.535564,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1075,
      'lotSize': 13599,
      'yearBuilt': 1963,
      'status': 'Active',
      'price': 194000,
      'listingType': 'Standard',
      'listedDate': '2025-08-07T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.058Z',
      'daysOnMarket': 192,
      'mlsName': 'FMLS',
      'mlsNumber': '7626027',
      'listingAgent': {
        'name': 'Joelle Ballariel',
        'phone': '2817537308',
        'email': 'joelle.ballariel@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-08-07': {
          'event': 'Sale Listing',
          'price': 194000,
          'listingType': 'Standard',
          'listedDate': '2025-08-07T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 192
        }
      }
    },
    {
      'id': '619-Camelot-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '619 Camelot Dr, Atlanta, GA 30349',
      'addressLine1': '619 Camelot Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.603159,
      'longitude': -84.475875,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1282,
      'lotSize': 1281,
      'yearBuilt': 1978,
      'hoa': {
        'fee': 500
      },
      'status': 'Active',
      'price': 54000,
      'listingType': 'Standard',
      'listedDate': '2025-08-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.055Z',
      'daysOnMarket': 191,
      'mlsName': 'FMLS',
      'mlsNumber': '7629122',
      'listingAgent': {
        'name': 'Michelle Grace Lynch',
        'phone': '4704755066',
        'email': 'michelle.lynch@kw.com',
        'website': 'https://lynchmichel.georgiamls.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Consultants',
        'phone': '6782874800',
        'email': 'klrw367@kw.com',
        'website': 'http://www.kwroswell.com'
      },
      'history': {
        '2025-08-08': {
          'event': 'Sale Listing',
          'price': 54000,
          'listingType': 'Standard',
          'listedDate': '2025-08-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 191
        }
      }
    },
    {
      'id': '5411-Louis-Xiv-Ln,-Atlanta,-GA-30349',
      'formattedAddress': '5411 Louis Xiv Ln, Atlanta, GA 30349',
      'addressLine1': '5411 Louis Xiv Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.608408,
      'longitude': -84.458671,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1815,
      'lotSize': 12720,
      'yearBuilt': 1968,
      'status': 'Active',
      'price': 254000,
      'listingType': 'Standard',
      'listedDate': '2025-08-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.054Z',
      'daysOnMarket': 191,
      'mlsName': 'FMLS',
      'mlsNumber': '7629056',
      'listingAgent': {
        'name': 'Javier Torres',
        'phone': '6788783888',
        'email': 'javiertorresrealt@gmail.com'
      },
      'listingOffice': {
        'name': 'Villa Realty Group, LLC',
        'phone': '7864516729',
        'email': 'juan@villarealtyusa.com'
      },
      'history': {
        '2025-02-27': {
          'event': 'Sale Listing',
          'price': 155000,
          'listingType': 'Standard',
          'listedDate': '2025-02-27T00:00:00.000Z',
          'removedDate': '2025-05-07T00:00:00.000Z',
          'daysOnMarket': 69
        },
        '2025-08-08': {
          'event': 'Sale Listing',
          'price': 254000,
          'listingType': 'Standard',
          'listedDate': '2025-08-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 191
        }
      }
    },
    {
      'id': '886-Stone-Crest-Rd-NE,-Atlanta,-GA-30324',
      'formattedAddress': '886 Stone Crest Rd NE, Atlanta, GA 30324',
      'addressLine1': '886 Stone Crest Rd NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.826612,
      'longitude': -84.351997,
      'propertyType': 'Townhouse',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 2323,
      'lotSize': 1176,
      'yearBuilt': 2018,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 795000,
      'listingType': 'Standard',
      'listedDate': '2025-08-08T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.047Z',
      'daysOnMarket': 191,
      'mlsName': 'FMLS',
      'mlsNumber': '7629820',
      'listingAgent': {
        'name': 'Narender G Reddy',
        'phone': '4048432500',
        'email': '400019.lead@leads.leadrouter.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-08-08': {
          'event': 'Sale Listing',
          'price': 795000,
          'listingType': 'Standard',
          'listedDate': '2025-08-08T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 191
        }
      }
    },
    {
      'id': '2386-Arno-Ct-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2386 Arno Ct NW, Atlanta, GA 30318',
      'addressLine1': '2386 Arno Ct NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.799076,
      'longitude': -84.466132,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 864,
      'lotSize': 9670,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 206000,
      'listingType': 'Standard',
      'listedDate': '2025-08-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-17T14:51:51.110Z',
      'lastSeenDate': '2026-02-14T11:22:49.035Z',
      'daysOnMarket': 188,
      'mlsName': 'FMLS',
      'mlsNumber': '7630617',
      'listingAgent': {
        'name': 'Noel Mwamba',
        'phone': '9149531380',
        'email': 'noel@mwambarealty.com'
      },
      'listingOffice': {
        'name': 'Mwamba Realty Atlanta, Llc',
        'phone': '9149531380',
        'email': 'noel@mwambarealty.com',
        'website': 'www.mwambarealty.com'
      },
      'history': {
        '2024-05-26': {
          'event': 'Sale Listing',
          'price': 215000,
          'listingType': 'Standard',
          'listedDate': '2024-05-26T00:00:00.000Z',
          'removedDate': '2024-12-01T00:00:00.000Z',
          'daysOnMarket': 189
        },
        '2025-08-11': {
          'event': 'Sale Listing',
          'price': 206000,
          'listingType': 'Standard',
          'listedDate': '2025-08-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 188
        }
      }
    },
    {
      'id': '602-Lofty-Ln-SW,-Atlanta,-GA-30331',
      'formattedAddress': '602 Lofty Ln SW, Atlanta, GA 30331',
      'addressLine1': '602 Lofty Ln SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.743716,
      'longitude': -84.50309,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2100,
      'lotSize': 1307,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 250
      },
      'status': 'Active',
      'price': 324500,
      'listingType': 'Standard',
      'listedDate': '2025-08-11T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-11-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.034Z',
      'daysOnMarket': 188,
      'mlsName': 'FMLS',
      'mlsNumber': '7629861',
      'listingAgent': {
        'name': 'Dung Montilla',
        'phone': '9436008411',
        'email': 'teamascendingrealty@gmail.com'
      },
      'listingOffice': {
        'name': 'The Official Ascending Realty, LLC',
        'phone': '4703293079',
        'email': 'teamascendingrealty@gmail.com'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 320000,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': '2025-07-31T00:00:00.000Z',
          'daysOnMarket': 70
        },
        '2025-08-11': {
          'event': 'Sale Listing',
          'price': 324500,
          'listingType': 'Standard',
          'listedDate': '2025-08-11T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 188
        }
      }
    },
    {
      'id': '4263-Notting-Hill-Dr-SW,-Unit-67,-Atlanta,-GA-30331',
      'formattedAddress': '4263 Notting Hill Dr SW, Unit 67, Atlanta, GA 30331',
      'addressLine1': '4263 Notting Hill Dr SW',
      'addressLine2': 'Unit 67',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.694439,
      'longitude': -84.535934,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1467,
      'lotSize': 1220,
      'yearBuilt': 2025,
      'hoa': {
        'fee': 40
      },
      'status': 'Active',
      'price': 270990,
      'listingType': 'New Construction',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.033Z',
      'daysOnMarket': 187,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10582347',
      'listingAgent': {
        'name': 'Shavon Shavers',
        'phone': '4704585167',
        'email': 'shavonshavers@kw.com'
      },
      'listingOffice': {
        'name': 'Rockhaven Realty',
        'phone': '4707304131',
        'email': 'rockhaven.realty@rockhavenga.com'
      },
      'history': {
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 270990,
          'listingType': 'New Construction',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '3820-Roswell-Rd-NE,-Unit-1004,-Atlanta,-GA-30342',
      'formattedAddress': '3820 Roswell Rd NE, Unit 1004, Atlanta, GA 30342',
      'addressLine1': '3820 Roswell Rd NE',
      'addressLine2': 'Unit 1004',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.858759,
      'longitude': -84.381532,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 964,
      'lotSize': 9670,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 533
      },
      'status': 'Active',
      'price': 354999,
      'listingType': 'Standard',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.030Z',
      'daysOnMarket': 187,
      'mlsName': 'FMLS',
      'mlsNumber': '7631047',
      'listingAgent': {
        'name': 'Kathy Chapman',
        'phone': '4043889577',
        'email': 'kathy.chapman@harrynorman.com',
        'website': 'http://kathychapman.harrynorman.com'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Buckhead',
        'phone': '4042334142',
        'email': 'bh.office@harrynorman.com',
        'website': 'https://www.harrynorman.com/bio/buckhead'
      },
      'history': {
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 354999,
          'listingType': 'Standard',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '1133-Avondale-Ave-SE,-Atlanta,-GA-30312',
      'formattedAddress': '1133 Avondale Ave SE, Atlanta, GA 30312',
      'addressLine1': '1133 Avondale Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723628,
      'longitude': -84.363165,
      'propertyType': 'Land',
      'lotSize': 44,
      'status': 'Active',
      'price': 259900,
      'listingType': 'Standard',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.028Z',
      'daysOnMarket': 187,
      'mlsName': 'FMLS',
      'mlsNumber': '7631064',
      'listingAgent': {
        'name': 'James H Spence',
        'phone': '6789073474',
        'email': '492750705@default.com'
      },
      'listingOffice': {
        'name': 'NorthGroup Real Estate',
        'phone': '9804471771',
        'email': 'lindy@northgroupre.com',
        'website': 'www.northgroupre.com'
      },
      'history': {
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 259900,
          'listingType': 'Standard',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '1023-Juniper-St-NE,-Unit-203,-Atlanta,-GA-30309',
      'formattedAddress': '1023 Juniper St NE, Unit 203, Atlanta, GA 30309',
      'addressLine1': '1023 Juniper St NE',
      'addressLine2': 'Unit 203',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.782622,
      'longitude': -84.382132,
      'propertyType': 'Single Family',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 898,
      'lotSize': 915,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 334
      },
      'status': 'Active',
      'price': 325000,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-11-19T17:31:16.979Z',
      'lastSeenDate': '2026-02-14T11:22:49.010Z',
      'daysOnMarket': 185,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10584494',
      'listingAgent': {
        'name': 'Brian Olivard',
        'phone': '4704424885',
        'email': 'brian@realtallrealestate.com'
      },
      'listingOffice': {
        'name': 'FIV Realty Co',
        'phone': '4704424885',
        'email': 'brian@realtallrealestate.com'
      },
      'history': {
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 325000,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '170-Boulevard-SE,-Apt-H314,-Atlanta,-GA-30312',
      'formattedAddress': '170 Boulevard SE, Apt H314, Atlanta, GA 30312',
      'addressLine1': '170 Boulevard SE',
      'addressLine2': 'Apt H314',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.751179,
      'longitude': -84.368917,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1008,
      'lotSize': 1002,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 456
      },
      'status': 'Active',
      'price': 359000,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-16T15:19:05.734Z',
      'lastSeenDate': '2026-02-14T11:22:49.009Z',
      'daysOnMarket': 186,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583322',
      'listingAgent': {
        'name': 'Hallie Chasen',
        'phone': '4042714635',
        'email': 'hallie.chasen@gmail.com',
        'website': 'http://www.coldwellbankeratlanta.com/hallie.chasen'
      },
      'listingOffice': {
        'name': 'Chapman Hall Premier, Realtors',
        'phone': '7704547840',
        'email': 'charlotte@chapmanhallrealtors.com',
        'website': 'www.chrpremier.com'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 359000,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '59-Brown-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '59 Brown Ave SE, Atlanta, GA 30315',
      'addressLine1': '59 Brown Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.71338,
      'longitude': -84.386331,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1656,
      'lotSize': 7492,
      'yearBuilt': 2004,
      'status': 'Active',
      'price': 358000,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.006Z',
      'daysOnMarket': 186,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583260',
      'listingAgent': {
        'name': 'Aileen Miller',
        'phone': '7703966696',
        'email': 'aileen.miller@coldwellbankeratlanta.com',
        'website': 'http://www.homesbyaileen.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4042621234',
        'email': 'debra.bradley@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/buckhead/oid_3218/'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 358000,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '800-Peachtree-St-NE,-Apt-1319,-Atlanta,-GA-30308',
      'formattedAddress': '800 Peachtree St NE, Apt 1319, Atlanta, GA 30308',
      'addressLine1': '800 Peachtree St NE',
      'addressLine2': 'Apt 1319',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.776787,
      'longitude': -84.38523,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1181,
      'lotSize': 1176,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 710
      },
      'status': 'Active',
      'price': 379900,
      'listingType': 'Standard',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.005Z',
      'daysOnMarket': 187,
      'mlsName': 'FMLS',
      'mlsNumber': '7631289',
      'listingAgent': {
        'name': 'Mark Kercher',
        'phone': '4043538003',
        'email': 'markkercher@ansleyatlanta.com',
        'website': 'http://www.markkercherrealty.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate | Christie\'s International Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyatlanta.com'
      },
      'history': {
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 389999,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': '2025-08-07T00:00:00.000Z',
          'daysOnMarket': 77
        },
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 379900,
          'listingType': 'Standard',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '976-Linam-Ave-SE,-Atlanta,-GA-30315',
      'formattedAddress': '976 Linam Ave SE, Atlanta, GA 30315',
      'addressLine1': '976 Linam Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.72789,
      'longitude': -84.385823,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1181,
      'lotSize': 5998,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 489900,
      'listingType': 'Standard',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-09-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.003Z',
      'daysOnMarket': 187,
      'mlsName': 'FMLS',
      'mlsNumber': '7631159',
      'listingAgent': {
        'name': 'Dan Thorp',
        'phone': '6785200563',
        'email': 'danthorprealtor@gmail.com',
        'website': 'http://www.danthorprealestate.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 489900,
          'listingType': 'Standard',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '26204-Plantation-Dr-NE,-Atlanta,-GA-30324',
      'formattedAddress': '26204 Plantation Dr NE, Atlanta, GA 30324',
      'addressLine1': '26204 Plantation Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.83586,
      'longitude': -84.354238,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1720,
      'lotSize': 1721,
      'yearBuilt': 1985,
      'hoa': {
        'fee': 770
      },
      'status': 'Active',
      'price': 344900,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.002Z',
      'daysOnMarket': 186,
      'mlsName': 'FMLS',
      'mlsNumber': '7631638',
      'listingAgent': {
        'name': 'Gwendolyn Mckinley',
        'phone': '7703747870',
        'email': 'gwenmckinley@bellsouth.net'
      },
      'listingOffice': {
        'name': 'Gg Sells Atlanta',
        'phone': '7706541283',
        'email': 'gwenmckinley@bellsouth.net',
        'website': 'www.gwenmckinley.com'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 344900,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '3857-Randall-Mill-Rd-NW,-Atlanta,-GA-30327',
      'formattedAddress': '3857 Randall Mill Rd NW, Atlanta, GA 30327',
      'addressLine1': '3857 Randall Mill Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.860539,
      'longitude': -84.424045,
      'propertyType': 'Single Family',
      'bedrooms': 8,
      'bathrooms': 10,
      'squareFootage': 16965,
      'lotSize': 100188,
      'yearBuilt': 1999,
      'status': 'Active',
      'price': 6000000,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T02:29:10.389Z',
      'lastSeenDate': '2026-02-14T11:22:49.001Z',
      'daysOnMarket': 186,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583773',
      'listingAgent': {
        'name': 'Briana Singleton',
        'phone': '3106940970'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-06-18': {
          'event': 'Sale Listing',
          'price': 5900000,
          'listingType': 'Standard',
          'listedDate': '2025-06-18T00:00:00.000Z',
          'removedDate': '2025-06-21T00:00:00.000Z',
          'daysOnMarket': 3
        },
        '2025-06-19': {
          'event': 'Sale Listing',
          'price': 5900000,
          'listingType': 'Standard',
          'listedDate': '2025-06-19T00:00:00.000Z',
          'removedDate': '2025-08-01T00:00:00.000Z',
          'daysOnMarket': 43
        },
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 6000000,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '970-Sidney-Marcus-Blvd-NE,-Unit-2115,-Atlanta,-GA-30324',
      'formattedAddress': '970 Sidney Marcus Blvd NE, Unit 2115, Atlanta, GA 30324',
      'addressLine1': '970 Sidney Marcus Blvd NE',
      'addressLine2': 'Unit 2115',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.825326,
      'longitude': -84.356427,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 840,
      'lotSize': 841,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 340
      },
      'status': 'Active',
      'price': 199900,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-03-14T14:29:00.333Z',
      'lastSeenDate': '2026-02-14T11:22:49.000Z',
      'daysOnMarket': 186,
      'mlsName': 'FMLS',
      'mlsNumber': '7625007',
      'listingAgent': {
        'name': 'Patter Byrne',
        'phone': '4048250880',
        'email': 'patterbyrne@gmail.com',
        'website': 'http://patterbyrne.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Intown',
        'phone': '4045413500',
        'email': 'klrw226@kw.com',
        'website': 'https://kwintown.com/'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 199900,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '259-14th-St-NE,-Unit-301,-Atlanta,-GA-30309',
      'formattedAddress': '259 14th St NE, Unit 301, Atlanta, GA 30309',
      'addressLine1': '259 14th St NE',
      'addressLine2': 'Unit 301',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.786236,
      'longitude': -84.379082,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 982,
      'lotSize': 1002,
      'yearBuilt': 1940,
      'hoa': {
        'fee': 325
      },
      'status': 'Active',
      'price': 409900,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:49.000Z',
      'daysOnMarket': 185,
      'mlsName': 'FMLS',
      'mlsNumber': '7632449',
      'listingAgent': {
        'name': 'David Juliao',
        'phone': '6783620747',
        'email': 'davidjuliao@msn.com',
        'website': 'http://raatl.com/agents/david-juliao/'
      },
      'listingOffice': {
        'name': 'REALTY ASSOCIATES OF ATLANTA LLC',
        'phone': '4042358900',
        'email': 'kwright@realtyassociatesofatlanta.com',
        'website': 'www.realtyassociatesofatlanta.com'
      },
      'history': {
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 409900,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '1291-Redford-Dr-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1291 Redford Dr SE, Atlanta, GA 30315',
      'addressLine1': '1291 Redford Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.686989,
      'longitude': -84.35406,
      'propertyType': 'Land',
      'lotSize': 6490,
      'status': 'Active',
      'price': 21000,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.999Z',
      'daysOnMarket': 180,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587174',
      'listingAgent': {
        'name': 'Shana Arnold',
        'phone': '4049143769',
        'email': 'shana@adamsrealtors.com',
        'website': 'https://www.adamsrealtors.com/agent-bio-shana-arnold'
      },
      'listingOffice': {
        'name': 'Adams Realtors',
        'phone': '4046881222',
        'email': 'wtadams@adamsrealtors.com',
        'website': 'www.wtadams.com'
      },
      'history': {
        '2024-06-11': {
          'event': 'Sale Listing',
          'price': 34900,
          'listingType': 'Standard',
          'listedDate': '2024-06-11T00:00:00.000Z',
          'removedDate': '2025-01-02T00:00:00.000Z',
          'daysOnMarket': 205
        },
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 21000,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '400-17th-St-NW,-Unit-2027,-Atlanta,-GA-30363',
      'formattedAddress': '400 17th St NW, Unit 2027, Atlanta, GA 30363',
      'addressLine1': '400 17th St NW',
      'addressLine2': 'Unit 2027',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30363',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.789229,
      'longitude': -84.402016,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 1080,
      'lotSize': 1080,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 478
      },
      'status': 'Active',
      'price': 285000,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-12-31T13:09:57.372Z',
      'lastSeenDate': '2026-02-14T11:22:48.998Z',
      'daysOnMarket': 185,
      'mlsName': 'FMLS',
      'mlsNumber': '7631649',
      'listingAgent': {
        'name': 'Santhosh Chandrasekaran',
        'phone': '4049561555',
        'email': 'santhosh.chandrasekaran@clhomes.com'
      },
      'listingOffice': {
        'name': 'CRYE-LEIKE, REALTORS',
        'phone': '6788451200',
        'email': 'cheryl.duvall@crye-leike.com',
        'website': 'www.crye-leike.com'
      },
      'history': {
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 285000,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '1770-Temple-Ave,-Atlanta,-GA-30337',
      'formattedAddress': '1770 Temple Ave, Atlanta, GA 30337',
      'addressLine1': '1770 Temple Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30337',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.655506,
      'longitude': -84.446905,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4.5,
      'squareFootage': 1741,
      'lotSize': 11400,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 373000,
      'listingType': 'Standard',
      'listedDate': '2025-08-12T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.997Z',
      'daysOnMarket': 187,
      'mlsName': 'FMLS',
      'mlsNumber': '7629907',
      'listingAgent': {
        'name': 'Derrick Hymon',
        'phone': '7703156163',
        'email': 'derrickhymonrealest@gmail.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty Biz',
        'phone': '7704955050',
        'email': 'jabarnhart@vpradmin.com',
        'website': 'www.virtualpropertiesrealty.biz'
      },
      'history': {
        '2025-08-12': {
          'event': 'Sale Listing',
          'price': 373000,
          'listingType': 'Standard',
          'listedDate': '2025-08-12T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 187
        }
      }
    },
    {
      'id': '3270-Connally-St,-Atlanta,-GA-30337',
      'formattedAddress': '3270 Connally St, Atlanta, GA 30337',
      'addressLine1': '3270 Connally St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30337',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.666877,
      'longitude': -84.448668,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 3018,
      'lotSize': 32670,
      'yearBuilt': 1966,
      'status': 'Active',
      'price': 699000,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.996Z',
      'daysOnMarket': 185,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583963',
      'listingAgent': {
        'name': 'Christine Aiken & Alex Smith Meier',
        'phone': '4047356027',
        'email': 'info@chrisandalexrealestate.com',
        'website': 'http://chrisandalexatl.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Metro Atlanta',
        'phone': '4045645560',
        'email': 'dammann@kw.com',
        'website': 'http://kwdecatur.com'
      },
      'history': {
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '1716-Browning-St-SW,-Atlanta,-GA-30314',
      'formattedAddress': '1716 Browning St SW, Atlanta, GA 30314',
      'addressLine1': '1716 Browning St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.752303,
      'longitude': -84.443312,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 2096,
      'lotSize': 7501,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 459000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-05-30T11:54:35.325Z',
      'lastSeenDate': '2026-02-14T11:22:48.995Z',
      'daysOnMarket': 186,
      'mlsName': 'FMLS',
      'mlsNumber': '7630538',
      'listingAgent': {
        'name': 'Celine Higgins',
        'phone': '6789159422',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'simplylistatlanta.com'
      },
      'listingOffice': {
        'name': 'Simply List',
        'phone': '4703091545',
        'email': 'transactionbroker@simplylistatlanta.com',
        'website': 'http://www.simplylistatlanta.com'
      },
      'history': {
        '2025-04-05': {
          'event': 'Sale Listing',
          'price': 449900,
          'listingType': 'Standard',
          'listedDate': '2025-04-05T00:00:00.000Z',
          'removedDate': '2025-07-15T00:00:00.000Z',
          'daysOnMarket': 101
        },
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 459000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '400-W-Peachtree-St-NW,-Unit-2010,-Atlanta,-GA-30308',
      'formattedAddress': '400 W Peachtree St NW, Unit 2010, Atlanta, GA 30308',
      'addressLine1': '400 W Peachtree St NW',
      'addressLine2': 'Unit 2010',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765128,
      'longitude': -84.388189,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 730,
      'lotSize': 732,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 365
      },
      'status': 'Active',
      'price': 210000,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-21T22:56:16.007Z',
      'lastSeenDate': '2026-02-14T11:22:48.995Z',
      'daysOnMarket': 185,
      'mlsName': 'FMLS',
      'mlsNumber': '7623673',
      'listingAgent': {
        'name': 'Marc Oppenheimer',
        'phone': '6782966550',
        'email': 'oppy@atlantareo.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Brookhaven/Dunwoody',
        'phone': '4048444198',
        'email': 'dunwoody@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2024-09-23': {
          'event': 'Sale Listing',
          'price': 274000,
          'listingType': 'Standard',
          'listedDate': '2024-09-23T00:00:00.000Z',
          'removedDate': '2024-12-31T00:00:00.000Z',
          'daysOnMarket': 99
        },
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 210000,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '785-Sw-Celeste-Ln,-Atlanta,-GA-30331',
      'formattedAddress': '785 Sw Celeste Ln, Atlanta, GA 30331',
      'addressLine1': '785 Sw Celeste Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.741135,
      'longitude': -84.506628,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1534,
      'lotSize': 1612,
      'yearBuilt': 2003,
      'status': 'Active',
      'price': 229900,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.990Z',
      'daysOnMarket': 186,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583705',
      'listingAgent': {
        'name': 'Dawn Fink'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Partners - Stockbridge',
        'phone': '7706920888',
        'email': 'frontdesk324@kw.com',
        'website': 'http://kwstockbridge.yourkwoffice.com/'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 229900,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '1129-Windsor-St-SW,-Unit-2,-Atlanta,-GA-30310',
      'formattedAddress': '1129 Windsor St SW, Unit 2, Atlanta, GA 30310',
      'addressLine1': '1129 Windsor St SW',
      'addressLine2': 'Unit 2',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.724067,
      'longitude': -84.398662,
      'propertyType': 'Multi-Family',
      'lotSize': 5009,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 240000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.990Z',
      'daysOnMarket': 184,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585042',
      'listingAgent': {
        'name': 'Joel Madden',
        'phone': '4043534500',
        'email': 'joel.g.madden@gmail.com',
        'website': 'https://joelmadden.kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Atl. Midtown',
        'phone': '4046043101',
        'email': 'rick@rickhale.com',
        'website': 'atlantamidtown.yourkwoffice.com'
      },
      'history': {
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 240000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '7632-Auden-Trl,-Atlanta,-GA-30350',
      'formattedAddress': '7632 Auden Trl, Atlanta, GA 30350',
      'addressLine1': '7632 Auden Trl',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30350',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.963398,
      'longitude': -84.350094,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 4200,
      'lotSize': 18408,
      'yearBuilt': 1978,
      'hoa': {
        'fee': 58
      },
      'status': 'Active',
      'price': 775000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.989Z',
      'daysOnMarket': 184,
      'mlsName': 'FMLS',
      'mlsNumber': '7632240',
      'listingAgent': {
        'name': 'Michael Schultz',
        'phone': '2197417449',
        'email': 'michaelsellsatl@gmail.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '7704427300',
        'email': 'info@atlantafinehomes.com',
        'website': 'www.sothebysrealty.com/atlantafinehomessir/eng'
      },
      'history': {
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 775000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-18L,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 18L, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 18L',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 609,
      'lotSize': 610,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 149900,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.988Z',
      'daysOnMarket': 186,
      'mlsName': 'FMLS',
      'mlsNumber': '7631902',
      'listingAgent': {
        'name': 'Sarah Choe',
        'phone': '4044534989',
        'email': '4989home@gmail.com'
      },
      'listingOffice': {
        'name': 'Realty One, Llc.',
        'phone': '4044534989',
        'email': '4989home@gmail.com'
      },
      'history': {
        '2024-08-08': {
          'event': 'Sale Listing',
          'price': 199000,
          'listingType': 'Standard',
          'listedDate': '2024-08-08T00:00:00.000Z',
          'removedDate': '2025-05-08T00:00:00.000Z',
          'daysOnMarket': 273
        },
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '9035-River,-Run,-Atlanta,-GA-30350',
      'formattedAddress': '9035 River, Run, Atlanta, GA 30350',
      'addressLine1': '9035 River',
      'addressLine2': 'Run',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30350',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.999643,
      'longitude': -84.35734,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 5,
      'squareFootage': 7384,
      'lotSize': 70567,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 85
      },
      'status': 'Active',
      'price': 1299000,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-06T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.987Z',
      'daysOnMarket': 186,
      'mlsName': 'FMLS',
      'mlsNumber': '7631826',
      'listingAgent': {
        'name': 'Teri Frye',
        'phone': '6784284281',
        'email': 'teri@fryeteam.com',
        'website': 'http://www.fryeteam.com/'
      },
      'listingOffice': {
        'name': 'The Rezerve, LLC',
        'phone': '7702999529',
        'email': 'broker@therezerve.com'
      },
      'history': {
        '2024-06-05': {
          'event': 'Sale Listing',
          'price': 1200000,
          'listingType': 'Standard',
          'listedDate': '2024-06-05T00:00:00.000Z',
          'removedDate': '2024-12-03T00:00:00.000Z',
          'daysOnMarket': 181
        },
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 1299000,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '180-Elm-St-SW,-Atlanta,-GA-30314',
      'formattedAddress': '180 Elm St SW, Atlanta, GA 30314',
      'addressLine1': '180 Elm St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.759541,
      'longitude': -84.409126,
      'propertyType': 'Land',
      'lotSize': 3964,
      'status': 'Active',
      'price': 200000,
      'listingType': 'Standard',
      'listedDate': '2025-08-13T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.987Z',
      'daysOnMarket': 186,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10583361',
      'listingAgent': {
        'name': 'Brandon Hawthorne',
        'phone': '6783927327',
        'email': 'b.hawthorne@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Signature Partners',
        'phone': '6786311700',
        'email': 'lynndoty@kw.com',
        'website': 'http://westcobb.yourkwoffice.com/'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 200000,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 186
        }
      }
    },
    {
      'id': '72-Ivy-Pkwy-NE,-Atlanta,-GA-30342',
      'formattedAddress': '72 Ivy Pkwy NE, Atlanta, GA 30342',
      'addressLine1': '72 Ivy Pkwy NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.857656,
      'longitude': -84.37844,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1632,
      'lotSize': 1655,
      'yearBuilt': 1972,
      'hoa': {
        'fee': 466
      },
      'status': 'Active',
      'price': 439000,
      'listingType': 'Standard',
      'listedDate': '2025-08-14T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-04-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.986Z',
      'daysOnMarket': 185,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10584284',
      'listingAgent': {
        'name': 'Salimeh Evjen',
        'phone': '3606897525',
        'email': 'salimeh@hotmail.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Brookhaven/Dunwoody',
        'phone': '4048444198',
        'email': 'dunwoody@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-04-18': {
          'event': 'Sale Listing',
          'price': 449000,
          'listingType': 'Standard',
          'listedDate': '2025-04-18T00:00:00.000Z',
          'removedDate': '2025-06-07T00:00:00.000Z',
          'daysOnMarket': 50
        },
        '2025-08-14': {
          'event': 'Sale Listing',
          'price': 439000,
          'listingType': 'Standard',
          'listedDate': '2025-08-14T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 185
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-2006,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 2006, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 2006',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1228,
      'lotSize': 1220,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 856
      },
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.985Z',
      'daysOnMarket': 184,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585584',
      'listingAgent': {
        'name': 'John Marino',
        'phone': '6784382193',
        'email': 'marino142@gmail.com',
        'website': 'fathamthegoodlife.com'
      },
      'listingOffice': {
        'name': 'Sperry Brokerage Services',
        'phone': '6783327838',
        'email': 'terri@sperryops.com'
      },
      'history': {
        '2025-02-07': {
          'event': 'Sale Listing',
          'price': 315000,
          'listingType': 'Standard',
          'listedDate': '2025-02-07T00:00:00.000Z',
          'removedDate': '2025-06-19T00:00:00.000Z',
          'daysOnMarket': 132
        },
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '2255-Peachtree-Rd-NE,-Unit-322,-Atlanta,-GA-30309',
      'formattedAddress': '2255 Peachtree Rd NE, Unit 322, Atlanta, GA 30309',
      'addressLine1': '2255 Peachtree Rd NE',
      'addressLine2': 'Unit 322',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.815792,
      'longitude': -84.390523,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 930,
      'lotSize': 928,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 602
      },
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.985Z',
      'daysOnMarket': 183,
      'mlsName': 'FMLS',
      'mlsNumber': '7633688',
      'listingAgent': {
        'name': 'Kelly Coquerel',
        'phone': '6786530508',
        'email': 'realestate@kellycoquerel.com'
      },
      'listingOffice': {
        'name': 'KDH Realty, LLC',
        'phone': '6785419733',
        'email': 'offers@kdhrealty.com',
        'website': 'http://www.kdhrealty.com'
      },
      'history': {
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '2686-Creek-View-Ter-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2686 Creek View Ter NW, Atlanta, GA 30318',
      'addressLine1': '2686 Creek View Ter NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.792438,
      'longitude': -84.447486,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3,
      'squareFootage': 2383,
      'lotSize': 958,
      'yearBuilt': 2023,
      'hoa': {
        'fee': 520
      },
      'status': 'Active',
      'price': 465000,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.984Z',
      'daysOnMarket': 181,
      'mlsName': 'FMLS',
      'mlsNumber': '7634304',
      'listingAgent': {
        'name': 'Jordan Voica'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Cherokee/Woodstock',
        'phone': '7702402005',
        'email': 'cherokee@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 465000,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '3655-Peachtree-Rd-NE,-Unit-304,-Atlanta,-GA-30319',
      'formattedAddress': '3655 Peachtree Rd NE, Unit 304, Atlanta, GA 30319',
      'addressLine1': '3655 Peachtree Rd NE',
      'addressLine2': 'Unit 304',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30319',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.85371,
      'longitude': -84.356501,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1200,
      'lotSize': 1220,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 698
      },
      'status': 'Active',
      'price': 399900,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.982Z',
      'daysOnMarket': 184,
      'mlsName': 'FMLS',
      'mlsNumber': '7633111',
      'listingAgent': {
        'name': 'Amanda Yu',
        'phone': '4044320068',
        'email': 'miaoyu1011@gmail.com'
      },
      'listingOffice': {
        'name': 'Elite Talents Group Inc',
        'phone': '4044359456',
        'email': 'dseger@bellsouth.net'
      },
      'history': {
        '2025-05-09': {
          'event': 'Sale Listing',
          'price': 439900,
          'listingType': 'Standard',
          'listedDate': '2025-05-09T00:00:00.000Z',
          'removedDate': '2025-07-26T00:00:00.000Z',
          'daysOnMarket': 78
        },
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 399900,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '1150-Moreland-Dr-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1150 Moreland Dr SE, Atlanta, GA 30315',
      'addressLine1': '1150 Moreland Dr SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.709278,
      'longitude': -84.352707,
      'propertyType': 'Land',
      'lotSize': 9300,
      'status': 'Active',
      'price': 55000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.981Z',
      'daysOnMarket': 184,
      'mlsName': 'FMLS',
      'mlsNumber': '7633662',
      'listingAgent': {
        'name': 'David Ajayi',
        'phone': '4703381290',
        'email': 'ajayiassets@gmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty West Atlanta',
        'phone': '4042025372',
        'email': 'klrw1176@kw.com'
      },
      'history': {
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 55000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '1136-Gilbert-St-SE,-Atlanta,-GA-30316',
      'formattedAddress': '1136 Gilbert St SE, Atlanta, GA 30316',
      'addressLine1': '1136 Gilbert St SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723446,
      'longitude': -84.350298,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1000,
      'lotSize': 7200,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 395000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-03-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.978Z',
      'daysOnMarket': 184,
      'mlsName': 'FMLS',
      'mlsNumber': '7628433',
      'listingAgent': {
        'name': 'Jonathan Huff',
        'phone': '4044927803',
        'email': 'team@jonrandy.com',
        'website': 'http://www.jonrandy.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Metro Atlanta',
        'phone': '4045645560',
        'email': 'dammann@kw.com',
        'website': 'http://kwdecatur.com'
      },
      'history': {
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 395000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '3024-Grand-Ave-SW,-Atlanta,-GA-30315',
      'formattedAddress': '3024 Grand Ave SW, Atlanta, GA 30315',
      'addressLine1': '3024 Grand Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.674192,
      'longitude': -84.405857,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1348,
      'lotSize': 10302,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 179900,
      'listingType': 'Standard',
      'listedDate': '2025-08-17T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-29T11:07:27.906Z',
      'lastSeenDate': '2026-02-14T11:22:48.977Z',
      'daysOnMarket': 182,
      'mlsName': 'FMLS',
      'mlsNumber': '7609978',
      'listingAgent': {
        'name': 'Mackenzie Crabtree',
        'phone': '4044587401',
        'email': 'mackenzie.crabtree@gmail.com',
        'website': 'http://mackenziecrabtreerealestate.com'
      },
      'listingOffice': {
        'name': 'MACKENZIE CRABTREE REAL ESTATE',
        'phone': '8434526225',
        'email': 'mackenzie.crabtree@gmail.com',
        'website': 'mackenziecrabtreerealestate.com'
      },
      'history': {
        '2025-08-17': {
          'event': 'Sale Listing',
          'price': 179900,
          'listingType': 'Standard',
          'listedDate': '2025-08-17T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 182
        }
      }
    },
    {
      'id': '1129-Windsor-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1129 Windsor St SW, Atlanta, GA 30310',
      'addressLine1': '1129 Windsor St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.724067,
      'longitude': -84.398662,
      'propertyType': 'Multi-Family',
      'bedrooms': 2,
      'bathrooms': 2,
      'lotSize': 5009,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 240000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-01-04T12:22:47.145Z',
      'lastSeenDate': '2026-02-14T11:22:48.974Z',
      'daysOnMarket': 184,
      'mlsName': 'FMLS',
      'mlsNumber': '7633276',
      'listingAgent': {
        'name': 'Joel Madden',
        'phone': '4042926636',
        'email': '900614.lead.lag.100143642@cendant.leadrouter.com',
        'website': 'http://www.coldwellbankeratlanta.com/search/agentprofile.cfm'
      },
      'listingOffice': {
        'name': 'KELLER WMS RE ATL MIDTOWN',
        'phone': '4046043100',
        'email': 'klrw630@kw.com',
        'website': 'atlantamidtown.yourkwoffice.com'
      },
      'history': {
        '2025-01-14': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-01-14T00:00:00.000Z',
          'removedDate': '2025-03-28T00:00:00.000Z',
          'daysOnMarket': 73
        },
        '2025-05-29': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2025-05-29T00:00:00.000Z',
          'removedDate': '2025-08-01T00:00:00.000Z',
          'daysOnMarket': 64
        },
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 240000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '1423-Graham-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1423 Graham St SW, Atlanta, GA 30310',
      'addressLine1': '1423 Graham St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.715987,
      'longitude': -84.416384,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1376,
      'lotSize': 6490,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 220000,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.972Z',
      'daysOnMarket': 183,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585715',
      'listingAgent': {
        'name': 'Edwin G Alfaro',
        'phone': '7703133632'
      },
      'listingOffice': {
        'name': 'CHAPMAN HALL REALTORS PROF.',
        'phone': '6787300080',
        'email': 'admin@chapmanhallprofessionals.com',
        'website': 'www.chapmanhallprofessionals.com'
      },
      'history': {
        '2025-01-20': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-01-20T00:00:00.000Z',
          'removedDate': '2025-07-20T00:00:00.000Z',
          'daysOnMarket': 181
        },
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '2189-Forrest-Pl-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2189 Forrest Pl NW, Atlanta, GA 30318',
      'addressLine1': '2189 Forrest Pl NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.815546,
      'longitude': -84.469422,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 990,
      'lotSize': 8886,
      'yearBuilt': 2007,
      'status': 'Active',
      'price': 385000,
      'listingType': 'Standard',
      'listedDate': '2025-08-15T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.970Z',
      'daysOnMarket': 184,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585446',
      'listingAgent': {
        'name': 'Ross Sheppard',
        'phone': '7068163675',
        'email': 'ross@austinhillrealty.com'
      },
      'listingOffice': {
        'name': 'Ansley RE|Christie\'s Int\'l RE',
        'phone': '4043136331',
        'email': 'lane@ansleyre.com',
        'website': 'https://www.ansleyatlanta.com'
      },
      'history': {
        '2025-08-15': {
          'event': 'Sale Listing',
          'price': 385000,
          'listingType': 'Standard',
          'listedDate': '2025-08-15T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 184
        }
      }
    },
    {
      'id': '2222-Hill-St-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2222 Hill St NW, Atlanta, GA 30318',
      'addressLine1': '2222 Hill St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.779792,
      'longitude': -84.462475,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1442,
      'lotSize': 5001,
      'yearBuilt': 1985,
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-13T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.968Z',
      'daysOnMarket': 180,
      'mlsName': 'FMLS',
      'mlsNumber': '7634929',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-05-02': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2025-05-02T00:00:00.000Z',
          'removedDate': '2025-06-07T00:00:00.000Z',
          'daysOnMarket': 36
        },
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '1-Plantation-Dr-NE,-Unit-B,-Atlanta,-GA-30324',
      'formattedAddress': '1 Plantation Dr NE, Unit B, Atlanta, GA 30324',
      'addressLine1': '1 Plantation Dr NE',
      'addressLine2': 'Unit B',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.836593,
      'longitude': -84.357277,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1635,
      'lotSize': 1655,
      'yearBuilt': 1983,
      'hoa': {
        'fee': 772
      },
      'status': 'Active',
      'price': 325000,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-03-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.967Z',
      'daysOnMarket': 180,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587440',
      'listingAgent': {
        'name': 'Rockey Fields',
        'phone': '6787938825',
        'email': 'rockeyf1@gmail.com',
        'website': 'https://www.realtor.com/realestateagents/56cd5e090fa4170100779447'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'adminatlanta@compass.com'
      },
      'history': {
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 325000,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '285-Centennial-Olympic-Park-Dr-NW,-Unit-1408,-Atlanta,-GA-30313',
      'formattedAddress': '285 Centennial Olympic Park Dr NW, Unit 1408, Atlanta, GA 30313',
      'addressLine1': '285 Centennial Olympic Park Dr NW',
      'addressLine2': 'Unit 1408',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30313',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.762578,
      'longitude': -84.391657,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1579,
      'lotSize': 1568,
      'yearBuilt': 2002,
      'hoa': {
        'fee': 809
      },
      'status': 'Active',
      'price': 515000,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-11T14:56:12.921Z',
      'lastSeenDate': '2026-02-14T11:22:48.966Z',
      'daysOnMarket': 181,
      'mlsName': 'FMLS',
      'mlsNumber': '7634236',
      'listingAgent': {
        'name': 'Stephen Clark',
        'phone': '7703751413',
        'email': 'stephenc8884@gmail.com'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Intown',
        'phone': '4048975558',
        'email': 'in.office@harrynorman.com',
        'website': 'http://www.harrynorman.com'
      },
      'history': {
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 515000,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '950-W-Peachtree-St-NW,-Unit-1102,-Atlanta,-GA-30309',
      'formattedAddress': '950 W Peachtree St NW, Unit 1102, Atlanta, GA 30309',
      'addressLine1': '950 W Peachtree St NW',
      'addressLine2': 'Unit 1102',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780059,
      'longitude': -84.388114,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 812,
      'lotSize': 810,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 403
      },
      'status': 'Active',
      'price': 319900,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.966Z',
      'daysOnMarket': 180,
      'mlsName': 'FMLS',
      'mlsNumber': '7630740',
      'listingAgent': {
        'name': 'Micah Rock',
        'phone': '7709102457',
        'email': 'micahrock@bolst.homes',
        'website': 'https://www.coldwellbankerhomes.com/ga/atlanta/agent/micah-rock/aid_231250/'
      },
      'listingOffice': {
        'name': 'Bolst, Inc.',
        'phone': '4044822293',
        'email': 'cathryn.childs@bolstrealestate.com',
        'website': 'www.bolst.homes'
      },
      'history': {
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 319900,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '3324-Peachtree-Rd-NE,-Unit-2907,-Atlanta,-GA-30326',
      'formattedAddress': '3324 Peachtree Rd NE, Unit 2907, Atlanta, GA 30326',
      'addressLine1': '3324 Peachtree Rd NE',
      'addressLine2': 'Unit 2907',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84597,
      'longitude': -84.369381,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 789,
      'lotSize': 1220,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 479
      },
      'status': 'Active',
      'price': 329900,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.964Z',
      'daysOnMarket': 181,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10586751',
      'listingAgent': {
        'name': 'John Bailey',
        'phone': '7704847888',
        'email': 'johnbailey@johnbaileyrealty.com',
        'website': 'http://www.johnbaileyrealty.com'
      },
      'listingOffice': {
        'name': 'JOHN BAILEY REALTY INC',
        'phone': '7704847888',
        'email': 'johnbailey@johnbaileyrealty.com',
        'website': 'http://www.johnbaileyrealty.com'
      },
      'history': {
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 329900,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '680-Dot-Dr,-Atlanta,-GA-30349',
      'formattedAddress': '680 Dot Dr, Atlanta, GA 30349',
      'addressLine1': '680 Dot Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.589258,
      'longitude': -84.525492,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2321,
      'lotSize': 12171,
      'yearBuilt': 2006,
      'status': 'Active',
      'price': 224900,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.964Z',
      'daysOnMarket': 180,
      'mlsName': 'FMLS',
      'mlsNumber': '7635108',
      'listingAgent': {
        'name': 'Pamela W. Saunders',
        'phone': '7707148110',
        'email': 'tosqp1@bellsouth.net'
      },
      'listingOffice': {
        'name': 'Era Towne Square Realty, Inc.',
        'phone': '8006591355',
        'email': 'tosqp1@bellsouth.net',
        'website': 'www.atlantaera.com'
      },
      'history': {
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 224900,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '6700-Roswell-Rd,-Apt-13A,-Atlanta,-GA-30328',
      'formattedAddress': '6700 Roswell Rd, Apt 13A, Atlanta, GA 30328',
      'addressLine1': '6700 Roswell Rd',
      'addressLine2': 'Apt 13A',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.941354,
      'longitude': -84.376385,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1216,
      'lotSize': 1220,
      'yearBuilt': 1967,
      'hoa': {
        'fee': 367
      },
      'status': 'Active',
      'price': 269900,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.963Z',
      'daysOnMarket': 183,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585915',
      'listingAgent': {
        'name': 'Tarran Craver',
        'phone': '7705979118',
        'email': 'tarran.craver@cbrealty.com',
        'website': 'http://www.sellnorthatlantahomes.com/'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7709939200',
        'email': 'caroline.wilson@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/roswell/office/north-fulton/oid_3280/'
      },
      'history': {
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 269900,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-3B,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 3B, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 3B',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 621,
      'lotSize': 623,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 189999,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-05T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.963Z',
      'daysOnMarket': 181,
      'mlsName': 'FMLS',
      'mlsNumber': '7634341',
      'listingAgent': {
        'name': 'Felipe Poveda',
        'phone': '4048480996',
        'email': 'felipe@thecollectivere.com'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-02-04': {
          'event': 'Sale Listing',
          'price': 239900,
          'listingType': 'Standard',
          'listedDate': '2025-02-04T00:00:00.000Z',
          'removedDate': '2025-08-01T00:00:00.000Z',
          'daysOnMarket': 178
        },
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 189999,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '785-Celeste-Ln-SW,-Atlanta,-GA-30331',
      'formattedAddress': '785 Celeste Ln SW, Atlanta, GA 30331',
      'addressLine1': '785 Celeste Ln SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.741135,
      'longitude': -84.506628,
      'propertyType': 'Townhouse',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1534,
      'lotSize': 1612,
      'yearBuilt': 2003,
      'status': 'Active',
      'price': 229900,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.963Z',
      'daysOnMarket': 181,
      'mlsName': 'FMLS',
      'mlsNumber': '7634736',
      'listingAgent': {
        'name': 'Dawn Fink'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Partners - Stockbridge',
        'phone': '7706920888',
        'email': 'frontdesk324@kw.com',
        'website': 'http://kwstockbridge.yourkwoffice.com/'
      },
      'history': {
        '2025-08-13': {
          'event': 'Sale Listing',
          'price': 249900,
          'listingType': 'Standard',
          'listedDate': '2025-08-13T00:00:00.000Z',
          'removedDate': '2025-08-16T00:00:00.000Z',
          'daysOnMarket': 3
        },
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 229900,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '375-Ralph-Mcgill-Blvd-NE,-Apt-1402,-Atlanta,-GA-30312',
      'formattedAddress': '375 Ralph Mcgill Blvd NE, Apt 1402, Atlanta, GA 30312',
      'addressLine1': '375 Ralph Mcgill Blvd NE',
      'addressLine2': 'Apt 1402',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.763412,
      'longitude': -84.375372,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 800,
      'lotSize': 784,
      'yearBuilt': 1980,
      'hoa': {
        'fee': 36
      },
      'status': 'Active',
      'price': 190000,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.962Z',
      'daysOnMarket': 183,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585779',
      'listingAgent': {
        'name': 'Amy Tep',
        'phone': '4703752973',
        'email': 'amy.tep@latepgroup.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-05-16': {
          'event': 'Sale Listing',
          'price': 195000,
          'listingType': 'Standard',
          'listedDate': '2025-05-16T00:00:00.000Z',
          'removedDate': '2025-06-09T00:00:00.000Z',
          'daysOnMarket': 24
        },
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 190000,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '400-W-Peachtree-St-NW,-Unit-3712,-Atlanta,-GA-30308',
      'formattedAddress': '400 W Peachtree St NW, Unit 3712, Atlanta, GA 30308',
      'addressLine1': '400 W Peachtree St NW',
      'addressLine2': 'Unit 3712',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.765128,
      'longitude': -84.388189,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 743,
      'lotSize': 741,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 391
      },
      'status': 'Active',
      'price': 277000,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.961Z',
      'daysOnMarket': 183,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585574',
      'listingAgent': {
        'name': 'John Phillips',
        'phone': '6783160638',
        'email': 'johnnyphillips@kw.com',
        'website': 'www.phillipsrealtyteam.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 277000,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '2555-Flat-Shoals-Rd,-Apt-3103,-Atlanta,-GA-30349',
      'formattedAddress': '2555 Flat Shoals Rd, Apt 3103, Atlanta, GA 30349',
      'addressLine1': '2555 Flat Shoals Rd',
      'addressLine2': 'Apt 3103',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.590704,
      'longitude': -84.472319,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1408,
      'lotSize': 1873,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 192000,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.961Z',
      'daysOnMarket': 180,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587430',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-03-18': {
          'event': 'Sale Listing',
          'price': 219000,
          'listingType': 'Standard',
          'listedDate': '2025-03-18T00:00:00.000Z',
          'removedDate': '2025-06-19T00:00:00.000Z',
          'daysOnMarket': 93
        },
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 192000,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '4248-River-Green-Dr-NW,-Apt-312,-Atlanta,-GA-30327',
      'formattedAddress': '4248 River Green Dr NW, Apt 312, Atlanta, GA 30327',
      'addressLine1': '4248 River Green Dr NW',
      'addressLine2': 'Apt 312',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.863136,
      'longitude': -84.447749,
      'propertyType': 'Townhouse',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 972,
      'lotSize': 958,
      'yearBuilt': 1991,
      'hoa': {
        'fee': 348
      },
      'status': 'Active',
      'price': 279900,
      'listingType': 'Standard',
      'listedDate': '2025-08-16T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-09-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.960Z',
      'daysOnMarket': 183,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10585082',
      'listingAgent': {
        'name': 'Valerie Brown',
        'phone': '4042015138',
        'email': 'onenationentity@gmail.com',
        'website': 'http://onenationentity.georgiamls.com'
      },
      'listingOffice': {
        'name': 'One Nation Entity Llc',
        'phone': '4042013138',
        'email': 'savvyvb@yahoo.com',
        'website': 'www.onenationentity.georgiamls.com'
      },
      'history': {
        '2024-12-26': {
          'event': 'Sale Listing',
          'price': 280000,
          'listingType': 'Standard',
          'listedDate': '2024-12-26T00:00:00.000Z',
          'removedDate': '2025-07-21T00:00:00.000Z',
          'daysOnMarket': 207
        },
        '2025-08-16': {
          'event': 'Sale Listing',
          'price': 279900,
          'listingType': 'Standard',
          'listedDate': '2025-08-16T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 183
        }
      }
    },
    {
      'id': '2425-Peachtree-Rd-NE,-Unit-404,-Atlanta,-GA-30305',
      'formattedAddress': '2425 Peachtree Rd NE, Unit 404, Atlanta, GA 30305',
      'addressLine1': '2425 Peachtree Rd NE',
      'addressLine2': 'Unit 404',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.820849,
      'longitude': -84.387597,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 3,
      'yearBuilt': 2024,
      'status': 'Active',
      'price': 1650000,
      'listingType': 'Standard',
      'listedDate': '2025-08-18T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.960Z',
      'daysOnMarket': 181,
      'mlsName': 'FMLS',
      'mlsNumber': '7632036',
      'listingAgent': {
        'name': 'Patti Junger',
        'phone': '4048491183',
        'email': 'pjunger@mindspring.com',
        'website': 'http://www.pattijunger.com'
      },
      'listingOffice': {
        'name': 'Dorsey Alston Realtors',
        'phone': '4043522010',
        'email': 'customerservice@dorseyalston.com',
        'website': 'www.dorseyalston.com'
      },
      'history': {
        '2025-08-18': {
          'event': 'Sale Listing',
          'price': 1650000,
          'listingType': 'Standard',
          'listedDate': '2025-08-18T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 181
        }
      }
    },
    {
      'id': '6900-Roswell-Rd,-Unit-10Q,-Atlanta,-GA-30328',
      'formattedAddress': '6900 Roswell Rd, Unit 10Q, Atlanta, GA 30328',
      'addressLine1': '6900 Roswell Rd',
      'addressLine2': 'Unit 10Q',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.943094,
      'longitude': -84.374338,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1040,
      'lotSize': 1041,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 243
      },
      'status': 'Active',
      'price': 229900,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.959Z',
      'daysOnMarket': 180,
      'mlsName': 'FMLS',
      'mlsNumber': '7634777',
      'listingAgent': {
        'name': 'Barbara Bobbi Meyers',
        'phone': '4045047093',
        'email': 'barbara@batesfinancialgroupllc.com',
        'website': 'http://brownmeyersbrokers.com'
      },
      'listingOffice': {
        'name': 'Brown Meyers Brokers, Llc',
        'phone': '4045047093',
        'email': 'barbara@batesfinancialgroupllc.com',
        'website': 'www.brownmeyersbrokers.com'
      },
      'history': {
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 229900,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '892-Ridge-Ave-NW,-Atlanta,-GA-30318',
      'formattedAddress': '892 Ridge Ave NW, Atlanta, GA 30318',
      'addressLine1': '892 Ridge Ave NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.779099,
      'longitude': -84.469694,
      'propertyType': 'Land',
      'bedrooms': 3,
      'bathrooms': 1,
      'lotSize': 43647,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 599900,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-20T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:22:48.956Z',
      'daysOnMarket': 180,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587523',
      'listingAgent': {
        'name': 'Katherine Moliner',
        'phone': '7703789444',
        'email': 'katherinemoliner1@gmail.com'
      },
      'listingOffice': {
        'name': 'Real Broker LLC',
        'phone': '7135613650',
        'email': 'membership@therealbrokerage.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 599900,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '977-Smith-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '977 Smith St SW, Atlanta, GA 30310',
      'addressLine1': '977 Smith St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.728223,
      'longitude': -84.400947,
      'propertyType': 'Land',
      'lotSize': 2483,
      'status': 'Active',
      'price': 75000,
      'listingType': 'Standard',
      'listedDate': '2025-08-19T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-09-16T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.968Z',
      'daysOnMarket': 180,
      'mlsName': 'FMLS',
      'mlsNumber': '7635348',
      'listingAgent': {
        'name': 'Diamond Wiggins',
        'phone': '4047193801',
        'email': 'diamond@houseofdiamonds.co',
        'website': 'www.normanliving.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2024-09-15': {
          'event': 'Sale Listing',
          'price': 80000,
          'listingType': 'Standard',
          'listedDate': '2024-09-15T00:00:00.000Z',
          'removedDate': '2025-07-17T00:00:00.000Z',
          'daysOnMarket': 305
        },
        '2025-08-19': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'Standard',
          'listedDate': '2025-08-19T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 180
        }
      }
    },
    {
      'id': '5015-Rapahoe-Trl,-Atlanta,-GA-30349',
      'formattedAddress': '5015 Rapahoe Trl, Atlanta, GA 30349',
      'addressLine1': '5015 Rapahoe Trl',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.619415,
      'longitude': -84.55316,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2010,
      'lotSize': 4356,
      'yearBuilt': 2019,
      'hoa': {
        'fee': 30
      },
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-08-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.966Z',
      'daysOnMarket': 179,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587595',
      'listingAgent': {
        'name': 'Keylee Pomp',
        'phone': '7063461705',
        'email': 'keylee.pomp@kw.com'
      },
      'listingOffice': {
        'name': 'Bolst, Inc.',
        'phone': '4044822293',
        'email': 'cathryn@bolst.homes'
      },
      'history': {
        '2025-08-20': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-08-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 179
        }
      }
    },
    {
      'id': '2699-Lincoln-Ct-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2699 Lincoln Ct NW, Atlanta, GA 30318',
      'addressLine1': '2699 Lincoln Ct NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.768395,
      'longitude': -84.465672,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 3496,
      'lotSize': 14549,
      'yearBuilt': 1964,
      'status': 'Active',
      'price': 349998,
      'listingType': 'Standard',
      'listedDate': '2025-08-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-04-13T16:35:05.838Z',
      'lastSeenDate': '2026-02-14T11:21:13.965Z',
      'daysOnMarket': 179,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10587415',
      'listingAgent': {
        'name': 'Max Kaiser',
        'phone': '6782981600',
        'email': 'max.kaiser99@gmail.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Intown',
        'phone': '4045413500',
        'email': 'klrw226@kw.com',
        'website': 'https://kwintown.com/'
      },
      'history': {
        '2025-08-20': {
          'event': 'Sale Listing',
          'price': 349998,
          'listingType': 'Standard',
          'listedDate': '2025-08-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 179
        }
      }
    },
    {
      'id': '155-Peyton-Pl-SW,-Atlanta,-GA-30311',
      'formattedAddress': '155 Peyton Pl SW, Atlanta, GA 30311',
      'addressLine1': '155 Peyton Pl SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.751256,
      'longitude': -84.477011,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1008,
      'lotSize': 10062,
      'yearBuilt': 1976,
      'hoa': {
        'fee': 225
      },
      'status': 'Active',
      'price': 113500,
      'listingType': 'Standard',
      'listedDate': '2025-08-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-02-05T10:09:59.657Z',
      'lastSeenDate': '2026-02-14T11:21:13.962Z',
      'daysOnMarket': 179,
      'mlsName': 'FMLS',
      'mlsNumber': '7635164',
      'listingAgent': {
        'name': 'Taiwo Oniru-akintokun',
        'phone': '4706565374',
        'email': 'taiwo.oniruakintokun@kw.com',
        'website': 'https://taiwo-oniruakintokun.kw.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Cityside',
        'phone': '7708746200',
        'email': 'nicole@zercherhomes.com',
        'website': 'http://kwcityside.com/'
      },
      'history': {
        '2025-08-20': {
          'event': 'Sale Listing',
          'price': 113500,
          'listingType': 'Standard',
          'listedDate': '2025-08-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 179
        }
      }
    },
    {
      'id': '3275-Lenox-Rd-NE,-Apt-302,-Atlanta,-GA-30324',
      'formattedAddress': '3275 Lenox Rd NE, Apt 302, Atlanta, GA 30324',
      'addressLine1': '3275 Lenox Rd NE',
      'addressLine2': 'Apt 302',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.84436,
      'longitude': -84.357664,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1423,
      'lotSize': 1394,
      'yearBuilt': 2001,
      'hoa': {
        'fee': 590
      },
      'status': 'Active',
      'price': 347900,
      'listingType': 'Standard',
      'listedDate': '2025-08-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.961Z',
      'daysOnMarket': 179,
      'mlsName': 'FMLS',
      'mlsNumber': '7635556',
      'listingAgent': {
        'name': 'Heather Repine',
        'phone': '4048432500',
        'email': 'heather.repine@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/heather.repine'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://metrobrokers.com'
      },
      'history': {
        '2025-08-20': {
          'event': 'Sale Listing',
          'price': 347900,
          'listingType': 'Standard',
          'listedDate': '2025-08-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 179
        }
      }
    },
    {
      'id': '1103-Brighton-Pt,-Atlanta,-GA-30328',
      'formattedAddress': '1103 Brighton Pt, Atlanta, GA 30328',
      'addressLine1': '1103 Brighton Pt',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.958066,
      'longitude': -84.366105,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1500,
      'lotSize': 1498,
      'yearBuilt': 1978,
      'hoa': {
        'fee': 470
      },
      'status': 'Active',
      'price': 289000,
      'listingType': 'Standard',
      'listedDate': '2025-08-20T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.957Z',
      'daysOnMarket': 179,
      'mlsName': 'FMLS',
      'mlsNumber': '7635643',
      'listingAgent': {
        'name': 'Sydne Minter',
        'phone': '2257720314',
        'website': 'http://www.sydnerierealty.com'
      },
      'listingOffice': {
        'name': 'Real Broker, Llc',
        'phone': '8554500442',
        'email': 'rodney@rodneyhenson.com',
        'website': 'http://www.joinreal.com'
      },
      'history': {
        '2025-08-20': {
          'event': 'Sale Listing',
          'price': 289000,
          'listingType': 'Standard',
          'listedDate': '2025-08-20T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 179
        }
      }
    },
    {
      'id': '1190-W-Wesley-Rd-NW,-Atlanta,-GA-30327',
      'formattedAddress': '1190 W Wesley Rd NW, Atlanta, GA 30327',
      'addressLine1': '1190 W Wesley Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.828259,
      'longitude': -84.426506,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4,
      'squareFootage': 4489,
      'lotSize': 101930,
      'yearBuilt': 1954,
      'status': 'Active',
      'price': 1550000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.955Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7636048',
      'listingAgent': {
        'name': 'Debra Johnston',
        'phone': '4043121959',
        'email': 'debra.johnston@cbrealty.com',
        'website': 'http://www.debraajohnston.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4042621234',
        'email': 'debra.bradley@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/buckhead/oid_3218/'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 1550000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '705-Bismark-Rd-NE,-Atlanta,-GA-30324',
      'formattedAddress': '705 Bismark Rd NE, Atlanta, GA 30324',
      'addressLine1': '705 Bismark Rd NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.810495,
      'longitude': -84.363677,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 1880,
      'lotSize': 828,
      'yearBuilt': 2019,
      'hoa': {
        'fee': 314
      },
      'status': 'Active',
      'price': 540000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-02-25T15:25:22.451Z',
      'lastSeenDate': '2026-02-14T11:21:13.954Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7636081',
      'listingAgent': {
        'name': 'Carla Feitosa',
        'phone': '6784719937',
        'email': 'carlafeitosacp@gmail.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044808805',
        'email': 'jaydee@ansleyre.com',
        'website': 'http://www.ansleyre.com/'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 540000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '3674-Saturn-Dr-NW,-Atlanta,-GA-30331',
      'formattedAddress': '3674 Saturn Dr NW, Atlanta, GA 30331',
      'addressLine1': '3674 Saturn Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30331',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.776755,
      'longitude': -84.507723,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 3,
      'squareFootage': 1200,
      'lotSize': 9100,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 154900,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-07-28T12:47:46.041Z',
      'lastSeenDate': '2026-02-14T11:21:13.951Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7635062',
      'listingAgent': {
        'name': 'Stew Team',
        'phone': '7704399999'
      },
      'listingOffice': {
        'name': 'STEWART BROKERS',
        'phone': '7704399999',
        'email': 'paul@stewartbrokers.com',
        'website': 'www.sellhomesfast.com'
      },
      'history': {
        '2024-05-31': {
          'event': 'Sale Listing',
          'price': 335000,
          'listingType': 'Standard',
          'listedDate': '2024-05-31T00:00:00.000Z',
          'removedDate': '2024-10-05T00:00:00.000Z',
          'daysOnMarket': 127
        },
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 154900,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '1423-Lanvale-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1423 Lanvale Dr SW, Atlanta, GA 30310',
      'addressLine1': '1423 Lanvale Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.724488,
      'longitude': -84.434483,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 2147,
      'lotSize': 14174,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 519000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-10-21T13:11:52.267Z',
      'lastSeenDate': '2026-02-14T11:21:13.949Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7629931',
      'listingAgent': {
        'name': 'Hope Kepley',
        'phone': '2393984579',
        'email': 'hlkepley@gmail.com'
      },
      'listingOffice': {
        'name': 'Komp Realty, Llc',
        'phone': '4044016063',
        'email': 'zack@komprealty.com'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 519000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '1781-Liberty-Pkwy-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1781 Liberty Pkwy NW, Atlanta, GA 30318',
      'addressLine1': '1781 Liberty Pkwy NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.815022,
      'longitude': -84.438407,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 3.5,
      'squareFootage': 1248,
      'lotSize': 610,
      'yearBuilt': 2009,
      'hoa': {
        'fee': 460
      },
      'status': 'Active',
      'price': 349900,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.949Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7634550',
      'listingAgent': {
        'name': 'Cristi Palmer',
        'phone': '4046421387',
        'email': 'cristipalmer@transitionsllc.net'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - InTown',
        'phone': '4048444977',
        'email': 'intown@atlantacommunities.net',
        'website': 'www.atlantacommunities.net'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 349900,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '750-Park-Ave-NE,-Apt-6S,-Atlanta,-GA-30326',
      'formattedAddress': '750 Park Ave NE, Apt 6S, Atlanta, GA 30326',
      'addressLine1': '750 Park Ave NE',
      'addressLine2': 'Apt 6S',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.855302,
      'longitude': -84.361855,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2262,
      'lotSize': 2261,
      'yearBuilt': 2000,
      'hoa': {
        'fee': 1665
      },
      'status': 'Active',
      'price': 699000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-05-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.947Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7624792',
      'listingAgent': {
        'name': 'David Hutchins',
        'phone': '4045500533',
        'email': 'davidhutchins@remax.net',
        'website': 'http://www.davidhutchins.com'
      },
      'listingOffice': {
        'name': 'RE/MAX Around Atlanta',
        'phone': '4042527500',
        'email': 'connie@aroundatlanta.com'
      },
      'history': {
        '2024-05-03': {
          'event': 'Sale Listing',
          'price': 889000,
          'listingType': 'Standard',
          'listedDate': '2024-05-03T00:00:00.000Z',
          'removedDate': '2025-08-21T00:00:00.000Z',
          'daysOnMarket': 475
        },
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 699000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '2253-Bonnybrook-Way-SW,-Atlanta,-GA-30311',
      'formattedAddress': '2253 Bonnybrook Way SW, Atlanta, GA 30311',
      'addressLine1': '2253 Bonnybrook Way SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.693734,
      'longitude': -84.482182,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1092,
      'lotSize': 10498,
      'yearBuilt': 1959,
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-10-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.946Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7636490',
      'listingAgent': {
        'name': 'Anica Pernes',
        'phone': '7709125011',
        'email': 'anica.realtor@gmail.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2024-05-03': {
          'event': 'Sale Listing',
          'price': 300000,
          'listingType': 'Standard',
          'listedDate': '2024-05-03T00:00:00.000Z',
          'removedDate': '2025-01-01T00:00:00.000Z',
          'daysOnMarket': 243
        },
        '2025-01-15': {
          'event': 'Sale Listing',
          'price': 270000,
          'listingType': 'Standard',
          'listedDate': '2025-01-15T00:00:00.000Z',
          'removedDate': '2025-08-21T00:00:00.000Z',
          'daysOnMarket': 218
        },
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '1807-Sylvan-Rd-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1807 Sylvan Rd SW, Atlanta, GA 30310',
      'addressLine1': '1807 Sylvan Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.705496,
      'longitude': -84.418549,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 2295,
      'lotSize': 7501,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 327000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.945Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7635209',
      'listingAgent': {
        'name': 'Joelle Ballariel',
        'phone': '2817537308',
        'email': 'joelle.ballariel@mainstay.io'
      },
      'listingOffice': {
        'name': 'Mainstay Brokerage LLC',
        'phone': '8005832914',
        'email': 'brokers@mainstay.io'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 327000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '7808-Wrotham-Cir,-Atlanta,-GA-30349',
      'formattedAddress': '7808 Wrotham Cir, Atlanta, GA 30349',
      'addressLine1': '7808 Wrotham Cir',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.671625,
      'longitude': -84.639562,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 3096,
      'lotSize': 9148,
      'yearBuilt': 2015,
      'hoa': {
        'fee': 45
      },
      'status': 'Active',
      'price': 389900,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-09-08T14:43:03.165Z',
      'lastSeenDate': '2026-02-14T11:21:13.944Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7636531',
      'listingAgent': {
        'name': 'Aurielle Lee',
        'phone': '6787679650'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Intown',
        'phone': '4048975558',
        'email': 'in.office@harrynorman.com',
        'website': 'http://www.harrynorman.com'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 389900,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '791-Wylie-St-SE,-Apt-103,-Atlanta,-GA-30316',
      'formattedAddress': '791 Wylie St SE, Apt 103, Atlanta, GA 30316',
      'addressLine1': '791 Wylie St SE',
      'addressLine2': 'Apt 103',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30316',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.752223,
      'longitude': -84.360236,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 724,
      'yearBuilt': 2003,
      'hoa': {
        'fee': 344
      },
      'status': 'Active',
      'price': 284000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-03T14:24:02.742Z',
      'lastSeenDate': '2026-02-14T11:21:13.941Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7635285',
      'listingAgent': {
        'name': 'Benjamin Gleeson',
        'phone': '7704290600',
        'email': 'benjamin.gleeson@cbrealty.com',
        'website': 'http://www.benjamingleesonhomes.com/'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '7704290600',
        'email': 'jenny.skeens@coldwellbankeratlanta.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/marietta/office/marietta-cobb/oid_3275/'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 284000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '2166-Belvedere-Ave-SW,-Atlanta,-GA-30311',
      'formattedAddress': '2166 Belvedere Ave SW, Atlanta, GA 30311',
      'addressLine1': '2166 Belvedere Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.720435,
      'longitude': -84.459413,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4.5,
      'squareFootage': 3200,
      'lotSize': 10001,
      'yearBuilt': 2023,
      'status': 'Active',
      'price': 539000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-05T12:11:50.447Z',
      'lastSeenDate': '2026-02-14T11:21:13.939Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7635178',
      'listingAgent': {
        'name': 'Teshuwah Price',
        'phone': '4049808744',
        'email': 'teshuwahprice@gmail.com',
        'website': 'https://homesmart.com/real-estate-agent/georgia/roswell/68494-teshuwah-price/welcome'
      },
      'listingOffice': {
        'name': 'HomeSmart Realty Partners',
        'phone': '4044191004',
        'email': 'rmusto@buckheadhomerealty.com',
        'website': 'www.buckheadhomerealty.com'
      },
      'history': {
        '2024-12-16': {
          'event': 'Sale Listing',
          'price': 575000,
          'listingType': 'Standard',
          'listedDate': '2024-12-16T00:00:00.000Z',
          'removedDate': '2025-04-02T00:00:00.000Z',
          'daysOnMarket': 107
        },
        '2025-04-10': {
          'event': 'Sale Listing',
          'price': 525000,
          'listingType': 'New Construction',
          'listedDate': '2025-04-10T00:00:00.000Z',
          'removedDate': '2025-06-14T00:00:00.000Z',
          'daysOnMarket': 65
        },
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 539000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '1705-Monroe-Dr-NE,-Apt-B4,-Atlanta,-GA-30324',
      'formattedAddress': '1705 Monroe Dr NE, Apt B4, Atlanta, GA 30324',
      'addressLine1': '1705 Monroe Dr NE',
      'addressLine2': 'Apt B4',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.801367,
      'longitude': -84.37127,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 800,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 900
      },
      'status': 'Active',
      'price': 130000,
      'listingType': 'Standard',
      'listedDate': '2025-08-21T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.939Z',
      'daysOnMarket': 178,
      'mlsName': 'FMLS',
      'mlsNumber': '7636737',
      'listingAgent': {
        'name': 'John Andersen',
        'phone': '4044957390',
        'email': 'john.andersen@theagencyre.com',
        'website': 'https://www.spaceintown.com'
      },
      'listingOffice': {
        'name': 'The Agency Atlanta Metro',
        'phone': '4709904414',
        'email': 'atlanta@theagencyre.com'
      },
      'history': {
        '2025-08-21': {
          'event': 'Sale Listing',
          'price': 130000,
          'listingType': 'Standard',
          'listedDate': '2025-08-21T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 178
        }
      }
    },
    {
      'id': '987-Pegg-Rd,-Atlanta,-GA-30344',
      'formattedAddress': '987 Pegg Rd, Atlanta, GA 30344',
      'addressLine1': '987 Pegg Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.689718,
      'longitude': -84.42112,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 904,
      'lotSize': 14623,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 360000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.937Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636772',
      'listingAgent': {
        'name': 'Antonzio Taylor',
        'phone': '4045503849',
        'email': 'antontaylor@me.com',
        'website': 'http://www.antontaylor.com'
      },
      'listingOffice': {
        'name': 'ANTON Real Estate, LLC',
        'phone': '4707990779',
        'email': 'anton@thelinkatl.com',
        'website': 'www.antonre.co'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 360000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-23J,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 23J, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 23J',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 722,
      'lotSize': 601,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 209000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-20T19:57:54.239Z',
      'lastSeenDate': '2026-02-14T11:21:13.936Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636798',
      'listingAgent': {
        'name': 'Rongrong Deng',
        'phone': '4048229753'
      },
      'listingOffice': {
        'name': 'R Square Realty, LLC',
        'phone': '4048229753',
        'email': 'dengrongrong115@gmail.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 209000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-15J,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 15J, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 15J',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 722,
      'lotSize': 601,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 220000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.936Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636796',
      'listingAgent': {
        'name': 'Rongrong Deng',
        'phone': '4048229753'
      },
      'listingOffice': {
        'name': 'R Square Realty, LLC',
        'phone': '4048229753',
        'email': 'dengrongrong115@gmail.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 220000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '3820-Roswell-Rd-NE,-Unit-510,-Atlanta,-GA-30342',
      'formattedAddress': '3820 Roswell Rd NE, Unit 510, Atlanta, GA 30342',
      'addressLine1': '3820 Roswell Rd NE',
      'addressLine2': 'Unit 510',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.858759,
      'longitude': -84.381532,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 1215,
      'lotSize': 1215,
      'yearBuilt': 2005,
      'hoa': {
        'fee': 671
      },
      'status': 'Active',
      'price': 320000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-04-18T14:47:41.685Z',
      'lastSeenDate': '2026-02-14T11:21:13.935Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636826',
      'listingAgent': {
        'name': 'Ali Akherati',
        'phone': '6786975291',
        'email': 'akherati@kw.com'
      },
      'listingOffice': {
        'name': 'Chapman Hall Professionals',
        'phone': '6787300080',
        'email': 'carrietallent@earthlink.net',
        'website': 'www.chapmanhallprofessionals.com'
      },
      'history': {
        '2025-01-03': {
          'event': 'Sale Listing',
          'price': 340000,
          'listingType': 'Standard',
          'listedDate': '2025-01-03T00:00:00.000Z',
          'removedDate': '2025-03-04T00:00:00.000Z',
          'daysOnMarket': 60
        },
        '2025-05-22': {
          'event': 'Sale Listing',
          'price': 350000,
          'listingType': 'Standard',
          'listedDate': '2025-05-22T00:00:00.000Z',
          'removedDate': '2025-08-22T00:00:00.000Z',
          'daysOnMarket': 92
        },
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 320000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '49-Willow-Gln,-Atlanta,-GA-30342',
      'formattedAddress': '49 Willow Gln, Atlanta, GA 30342',
      'addressLine1': '49 Willow Gln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.899744,
      'longitude': -84.375752,
      'propertyType': 'Townhouse',
      'bedrooms': 4,
      'bathrooms': 4,
      'squareFootage': 3536,
      'lotSize': 3311,
      'yearBuilt': 1973,
      'hoa': {
        'fee': 875
      },
      'status': 'Active',
      'price': 450000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.927Z',
      'daysOnMarket': 177,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10589460',
      'listingAgent': {
        'name': 'Marlene Green',
        'phone': '4042856889',
        'email': 'marlenegreen@kw.com',
        'website': 'https://ansleyre.com/agents/marlene-green/'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044808805',
        'email': 'jaydee@ansleyre.com',
        'website': 'http://www.ansleyre.com/'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 450000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '1451-Andrews-St-NW,-Atlanta,-GA-30314',
      'formattedAddress': '1451 Andrews St NW, Atlanta, GA 30314',
      'addressLine1': '1451 Andrews St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.760565,
      'longitude': -84.435524,
      'propertyType': 'Land',
      'lotSize': 9148,
      'status': 'Active',
      'price': 65000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.926Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636795',
      'listingAgent': {
        'name': 'Kashaun Henderson',
        'phone': '6787095186',
        'email': 'thehendegroup@gmail.com',
        'website': 'https://homesmart.com/real-estate-agent/georgia/atlanta/66667-kashaun-henderson/welcome'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 65000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '6350-Kimberly-Mill-Rd,-Atlanta,-GA-30349',
      'formattedAddress': '6350 Kimberly Mill Rd, Atlanta, GA 30349',
      'addressLine1': '6350 Kimberly Mill Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.581613,
      'longitude': -84.486628,
      'propertyType': 'Land',
      'lotSize': 14331,
      'yearBuilt': 1979,
      'status': 'Active',
      'price': 50000,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.926Z',
      'daysOnMarket': 174,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10590829',
      'listingAgent': {
        'name': 'Larry Walker',
        'phone': '8883461098',
        'email': 'larry.walker@metrobrokers.com',
        'website': 'http://www.larrysgahomes.com'
      },
      'listingOffice': {
        'name': 'Better Homes and Gardens Real Estate Metro Brokers',
        'phone': '4048432500',
        'email': 'info@metrobrokers.com',
        'website': 'http://www.metrobrokers.com/'
      },
      'history': {
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 50000,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '250-Pharr-Rd-NE,-Apt-216,-Atlanta,-GA-30305',
      'formattedAddress': '250 Pharr Rd NE, Apt 216, Atlanta, GA 30305',
      'addressLine1': '250 Pharr Rd NE',
      'addressLine2': 'Apt 216',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.837184,
      'longitude': -84.378964,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 797,
      'lotSize': 784,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 437
      },
      'status': 'Active',
      'price': 289999,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.925Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7637005',
      'listingAgent': {
        'name': 'Mark Kercher',
        'phone': '4043538003',
        'email': 'markkercher@ansleyatlanta.com',
        'website': 'http://www.markkercherrealty.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate | Christie\'s International Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyatlanta.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 289999,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '300-Peachtree-St-NE,-Apt-20M,-Atlanta,-GA-30308',
      'formattedAddress': '300 Peachtree St NE, Apt 20M, Atlanta, GA 30308',
      'addressLine1': '300 Peachtree St NE',
      'addressLine2': 'Apt 20M',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.76256,
      'longitude': -84.387879,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 387,
      'lotSize': 601,
      'yearBuilt': 1962,
      'hoa': {
        'fee': 529
      },
      'status': 'Active',
      'price': 189000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.923Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636729',
      'listingAgent': {
        'name': 'Rongrong Deng',
        'phone': '4048229753'
      },
      'listingOffice': {
        'name': 'R Square Realty, LLC',
        'phone': '4048229753',
        'email': 'dengrongrong115@gmail.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 189000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '11-Mooregate-Sq-NW,-Atlanta,-GA-30327',
      'formattedAddress': '11 Mooregate Sq NW, Atlanta, GA 30327',
      'addressLine1': '11 Mooregate Sq NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.843311,
      'longitude': -84.408325,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2904,
      'lotSize': 3049,
      'yearBuilt': 1974,
      'hoa': {
        'fee': 1075
      },
      'status': 'Active',
      'price': 1485000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.921Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7637429',
      'listingAgent': {
        'name': 'George Heery',
        'phone': '4042375000',
        'email': 'george.heery@atlantafinehomes.com',
        'website': 'http://www.heerybrothers.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2024-03-14': {
          'event': 'Sale Listing',
          'price': 775000,
          'listingType': 'Standard',
          'listedDate': '2024-03-14T00:00:00.000Z',
          'removedDate': '2025-02-09T00:00:00.000Z',
          'daysOnMarket': 332
        },
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 1485000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '2313-Manor-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '2313 Manor Ave, Atlanta, GA 30344',
      'addressLine1': '2313 Manor Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.692926,
      'longitude': -84.463912,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1363,
      'lotSize': 11761,
      'yearBuilt': 2002,
      'status': 'Active',
      'price': 349000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-22T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.920Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7636071',
      'listingAgent': {
        'name': 'Dwayne Wasson',
        'phone': '4046734362',
        'email': 'dwayne.wasson@kw.com'
      },
      'listingOffice': {
        'name': 'Wynd Realty',
        'phone': '4049334017',
        'email': 'info@wyndrealty.com',
        'website': 'www.wyndrealty.com'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 349000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '650-Moores-Mill-Rd-NW,-Unit-11,-Atlanta,-GA-30327',
      'formattedAddress': '650 Moores Mill Rd NW, Unit 11, Atlanta, GA 30327',
      'addressLine1': '650 Moores Mill Rd NW',
      'addressLine2': 'Unit 11',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.842865,
      'longitude': -84.408936,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 2904,
      'lotSize': 3049,
      'yearBuilt': 1974,
      'hoa': {
        'fee': 1075
      },
      'status': 'Active',
      'price': 1495000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.920Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7637409',
      'listingAgent': {
        'name': 'George Heery',
        'phone': '4042375000',
        'email': 'george.heery@atlantafinehomes.com',
        'website': 'http://www.heerybrothers.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 1495000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '81-Delmont-Dr-NE,-Atlanta,-GA-30305',
      'formattedAddress': '81 Delmont Dr NE, Atlanta, GA 30305',
      'addressLine1': '81 Delmont Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.833236,
      'longitude': -84.380661,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3.5,
      'squareFootage': 2880,
      'lotSize': 2614,
      'yearBuilt': 2023,
      'hoa': {
        'fee': 288
      },
      'status': 'Active',
      'price': 1750000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-11-08T12:32:57.698Z',
      'lastSeenDate': '2026-02-14T11:21:13.919Z',
      'daysOnMarket': 177,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10589817',
      'listingAgent': {
        'name': 'Bonneau Ansley',
        'phone': '4049063161',
        'email': 'bonneau@ansleyatlanta.com',
        'website': 'http://www.bonneauansley.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyre.com',
        'website': 'www.ansleyatlanta.com'
      },
      'history': {
        '2025-03-17': {
          'event': 'Sale Listing',
          'price': 1899000,
          'listingType': 'Standard',
          'listedDate': '2025-03-17T00:00:00.000Z',
          'removedDate': '2025-08-15T00:00:00.000Z',
          'daysOnMarket': 151
        },
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 1750000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '3286-Northside-Pkwy-S,-Unit-1007,-Atlanta,-GA-30327',
      'formattedAddress': '3286 Northside Pkwy S, Unit 1007, Atlanta, GA 30327',
      'addressLine1': '3286 Northside Pkwy S',
      'addressLine2': 'Unit 1007',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30327',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.844237,
      'longitude': -84.426364,
      'propertyType': 'Condo',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 4055,
      'lotSize': 3877,
      'yearBuilt': 2001,
      'status': 'Active',
      'price': 1095000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.916Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7635580',
      'listingAgent': {
        'name': 'Jared Sapp',
        'phone': '4042375000',
        'email': 'jared@atlantafinehomes.com',
        'website': 'http://www.jaredsapp.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 1095000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '2008-Joseph-E-Boone-Blvd-NW,-Atlanta,-GA-30314',
      'formattedAddress': '2008 Joseph E Boone Blvd NW, Atlanta, GA 30314',
      'addressLine1': '2008 Joseph E Boone Blvd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.763895,
      'longitude': -84.452333,
      'propertyType': 'Multi-Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'lotSize': 7701,
      'yearBuilt': 1934,
      'status': 'Active',
      'price': 299000,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-12T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.916Z',
      'daysOnMarket': 172,
      'mlsName': 'FMLS',
      'mlsNumber': '7639333',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 299000,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '1055-Piedmont-Ave-NE,-Unit-408,-Atlanta,-GA-30309',
      'formattedAddress': '1055 Piedmont Ave NE, Unit 408, Atlanta, GA 30309',
      'addressLine1': '1055 Piedmont Ave NE',
      'addressLine2': 'Unit 408',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.783449,
      'longitude': -84.378595,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 803,
      'lotSize': 784,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 412
      },
      'status': 'Active',
      'price': 329000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-05-13T12:57:56.962Z',
      'lastSeenDate': '2026-02-14T11:21:13.915Z',
      'daysOnMarket': 177,
      'mlsName': 'FMLS',
      'mlsNumber': '7637312',
      'listingAgent': {
        'name': 'Stephen Beckwith',
        'phone': '4048740300',
        'email': 'stephenbeckwith@atlantafinehomes.com',
        'website': 'http://stephenbeckwith.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4048740300',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 329000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '2720-Randall-St,-Atlanta,-GA-30344',
      'formattedAddress': '2720 Randall St, Atlanta, GA 30344',
      'addressLine1': '2720 Randall St',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.681025,
      'longitude': -84.433143,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 1400,
      'lotSize': 8947,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 179900,
      'listingType': 'Standard',
      'listedDate': '2025-08-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-06-10T12:25:37.372Z',
      'lastSeenDate': '2026-02-14T11:21:13.912Z',
      'daysOnMarket': 173,
      'mlsName': 'FMLS',
      'mlsNumber': '7638992',
      'listingAgent': {
        'name': 'Andy Griffith',
        'phone': '6788787590',
        'email': 'andy.griffith@engelvoelkers.com',
        'website': 'http://andygriffith.evrealestate-atlanta.com'
      },
      'listingOffice': {
        'name': 'Engel & Volkers Atlanta',
        'phone': '4048457724',
        'email': 'atlanta@engelvoelkers.com',
        'website': 'https://evatlanta.evrealestate.com'
      },
      'history': {
        '2025-08-26': {
          'event': 'Sale Listing',
          'price': 179900,
          'listingType': 'Standard',
          'listedDate': '2025-08-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 173
        }
      }
    },
    {
      'id': '651-James-P-Brawley-Dr-NW,-Atlanta,-GA-30318',
      'formattedAddress': '651 James P Brawley Dr NW, Atlanta, GA 30318',
      'addressLine1': '651 James P Brawley Dr NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.77244,
      'longitude': -84.412148,
      'propertyType': 'Multi-Family',
      'lotSize': 6578,
      'yearBuilt': 1961,
      'status': 'Active',
      'price': 1000000,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.912Z',
      'daysOnMarket': 172,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10592392',
      'listingAgent': {
        'name': 'Tonya Quin',
        'phone': '4143315693',
        'email': 'tquin@agaperealtygroup.net',
        'website': 'http://www.agaperealtygroup.net/'
      },
      'listingOffice': {
        'name': 'Agape Realty Group',
        'email': 'tquin@agaperealtygroup.net'
      },
      'history': {
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 1000000,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '15-Johnson-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '15 Johnson Rd NW, Atlanta, GA 30318',
      'addressLine1': '15 Johnson Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780849,
      'longitude': -84.455348,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1302,
      'lotSize': 13983,
      'yearBuilt': 1975,
      'status': 'Active',
      'price': 290000,
      'listingType': 'Standard',
      'listedDate': '2025-08-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-11-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.910Z',
      'daysOnMarket': 176,
      'mlsName': 'FMLS',
      'mlsNumber': '7637753',
      'listingAgent': {
        'name': 'Pratik Karan',
        'phone': '4042072278',
        'email': 'pratikkarangt@gmail.com',
        'website': 'http://www.pkaranrealestate.com'
      },
      'listingOffice': {
        'name': 'Dalton Wade, Inc.',
        'phone': '8886688283',
        'email': 'kevin@daltonwade.com'
      },
      'history': {
        '2024-11-06': {
          'event': 'Sale Listing',
          'price': 169900,
          'listingType': 'Standard',
          'listedDate': '2024-11-06T00:00:00.000Z',
          'removedDate': '2025-06-21T00:00:00.000Z',
          'daysOnMarket': 227
        },
        '2025-08-23': {
          'event': 'Sale Listing',
          'price': 290000,
          'listingType': 'Standard',
          'listedDate': '2025-08-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 176
        }
      }
    },
    {
      'id': '2235-Pryor-Rd-SW,-Atlanta,-GA-30315',
      'formattedAddress': '2235 Pryor Rd SW, Atlanta, GA 30315',
      'addressLine1': '2235 Pryor Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.693323,
      'longitude': -84.399538,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 842,
      'lotSize': 8494,
      'yearBuilt': 1960,
      'status': 'Active',
      'price': 114900,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.907Z',
      'daysOnMarket': 174,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10591295',
      'listingAgent': {
        'name': 'Robert Murphy',
        'phone': '6787918556',
        'email': 'robertmurphy@kw.com'
      },
      'listingOffice': {
        'name': 'Homestead Realtors, Llc',
        'phone': '4048764526',
        'email': 'michael@homesteadatlanta.com',
        'website': 'www.homesteadatlanta.com'
      },
      'history': {
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 114900,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '1351-Harbin-Rd-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1351 Harbin Rd SW, Atlanta, GA 30311',
      'addressLine1': '1351 Harbin Rd SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.718536,
      'longitude': -84.484355,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2,
      'squareFootage': 2450,
      'lotSize': 20386,
      'yearBuilt': 1956,
      'status': 'Active',
      'price': 235000,
      'listingType': 'Standard',
      'listedDate': '2025-08-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-17T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.907Z',
      'daysOnMarket': 173,
      'mlsName': 'FMLS',
      'mlsNumber': '7639076',
      'listingAgent': {
        'name': 'Zena Gray',
        'phone': '7708828315',
        'email': 'zenagray778@aol.com'
      },
      'listingOffice': {
        'name': 'Maximum One Realtor Partners',
        'phone': '6787825050',
        'email': 'broker1@maxonepartners.com',
        'website': 'www.maxonepartners.com'
      },
      'history': {
        '2025-01-16': {
          'event': 'Sale Listing',
          'price': 240000,
          'listingType': 'Standard',
          'listedDate': '2025-01-16T00:00:00.000Z',
          'removedDate': '2025-07-01T00:00:00.000Z',
          'daysOnMarket': 166
        },
        '2025-08-26': {
          'event': 'Sale Listing',
          'price': 235000,
          'listingType': 'Standard',
          'listedDate': '2025-08-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 173
        }
      }
    },
    {
      'id': '3780-Lake-Haven-Way,-Atlanta,-GA-30349',
      'formattedAddress': '3780 Lake Haven Way, Atlanta, GA 30349',
      'addressLine1': '3780 Lake Haven Way',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.654206,
      'longitude': -84.528803,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 5,
      'squareFootage': 5695,
      'lotSize': 8764,
      'yearBuilt': 2015,
      'hoa': {
        'fee': 100
      },
      'status': 'Active',
      'price': 620000,
      'listingType': 'Standard',
      'listedDate': '2025-08-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-08-12T09:13:15.293Z',
      'lastSeenDate': '2026-02-14T11:21:13.906Z',
      'daysOnMarket': 176,
      'mlsName': 'FMLS',
      'mlsNumber': '7637463',
      'listingAgent': {
        'name': 'India Jonassaint',
        'phone': '6789534164',
        'email': 'india.jonassaint@exprealty.com',
        'website': 'indiajonassaint.exprealty.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-08-23': {
          'event': 'Sale Listing',
          'price': 620000,
          'listingType': 'Standard',
          'listedDate': '2025-08-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 176
        }
      }
    },
    {
      'id': '1194-Warfield-St-NW,-Atlanta,-GA-30318',
      'formattedAddress': '1194 Warfield St NW, Atlanta, GA 30318',
      'addressLine1': '1194 Warfield St NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.780388,
      'longitude': -84.426229,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1160,
      'lotSize': 12423,
      'yearBuilt': 1930,
      'status': 'Active',
      'price': 590000,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-03-24T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.904Z',
      'daysOnMarket': 174,
      'mlsName': 'FMLS',
      'mlsNumber': '7635622',
      'listingAgent': {
        'name': 'Michael Pillow',
        'phone': '4049914752',
        'email': 'michael@michaelpillow.com',
        'website': 'https://www.thepillowgroup.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4048742262',
        'email': 'rcarter@cbrealty.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/intown/oid_3222/'
      },
      'history': {
        '2024-03-24': {
          'event': 'Sale Listing',
          'price': 700000,
          'listingType': 'Standard',
          'listedDate': '2024-03-24T00:00:00.000Z',
          'removedDate': '2025-02-18T00:00:00.000Z',
          'daysOnMarket': 331
        },
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 590000,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '387-Ralph-Mcgill-Blvd-NE,-Apt-B,-Atlanta,-GA-30312',
      'formattedAddress': '387 Ralph Mcgill Blvd NE, Apt B, Atlanta, GA 30312',
      'addressLine1': '387 Ralph Mcgill Blvd NE',
      'addressLine2': 'Apt B',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.763412,
      'longitude': -84.375372,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 790,
      'lotSize': 1089,
      'yearBuilt': 1980,
      'hoa': {
        'fee': 421
      },
      'status': 'Active',
      'price': 159000,
      'listingType': 'Standard',
      'listedDate': '2025-08-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.902Z',
      'daysOnMarket': 176,
      'mlsName': 'FMLS',
      'mlsNumber': '7637532',
      'listingAgent': {
        'name': 'Rachel Gibson',
        'phone': '4043979177',
        'email': 'rachel@sevenkeysrealty.com',
        'website': 'www.sevenkeysrealty.com'
      },
      'listingOffice': {
        'name': 'Seven Keys Realty Llc',
        'phone': '4043979177',
        'email': 'sevenkeysrealtyga@gmail.com',
        'website': 'www.sevenkeysrealty.com'
      },
      'history': {
        '2025-08-23': {
          'event': 'Sale Listing',
          'price': 159000,
          'listingType': 'Standard',
          'listedDate': '2025-08-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 176
        }
      }
    },
    {
      'id': '3410-Leisure-Ln,-Atlanta,-GA-30349',
      'formattedAddress': '3410 Leisure Ln, Atlanta, GA 30349',
      'addressLine1': '3410 Leisure Ln',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.576048,
      'longitude': -84.49928,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1308,
      'lotSize': 13499,
      'yearBuilt': 1970,
      'status': 'Active',
      'price': 180000,
      'listingType': 'Standard',
      'listedDate': '2025-08-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.902Z',
      'daysOnMarket': 173,
      'mlsName': 'FMLS',
      'mlsNumber': '7638783',
      'listingAgent': {
        'name': 'Charity Manns',
        'phone': '4043246016',
        'email': 'cmanns325@gmail.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'http://www.palmerhouseproperties.com'
      },
      'history': {
        '2025-08-26': {
          'event': 'Sale Listing',
          'price': 180000,
          'listingType': 'Standard',
          'listedDate': '2025-08-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 173
        }
      }
    },
    {
      'id': '1050-Garibaldi-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1050 Garibaldi St SW, Atlanta, GA 30310',
      'addressLine1': '1050 Garibaldi St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726181,
      'longitude': -84.399004,
      'propertyType': 'Single Family',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 740,
      'lotSize': 2483,
      'yearBuilt': 1919,
      'status': 'Active',
      'price': 130000,
      'listingType': 'Standard',
      'listedDate': '2025-08-22T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-11-25T07:25:59.282Z',
      'lastSeenDate': '2026-02-14T11:21:13.901Z',
      'daysOnMarket': 177,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10589943',
      'listingAgent': {
        'name': 'Andrew Griffin',
        'phone': '4706877743',
        'email': 'andrewgriffin@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta Partners',
        'phone': '7709799400',
        'email': 'agentservices292@gmail.com',
        'website': 'https://kwapne.yourkwoffice.com/'
      },
      'history': {
        '2025-08-22': {
          'event': 'Sale Listing',
          'price': 130000,
          'listingType': 'Standard',
          'listedDate': '2025-08-22T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 177
        }
      }
    },
    {
      'id': '1040-Edie-Ave-SE,-Atlanta,-GA-30312',
      'formattedAddress': '1040 Edie Ave SE, Atlanta, GA 30312',
      'addressLine1': '1040 Edie Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726158,
      'longitude': -84.363281,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 4.5,
      'lotSize': 4574,
      'yearBuilt': 2026,
      'status': 'Active',
      'price': 1000000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-23T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.901Z',
      'daysOnMarket': 176,
      'mlsName': 'FMLS',
      'mlsNumber': '7637566',
      'listingAgent': {
        'name': 'Barbara Spiller',
        'phone': '4047485988',
        'email': 'bobbie@eketsa.com'
      },
      'listingOffice': {
        'name': 'KELLER KNAPP INC',
        'phone': '6783584321',
        'email': 'wesleeknapp@bellsouth.net'
      },
      'history': {
        '2025-08-23': {
          'event': 'Sale Listing',
          'price': 1000000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-23T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 176
        }
      }
    },
    {
      'id': '567-Cooper-St-SW,-Atlanta,-GA-30312',
      'formattedAddress': '567 Cooper St SW, Atlanta, GA 30312',
      'addressLine1': '567 Cooper St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.739266,
      'longitude': -84.397298,
      'propertyType': 'Land',
      'lotSize': 3746,
      'status': 'Active',
      'price': 75000,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.900Z',
      'daysOnMarket': 174,
      'mlsName': 'FMLS',
      'mlsNumber': '7638206',
      'listingAgent': {
        'name': 'Jasha Balcom',
        'phone': '7708172185',
        'email': 'balcomrealty@gmail.com',
        'website': 'http://www.jashaandjoya.com'
      },
      'listingOffice': {
        'name': 'Atlanta Fine Homes Sotheby\'s International Realty',
        'phone': '4042375000',
        'email': 'info@atlantafinehomes.com',
        'website': 'http://www.atlantafinehomes.com/'
      },
      'history': {
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 75000,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '870-Mayson-Turner-Rd-NW,-Unit-1103,-Atlanta,-GA-30314',
      'formattedAddress': '870 Mayson Turner Rd NW, Unit 1103, Atlanta, GA 30314',
      'addressLine1': '870 Mayson Turner Rd NW',
      'addressLine2': 'Unit 1103',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30314',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.755891,
      'longitude': -84.417102,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 862,
      'lotSize': 871,
      'yearBuilt': 2007,
      'hoa': {
        'fee': 375
      },
      'status': 'Active',
      'price': 122500,
      'listingType': 'Standard',
      'listedDate': '2025-08-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-12-03T21:30:45.669Z',
      'lastSeenDate': '2026-02-14T11:21:13.899Z',
      'daysOnMarket': 173,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10591331',
      'listingAgent': {
        'name': 'Renee C Grace',
        'phone': '6788513977',
        'email': 'renee@graceandcorealtygroup.com',
        'website': 'http://graceandcorealtygroup.com'
      },
      'listingOffice': {
        'name': 'Grace & Co Realty Group, LLC',
        'phone': '4702891488',
        'email': 'renee@graceandcorealtygroup.com',
        'website': 'www.graceandcorealtygroup.com'
      },
      'history': {
        '2025-08-26': {
          'event': 'Sale Listing',
          'price': 122500,
          'listingType': 'Standard',
          'listedDate': '2025-08-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 173
        }
      }
    },
    {
      'id': '3060-Pharr-Ct,-North-NW-Apt-608,-Atlanta,-GA-30305',
      'formattedAddress': '3060 Pharr Ct, North NW Apt 608, Atlanta, GA 30305',
      'addressLine1': '3060 Pharr Ct',
      'addressLine2': 'North NW Apt 608',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.838741,
      'longitude': -84.384684,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 840,
      'lotSize': 841,
      'yearBuilt': 1970,
      'hoa': {
        'fee': 569
      },
      'status': 'Active',
      'price': 199900,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-11-11T11:15:01.116Z',
      'lastSeenDate': '2026-02-14T11:21:13.896Z',
      'daysOnMarket': 174,
      'mlsName': 'FMLS',
      'mlsNumber': '7635628',
      'listingAgent': {
        'name': 'Sam Lenaeus',
        'phone': '7708559915',
        'email': 'sam.lenaeus@gmail.com',
        'website': 'http://www.samlenaeusweb.harrynorman.com'
      },
      'listingOffice': {
        'name': 'Ansley Real Estate | Christie\'s International Real Estate',
        'phone': '4044804663',
        'email': 'lane@ansleyatlanta.com'
      },
      'history': {
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 199900,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '1292-Eubanks-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '1292 Eubanks Ave, Atlanta, GA 30344',
      'addressLine1': '1292 Eubanks Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.665277,
      'longitude': -84.431319,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 2293,
      'lotSize': 12449,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 426900,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-13T14:26:45.896Z',
      'lastSeenDate': '2026-02-14T11:21:13.895Z',
      'daysOnMarket': 172,
      'mlsName': 'FMLS',
      'mlsNumber': '7637461',
      'listingAgent': {
        'name': 'Mikel Muffley',
        'phone': '4042733186',
        'email': 'mikel@thecollectivere.com',
        'website': 'http://www.thecollectivere.com/'
      },
      'listingOffice': {
        'name': 'Weichert Realtors- The Collective',
        'phone': '4048480996',
        'email': 'billling@thecollectivere.com',
        'website': 'http://thecollectivere.com'
      },
      'history': {
        '2025-04-20': {
          'event': 'Sale Listing',
          'price': 485000,
          'listingType': 'Standard',
          'listedDate': '2025-04-20T00:00:00.000Z',
          'removedDate': '2025-06-04T00:00:00.000Z',
          'daysOnMarket': 45
        },
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 426900,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '1436-Lanvale-Dr-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1436 Lanvale Dr SW, Atlanta, GA 30310',
      'addressLine1': '1436 Lanvale Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.723984,
      'longitude': -84.435008,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1012,
      'lotSize': 8773,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 245000,
      'listingType': 'Standard',
      'listedDate': '2025-08-25T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-04-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.894Z',
      'daysOnMarket': 174,
      'mlsName': 'FMLS',
      'mlsNumber': '7637298',
      'listingAgent': {
        'name': 'Rebecca Kimpson',
        'phone': '0000000000'
      },
      'listingOffice': {
        'name': 'Legacy Key Real Estate',
        'phone': '6787075600',
        'email': 'nicolemcconico@legacykeyteam.com'
      },
      'history': {
        '2024-08-19': {
          'event': 'Sale Listing',
          'price': 425000,
          'listingType': 'Standard',
          'listedDate': '2024-08-19T00:00:00.000Z',
          'removedDate': '2024-10-28T00:00:00.000Z',
          'daysOnMarket': 70
        },
        '2024-11-14': {
          'event': 'Sale Listing',
          'price': 365000,
          'listingType': 'Standard',
          'listedDate': '2024-11-14T00:00:00.000Z',
          'removedDate': '2025-06-01T00:00:00.000Z',
          'daysOnMarket': 199
        },
        '2025-06-10': {
          'event': 'Sale Listing',
          'price': 340000,
          'listingType': 'Standard',
          'listedDate': '2025-06-10T00:00:00.000Z',
          'removedDate': '2025-07-28T00:00:00.000Z',
          'daysOnMarket': 48
        },
        '2025-08-25': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-08-25T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 174
        }
      }
    },
    {
      'id': '4157-Kenwood-Trl,-Atlanta,-GA-30349',
      'formattedAddress': '4157 Kenwood Trl, Atlanta, GA 30349',
      'addressLine1': '4157 Kenwood Trl',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.627882,
      'longitude': -84.522604,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 2.5,
      'squareFootage': 3300,
      'lotSize': 21649,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 270000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-26T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-11-19T07:41:36.078Z',
      'lastSeenDate': '2026-02-14T11:21:13.891Z',
      'daysOnMarket': 173,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10591675',
      'listingAgent': {
        'name': 'Joseph Nelson',
        'phone': '7708733946',
        'email': 'j.nelson.a1realtygroup@gmail.com'
      },
      'listingOffice': {
        'name': 'A-1 Realty Group',
        'phone': '7708733946',
        'email': 'aonerealtygroupllc@gmail.com'
      },
      'history': {
        '2025-08-26': {
          'event': 'Sale Listing',
          'price': 270000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-26T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 173
        }
      }
    },
    {
      'id': '382-Southbend-Ave,-Atlanta,-GA-30315',
      'formattedAddress': '382 Southbend Ave, Atlanta, GA 30315',
      'addressLine1': '382 Southbend Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.705601,
      'longitude': -84.37646,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1052,
      'lotSize': 43560,
      'yearBuilt': 1980,
      'status': 'Active',
      'price': 149900,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-27T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.891Z',
      'daysOnMarket': 172,
      'mlsName': 'FMLS',
      'mlsNumber': '7639206',
      'listingAgent': {
        'name': 'Natara Rice',
        'email': 'tfundgroup@gmail.com'
      },
      'listingOffice': {
        'name': 'Sanders RE, LLC',
        'phone': '6788883438',
        'email': 'greg@sandersteamrealty.com',
        'website': 'https://www.sandersteamrealty.com'
      },
      'history': {
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 149900,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '1568-Mayflower-Ave-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1568 Mayflower Ave SW, Atlanta, GA 30311',
      'addressLine1': '1568 Mayflower Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727709,
      'longitude': -84.439414,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 2030,
      'lotSize': 11238,
      'yearBuilt': 1945,
      'status': 'Active',
      'price': 342000,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.891Z',
      'daysOnMarket': 172,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10592454',
      'listingAgent': {
        'name': 'Karen Hatcher',
        'phone': '4049744694',
        'email': 'sales@sovereignrm.com',
        'website': 'https://sovereignrm.com'
      },
      'listingOffice': {
        'name': 'Sovereign Realty & Management',
        'phone': '4049744694',
        'email': 'info@sovereignrm.com',
        'website': 'http://www.sovereignrm.com'
      },
      'history': {
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 342000,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '1247-Lucile-Ave-SW,-Atlanta,-GA-30310',
      'formattedAddress': '1247 Lucile Ave SW, Atlanta, GA 30310',
      'addressLine1': '1247 Lucile Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.742582,
      'longitude': -84.428523,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 4,
      'squareFootage': 3143,
      'lotSize': 7549,
      'yearBuilt': 1920,
      'status': 'Active',
      'price': 678500,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T00:38:25.902Z',
      'lastSeenDate': '2026-02-14T11:21:13.889Z',
      'daysOnMarket': 171,
      'mlsName': 'FMLS',
      'mlsNumber': '7615514',
      'listingAgent': {
        'name': 'Horace Bryan',
        'phone': '4702069994',
        'email': 'hbryan@bryanrealtors.com',
        'website': 'www.bryanrealtors.com'
      },
      'listingOffice': {
        'name': 'Bryan Realtors',
        'phone': '4702069994',
        'email': 'hbryan@bryanrealtors.com',
        'website': 'www.bryanrealtors.com'
      },
      'history': {
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 678500,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '199-14th-St-NE,-Apt-1609,-Atlanta,-GA-30309',
      'formattedAddress': '199 14th St NE, Apt 1609, Atlanta, GA 30309',
      'addressLine1': '199 14th St NE',
      'addressLine2': 'Apt 1609',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.786134,
      'longitude': -84.380792,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1.5,
      'squareFootage': 750,
      'lotSize': 749,
      'yearBuilt': 1992,
      'hoa': {
        'fee': 377
      },
      'status': 'Active',
      'price': 265000,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-08-09T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.887Z',
      'daysOnMarket': 172,
      'mlsName': 'FMLS',
      'mlsNumber': '7639286',
      'listingAgent': {
        'name': 'Li Guo',
        'phone': '7708221257'
      },
      'listingOffice': {
        'name': 'Russell Realty Brokers, Llc',
        'phone': '4075555555',
        'email': 'wzc422@hotmail.com'
      },
      'history': {
        '2024-08-08': {
          'event': 'Sale Listing',
          'price': 329000,
          'listingType': 'Standard',
          'listedDate': '2024-08-08T00:00:00.000Z',
          'removedDate': '2024-10-25T00:00:00.000Z',
          'daysOnMarket': 78
        },
        '2024-12-05': {
          'event': 'Sale Listing',
          'price': 310000,
          'listingType': 'Standard',
          'listedDate': '2024-12-05T00:00:00.000Z',
          'removedDate': '2025-01-30T00:00:00.000Z',
          'daysOnMarket': 56
        },
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 265000,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '3445-Stratford-Rd-NE,-Apt-3109,-Atlanta,-GA-30326',
      'formattedAddress': '3445 Stratford Rd NE, Apt 3109, Atlanta, GA 30326',
      'addressLine1': '3445 Stratford Rd NE',
      'addressLine2': 'Apt 3109',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30326',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.850838,
      'longitude': -84.367676,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 972,
      'lotSize': 871,
      'yearBuilt': 2006,
      'hoa': {
        'fee': 539
      },
      'status': 'Active',
      'price': 313900,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-28T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.884Z',
      'daysOnMarket': 172,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10592395',
      'listingAgent': {
        'name': 'Kristie Samples',
        'phone': '7709635181',
        'email': 'kristiesamples@kw.com'
      },
      'listingOffice': {
        'name': 'Hill Wood Realty, Llc',
        'phone': '7708222499',
        'email': 'cwood@hillwoodhometeam.com',
        'website': 'www.hillwoodhometeam.com'
      },
      'history': {
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 313900,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '1411-Mercer-Ave,-Atlanta,-GA-30337',
      'formattedAddress': '1411 Mercer Ave, Atlanta, GA 30337',
      'addressLine1': '1411 Mercer Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30337',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.665229,
      'longitude': -84.435201,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1449,
      'lotSize': 10245,
      'yearBuilt': 1950,
      'status': 'Active',
      'price': 340000,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.884Z',
      'daysOnMarket': 171,
      'mlsName': 'FMLS',
      'mlsNumber': '7640455',
      'listingAgent': {
        'name': 'India Jonassaint',
        'phone': '6789534164',
        'email': 'india.jonassaint@exprealty.com',
        'website': 'indiajonassaint.exprealty.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 340000,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': 'Beeler-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': 'Beeler Dr SW, Atlanta, GA 30315',
      'addressLine1': 'Beeler Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.682845,
      'longitude': -84.401699,
      'propertyType': 'Land',
      'lotSize': 59982,
      'status': 'Active',
      'price': 390000,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.884Z',
      'daysOnMarket': 171,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10592903',
      'listingAgent': {
        'name': 'Michael Pappas',
        'phone': '7708158370',
        'email': 'michaelpappas@kw.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Chattahoochee North',
        'phone': '6785782700',
        'email': 'mikemoulder@kw.com',
        'website': 'http://chattahoocheenorth.yourkwoffice.com/home'
      },
      'history': {
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 390000,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '2660-Peachtree-Rd-NW,-Apt-4G,-Atlanta,-GA-30305',
      'formattedAddress': '2660 Peachtree Rd NW, Apt 4G, Atlanta, GA 30305',
      'addressLine1': '2660 Peachtree Rd NW',
      'addressLine2': 'Apt 4G',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.827469,
      'longitude': -84.388166,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 1355,
      'lotSize': 8943,
      'yearBuilt': 1987,
      'hoa': {
        'fee': 1065
      },
      'status': 'Active',
      'price': 799000,
      'listingType': 'Standard',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-03T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.883Z',
      'daysOnMarket': 172,
      'mlsName': 'FMLS',
      'mlsNumber': '7639230',
      'listingAgent': {
        'name': 'Jolynne Szymanski',
        'phone': '4042717167',
        'email': 'jolynne@intownere.com',
        'website': 'http://intownere.com'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-05-02': {
          'event': 'Sale Listing',
          'price': 690000,
          'listingType': 'Standard',
          'listedDate': '2025-05-02T00:00:00.000Z',
          'removedDate': '2025-06-03T00:00:00.000Z',
          'daysOnMarket': 32
        },
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 799000,
          'listingType': 'Standard',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '2870-Pharr-Ct,-South-NW-Apt-901,-Atlanta,-GA-30305',
      'formattedAddress': '2870 Pharr Ct, South NW Apt 901, Atlanta, GA 30305',
      'addressLine1': '2870 Pharr Ct',
      'addressLine2': 'South NW Apt 901',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.834043,
      'longitude': -84.385749,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1260,
      'lotSize': 1263,
      'yearBuilt': 1988,
      'hoa': {
        'fee': 856
      },
      'status': 'Active',
      'price': 244900,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-21T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.883Z',
      'daysOnMarket': 171,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10593273',
      'listingAgent': {
        'name': 'Tanya Farbman',
        'phone': '4046060077',
        'email': 'vistaf1991@gmail.com'
      },
      'listingOffice': {
        'name': 'KELLER WILLIAMS REALTY FIRST ATLANTA',
        'phone': '4045315700',
        'email': 'johnfountain@kw.com',
        'website': 'http://www.kwatlanta.com'
      },
      'history': {
        '2025-05-20': {
          'event': 'Sale Listing',
          'price': 299900,
          'listingType': 'Standard',
          'listedDate': '2025-05-20T00:00:00.000Z',
          'removedDate': '2025-07-05T00:00:00.000Z',
          'daysOnMarket': 46
        },
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 244900,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '858-Charles-Allen-Dr-NE,-Atlanta,-GA-30308',
      'formattedAddress': '858 Charles Allen Dr NE, Atlanta, GA 30308',
      'addressLine1': '858 Charles Allen Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30308',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.778093,
      'longitude': -84.373171,
      'propertyType': 'Multi-Family',
      'lotSize': 7501,
      'yearBuilt': 1925,
      'status': 'Active',
      'price': 1250000,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-29T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.882Z',
      'daysOnMarket': 171,
      'mlsName': 'FMLS',
      'mlsNumber': '7640367',
      'listingAgent': {
        'name': 'Andy Lundsberg',
        'phone': '4048761640',
        'email': 'andy@bullrealty.com'
      },
      'listingOffice': {
        'name': 'Bull Realty, Inc.',
        'phone': '4048761640',
        'email': 'accounting@bullrealty.com',
        'website': 'www.bullrealty.com'
      },
      'history': {
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 1250000,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '1993-Reynolds-Dr-SW,-Atlanta,-GA-30315',
      'formattedAddress': '1993 Reynolds Dr SW, Atlanta, GA 30315',
      'addressLine1': '1993 Reynolds Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.700096,
      'longitude': -84.400215,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4,
      'squareFootage': 2800,
      'lotSize': 17424,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 540000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-27T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-05-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.880Z',
      'daysOnMarket': 172,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10592107',
      'listingAgent': {
        'name': 'Mark Martin',
        'phone': '6788983514',
        'email': 'mark.martin@eastsiderealtygroupllc.com',
        'website': 'eastsiderealtygroupllc.com'
      },
      'listingOffice': {
        'name': 'Eastside Realty Group, LLC',
        'phone': '6788983514',
        'email': 'mark.martin@eastsiderealtygroupllc.com'
      },
      'history': {
        '2025-05-30': {
          'event': 'Sale Listing',
          'price': 549999,
          'listingType': 'New Construction',
          'listedDate': '2025-05-30T00:00:00.000Z',
          'removedDate': '2025-08-20T00:00:00.000Z',
          'daysOnMarket': 82
        },
        '2025-08-27': {
          'event': 'Sale Listing',
          'price': 540000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-27T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 172
        }
      }
    },
    {
      'id': '100-Biscayne-Dr-NW,-Apt-A3,-Atlanta,-GA-30309',
      'formattedAddress': '100 Biscayne Dr NW, Apt A3, Atlanta, GA 30309',
      'addressLine1': '100 Biscayne Dr NW',
      'addressLine2': 'Apt A3',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.815645,
      'longitude': -84.395282,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1.5,
      'squareFootage': 1036,
      'lotSize': 1045,
      'yearBuilt': 1964,
      'hoa': {
        'fee': 587
      },
      'status': 'Active',
      'price': 275000,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-02-23T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.879Z',
      'daysOnMarket': 171,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10593020',
      'listingAgent': {
        'name': 'Carly Costo',
        'phone': '6789835680',
        'email': 'carlyn.costo@redbarnrealestate.com'
      },
      'listingOffice': {
        'name': 'Atlanta Communities - Cherokee/Woodstock',
        'phone': '7702402005',
        'email': 'cherokee@atlantacommunities.net',
        'website': 'http://www.atlantacommunities.net'
      },
      'history': {
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 275000,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '3409-Walnut-Rdg,-Atlanta,-GA-30349',
      'formattedAddress': '3409 Walnut Rdg, Atlanta, GA 30349',
      'addressLine1': '3409 Walnut Rdg',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.663948,
      'longitude': -84.588591,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 4.5,
      'squareFootage': 3570,
      'lotSize': 18774,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 92
      },
      'status': 'Active',
      'price': 475000,
      'listingType': 'Standard',
      'listedDate': '2025-08-28T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-18T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:21:13.878Z',
      'daysOnMarket': 171,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10586030',
      'listingAgent': {
        'name': 'Antonzio Taylor',
        'phone': '4045503849',
        'email': 'antontaylor@me.com',
        'website': 'http://www.antontaylor.com'
      },
      'listingOffice': {
        'name': 'ANTON Real Estate, LLC',
        'phone': '4707990779',
        'email': 'anton@thelinkatl.com',
        'website': 'www.antonre.co'
      },
      'history': {
        '2025-08-17': {
          'event': 'Sale Listing',
          'price': 470000,
          'listingType': 'Standard',
          'listedDate': '2025-08-17T00:00:00.000Z',
          'removedDate': '2025-08-28T00:00:00.000Z',
          'daysOnMarket': 11
        },
        '2025-08-28': {
          'event': 'Sale Listing',
          'price': 475000,
          'listingType': 'Standard',
          'listedDate': '2025-08-28T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 171
        }
      }
    },
    {
      'id': '4460-Stonewall-Tell-Rd,-Atlanta,-GA-30349',
      'formattedAddress': '4460 Stonewall Tell Rd, Atlanta, GA 30349',
      'addressLine1': '4460 Stonewall Tell Rd',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.635832,
      'longitude': -84.5742,
      'propertyType': 'Land',
      'lotSize': 187308,
      'status': 'Active',
      'price': 351000,
      'listingType': 'Standard',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.871Z',
      'daysOnMarket': 170,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10593891',
      'listingAgent': {
        'name': 'Aimee Francis',
        'phone': '6783600318',
        'email': 'aimee.francis@metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Virtual Properties Realty',
        'phone': '7704955050',
        'email': 'vprlistings@vpradmin.com',
        'website': 'virtualpropertiesrealty.com'
      },
      'history': {
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 351000,
          'listingType': 'Standard',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '1-Biscayne-Dr-NW,-Unit-304,-Atlanta,-GA-30309',
      'formattedAddress': '1 Biscayne Dr NW, Unit 304, Atlanta, GA 30309',
      'addressLine1': '1 Biscayne Dr NW',
      'addressLine2': 'Unit 304',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.815581,
      'longitude': -84.392638,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 750,
      'lotSize': 749,
      'yearBuilt': 1997,
      'hoa': {
        'fee': 389
      },
      'status': 'Active',
      'price': 244000,
      'listingType': 'Standard',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-04-26T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.870Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7640356',
      'listingAgent': {
        'name': 'Livian Ascend',
        'phone': '4702019056',
        'email': 'livianascens@livian.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty North Atlanta',
        'phone': '7706637291',
        'email': 'melbafranklin@kw.com',
        'website': 'http://northatlanta.yourkwoffice.com/home'
      },
      'history': {
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 244000,
          'listingType': 'Standard',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '554-Lawton-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '554 Lawton St SW, Atlanta, GA 30310',
      'addressLine1': '554 Lawton St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.739981,
      'longitude': -84.423058,
      'propertyType': 'Single Family',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 885,
      'lotSize': 5131,
      'yearBuilt': 1928,
      'status': 'Active',
      'price': 209900,
      'listingType': 'New Construction',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-15T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.867Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7639809',
      'listingAgent': {
        'name': 'Teshuwah Price',
        'phone': '4049808744',
        'email': 'teshuwahprice@gmail.com',
        'website': 'https://homesmart.com/real-estate-agent/georgia/roswell/68494-teshuwah-price/welcome'
      },
      'listingOffice': {
        'name': 'HomeSmart Realty Partners',
        'phone': '4044191004',
        'email': 'rmusto@buckheadhomerealty.com',
        'website': 'www.buckheadhomerealty.com'
      },
      'history': {
        '2024-12-09': {
          'event': 'Sale Listing',
          'price': 249900,
          'listingType': 'Standard',
          'listedDate': '2024-12-09T00:00:00.000Z',
          'removedDate': '2025-02-14T00:00:00.000Z',
          'daysOnMarket': 67
        },
        '2025-04-27': {
          'event': 'Sale Listing',
          'price': 244500,
          'listingType': 'Standard',
          'listedDate': '2025-04-27T00:00:00.000Z',
          'removedDate': '2025-07-02T00:00:00.000Z',
          'daysOnMarket': 66
        },
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 209900,
          'listingType': 'New Construction',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '725-Catherine-St-SW,-Atlanta,-GA-30310',
      'formattedAddress': '725 Catherine St SW, Atlanta, GA 30310',
      'addressLine1': '725 Catherine St SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30310',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726158,
      'longitude': -84.411373,
      'propertyType': 'Multi-Family',
      'bedrooms': 4,
      'bathrooms': 4,
      'lotSize': 7501,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 785000,
      'listingType': 'Standard',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-22T01:11:59.107Z',
      'lastSeenDate': '2026-02-14T11:18:47.865Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7640948',
      'listingAgent': {
        'name': 'Michael Palazzone',
        'phone': '7703140538',
        'website': 'www.metrobrokers.com'
      },
      'listingOffice': {
        'name': 'Tomahawk Realty Partners'
      },
      'history': {
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 785000,
          'listingType': 'Standard',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '1039-Avondale-Ave-SE,-Atlanta,-GA-30312',
      'formattedAddress': '1039 Avondale Ave SE, Atlanta, GA 30312',
      'addressLine1': '1039 Avondale Ave SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.726148,
      'longitude': -84.362728,
      'propertyType': 'Single Family',
      'bedrooms': 5,
      'bathrooms': 3.5,
      'squareFootage': 3446,
      'lotSize': 8712,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 1274900,
      'listingType': 'New Construction',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-12-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.865Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7639528',
      'listingAgent': {
        'name': 'Brittany Miller',
        'phone': '4048252650',
        'email': 'brittany@dreamcatcherrealtygrp.com',
        'website': 'http://www.dreamcatcherrealtygrp.com'
      },
      'listingOffice': {
        'name': 'Coldwell Banker Realty',
        'phone': '4048742262',
        'email': 'rcarter@cbrealty.com',
        'website': 'https://www.coldwellbankerhomes.com//ga/atlanta/office/intown/oid_3222/'
      },
      'history': {
        '2024-12-06': {
          'event': 'Sale Listing',
          'price': 1399000,
          'listingType': 'New Construction',
          'listedDate': '2024-12-06T00:00:00.000Z',
          'removedDate': '2025-01-04T00:00:00.000Z',
          'daysOnMarket': 29
        },
        '2025-03-26': {
          'event': 'Sale Listing',
          'price': 1349900,
          'listingType': 'New Construction',
          'listedDate': '2025-03-26T00:00:00.000Z',
          'removedDate': '2025-08-26T00:00:00.000Z',
          'daysOnMarket': 153
        },
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 1274900,
          'listingType': 'New Construction',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '4132-Haverhill-Dr-NE,-Atlanta,-GA-30342',
      'formattedAddress': '4132 Haverhill Dr NE, Atlanta, GA 30342',
      'addressLine1': '4132 Haverhill Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30342',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.86757,
      'longitude': -84.377948,
      'propertyType': 'Single Family',
      'bedrooms': 6,
      'bathrooms': 8,
      'squareFootage': 7700,
      'lotSize': 20691,
      'yearBuilt': 2025,
      'status': 'Active',
      'price': 3250000,
      'listingType': 'New Construction',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-01-10T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.863Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7640354',
      'listingAgent': {
        'name': 'Shiva Vasseghi',
        'phone': '7703654300',
        'email': 'shiva@compass.com',
        'website': 'https://www.compass.com/agents/shivagroup'
      },
      'listingOffice': {
        'name': 'COMPASS',
        'phone': '4046686621',
        'email': 'beth.butler@compass.com',
        'website': 'www.compass.com'
      },
      'history': {
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 3250000,
          'listingType': 'New Construction',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '375-Ralph-Mcgill-Blvd-NE,-Apt-607,-Atlanta,-GA-30312',
      'formattedAddress': '375 Ralph Mcgill Blvd NE, Apt 607, Atlanta, GA 30312',
      'addressLine1': '375 Ralph Mcgill Blvd NE',
      'addressLine2': 'Apt 607',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30312',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.763412,
      'longitude': -84.375372,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 1,
      'squareFootage': 882,
      'lotSize': 871,
      'yearBuilt': 1980,
      'hoa': {
        'fee': 471
      },
      'status': 'Active',
      'price': 205000,
      'listingType': 'Standard',
      'listedDate': '2025-08-29T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.863Z',
      'daysOnMarket': 170,
      'mlsName': 'FMLS',
      'mlsNumber': '7641044',
      'listingAgent': {
        'name': 'Victoria Groover',
        'phone': '7062475796',
        'email': 'victoria.groover@matthesterhomes.com'
      },
      'listingOffice': {
        'name': 'Harry Norman, REALTORS® - Intown',
        'phone': '4048975558',
        'email': 'in.office@harrynorman.com',
        'website': 'http://www.harrynorman.com'
      },
      'history': {
        '2025-08-29': {
          'event': 'Sale Listing',
          'price': 205000,
          'listingType': 'Standard',
          'listedDate': '2025-08-29T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 170
        }
      }
    },
    {
      'id': '961-Lindbergh-Dr-NE,-Atlanta,-GA-30324',
      'formattedAddress': '961 Lindbergh Dr NE, Atlanta, GA 30324',
      'addressLine1': '961 Lindbergh Dr NE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30324',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.819701,
      'longitude': -84.356366,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 2,
      'squareFootage': 1521,
      'lotSize': 12815,
      'yearBuilt': 1947,
      'status': 'Active',
      'price': 450000,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-06-07T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.861Z',
      'daysOnMarket': 169,
      'mlsName': 'FMLS',
      'mlsNumber': '7640624',
      'listingAgent': {
        'name': 'Mark Spain',
        'phone': '8552997653',
        'email': 'homes@markspain.com',
        'website': 'http://www.markspain.com'
      },
      'listingOffice': {
        'name': 'Mark Spain Real Estate',
        'phone': '7708869000',
        'email': 'homes@markspain.com'
      },
      'history': {
        '2025-06-06': {
          'event': 'Sale Listing',
          'price': 475000,
          'listingType': 'Standard',
          'listedDate': '2025-06-06T00:00:00.000Z',
          'removedDate': '2025-08-05T00:00:00.000Z',
          'daysOnMarket': 60
        },
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 450000,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '2555-Flat-Shoals-Rd,-Apt-1705,-Atlanta,-GA-30349',
      'formattedAddress': '2555 Flat Shoals Rd, Apt 1705, Atlanta, GA 30349',
      'addressLine1': '2555 Flat Shoals Rd',
      'addressLine2': 'Apt 1705',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.590793,
      'longitude': -84.473704,
      'propertyType': 'Townhouse',
      'bedrooms': 3,
      'bathrooms': 2.5,
      'squareFootage': 1612,
      'lotSize': 4443,
      'yearBuilt': 2004,
      'hoa': {
        'fee': 350
      },
      'status': 'Active',
      'price': 224990,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-02-19T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.860Z',
      'daysOnMarket': 169,
      'mlsName': 'FMLS',
      'mlsNumber': '7641211',
      'listingAgent': {
        'name': 'Leonie Wedderburn',
        'phone': '4045936599',
        'email': 'leoniewedderburn@gmail.com'
      },
      'listingOffice': {
        'name': 'HomeSmart',
        'phone': '4048764901',
        'email': 'tvonbrinegar@phpatlanta.com',
        'website': 'www.palmerhouseproperties.com'
      },
      'history': {
        '2025-02-19': {
          'event': 'Sale Listing',
          'price': 245000,
          'listingType': 'Standard',
          'listedDate': '2025-02-19T00:00:00.000Z',
          'removedDate': '2025-08-18T00:00:00.000Z',
          'daysOnMarket': 180
        },
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 224990,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '3136-Latona-Dr-SW,-Atlanta,-GA-30354',
      'formattedAddress': '3136 Latona Dr SW, Atlanta, GA 30354',
      'addressLine1': '3136 Latona Dr SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30354',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.669137,
      'longitude': -84.395241,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1144,
      'lotSize': 10280,
      'yearBuilt': 1955,
      'status': 'Active',
      'price': 189900,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-30T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.859Z',
      'daysOnMarket': 169,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10594584',
      'listingAgent': {
        'name': 'Isabella Frazier',
        'phone': '4043830700',
        'email': 'southeastteam@trelora.com'
      },
      'listingOffice': {
        'name': 'Trelora Realty, LLC',
        'phone': '6514980203',
        'email': 'ironwoodgroup@trelora.com',
        'website': 'http://www.trelora.com'
      },
      'history': {
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 189900,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '1349-Cleveland-Ave,-Atlanta,-GA-30344',
      'formattedAddress': '1349 Cleveland Ave, Atlanta, GA 30344',
      'addressLine1': '1349 Cleveland Ave',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30344',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.679806,
      'longitude': -84.432981,
      'propertyType': 'Single Family',
      'bedrooms': 3,
      'bathrooms': 1,
      'squareFootage': 1667,
      'lotSize': 10402,
      'yearBuilt': 1940,
      'status': 'Active',
      'price': 119900,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2024-06-14T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.858Z',
      'daysOnMarket': 169,
      'mlsName': 'FMLS',
      'mlsNumber': '7638955',
      'listingAgent': {
        'name': 'Stew Team',
        'phone': '7704399999'
      },
      'listingOffice': {
        'name': 'STEWART BROKERS',
        'phone': '7704399999',
        'email': 'paul@stewartbrokers.com',
        'website': 'www.sellhomesfast.com'
      },
      'history': {
        '2024-09-09': {
          'event': 'Sale Listing',
          'price': 179990,
          'listingType': 'Standard',
          'listedDate': '2024-09-09T00:00:00.000Z',
          'removedDate': '2024-12-02T00:00:00.000Z',
          'daysOnMarket': 84
        },
        '2024-12-11': {
          'event': 'Sale Listing',
          'price': 179900,
          'listingType': 'Short Sale',
          'listedDate': '2024-12-11T00:00:00.000Z',
          'removedDate': '2025-05-31T00:00:00.000Z',
          'daysOnMarket': 171
        },
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 119900,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '4485-Spring-Valley-Pkwy,-Atlanta,-GA-30349',
      'formattedAddress': '4485 Spring Valley Pkwy, Atlanta, GA 30349',
      'addressLine1': '4485 Spring Valley Pkwy',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30349',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.633026,
      'longitude': -84.505065,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 1510,
      'lotSize': 18121,
      'yearBuilt': 1977,
      'status': 'Active',
      'price': 315000,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-01-25T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.856Z',
      'daysOnMarket': 169,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10594789',
      'listingAgent': {
        'name': 'Marquan Jenkins',
        'phone': '6784883542',
        'email': 'marquanjenkins@yahoo.com'
      },
      'listingOffice': {
        'name': 'Keller Williams Atl. Classic',
        'phone': '4045649500',
        'email': 'araenee@gmail.com',
        'website': 'https://www.facebook.com/kwatlantaclassic'
      },
      'history': {
        '2025-01-25': {
          'event': 'Sale Listing',
          'price': 320000,
          'listingType': 'Standard',
          'listedDate': '2025-01-25T00:00:00.000Z',
          'removedDate': '2025-07-24T00:00:00.000Z',
          'daysOnMarket': 180
        },
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 315000,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '44-Dunwoody-Springs-Dr,-Atlanta,-GA-30328',
      'formattedAddress': '44 Dunwoody Springs Dr, Atlanta, GA 30328',
      'addressLine1': '44 Dunwoody Springs Dr',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30328',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.922183,
      'longitude': -84.356221,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2,
      'squareFootage': 1900,
      'lotSize': 1917,
      'yearBuilt': 1985,
      'hoa': {
        'fee': 450
      },
      'status': 'Active',
      'price': 325000,
      'listingType': 'Standard',
      'listedDate': '2025-08-30T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-08-31T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.854Z',
      'daysOnMarket': 169,
      'mlsName': 'FMLS',
      'mlsNumber': '7641422',
      'listingAgent': {
        'name': 'Harriet Hinson',
        'phone': '4044031177',
        'email': 'harriet@ilovemyhome.com',
        'website': 'http://www.ilovemyhome.com'
      },
      'listingOffice': {
        'name': 'Exp Realty LLC',
        'phone': '8889599461',
        'email': 'jason.white@exprealty.com'
      },
      'history': {
        '2025-08-30': {
          'event': 'Sale Listing',
          'price': 325000,
          'listingType': 'Standard',
          'listedDate': '2025-08-30T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 169
        }
      }
    },
    {
      'id': '1700-Oak-Knoll-Cir-SE,-Atlanta,-GA-30315',
      'formattedAddress': '1700 Oak Knoll Cir SE, Atlanta, GA 30315',
      'addressLine1': '1700 Oak Knoll Cir SE',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30315',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.709351,
      'longitude': -84.376779,
      'propertyType': 'Land',
      'bedrooms': 3,
      'bathrooms': 1,
      'lotSize': 12602,
      'yearBuilt': 1946,
      'status': 'Active',
      'price': 135000,
      'listingType': 'Standard',
      'listedDate': '2025-09-01T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2020-09-25T11:34:15.335Z',
      'lastSeenDate': '2026-02-14T11:18:47.852Z',
      'daysOnMarket': 167,
      'mlsName': 'FMLS',
      'mlsNumber': '7641751',
      'listingAgent': {
        'name': 'Chuba Amadi',
        'phone': '7704290600',
        'email': 'chuba.amadi@coldwellbankeratlanta.com',
        'website': 'http://homesbychuba.com'
      },
      'listingOffice': {
        'name': 'The Listing Menu',
        'phone': '4044774971',
        'email': 'info@finallyhomebychuba.com'
      },
      'history': {
        '2025-09-01': {
          'event': 'Sale Listing',
          'price': 135000,
          'listingType': 'Standard',
          'listedDate': '2025-09-01T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 167
        }
      }
    },
    {
      'id': '1574-Mayflower-Ave-SW,-Atlanta,-GA-30311',
      'formattedAddress': '1574 Mayflower Ave SW, Atlanta, GA 30311',
      'addressLine1': '1574 Mayflower Ave SW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30311',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.727837,
      'longitude': -84.439595,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3,
      'squareFootage': 2332,
      'lotSize': 11238,
      'yearBuilt': 2016,
      'status': 'Active',
      'price': 399000,
      'listingType': 'Standard',
      'listedDate': '2025-09-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2021-06-16T15:18:55.718Z',
      'lastSeenDate': '2026-02-14T11:18:47.852Z',
      'daysOnMarket': 166,
      'mlsName': 'FMLS',
      'mlsNumber': '7642043',
      'listingAgent': {
        'name': 'Rose Mary Brown',
        'phone': '4047096686',
        'email': 'rosemary6451@gmail.com'
      },
      'listingOffice': {
        'name': 'Berkshire Hathaway HomeServices Georgia Properties',
        'phone': '4047779045',
        'email': 'wendy.allen@bhhsgeorgia.com'
      },
      'history': {
        '2025-09-02': {
          'event': 'Sale Listing',
          'price': 399000,
          'listingType': 'Standard',
          'listedDate': '2025-09-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 166
        }
      }
    },
    {
      'id': '2285-Peachtree-Rd-NE,-Unit-602,-Atlanta,-GA-30309',
      'formattedAddress': '2285 Peachtree Rd NE, Unit 602, Atlanta, GA 30309',
      'addressLine1': '2285 Peachtree Rd NE',
      'addressLine2': 'Unit 602',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30309',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.816377,
      'longitude': -84.38954,
      'propertyType': 'Condo',
      'bedrooms': 1,
      'bathrooms': 1,
      'squareFootage': 703,
      'lotSize': 697,
      'yearBuilt': 1965,
      'hoa': {
        'fee': 530
      },
      'status': 'Active',
      'price': 159500,
      'listingType': 'Standard',
      'listedDate': '2025-09-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2023-03-08T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.850Z',
      'daysOnMarket': 166,
      'mlsName': 'GeorgiaMLS',
      'mlsNumber': '10595635',
      'listingAgent': {
        'name': 'Shawntell Carter',
        'phone': '6785712082',
        'email': 'shawntell@sellinghousesinga.com',
        'website': 'https://livingoutloudrealty.com/'
      },
      'listingOffice': {
        'name': 'Living Out Loud Real Estate Solution',
        'phone': '6785712082',
        'email': 'shawntell@sellinghousesinga.com'
      },
      'history': {
        '2024-10-31': {
          'event': 'Sale Listing',
          'price': 174500,
          'listingType': 'Standard',
          'listedDate': '2024-10-31T00:00:00.000Z',
          'removedDate': '2025-02-25T00:00:00.000Z',
          'daysOnMarket': 117
        },
        '2025-03-03': {
          'event': 'Sale Listing',
          'price': 169999,
          'listingType': 'Standard',
          'listedDate': '2025-03-03T00:00:00.000Z',
          'removedDate': '2025-07-02T00:00:00.000Z',
          'daysOnMarket': 121
        },
        '2025-09-02': {
          'event': 'Sale Listing',
          'price': 159500,
          'listingType': 'Standard',
          'listedDate': '2025-09-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 166
        }
      }
    },
    {
      'id': '2059-Howell-Mill-Rd-NW,-Atlanta,-GA-30318',
      'formattedAddress': '2059 Howell Mill Rd NW, Atlanta, GA 30318',
      'addressLine1': '2059 Howell Mill Rd NW',
      'addressLine2': null,
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30318',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.811399,
      'longitude': -84.412873,
      'propertyType': 'Single Family',
      'bedrooms': 4,
      'bathrooms': 3.5,
      'squareFootage': 4000,
      'lotSize': 12023,
      'yearBuilt': 1988,
      'status': 'Active',
      'price': 1099000,
      'listingType': 'Standard',
      'listedDate': '2025-09-02T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2022-03-14T14:42:07.059Z',
      'lastSeenDate': '2026-02-14T11:18:47.849Z',
      'daysOnMarket': 166,
      'mlsName': 'FMLS',
      'mlsNumber': '7642393',
      'listingAgent': {
        'name': 'Matthew Proveaux'
      },
      'listingOffice': {
        'name': 'Beacham & Company REALTORS',
        'phone': '4042616300',
        'email': 'dac@beacham.com',
        'website': 'http://www.beacham.com/'
      },
      'history': {
        '2025-01-07': {
          'event': 'Sale Listing',
          'price': 1099000,
          'listingType': 'Standard',
          'listedDate': '2025-01-07T00:00:00.000Z',
          'removedDate': '2025-05-02T00:00:00.000Z',
          'daysOnMarket': 115
        },
        '2025-09-02': {
          'event': 'Sale Listing',
          'price': 1099000,
          'listingType': 'Standard',
          'listedDate': '2025-09-02T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 166
        }
      }
    },
    {
      'id': '2425-Peachtree-Rd-NE,-Unit-1604,-Atlanta,-GA-30305',
      'formattedAddress': '2425 Peachtree Rd NE, Unit 1604, Atlanta, GA 30305',
      'addressLine1': '2425 Peachtree Rd NE',
      'addressLine2': 'Unit 1604',
      'city': 'Atlanta',
      'state': 'GA',
      'stateFips': '13',
      'zipCode': '30305',
      'county': 'Fulton',
      'countyFips': '121',
      'latitude': 33.820849,
      'longitude': -84.387597,
      'propertyType': 'Condo',
      'bedrooms': 2,
      'bathrooms': 2.5,
      'squareFootage': 2639,
      'yearBuilt': 2024,
      'hoa': {
        'fee': 1488
      },
      'status': 'Active',
      'price': 2750000,
      'listingType': 'Standard',
      'listedDate': '2025-09-03T00:00:00.000Z',
      'removedDate': null,
      'createdDate': '2025-03-01T00:00:00.000Z',
      'lastSeenDate': '2026-02-14T11:18:47.848Z',
      'daysOnMarket': 165,
      'mlsName': 'FMLS',
      'mlsNumber': '7642596',
      'listingAgent': {
        'name': 'Peggy Pfohl',
        'phone': '4043071299',
        'email': 'peggypfohl@kw.com',
        'website': 'https://homesbypeggy.kw.com/'
      },
      'listingOffice': {
        'name': 'Keller Williams Realty Atlanta - Sugarloaf',
        'phone': '6787752600',
        'email': 'agentservices152@gmail.com',
        'website': 'http://kwsugarloaf.com/'
      },
      'history': {
        '2025-09-03': {
          'event': 'Sale Listing',
          'price': 2750000,
          'listingType': 'Standard',
          'listedDate': '2025-09-03T00:00:00.000Z',
          'removedDate': null,
          'daysOnMarket': 165
        }
      }
    }
  ].map(_listings => toListingDto(_listings))
}