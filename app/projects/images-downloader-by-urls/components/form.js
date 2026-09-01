'use client'
import PrimaryButton from '@/components/buttons/primary'
import UncontrolledTextAreaInput from '@/components/inputs/uncontrolled-textarea'
import Heading2 from '@/components/texts/headings/2'
import ControlLabelText from '@/components/texts/labels/control'
import React, {useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'
import ControlledTextAreaInput from '@/components/inputs/controlled-textarea'
import apiUtility from '@/utilities/api'
import NormalText from '@/components/texts/normal'
import InlineTextLink from '@/components/links/inline-text'
import {htmlDataExtractor} from '@/constants/navigation-items'
import LoadingIcon from '@/components/icons/loading'
import {HugeiconsIcon} from '@hugeicons/react'
import {DownloadCircle01Icon} from '@hugeicons-pro/core-solid-standard'
import UncontrolledTextInput from '@/components/inputs/uncontrolled-text'

export default function Form() {
  const [_, setControlsErrorMessages] = useState({})
  const [isFormSubmitting, setIFormSubmitting] = useState(false)
  const [results, setResults] = useState('')

  /* Update error fields */
  const removeErrorMessages = useDebouncedCallback((_fields = []) => {
    setControlsErrorMessages(_previousState => {
      const newState = { ..._previousState }

      _fields.forEach(_field => {
        newState[_field] = undefined
      })

      return newState
    })
  }, 250)

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
    setIFormSubmitting(true)

    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())
    const imageUrls = formData.imageUrls
      ? formData.imageUrls.split('\n')
      : []

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      setResults('No URLs provided')
      setIFormSubmitting(false)
      return
    }

    if (imageUrls.length > 500) {
      setResults('Too many URLs! Maximum 500 URLs allowed.')
      setIFormSubmitting(false)
      return
    }

    const response = await apiUtility.post(
      '/api/projects/images-downloader-by-urls',
      {
        imageUrls: imageUrls
      }
    )

    if (!response.ok) {
      const responseErrorMessage = (await response.json()).error
      setResults(responseErrorMessage)
      setIFormSubmitting(false)
      return
    }

    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${formData.downloadFileName ?? 'images'}.zip`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)

    setResults('Images are downloaded!')
    setIFormSubmitting(false)
  }

  return <>
    <Heading2 className={'heading-2-my'}>Input</Heading2>
    <NormalText className={'mb-8'}>
      You can use the{' '}
      <InlineTextLink
        className={'font-semibold'}
        href={htmlDataExtractor.path}>
        HTML data extractor
      </InlineTextLink> project to extract the image urls from the HTML and paste it below.
    </NormalText>
    <form onSubmit={onFormSubmit}>
      <ControlLabelText htmlFor={'url'} className={'mb-2'}>Image URLs *</ControlLabelText>
      <UncontrolledTextAreaInput
        id="imageUrls"
        name={'imageUrls'}
        rows={12}
        onInputChange={_event => removeErrorMessages(['imageUrls'])}
      />

      <ControlLabelText htmlFor={'downloadFileName'} className={'mt-6 mb-2'}>Download file name (.zip)</ControlLabelText>
      <UncontrolledTextInput
        id="downloadFileName"
        name={'downloadFileName'}
        defaultValue={'images'}
        onInputChange={_event => removeErrorMessages(['downloadFileName'])}
      />

      <PrimaryButton
        ariaLabel={'Download button'}
        type={'submit'}
        className={'mt-6 w-full flex items-center justify-center'}
        isDisabled={isFormSubmitting}>
        {isFormSubmitting ?
            <LoadingIcon className={'size-5 lg:size-6'} />
          : <HugeiconsIcon icon={DownloadCircle01Icon} className={'size-5 lg:size-6'} />}
        <span className={'ml-2 hidden sm:inline'}>Download</span>
      </PrimaryButton>
    </form>
    <Heading2 className={'heading-2-my'}>Output</Heading2>
    <ControlLabelText htmlFor={'results'} className={'mt-6 mb-2'}>Result</ControlLabelText>
    <ControlledTextAreaInput
      id="results"
      name={'results'}
      rows={12}
      value={results}
      readOnly={true}
    />
  </>
}
