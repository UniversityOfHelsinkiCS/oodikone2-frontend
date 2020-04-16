import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Segment, Loader, Dimmer, Icon, Checkbox } from 'semantic-ui-react'
import _ from 'lodash'
import { getTextIn } from '../../common'
import { callApi } from '../../apiConnection'
import './status.css'

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
}

const mapValueToRange = (x, min1, max1, min2, max2) => {
  if (x < min1) return min2
  if (x > max1) return max2
  return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
}

const StatusContainer = ({
  title,
  current,
  previous,
  clickable,
  handleClick,
  min1,
  max1,
  showYearlyValues,
  yearlyValues
}) => {
  const diff = Math.round(current - previous)
  const p = getP(current, previous)
  const change = Math.round((p - 1) * 1000) / 10

  const getColor = v => {
    if (v > 2.5) return '#6ab04c'
    if (v < -2.5) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = x => {
    if (x > 0) return `+${x}`
    return x
  }

  return (
    <Segment
      className="status-card"
      onClick={clickable ? handleClick : null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '220px',
        minWidth: '220px',
        cursor: clickable ? 'pointer' : 'default',
        flex: 1,
        margin: 0
      }}
      textAlign="center"
      compact
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowWrap: 'break-word'
        }}
      >
        <span className="status-title">{title}</span>
        <div style={{ margin: '10px 0' }}>
          <Icon
            style={{
              color: getColor(change),
              transform: `rotateZ(${-mapValueToRange(change, min1, max1, -45, 45)}deg)`
            }}
            size="huge"
            name="arrow right"
          />
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>{plussify(diff)}</span>
          <br />
          <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change)}%)</span>
        </div>
      </div>
      {showYearlyValues && (
        <div style={{ marginTop: '10px', textAlign: 'start' }}>
          {_.orderBy(Object.entries(yearlyValues), ([y]) => y, ['desc']).map(([year, sum]) => {
            return (
              <div style={{ margin: '5px 0' }} key={year}>
                <span>
                  <b>
                    {year}-{`${Number(year) + 1}`.slice(-2)}:
                  </b>{' '}
                  {Math.round(sum)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Segment>
  )
}

StatusContainer.propTypes = {
  title: PropTypes.string.isRequired,
  current: PropTypes.number.isRequired,
  previous: PropTypes.number.isRequired,
  clickable: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
  min1: PropTypes.number.isRequired,
  max1: PropTypes.number.isRequired,
  showYearlyValues: PropTypes.bool.isRequired,
  yearlyValues: PropTypes.shape({}).isRequired
}

const Status = () => {
  const [showYearlyValues, setShowYearlyValues] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [drillStack, setDrillStack] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await callApi('/cool-data-science/status', 'get', null)
      setData(res.data)
      setLoading(false)
    }

    load()
  }, [])

  const handleShowYearlyValuesToggled = () => {
    setShowYearlyValues(!showYearlyValues)
  }

  const pushToDrillStack = values => {
    const updatedDrillStack = [...drillStack].concat(values)
    setDrillStack(updatedDrillStack)
  }

  const popFromDrillStack = () => {
    const updatedDrillStack = _.dropRight([...drillStack], 1)
    setDrillStack(updatedDrillStack)
  }

  if (!data || loading)
    return (
      <Segment style={{ padding: '40px' }} textAlign="center">
        <Dimmer inverted active />
        <Loader active={loading} />
      </Segment>
    )

  const orderedAbsDiffs = _.orderBy(
    Object.values(_.last(drillStack) || data).map(({ current, previous }) => {
      return Math.abs(Math.floor((getP(current, previous) - 1) * 1000) / 10)
    })
  )
  const medianDiff = orderedAbsDiffs[Math.round((orderedAbsDiffs.length - 1) / 2)]
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        {drillStack.length > 0 && (
          <Icon
            onClick={popFromDrillStack}
            style={{ fontSize: '40px', cursor: 'pointer', marginRight: '20px' }}
            name="arrow left"
          />
        )}
        <Checkbox label="Show previous years" onChange={handleShowYearlyValuesToggled} checked={showYearlyValues} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 220px)',
          gridTemplateRows: 'repeat(auto-fill) 20px',
          gridGap: '20px'
        }}
      >
        {_.orderBy(Object.entries(_.last(drillStack) || data), ([, { current, previous }]) => getP(current, previous), [
          'desc'
        ]).map(([code, stats]) => {
          const handleClick = () => pushToDrillStack(stats.drill)
          return (
            <StatusContainer
              clickable={!!stats.drill}
              handleClick={handleClick}
              key={code}
              title={getTextIn(stats.name)}
              current={stats.current}
              previous={stats.previous}
              showYearlyValues={showYearlyValues}
              min1={-medianDiff * 2}
              max1={medianDiff * 2}
              yearlyValues={stats.yearly}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Status