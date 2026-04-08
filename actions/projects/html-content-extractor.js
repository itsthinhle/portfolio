'use server'
import statusConstant from '@/constants/statuses'
import {z} from 'zod'
import * as cheerio from 'cheerio'

export async function validateForm(_formData) {
  // Zod: Defining a schema
  // Properties are required by default
  const formSchema = z.object({
    htmlContent: z
      .string()
      .trim()
      .min(1, 'Required'),
    cssSelector: z // No need to set length validation because we disabled the custom value for state
      .string()
      .trim()
      .min(1, 'Required')
  })

  // Validate form using Zod
  const validatedFields = formSchema.safeParse({
    htmlContent: _formData.htmlContent,
    cssSelector: _formData.cssSelector
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

export async function extractContents(_formData) {
  const $ = cheerio.load(_formData.htmlContent)
  const results = []
  $(_formData.cssSelector).each((_, _htmlElement) => {
    const text = $(_htmlElement).text().trim()
    if (text) results.push(text)
  })

  return results.length > 0
    ? results.join('\n')
    : 'Oops! No content found. ☹️'
}