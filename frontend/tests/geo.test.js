// REQ-GEO-001: geodesic length/area and display formatting for drawn geometries
import { describe, expect, it } from 'vitest'
import { formatArea, formatLength, getArea, getLength } from '../src/utils/geo'

describe('getLength', () => {
  it('test_getLength_emptyCoords_returnsZero', () => {
    expect(getLength([])).toBe(0)
  })

  it('test_getLength_singlePoint_returnsZero', () => {
    expect(getLength([[77.2, 28.6]])).toBe(0)
  })

  it('test_getLength_oneDegreeEquator_isHaversine111km', () => {
    const len = getLength([[0, 0], [1, 0]])
    expect(len).toBeGreaterThan(111000)
    expect(len).toBeLessThan(112000)
  })
})

describe('getArea', () => {
  it('test_getArea_emptyGeometry_returnsZero', () => {
    expect(getArea([])).toBe(0)
  })

  it('test_getArea_knownSquare_matchesSphericalExcess', () => {
    // ~1°x1° cell at the equator ≈ 12,364 km²
    const area = getArea([[0, 0], [1, 0], [1, 1], [0, 1]])
    expect(area).toBeGreaterThan(1.20e10)
    expect(area).toBeLessThan(1.26e10)
  })

  it('test_getArea_ringOrientation_areaSignIndependent', () => {
    const cw = getArea([[0, 0], [1, 0], [1, 1], [0, 1]])
    const ccw = getArea([[0, 0], [0, 1], [1, 1], [1, 0]])
    expect(cw).toBeCloseTo(ccw, 6)
  })
})

describe('formatting', () => {
  it('test_formatLength_subKilometer_usesMeters', () => {
    expect(formatLength(999.94)).toBe('999.9 m')
  })

  it('test_formatLength_overKilometer_usesKm', () => {
    expect(formatLength(1500)).toBe('1.50 km')
  })

  it('test_formatArea_belowSquareKm_usesSquareMeters', () => {
    expect(formatArea(500000)).toBe('500000.0 m²')
  })

  it('test_formatArea_overSquareKm_usesSquareKm', () => {
    expect(formatArea(2.5e6)).toBe('2.50 km²')
  })
})
