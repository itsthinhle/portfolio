'use server'
import statusConstant from '@/constants/status'
import {promises as fs} from 'fs'
import { z } from 'zod'

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

export async function searchListings(
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
    zip: z
      .string()
      .regex(/^\d{5}$/, 'Must be exactly 5 digits')
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
        const hasZip = !!data.zip?.trim()

        // Add more cross-field rules here

        if (!hasState && !hasZip) {
          context.addIssue({
            path: ['stateAndZipValidation'],
            message: 'Please choose at least a state or enter a zip code to search'
          })
        }
      }
    )

  // Validate form using Zod
  const validatedFields = SearchListingsFormSchema.safeParse({
    rentCastApiKey: _formData.rentCastApiKey,
    state: _formData.state,
    city: _formData.city,
    zip: _formData.zip,
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
      result: undefined
    }
  }

  return [0, 1]
}