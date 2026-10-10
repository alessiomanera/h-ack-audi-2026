import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatically clean up tests after each run
afterEach(() => {
  cleanup()
})
