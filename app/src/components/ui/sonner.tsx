import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/** Dark-only toaster themed from the brand tokens (no lava: toasts are neutral). */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'bg-card text-card-foreground border border-border rounded-md font-sans',
          description: 'text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
