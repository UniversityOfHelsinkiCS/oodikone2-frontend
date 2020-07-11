import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { connect } from 'react-redux'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'
import useFilters from '../useFilters'

const Gender = ({ translate }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const [value, setValue] = useState(null)
  const name = 'gender'

  const genderCodes = {
    female: { label: translate('genderFilter.female'), value: 2 },
    male: { label: translate('genderFilter.male'), value: 1 },
    other: { label: translate('genderFilter.other'), value: 9 },
    unknown: { label: translate('genderFilter.unknown'), value: 0 }
  }

  useEffect(() => {
    if (!value) {
      removeFilter(name)
    } else {
      addFilter(name, student => value === student.gender_code)
    }
  }, [value])

  const countsByGender = {}
  withoutFilter(name).forEach(student => {
    const gc = student.gender_code
    countsByGender[gc] = countsByGender[gc] ? countsByGender[gc] + 1 : 1
  })

  const count = genderCode => withoutFilter(name).filter(student => student.gender_code === genderCode).length

  const options = Object.entries(genderCodes).map(([key, gender]) => ({
    key,
    text: `${gender.label} (${count(gender.value)})`,
    value: gender.value
  }))

  return (
    <FilterCard
      title={translate('genderFilter.title')}
      contextKey="genderFilter"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <Form>
        <Dropdown
          options={options}
          value={value}
          onChange={(_, { value: inputValue }) => setValue(inputValue)}
          placeholder={translate('genderFilter.dropdownLabel')}
          className="mini"
          selection
          fluid
          button
        />
      </Form>
    </FilterCard>
  )
}

Gender.propTypes = {
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(Gender)
