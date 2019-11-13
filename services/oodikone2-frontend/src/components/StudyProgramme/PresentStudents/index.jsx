import React, { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { flatten } from 'lodash'
import YearAccordion from './YearAccordion'

const PresentStudents = () => {
  const { data: presentStudents } = useSelector(state => state.presentStudents)
  const [activeYearAccordion, setActiveYearAccordion] = useState(-1)

  // Tries to merge data by years in the following manner:
  // ..., 80-89, 90-99, 00-04, 04-09
  // There may be some differences in results if some years
  // have 0 students or MERGE_TRESHOLD_AFTER_2000 is changed.
  const mergeDataByYears = () => {
    if (!presentStudents) return {}
    const MERGE_TRESHOLD_AFTER_2000 = 5
    const entries = Object.entries(presentStudents)
      .map(e => [Number(e[0]), e[1]])
      .sort((a, b) => a[0] - b[0])

    const getNextDecadeFrom = year => Math.ceil((year % 10 === 0 ? year + 1 : year) / 10) * 10

    const mergedData = {}
    let minYear
    let maxYear
    let nextDecade
    let studentAccumulator
    let currentClusterSize

    const resetVariablesBy = year => {
      studentAccumulator = []
      minYear = year
      maxYear = minYear
      nextDecade = getNextDecadeFrom(minYear)
      currentClusterSize = 0
    }

    resetVariablesBy(entries[0] ? entries[0][0] : -1)

    const mergeData = year => {
      mergedData[minYear !== maxYear ? `${minYear}-${maxYear}` : `${maxYear}`] = {
        endYear: year,
        students: flatten([...studentAccumulator])
      }
      resetVariablesBy(year)
    }

    entries.forEach(([year, students], i) => {
      if (
        (++currentClusterSize % Math.max(2, MERGE_TRESHOLD_AFTER_2000) === 0 && maxYear >= 2000) ||
        (year >= nextDecade && maxYear <= 2000)
      ) {
        mergeData(year)
      } else {
        maxYear = year
      }
      studentAccumulator.push(students)
      if (i === entries.length - 1) mergeData(year)
    })
    return mergedData
  }

  const mergedData = useMemo(() => mergeDataByYears(), [presentStudents])
  return (
    <div>
      <h2 style={{ margin: '10px' }}>
        Behind a feature toggle (this page is only visible to admins and developers and is still under development)
      </h2>
      {Object.entries(mergedData)
        .slice()
        .sort(([, { endYear: endYear1 }], [, { endYear: endYear2 }]) => endYear2 - endYear1)
        .map(([years, { students }], i) => (
          <YearAccordion
            index={i}
            active={activeYearAccordion === i}
            handleClick={() => setActiveYearAccordion(i === activeYearAccordion ? -1 : i)}
            key={`${years}-${students.length}`}
            years={years}
            students={students}
          />
        ))}
    </div>
  )
}

export default PresentStudents