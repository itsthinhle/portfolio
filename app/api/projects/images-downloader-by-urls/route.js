import JSZip from 'jszip'
import {getExtensionFromUrl} from '@/utilities/string'

export async function POST(request) {
  try {
    const { imageUrls, downloadFileName } = await request.json()

    const zip = new JSZip()

    for (let index = 0; index < imageUrls.length; index++) {
      const response = await fetch(imageUrls[index])

      if (!response.ok) {
        console.error(`Skipped this image url: ${imageUrls[index]}`)
        continue
      }

      const buffer = await response.arrayBuffer()
      const imageExtension = getExtensionFromUrl(imageUrls[index])

      zip.file(`image-${index + 1}.${imageExtension}`, buffer)
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
    })

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${downloadFileName ?? 'images'}.zip"`,
      },
    })
  } catch (error) {
    return Response.json(
      { error: 'Failed while downloading images. Please check you URLs again.' },
      { status: 500 }
    )
  }
}