import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button, Form, Radio } from 'semantic-ui-react'
import { func, arrayOf, bool, shape, string, number } from 'prop-types'
import { union, uniq, difference } from 'lodash'

import CreditsLessThan from '../../PopulationFilters/CreditsLessThan'
import CreditsAtLeast from '../../PopulationFilters/CreditsAtLeast'
import GradeMeanFilter from '../../PopulationFilters/GradeMeanFilter'
import CourseParticipation from '../../PopulationFilters/CourseParticipation'
import CourseParticipationNTimes from '../../PopulationFilters/CourseParticipationNTimes'
import SexFilter from '../../PopulationFilters/SexFilter'
import InfoBox from '../../InfoBox'
import infotooltips from '../../../common/InfoToolTips'
import GradeFilter from './GradeFilter'
import ProgrammeFilter from './ProgrammeFilter'
import CourseCreditFilter from './CourseCreditFilter'
import { clearPopulationFilters, setComplementFilter } from '../../../redux/populationFilters'

const componentFor = {
  GradeFilter,
  ProgrammeFilter,
  CreditsAtLeast,
  CreditsLessThan,
  GradeMeanFilter,
  SexFilter,
  CourseParticipation,
  CourseParticipationNTimes,
  CourseCreditFilter
}

const advancedFilters = {
  CourseCreditFilter
}

const CustomPopulationFilters = ({
  samples,
  filters,
  clearPopulationFiltersDispatch,
  complemented,
  setComplementFilterDispatch,
  allStudyrights,
  coursecodes,
  from,
  to,
  studentToTargetCourseDateMap,
  coursePopulation
}) => {
  const [visible, setVisible] = useState(false)
  const [showAdvanced, setAdvanced] = useState(false)

  const renderAddFilters = () => {
    const { Add } = infotooltips.PopulationStatistics.Filters
    const allFilters = union(Object.keys(componentFor))

    const setFilters = union(filters.map(f => f.type), filters.filter(f => f.type === 'Preset').map(f => f.id))

    const unsetFilters = uniq(difference(allFilters, setFilters))

    const filteredUnsetFilters = unsetFilters.filter(
      filter => !Object.keys(advancedFilters).includes(filter) || showAdvanced
    )

    if (filteredUnsetFilters.length === 0) {
      return null
    }
    if (!visible) {
      return (
        <Segment>
          <Header>
            Add filters <InfoBox content={Add} />
          </Header>
          <Button onClick={() => setVisible(true)}>add</Button>
        </Segment>
      )
    }
    return (
      <Segment>
        <Header>
          Add filters <InfoBox content={Add} />
        </Header>
        {coursePopulation ? (
          <div>
            <Radio toggle label="Advanced filters" checked={showAdvanced} onChange={() => setAdvanced(!showAdvanced)} />
          </div>
        ) : null}
        {filteredUnsetFilters.map(filterName => {
          if (!coursePopulation && ['GradeFilter', 'CourseCreditFilter'].includes(filterName)) {
            return null
          }
          return React.createElement(componentFor[filterName], {
            filter: { notSet: true },
            key: filterName,
            samples,
            studentToTargetCourseDateMap,
            coursecodes,
            from,
            to
          })
        })}
        <Button onClick={() => setVisible(false)}>cancel</Button>
      </Segment>
    )
  }

  const renderSetFilters = () => {
    const setFilters = filters.map(f => f.type)
    const { Filters } = infotooltips.PopulationStatistics.Filters
    if (setFilters.length === 0) {
      return null
    }
    return (
      <Segment>
        <Header>
          Filters <InfoBox content={Filters} />
        </Header>
        {filters.map(filter =>
          React.createElement(componentFor[filter.type], {
            filter,
            key: filter.id,
            samples,
            allStudyrights,
            coursecodes,
            from,
            to
          })
        )}
        <Form>
          <Form.Group inline>
            <Form.Field>
              <label>Show excluded students only</label>
            </Form.Field>
            <Form.Field>
              <Radio toggle checked={complemented} onClick={setComplementFilterDispatch} />
            </Form.Field>
          </Form.Group>
        </Form>
        <Button onClick={clearPopulationFiltersDispatch}>clear all filters</Button>
      </Segment>
    )
  }
  return (
    <div>
      {renderAddFilters()}
      {renderSetFilters()}
    </div>
  )
}

CustomPopulationFilters.defaultProps = {
  coursecodes: [],
  from: 0,
  to: 0,
  studentToTargetCourseDateMap: null,
  coursePopulation: false
}

CustomPopulationFilters.propTypes = {
  filters: arrayOf(shape([])).isRequired,
  complemented: bool.isRequired,
  samples: arrayOf(shape([])).isRequired,
  clearPopulationFiltersDispatch: func.isRequired,
  setComplementFilterDispatch: func.isRequired,
  coursecodes: arrayOf(string),
  allStudyrights: shape({}).isRequired,
  studentToTargetCourseDateMap: shape({}),
  from: number,
  to: number,
  coursePopulation: bool
}

const mapStateToProps = ({ populationFilters, populations }) => ({
  filters: populationFilters.filters,
  complemented: populationFilters.complemented,
  allStudyrights: populations.data.studyrights || {}
})

export default connect(
  mapStateToProps,
  {
    clearPopulationFiltersDispatch: clearPopulationFilters,
    setComplementFilterDispatch: setComplementFilter
  }
)(CustomPopulationFilters)