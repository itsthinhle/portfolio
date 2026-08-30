import JSZip from 'jszip'
import {getExtensionFromUrl} from '@/utilities/string'

export async function POST(request) {
  try {
    const { imageUrls } = await request.json()

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return Response.json(
        { error: 'No image URLs provided' },
        { status: 400 }
      )
    }

    const zip = new JSZip()

    for (let i = 0; i < imageUrls.length; i++) {
      const response = await fetch(imageUrls[i])

      if (!response.ok) {
        throw new Error(
          `Failed to download ${imageUrls[i]}: ${response.status}`
        )
      }

      const buffer = await response.arrayBuffer()
      const imageExtension = getExtensionFromUrl(imageUrls[i])

      zip.file(`image-${i + 1}.${imageExtension}`, buffer)
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
    })

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="images.zip"',
      },
    })
  } catch (error) {
    return Response.json(
      { error: 'Failed to create image ZIP' },
      { status: 500 }
    )
  }
}