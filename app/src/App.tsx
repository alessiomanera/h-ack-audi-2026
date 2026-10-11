import { Route, Routes } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { featureRoutes } from '@/features/registry'

export default function App() {
  return (
    <>
      <Routes>
        {featureRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
      <Toaster />
    </>
  )
}
