// Features are Lego blocks: each src/features/<name>/index.ts exports `routes` and is picked up here.
import type { ComponentType } from 'react'

export interface FeatureRoute {
  path: string
  Component: ComponentType
}

interface FeatureModule {
  routes: FeatureRoute[]
}

const modules = import.meta.glob<FeatureModule>('./*/index.ts', { eager: true })

export const featureRoutes: FeatureRoute[] = Object.values(modules).flatMap((m) => m.routes)
