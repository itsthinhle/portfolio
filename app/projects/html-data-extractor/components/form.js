'use client'
import PrimaryButton from '@/components/buttons/primary'
import SecondaryButton from '@/components/buttons/secondary'
import ControlledTextAreaInput from '@/components/inputs/controlled-textarea'
import UncontrolledTextInput from '@/components/inputs/uncontrolled-text'
import UncontrolledTextAreaInput from '@/components/inputs/uncontrolled-textarea'
import UncontrolledSelect from '@/components/selects/uncontrolled'
import Heading2 from '@/components/texts/headings/2'
import ControlLabelText from '@/components/texts/labels/control'
import * as cheerio from 'cheerio'
import clsx from 'clsx'
import React, {useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'
import {Copy01Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import {comicImagesDownloader, htmlDataExtractor} from '@/constants/navigation-items'
import InlineTextLink from '@/components/links/inline-text'

const extractTypeOptions = [
  {label: 'Text', value: 'text'},
  {label: 'Attribute', value: 'attribute'},
]

export default function Form() {
  const [_, setControlsErrorMessages] = useState({})
  const [results, setResults] = useState('')
  const [extractType, setExtractType] = useState('text')

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

  const extractContents = (_formData) => {
    const $ = cheerio.load(_formData.htmlContent)
    const results = []
    const attributeName = _formData.attributeName?.trim()

    $(_formData.cssSelector).each((_, _htmlElement) => {
      let value

      if (_formData.extractType === 'attribute') {
        if (!attributeName) return
        value = $(_htmlElement).attr(attributeName)?.trim()
      } else {
        value = $(_htmlElement).text().trim()
      }

      if (value) results.push(value)
    })

    return results.length > 0
      ? results.join('\n')
      : 'Oops! No content found. ☹️'
  }

  const onFormSubmit = async (_event) => {
    _event.preventDefault()
    const formDataInterface = new FormData(_event.target)
    const formData = Object.fromEntries(formDataInterface.entries())
    setResults(extractContents(formData))
  }

  return <>
    <Heading2 className={'heading-2-my'}>Input</Heading2>
    <form onSubmit={onFormSubmit}>
      <ControlLabelText htmlFor={'url'} className={'mb-2'}>HTML content *</ControlLabelText>
      <UncontrolledTextAreaInput
        id="htmlContent"
        name={'htmlContent'}
        rows={12}
        onInputChange={_event => removeErrorMessages(['htmlContent'])}
      />

      <ControlLabelText htmlFor={'cssSelector'} className={'mt-6 mb-2'}>CSS selectors *</ControlLabelText>
      <UncontrolledTextAreaInput
        id="cssSelector"
        name={'cssSelector'}
        rows={2}
        onInputChange={_event => removeErrorMessages(['cssSelector'])}
      />

      <ControlLabelText htmlFor={'extractType'} className={'mt-6 mb-2'}>Extract type *</ControlLabelText>
      <UncontrolledSelect
        id={'extractType'}
        name={'extractType'}
        options={extractTypeOptions}
        defaultValue={['text']}
        onValueChange={_details => setExtractType(_details.value[0])}
      />

      {extractType === 'attribute' && <>
        <ControlLabelText htmlFor={'attributeName'} className={'mt-6 mb-2'}>Attribute name*</ControlLabelText>
        <UncontrolledTextInput
          id="attributeName"
          name={'attributeName'}
          onInputChange={_event => removeErrorMessages(['attributeName'])}
        />
      </>}

      <PrimaryButton
        type={'submit'}
        className={'mt-6 w-full'}>
        Extract
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
    <Heading2 className={'heading-2-my'}>What&#39;s next</Heading2>
    <ul className="list-disc list-outside pl-8 mb-8 text-light-normal-text dark:text-dark-normal-text">
      <li>
        <InlineTextLink
          className={'font-semibold'}
          href={comicImagesDownloader.path}>
          Comic images downloader
        </InlineTextLink>
      </li>
    </ul>
  </>
}
