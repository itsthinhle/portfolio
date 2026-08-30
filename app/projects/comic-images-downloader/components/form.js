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

export default function Form() {
  const [_, setControlsErrorMessages] = useState({})
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
    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())
    const imageUrls = formData.imageUrls.split('\n')

    const response = await apiUtility.post(
      '/api/projects/comic-images-downloader',
      {
        imageUrls: imageUrls
      }
    )

    if (!response.ok) {
      setResults('Failed when creating the zip file. Please try again!')
    }

    const blob = await response.blob()

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'images.zip'

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)

    setResults('Images are downloaded!')
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

      <PrimaryButton
        type={'submit'}
        className={'mt-6 w-full'}>
        Download
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
