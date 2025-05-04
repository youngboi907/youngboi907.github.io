"use client"

import { useEffect, useRef, useState } from "react"

interface CandlestickChartProps {
  data: any[]
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    data: any
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Set chart dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 50 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Find min and max values for scaling
    const minValue = Math.min(...data.map((d) => d.low))
    const maxValue = Math.max(...data.map((d) => d.high))
    const valueRange = maxValue - minValue

    // Add padding to the value range
    const paddedMin = minValue - valueRange * 0.1
    const paddedMax = maxValue + valueRange * 0.1
    const paddedRange = paddedMax - paddedMin

    // Scale functions
    const xScale = (i: number) => margin.left + (i * width) / (data.length - 1 || 1)
    const yScale = (value: number) => margin.top + height - ((value - paddedMin) / paddedRange) * height

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * height) / gridLines
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + width, y)
      ctx.stroke()

      // Draw y-axis labels
      const value = paddedMax - (i / gridLines) * paddedRange
      ctx.fillStyle = "#aaa"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(2), margin.left - 5, y + 4)
    }

    // Zero line
    const zeroY = yScale(0)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.left, zeroY)
    ctx.lineTo(margin.left + width, zeroY)
    ctx.stroke()

    // Draw candlesticks
    const candleWidth = Math.min((width / data.length) * 0.8, 15)

    data.forEach((d, i) => {
      const x = margin.left + (i * width) / (data.length - 1 || 1)
      const open = yScale(d.open)
      const close = yScale(d.close)
      const high = yScale(d.high)
      const low = yScale(d.low)

      // Determine if bullish or bearish
      const isBullish = d.close >= d.open
      const color = isBullish ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)"

      // Draw wick
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, high)
      ctx.lineTo(x, low)
      ctx.stroke()

      // Draw body
      const bodyTop = isBullish ? close : open
      const bodyHeight = Math.abs(close - open) || 1 // Ensure at least 1px height

      ctx.fillStyle = color
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)

      // Draw x-axis labels (time) for every 5th candle
      if (i % 5 === 0) {
        ctx.fillStyle = "#aaa"
        ctx.textAlign = "center"
        ctx.save()
        ctx.translate(x, height + margin.top + 10)
        ctx.rotate(-Math.PI / 4)
        ctx.fillText(d.time, 0, 0)
        ctx.restore()
      }
    })

    // Add event listeners for tooltip
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Find the closest candle
      let closestIndex = -1
      let closestDistance = Number.POSITIVE_INFINITY

      data.forEach((d, i) => {
        const candleX = margin.left + (i * width) / (data.length - 1 || 1)
        const distance = Math.abs(x - candleX)

        if (distance < closestDistance && distance < candleWidth) {
          closestDistance = distance
          closestIndex = i
        }
      })

      if (closestIndex >= 0) {
        setTooltip({
          visible: true,
          x: x,
          y: y,
          data: data[closestIndex],
        })
      } else {
        setTooltip({ ...tooltip, visible: false })
      }
    }

    const handleMouseLeave = () => {
      setTooltip({ ...tooltip, visible: false })
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [data])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      {tooltip.visible && tooltip.data && (
        <div
          className="absolute bg-gray-800 p-2 border border-gray-700 rounded shadow-lg z-10 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 80,
            maxWidth: "200px",
          }}
        >
          <p className="text-gray-300">{`Time: ${tooltip.data.time}`}</p>
          <p className="text-white font-medium">{`Delta: ${tooltip.data.delta.toFixed(2)}`}</p>
          <p className="text-green-400">{`Max Delta: ${tooltip.data.maxDelta.toFixed(2)}`}</p>
          <p className="text-red-400">{`Min Delta: ${tooltip.data.minDelta.toFixed(2)}`}</p>
        </div>
      )}
    </div>
  )
}
