'use server'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/property-type'
import {toListingDto} from '@/app/projects/sale-and-rental-listings/utilities'
import statusConstant from '@/constants/statuses'
import apiUtility from '@/utilities/api'
import {promises as fs} from 'fs'
import {z} from 'zod'

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
            message: 'Please choose at least a state and a city, or enter a zip code to search'
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
}