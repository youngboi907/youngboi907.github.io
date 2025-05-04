"use client"

import * as React from "react"
import { ChartContext } from "@/components/ui/chart"

interface CandlestickProps {
  className?: string
}

const Candlestick = React.forwardRef<HTMLDivElement, CandlestickProps>(({ className }, ref) => {
  return (
    <g className={className} ref={ref}>
      {/* Candlestick rendering is handled by the CandlestickChart component */}
    </g>
  )
})
Candlestick.displayName = "Candlestick"

interface CandlestickChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  margin?: { top: number; right: number; bottom: number; left: number }
  children?: React.ReactNode
}

const CandlestickChart = React.forwardRef<HTMLDivElement, CandlestickChartProps>(
  ({ data, margin, children, ...props }, ref) => {
    // Custom rendering for candlesticks
    const renderCandlesticks = () => {
      return (
        <g className="candlesticks">
          {data.map((d, i) => {
            // Calculate positions
            const x = 40 + i * (props.width ? (props.width - 80) / data.length : 10)
            const width = props.width ? ((props.width - 80) / data.length) * 0.8 : 8

            // Get values
            const open = d.open
            const close = d.close
            const high = d.high
            const low = d.low

            // Calculate y positions (invert because SVG y increases downward)
            const yScale = (value: number) => {
              const height = props.height || 300
              const min = Math.min(...data.map((d) => d.low))
              const max = Math.max(...data.map((d) => d.high))
              const range = max - min
              // Add padding
              const paddedMin = min - range * 0.1
              const paddedMax = max + range * 0.1
              const paddedRange = paddedMax - paddedMin

              return height - 40 - ((value - paddedMin) / paddedRange) * (height - 80)
            }

            const openY = yScale(open)
            const closeY = yScale(close)
            const highY = yScale(high)
            const lowY = yScale(low)

            // Determine if bullish or bearish
            const isBullish = close >= open
            const color = isBullish ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)"

            // Calculate body dimensions
            const bodyTop = isBullish ? closeY : openY
            const bodyHeight = Math.abs(closeY - openY) || 1 // Ensure at least 1px height

            return (
              <g key={i}>
                {/* Wick */}
                <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1} />

                {/* Body */}
                <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} />
              </g>
            )
          })}
        </g>
      )
    }

    return (
      <ChartContext.Provider value={{ data }}>
        <svg width="100%" height="100%" {...props} ref={ref}>
          <g transform={`translate(${margin?.left || 0},${margin?.top || 0})`}>
            {children}
            {renderCandlesticks()}
          </g>
        </svg>
      </ChartContext.Provider>
    )
  },
)
CandlestickChart.displayName = "CandlestickChart"

export { Candlestick, CandlestickChart }
