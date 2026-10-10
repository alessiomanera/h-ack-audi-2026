import type { FeatureRoute } from '../registry'
import { AudiWithYouPage } from './AudiWithYouPage'

export const routes: FeatureRoute[] = [
  { path: '/', Component: AudiWithYouPage },
  { path: '*', Component: AudiWithYouPage },
]
