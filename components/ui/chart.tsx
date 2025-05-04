import React from "react"

interface ChartContextProps {
  data: any[]
}

const ChartContext = React.createContext<ChartContextProps | undefined>(undefined)

export { ChartContext }
