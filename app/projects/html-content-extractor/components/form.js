'use client'
import {extractContents, validateForm} from '@/actions/projects/html-content-extractor'
import PrimaryButton from '@/components/buttons/primary'
import SecondaryButton from '@/components/buttons/secondary'
import ControlledTextAreaInput from '@/components/inputs/controlled-text-area'
import TextAreaInput from '@/components/inputs/textarea'
import Heading2 from '@/components/texts/headings/2'
import ControlLabelText from '@/components/texts/labels/control'
import statusConstant from '@/constants/statuses'
import clsx from 'clsx'
import React, {useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'
import {Copy01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'

export default function Form() {
  const [controlsErrorMessages, setControlsErrorMessages] = useState({})
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(results)
  }

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())

    // Object.fromEntries: convert Form object to JS object
    const searchFormValidation = await validateForm(formData)

    if (searchFormValidation.status === statusConstant.error) {
      setControlsErrorMessages(searchFormValidation.errors)
      return
    }

    extractContents(formData)
      .then(_scrapeResult => { // searchResult can be an array or object
        setResults(_scrapeResult)
      })
  }

  return <>
    <Heading2 className={'heading-2-my'}>Input</Heading2>
    <form onSubmit={onFormSubmit}>
      <ControlLabelText htmlFor={'url'} className={'mb-2'}>HTML content *</ControlLabelText>
      <TextAreaInput
        id="htmlContent"
        name={'htmlContent'}
        rows={12}
        onInputChange={_event => removeErrorMessages(['htmlContent'])}
        errorCondition={controlsErrorMessages?.htmlContent}
        errorMessage={controlsErrorMessages?.htmlContent?.errors?.[0]}
      />

      <ControlLabelText htmlFor={'cssSelector'} className={'mt-6 mb-2'}>CSS selectors *</ControlLabelText>
      <TextAreaInput
        id="cssSelector"
        name={'cssSelector'}
        rows={2}
        onInputChange={_event => removeErrorMessages(['cssSelector'])}
        errorCondition={controlsErrorMessages?.cssSelector}
        errorMessage={controlsErrorMessages?.cssSelector?.errors?.[0]}
      />

      <PrimaryButton
        type={'submit'}
        className={'mt-6 w-full'}>
        Scrape
      </PrimaryButton>
    </form>
    <Heading2 className={'heading-2-my'}>Output</Heading2>
    <ControlLabelText htmlFor={'results'} className={'mt-6 mb-2'}>Result</ControlLabelText>
    <div className={'relative'}>
      <ControlledTextAreaInput
        id="results"
        name={'results'}
        rows={18}
        value={results}
        readOnly={true}
      />
      <SecondaryButton
        onClick={handleCopy}
        className={clsx(
          'absolute right-6 top-2'
        )}
      >
        <HugeiconsIcon icon={Copy01Icon} className={'size-4 lg:size-5'} />
      </SecondaryButton>
    </div>
  </>
}
