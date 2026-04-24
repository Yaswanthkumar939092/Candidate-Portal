/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"

// test-utils.tsx
export const renderWithProviders = (ui: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => {
    const client = new QueryClient()
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    )
  }