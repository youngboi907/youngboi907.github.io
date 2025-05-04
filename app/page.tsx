"use client"

import { useEffect, useRef, useState } from "react"
import TakerDeltaHeatmap from "@/components/taker-delta-heatmap"
import LiquidationHeatmap from "@/components/liquidation-heatmap"
import OIVolumeRatio from "@/components/oi-volume-ratio"

export default function Home() {
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeKey>("5m")
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showVolumeChart, setShowVolumeChart] = useState(true)
  const [showLiquidationHeatmap, setShowLiquidationHeatmap] = useState(true)

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: TimeframeKey) => {
    setCurrentTimeframe(timeframe)
    setScrollPosition(0) // Reset scroll position when changing timeframe
    // Dispatch a custom event to notify the charts
    window.dispatchEvent(new CustomEvent("timeframeChange", { detail: timeframe }))
  }

  // Handle scroll position change
  const handleScrollChange = (position: number) => {
    setScrollPosition(position)
    // Dispatch a custom event to notify the charts
    window.dispatchEvent(new CustomEvent("scrollChange", { detail: position }))
  }

  // Toggle volume chart visibility
  const toggleVolumeChart = () => {
    setShowVolumeChart(!showVolumeChart)
  }

  // Toggle liquidation heatmap visibility
  const toggleLiquidationHeatmap = () => {
    setShowLiquidationHeatmap(!showLiquidationHeatmap)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0 bg-black">
      <div className="w-full max-w-full bg-gray-900 border-gray-800 text-white">
        <div className="border-b border-gray-800 p-4 flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-white">BTCUSDT Futures Analysis (UTC)</h1>
            <CurrentUTCTime />
          </div>
          <TimeframeSelector selectedTimeframe={currentTimeframe} onTimeframeChange={handleTimeframeChange} />
          {scrollPosition > 0 && (
            <div className="mt-2 flex items-center text-amber-400 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Viewing historical data - Drag to scroll
            </div>
          )}
        </div>
        <div className="p-0">
          {/* Price Chart */}
          <div className="h-[600px] w-full border-b border-gray-800">
            <PriceChart
              timeframe={currentTimeframe}
              scrollPosition={scrollPosition}
              onScrollChange={handleScrollChange}
            />
          </div>
          {/* Taker Delta Chart */}
          <div className="h-[300px] w-full border-b border-gray-800">
            <TakerDeltaChart
              timeframe={currentTimeframe}
              scrollPosition={scrollPosition}
              onScrollChange={handleScrollChange}
            />
          </div>
          {/* Volume Chart with Toggle */}
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={toggleVolumeChart}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded flex items-center"
              >
                {showVolumeChart ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hide Volume
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show Volume
                  </>
                )}
              </button>
            </div>
            {showVolumeChart && (
              <div className="h-[200px] w-full border-b border-gray-800">
                <VolumeChart
                  timeframe={currentTimeframe}
                  scrollPosition={scrollPosition}
                  onScrollChange={handleScrollChange}
                />
              </div>
            )}
          </div>
          {/* Taker Delta Heatmap */}
          <div className="h-[400px] w-full border-b border-gray-800">
            <TakerDeltaHeatmap
              timeframe={currentTimeframe}
              scrollPosition={scrollPosition}
              onScrollChange={handleScrollChange}
            />
          </div>

          {/* Liquidation Heatmap with Toggle */}
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={toggleLiquidationHeatmap}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded flex items-center"
              >
                {showLiquidationHeatmap ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hide Liquidations
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show Liquidations
                  </>
                )}
              </button>
            </div>
            {showLiquidationHeatmap && (
              <div className="h-[200px] w-full">
                <LiquidationHeatmap
                  timeframe={currentTimeframe}
                  scrollPosition={scrollPosition}
                  onScrollChange={handleScrollChange}
                />
              </div>
            )}
          </div>
          {/* OI/Volume Ratio Dashboard */}
          <OIVolumeRatio />
        </div>
      </div>
    </main>
  )
}

// Display current UTC time
function CurrentUTCTime() {
  const [utcTime, setUtcTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setUtcTime(
        `${now.getUTCHours().toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")}:${now.getUTCSeconds().toString().padStart(2, "0")} UTC`,
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return <div className="text-gray-300 text-sm">{utcTime}</div>
}

// Available timeframes in minutes
const TIMEFRAMES = {
  "1m": 1,
  "3m": 3,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "4h": 240,
  "6h": 360,
  "12h": 720,
  "1d": 1440,
  "1w": 10080,
}

type TimeframeKey = keyof typeof TIMEFRAMES

interface TimeframeSelectorProps {
  selectedTimeframe: TimeframeKey
  onTimeframeChange: (timeframe: TimeframeKey) => void
}

function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  // Group timeframes for better UI organization
  const timeframeGroups = {
    minutes: ["1m", "3m", "5m", "15m", "30m"],
    hours: ["1h", "2h", "4h", "6h", "12h"],
    days: ["1d", "1w"],
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center">
        <span className="text-gray-400 text-xs mr-2">Minutes:</span>
        <div className="flex space-x-1">
          {timeframeGroups.minutes.map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 rounded text-xs ${
                selectedTimeframe === tf ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => onTimeframeChange(tf as TimeframeKey)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <span className="text-gray-400 text-xs mr-2">Hours:</span>
        <div className="flex space-x-1">
          {timeframeGroups.hours.map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 rounded text-xs ${
                selectedTimeframe === tf ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => onTimeframeChange(tf as TimeframeKey)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <span className="text-gray-400 text-xs mr-2">Days+:</span>
        <div className="flex space-x-1">
          {timeframeGroups.days.map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 rounded text-xs ${
                selectedTimeframe === tf ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => onTimeframeChange(tf as TimeframeKey)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Price candle interface
interface PriceCandle {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  isComplete: boolean
}

// Delta candle interface
interface DeltaCandle {
  time: string
  timestamp: number
  open: number
  close: number
  high: number
  low: number
  isComplete: boolean
}

// Timeframe data interface for price chart
interface PriceTimeframeData {
  [key: string]: {
    candles: PriceCandle[]
    lastTimestamp: number | null
    lastPrice: number | null
  }
}

// Timeframe data interface for delta chart
interface DeltaTimeframeData {
  [key: string]: {
    candles: DeltaCandle[]
    currentDelta: number
    currentHigh: number
    currentLow: number
    lastTimestamp: number | null
  }
}

// Max bars to store for each timeframe
const maxBarsPerTimeframe: Record<TimeframeKey, number> = {
  "1m": 1440, // 1 day of 1-min bars
  "3m": 1440, // 3 days of 3-min bars
  "5m": 1440, // 5 days of 5-min bars
  "15m": 1440, // 15 days of 15-min bars
  "30m": 1440, // 30 days of 30-min bars
  "1h": 1440, // 60 days of 1-hour bars
  "2h": 1440, // 120 days of 2-hour bars
  "4h": 720, // 120 days of 4-hour bars
  "6h": 720, // 180 days of 6-hour bars
  "12h": 720, // 360 days of 12-hour bars
  "1d": 365, // 1 year of daily bars
  "1w": 156, // 3 years of weekly bars
}

// Visible bars for each timeframe
const visibleBarsPerTimeframe: Record<TimeframeKey, number> = {
  "1m": 120, // 2 hours of 1-min bars
  "3m": 120, // 6 hours of 3-min bars
  "5m": 96, // 8 hours of 5-min bars
  "15m": 96, // 24 hours of 15-min bars
  "30m": 48, // 24 hours of 30-min bars
  "1h": 48, // 2 days of 1-hour bars
  "2h": 48, // 4 days of 2-hour bars
  "4h": 48, // 8 days of 4-hour bars
  "6h": 32, // 8 days of 6-hour bars
  "12h": 32, // 16 days of 12-hour bars
  "1d": 30, // 1 month of daily bars
  "1w": 52, // 1 year of weekly bars
}

// Round timestamp to UTC timeframe boundaries
function roundToUTCTimeframe(timestamp: number, timeframeMinutes: number) {
  const date = new Date(timestamp)

  // Convert to UTC
  const utcYear = date.getUTCFullYear()
  const utcMonth = date.getUTCMonth()
  const utcDate = date.getUTCDate()
  const utcHours = date.getUTCHours()
  const utcMinutes = date.getUTCMinutes()
  const utcDay = date.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

  // Create a new UTC date
  const utcDateObj = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours, utcMinutes, 0, 0))

  if (timeframeMinutes < 60) {
    // For minute-based timeframes (1m, 3m, 5m, 15m, 30m)
    const minutesToSubtract = utcMinutes % timeframeMinutes
    utcDateObj.setUTCMinutes(utcMinutes - minutesToSubtract)
  } else if (timeframeMinutes < 1440) {
    // For hour-based timeframes (1h, 2h, 4h, 6h, 12h)
    const hours = timeframeMinutes / 60
    const hoursToSubtract = utcHours % hours
    utcDateObj.setUTCMinutes(0)
    utcDateObj.setUTCHours(utcHours - hoursToSubtract)
  } else if (timeframeMinutes === 1440) {
    // For daily timeframe (1d)
    utcDateObj.setUTCMinutes(0)
    utcDateObj.setUTCHours(0)
  } else {
    // For weekly timeframe (1w)
    // Set to previous Monday 00:00 UTC
    const daysFromMonday = (utcDay + 6) % 7 // Convert Sunday=0 to Sunday=6, so Monday=0
    utcDateObj.setUTCDate(utcDate - daysFromMonday)
    utcDateObj.setUTCHours(0)
    utcDateObj.setUTCMinutes(0)
  }

  return utcDateObj.getTime()
}

// Format timestamp to readable UTC time based on timeframe
function formatUTCTimeLabel(timestamp: number, timeframe: TimeframeKey) {
  const date = new Date(timestamp)

  if (timeframe === "1w") {
    return `W${getWeekNumber(date)} ${date.getUTCFullYear()}`
  } else if (timeframe === "1d") {
    return `${date.getUTCDate()}-${date.getUTCMonth() + 1}`
  } else if (["12h", "6h", "4h", "2h"].includes(timeframe)) {
    return `${date.getUTCDate()}-${date.getUTCMonth() + 1} ${date.getUTCHours()}:00`
  } else if (timeframe === "1h") {
    return `${date.getUTCHours()}:00`
  } else {
    return `${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, "0")}`
  }
}

// Get ISO week number
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Price Chart Component
interface PriceChartProps {
  timeframe: TimeframeKey
  scrollPosition: number
  onScrollChange: (position: number) => void
}

function PriceChart({ timeframe, scrollPosition, onScrollChange }: PriceChartProps) {
  // Initialize state for all timeframes
  const initialTimeframeData: PriceTimeframeData = {}
  Object.keys(TIMEFRAMES).forEach((tf) => {
    initialTimeframeData[tf] = {
      candles: [],
      lastTimestamp: null,
      lastPrice: null,
    }
  })

  // Store data for all timeframes
  const [timeframeData, setTimeframeData] = useState<PriceTimeframeData>(initialTimeframeData)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const isDraggingRef = useRef(false)
  const lastMouseXRef = useRef(0)

  // Update price candle data for a specific timeframe
  function updatePriceTimeframeData(timeframe: TimeframeKey, timestamp: number, price: number) {
    setTimeframeData((prevData) => {
      const newData = { ...prevData }
      const tfData = { ...newData[timeframe] }
      const tfMinutes = TIMEFRAMES[timeframe]
      const barTime = roundToUTCTimeframe(timestamp, tfMinutes)

      // Initialize if this is the first update
      if (tfData.lastTimestamp === null) {
        tfData.lastTimestamp = barTime
        tfData.lastPrice = price

        tfData.candles = [
          {
            time: formatUTCTimeLabel(barTime, timeframe),
            timestamp: barTime,
            open: price,
            high: price,
            low: price,
            close: price,
            isComplete: false,
          },
        ]
      }
      // Check if we need to start a new candle
      else if (barTime > tfData.lastTimestamp) {
        // Mark the current candle as complete
        if (tfData.candles.length > 0) {
          tfData.candles[tfData.candles.length - 1].isComplete = true
        }

        // Create a new candle
        tfData.candles.push({
          time: formatUTCTimeLabel(barTime, timeframe),
          timestamp: barTime,
          open: tfData.lastPrice || price, // Use last known price as open
          high: price,
          low: price,
          close: price,
          isComplete: false,
        })

        // Update tracking for the new timeframe
        tfData.lastTimestamp = barTime
        tfData.lastPrice = price

        // Limit the number of candles
        if (tfData.candles.length > maxBarsPerTimeframe[timeframe]) {
          tfData.candles = tfData.candles.slice(tfData.candles.length - maxBarsPerTimeframe[timeframe])
        }
      }
      // Update the current candle
      else {
        if (tfData.candles.length > 0) {
          const currentCandle = tfData.candles[tfData.candles.length - 1]
          currentCandle.close = price
          currentCandle.high = Math.max(currentCandle.high, price)
          currentCandle.low = Math.min(currentCandle.low, price)
          tfData.lastPrice = price
        }
      }

      newData[timeframe] = tfData
      return newData
    })
  }

  // Connect to Binance WebSocket for price data
  useEffect(() => {
    wsRef.current = new WebSocket("wss://fstream.binance.com/ws/btcusdt@kline_1m")

    wsRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.k) {
          const kline = data.k
          const price = Number.parseFloat(kline.c) // Close price
          const timestamp = data.E // Event time

          // Update all timeframes with this price
          Object.keys(TIMEFRAMES).forEach((tf) => {
            updatePriceTimeframeData(tf as TimeframeKey, timestamp, price)
          })
        }
      } catch (error) {
        console.error("Error processing kline data:", error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed")
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Listen for timeframe change events
  useEffect(() => {
    const handleScrollChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      onScrollChange(customEvent.detail)
    }

    window.addEventListener("scrollChange", handleScrollChange as EventListener)

    return () => {
      window.removeEventListener("scrollChange", handleScrollChange as EventListener)
    }
  }, [onScrollChange])

  // Set up mouse and touch events for scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMouseXRef.current = e.clientX
      container.style.cursor = "grabbing"
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - lastMouseXRef.current
      lastMouseXRef.current = e.clientX

      // Invert deltaX to make dragging left show older data (increasing scroll position)
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      container.style.cursor = "grab"
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const newPos = scrollPosition + (e.deltaY > 0 ? 5 : -5)
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        lastMouseXRef.current = e.clientX
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return

      const deltaX = e.touches[0].clientX - lastMouseXRef.current
      lastMouseXRef.current = e.touches[0].clientX

      // Invert deltaX to make dragging left show older data
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
        e.preventDefault() // Prevent page scrolling while dragging chart
      }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    container.addEventListener("mousedown", handleMouseDown)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("mouseleave", handleMouseUp)
    container.addEventListener("wheel", handleWheel)

    // Add touch events
    container.addEventListener("touchstart", handleTouchStart as EventListener)
    container.addEventListener("touchmove", handleTouchMove as EventListener, { passive: false })
    container.addEventListener("touchend", handleTouchEnd as EventListener)

    return () => {
      container.removeEventListener("mousedown", handleMouseDown)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("mouseleave", handleMouseUp)
      container.removeEventListener("wheel", handleWheel)

      // Remove touch events
      container.removeEventListener("touchstart", handleTouchStart as EventListener)
      container.removeEventListener("touchmove", handleTouchMove as EventListener)
      container.removeEventListener("touchend", handleTouchEnd as EventListener)
    }
  }, [timeframeData, timeframe, scrollPosition, onScrollChange])

  // Draw the price chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    // Set chart dimensions with increased right margin for labels and bottom margin for timestamps
    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Draw background
    ctx.fillStyle = "#1a2035" // Dark blue background for price chart
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#141b2d" // Slightly darker blue for the chart area
    ctx.fillRect(margin.left, margin.top, width, height)

    // Get candles for current timeframe
    const candles = timeframeData[timeframe]?.candles || []

    // Get visible data based on scroll position
    const visibleBars = visibleBarsPerTimeframe[timeframe]
    const start = Math.max(0, candles.length - visibleBars - scrollPosition)
    const end = Math.min(candles.length, start + visibleBars)
    const visibleData = candles.slice(start, end)

    if (visibleData.length === 0) {
      // Draw "Waiting for data" message
      ctx.fillStyle = "#8a94a6"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for price data...", margin.left + width / 2, margin.top + height / 2)
      return
    }

    // Find min and max values for scaling
    const minValue = Math.min(...visibleData.map((d) => d.low))
    const maxValue = Math.max(...visibleData.map((d) => d.high))
    const valueRange = maxValue - minValue

    // Add more padding to the value range to accommodate all price levels
    const paddedMin = minValue - valueRange * 0.1
    const paddedMax = maxValue + valueRange * 0.1
    const paddedRange = paddedMax - paddedMin

    // Scale functions
    const xScale = (i: number) => margin.left + (i * width) / (visibleData.length - 1 || 1)
    const yScale = (value: number) => margin.top + height - ((value - paddedMin) / paddedRange) * height

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Vertical grid lines only (horizontal grid lines removed)
    const verticalLines = Math.min(12, visibleData.length)
    for (let i = 0; i <= verticalLines; i++) {
      const x = margin.left + (i * width) / verticalLines
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + height)
      ctx.stroke()

      if (i < verticalLines) {
        const dataIndex = Math.floor((i * visibleData.length) / verticalLines)
        if (dataIndex < visibleData.length) {
          const timeLabel = visibleData[dataIndex].time

          // Draw timestamp horizontally
          ctx.fillStyle = "#8a94a6"
          ctx.textAlign = "center"
          ctx.font = "10px Arial"
          ctx.fillText(timeLabel, x, margin.top + height + 15)
        }
      }
    }

    // Draw price levels on right side with background for better visibility
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * height) / gridLines

      // Draw y-axis labels on right side with background
      const value = paddedMax - (i / gridLines) * paddedRange

      // Draw background for label
      ctx.fillStyle = "rgba(20, 27, 45, 0.8)" // Semi-transparent background matching chart
      ctx.fillRect(margin.left + width + 2, y - 10, margin.right - 4, 20)

      // Draw label
      ctx.fillStyle = "#8a94a6" // Light blue-gray for text
      ctx.textAlign = "left"
      ctx.font = "12px Arial"
      ctx.fillText(value.toFixed(1), margin.left + width + 5, y + 4)
    }

    // Add current price marker on y-axis if we have candles
    if (candles.length > 0) {
      const lastPrice = candles[candles.length - 1].close
      const lastPriceY = yScale(lastPrice)

      // Only draw if in visible range
      if (lastPriceY >= margin.top && lastPriceY <= margin.top + height) {
        // Draw horizontal line at last price
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(margin.left, lastPriceY)
        ctx.lineTo(margin.left + width, lastPriceY)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw background for current price label
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)" // Dark background for contrast
        ctx.fillRect(margin.left + width + 2, lastPriceY - 10, margin.right - 4, 20)

        // Draw price label on right y-axis
        ctx.fillStyle = "#fff"
        ctx.textAlign = "left"
        ctx.font = "bold 12px Arial"
        ctx.fillText(`◄ ${lastPrice.toFixed(1)}`, margin.left + width + 5, lastPriceY + 4)
      }
    }

    // Draw candlesticks
    const candleWidth = Math.min((width / visibleData.length) * 0.8, 15)

    visibleData.forEach((d, i) => {
      const x = margin.left + (i * width) / (visibleData.length - 1 || 1)
      const openY = yScale(d.open)
      const closeY = yScale(d.close)
      const highY = yScale(d.high)
      const lowY = yScale(d.low)

      // Determine if bullish or bearish
      const isBullish = d.close >= d.open

      // Use more vibrant colors for the current candle
      let bodyColor = isBullish ? "rgba(0, 192, 135, 0.8)" : "rgba(247, 105, 105, 0.8)" // Green for bullish, red for bearish
      let wickColor = isBullish ? "rgba(0, 192, 135, 0.9)" : "rgba(247, 105, 105, 0.9)"

      // Make the current candle more prominent
      if (!d.isComplete) {
        bodyColor = isBullish ? "rgba(0, 192, 135, 1)" : "rgba(247, 105, 105, 1)"
        wickColor = isBullish ? "rgba(0, 192, 135, 1)" : "rgba(247, 105, 105, 1)"
        ctx.lineWidth = 2 // Thicker for current candle
      } else {
        ctx.lineWidth = 1
      }

      // Draw wick
      ctx.strokeStyle = wickColor
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // Draw body
      const bodyTop = isBullish ? closeY : openY
      const bodyBottom = isBullish ? openY : closeY
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1) // Ensure at least 1px height

      ctx.fillStyle = bodyColor
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)

      // Add "LIVE" label to the current candle
      if (!d.isComplete) {
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.font = "bold 12px Arial"
        ctx.fillText("LIVE", x, highY - 10)
      }
    })

    // Draw axes
    ctx.strokeStyle = "#555"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + height)
    ctx.lineTo(margin.left + width, margin.top + height)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + height)
    ctx.stroke()

    // Draw title and info with background for better visibility
    // Background for title
    ctx.fillStyle = "rgba(26, 32, 53, 0.9)" // Semi-transparent background
    ctx.fillRect(margin.left - 5, margin.top - 20, 300, 20)

    // Current price value
    if (candles.length > 0) {
      const currentPrice = candles[candles.length - 1].close
      ctx.fillStyle = "#fff"
      ctx.font = "bold 14px Arial"
      ctx.fillText(`BTCUSDT Price (${timeframe}): ${currentPrice.toFixed(1)}`, margin.left, margin.top - 5)
    }

    // Candle count info with background
    ctx.fillStyle = "rgba(26, 32, 53, 0.9)" // Semi-transparent background
    ctx.fillRect(margin.left + width - 200, margin.top - 20, 200, 20)

    ctx.fillStyle = "#8a94a6"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`Showing ${visibleData.length} of ${candles.length} candles`, margin.left + width - 5, margin.top - 5)
  }, [timeframeData, timeframe, scrollPosition])

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-grab">
      <canvas ref={canvasRef} className="w-full h-full" />
      {scrollPosition > 0 && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Historical Data
        </div>
      )}
    </div>
  )
}

// Taker Delta Chart Component
interface TakerDeltaChartProps {
  timeframe: TimeframeKey
  scrollPosition: number
  onScrollChange: (position: number) => void
}

function TakerDeltaChart({ timeframe, scrollPosition, onScrollChange }: TakerDeltaChartProps) {
  // Initialize state for all timeframes
  const initialTimeframeData: DeltaTimeframeData = {}
  Object.keys(TIMEFRAMES).forEach((tf) => {
    initialTimeframeData[tf] = {
      candles: [],
      currentDelta: 0,
      currentHigh: 0,
      currentLow: 0,
      lastTimestamp: null,
    }
  })

  // Store data for all timeframes
  const [timeframeData, setTimeframeData] = useState<DeltaTimeframeData>(initialTimeframeData)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const isDraggingRef = useRef(false)
  const lastMouseXRef = useRef(0)

  // Update candle data for a specific timeframe
  function updateTimeframeData(timeframe: TimeframeKey, timestamp: number, delta: number) {
    setTimeframeData((prevData) => {
      const newData = { ...prevData }
      const tfData = { ...newData[timeframe] }
      const tfMinutes = TIMEFRAMES[timeframe]
      const barTime = roundToUTCTimeframe(timestamp, tfMinutes)

      // Initialize if this is the first update
      if (tfData.lastTimestamp === null) {
        tfData.lastTimestamp = barTime
        tfData.currentDelta = delta
        tfData.currentHigh = Math.max(0, delta)
        tfData.currentLow = Math.min(0, delta)

        tfData.candles = [
          {
            time: formatUTCTimeLabel(barTime, timeframe),
            timestamp: barTime,
            open: 0,
            close: delta,
            high: Math.max(0, delta),
            low: Math.min(0, delta),
            isComplete: false,
          },
        ]
      }
      // Check if we need to start a new candle
      else if (barTime > tfData.lastTimestamp) {
        // Mark the current candle as complete
        if (tfData.candles.length > 0) {
          tfData.candles[tfData.candles.length - 1].isComplete = true
        }

        // Create a new candle
        tfData.candles.push({
          time: formatUTCTimeLabel(barTime, timeframe),
          timestamp: barTime,
          open: 0,
          close: delta,
          high: Math.max(0, delta),
          low: Math.min(0, delta),
          isComplete: false,
        })

        // Reset tracking for the new timeframe
        tfData.lastTimestamp = barTime
        tfData.currentDelta = delta
        tfData.currentHigh = Math.max(0, delta)
        tfData.currentLow = Math.min(0, delta)

        // Limit the number of candles
        if (tfData.candles.length > maxBarsPerTimeframe[timeframe]) {
          tfData.candles = tfData.candles.slice(tfData.candles.length - maxBarsPerTimeframe[timeframe])
        }
      }
      // Update the current candle
      else {
        tfData.currentDelta += delta
        tfData.currentHigh = Math.max(tfData.currentHigh, tfData.currentDelta)
        tfData.currentLow = Math.min(tfData.currentLow, tfData.currentDelta)

        if (tfData.candles.length > 0) {
          const currentCandle = tfData.candles[tfData.candles.length - 1]
          currentCandle.close = tfData.currentDelta
          currentCandle.high = tfData.currentHigh
          currentCandle.low = tfData.currentLow
        }
      }

      newData[timeframe] = tfData
      return newData
    })
  }

  // Connect to Binance WebSocket and process trade data
  useEffect(() => {
    wsRef.current = new WebSocket("wss://fstream.binance.com/ws/btcusdt@trade")

    wsRef.current.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data)
        const qty = Number.parseFloat(t.q)
        const price = Number.parseFloat(t.p)
        const isSell = t.m
        const usd = qty * price
        const delta = isSell ? -usd : usd
        const now = Date.now()

        // Update all timeframes with this trade
        Object.keys(TIMEFRAMES).forEach((tf) => {
          updateTimeframeData(tf as TimeframeKey, now, delta)
        })
      } catch (error) {
        console.error("Error processing trade data:", error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed")
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Listen for timeframe change events
  useEffect(() => {
    const handleScrollChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      onScrollChange(customEvent.detail)
    }

    window.addEventListener("scrollChange", handleScrollChange as EventListener)

    return () => {
      window.removeEventListener("scrollChange", handleScrollChange as EventListener)
    }
  }, [onScrollChange])

  // Set up mouse and touch events for scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMouseXRef.current = e.clientX
      container.style.cursor = "grabbing"
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - lastMouseXRef.current
      lastMouseXRef.current = e.clientX

      // Invert deltaX to make dragging left show older data (increasing scroll position)
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      container.style.cursor = "grab"
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const newPos = scrollPosition + (e.deltaY > 0 ? 5 : -5)
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        lastMouseXRef.current = e.clientX
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return

      const deltaX = e.touches[0].clientX - lastMouseXRef.current
      lastMouseXRef.current = e.touches[0].clientX

      // Invert deltaX to make dragging left show older data
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
        e.preventDefault() // Prevent page scrolling while dragging chart
      }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    container.addEventListener("mousedown", handleMouseDown)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("mouseleave", handleMouseUp)
    container.addEventListener("wheel", handleWheel)

    // Add touch events
    container.addEventListener("touchstart", handleTouchStart as EventListener)
    container.addEventListener("touchmove", handleTouchMove as EventListener)
    container.addEventListener("touchend", handleTouchEnd as EventListener)

    return () => {
      container.removeEventListener("mousedown", handleMouseDown)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("mouseleave", handleMouseUp)
      container.removeEventListener("wheel", handleWheel)

      // Remove touch events
      container.removeEventListener("touchstart", handleTouchStart as EventListener)
      container.removeEventListener("touchmove", handleTouchMove as EventListener)
      container.removeEventListener("touchend", handleTouchEnd as EventListener)
    }
  }, [timeframeData, timeframe, scrollPosition, onScrollChange])

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    // Set chart dimensions with increased right margin for labels and bottom margin for timestamps
    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Draw background
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(margin.left, margin.top, width, height)

    // Get candles for current timeframe
    const candles = timeframeData[timeframe]?.candles || []

    // Get visible data based on scroll position
    const visibleBars = visibleBarsPerTimeframe[timeframe]
    const start = Math.max(0, candles.length - visibleBars - scrollPosition)
    const end = Math.min(candles.length, start + visibleBars)
    const visibleData = candles.slice(start, end)

    if (visibleData.length === 0) {
      // Draw "Waiting for data" message
      ctx.fillStyle = "#555"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for data...", margin.left + width / 2, margin.top + height / 2)
      return
    }

    // Find min and max values for scaling
    const minValue = Math.min(...visibleData.map((d) => d.low))
    const maxValue = Math.max(...visibleData.map((d) => d.high))
    const valueRange = maxValue - minValue

    // Add padding to the value range
    const paddedMin = minValue - valueRange * 0.1
    const paddedMax = maxValue + valueRange * 0.1
    const paddedRange = paddedMax - paddedMin

    // Scale functions
    const xScale = (i: number) => margin.left + (i * width) / (visibleData.length - 1 || 1)
    const yScale = (value: number) => margin.top + height - ((value - paddedMin) / paddedRange) * height

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Vertical grid lines only (horizontal grid lines removed)
    const verticalLines = Math.min(12, visibleData.length)
    for (let i = 0; i <= verticalLines; i++) {
      const x = margin.left + (i * width) / verticalLines
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + height)
      ctx.stroke()

      if (i < verticalLines) {
        const dataIndex = Math.floor((i * visibleData.length) / verticalLines)
        if (dataIndex < visibleData.length) {
          const timeLabel = visibleData[dataIndex].time

          // Draw timestamp horizontally
          ctx.fillStyle = "#aaa"
          ctx.textAlign = "center"
          ctx.font = "10px Arial"
          ctx.fillText(timeLabel, x, margin.top + height + 15)
        }
      }
    }

    // Draw delta levels on right side with background for better visibility
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * height) / gridLines

      // Draw y-axis labels on right side with background
      const value = paddedMax - (i / gridLines) * paddedRange

      // Draw background for label
      ctx.fillStyle = "rgba(26, 26, 26, 0.8)" // Semi-transparent background matching chart
      ctx.fillRect(margin.left + width + 2, y - 10, margin.right - 4, 20)

      // Draw label
      ctx.fillStyle = "#aaa"
      ctx.textAlign = "left"
      ctx.font = "12px Arial"
      ctx.fillText(value.toFixed(2), margin.left + width + 5, y + 4)
    }

    // Add current delta marker on y-axis if we have candles
    if (candles.length > 0) {
      const lastDelta = candles[candles.length - 1].close
      const lastDeltaY = yScale(lastDelta)

      // Only draw if in visible range
      if (lastDeltaY >= margin.top && lastDeltaY <= margin.top + height) {
        // Draw horizontal line at last delta
        ctx.strokeStyle = lastDelta >= 0 ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)"
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(margin.left, lastDeltaY)
        ctx.lineTo(margin.left + width, lastDeltaY)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw background for current delta label
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)" // Dark background for contrast
        ctx.fillRect(margin.left + width + 2, lastDeltaY - 10, margin.right - 4, 20)

        // Draw delta label on right y-axis
        ctx.fillStyle = lastDelta >= 0 ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)"
        ctx.textAlign = "left"
        ctx.font = "bold 12px Arial"
        ctx.fillText(`◄ ${lastDelta.toFixed(2)}`, margin.left + width + 5, lastDeltaY + 4)
      }
    }

    // Zero line
    const zeroY = yScale(0)
    if (zeroY >= margin.top && zeroY <= margin.top + height) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(margin.left, zeroY)
      ctx.lineTo(margin.left + width, zeroY)
      ctx.stroke()
    }

    // Draw candlesticks
    const candleWidth = Math.min((width / visibleData.length) * 0.8, 15)

    visibleData.forEach((d, i) => {
      const x = margin.left + (i * width) / (visibleData.length - 1 || 1)
      const openY = yScale(d.open) // Always 0
      const closeY = yScale(d.close)
      const highY = yScale(d.high)
      const lowY = yScale(d.low)

      // Determine if bullish or bearish
      const isBullish = d.close >= d.open

      // Use more vibrant colors for the current candle
      let color = isBullish ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)"

      // Make the current candle more prominent
      if (!d.isComplete) {
        color = isBullish ? "rgba(0, 255, 0, 0.9)" : "rgba(255, 0, 0, 0.9)"
        ctx.lineWidth = 2 // Thicker for current candle
      } else {
        ctx.lineWidth = 1
      }

      // Draw wick
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // Draw body
      const bodyTop = isBullish ? closeY : openY
      const bodyBottom = isBullish ? openY : closeY
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1) // Ensure at least 1px height

      ctx.fillStyle = color
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)

      // Add "LIVE" label to the current candle
      if (!d.isComplete) {
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.font = "bold 12px Arial"
        ctx.fillText("LIVE", x, highY - 10)
      }
    })

    // Draw axes
    ctx.strokeStyle = "#555"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + height)
    ctx.lineTo(margin.left + width, margin.top + height)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + height)
    ctx.stroke()

    // Draw title and info with background for better visibility
    // Background for title
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)" // Semi-transparent background
    ctx.fillRect(margin.left - 5, margin.top - 20, 300, 20)

    // Current delta value
    if (candles.length > 0) {
      const currentDelta = candles[candles.length - 1].close
      const color = currentDelta >= 0 ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)"
      ctx.fillStyle = color
      ctx.font = "bold 14px Arial"
      ctx.fillText(`Taker Delta (${timeframe}): ${currentDelta.toFixed(2)}`, margin.left, margin.top - 5)
    }

    // Candle count info with background
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)" // Semi-transparent background
    ctx.fillRect(margin.left + width - 200, margin.top - 20, 200, 20)

    ctx.fillStyle = "#777"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`Showing ${visibleData.length} of ${candles.length} candles`, margin.left + width - 5, margin.top - 5)
  }, [timeframeData, timeframe, scrollPosition])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 cursor-grab">
      <canvas ref={canvasRef} className="w-full h-full" />
      {scrollPosition > 0 && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Historical Data
        </div>
      )}
    </div>
  )
}

// Volume Chart Component
interface VolumeChartProps {
  timeframe: TimeframeKey
  scrollPosition: number
  onScrollChange: (position: number) => void
}

function VolumeChart({ timeframe, scrollPosition, onScrollChange }: VolumeChartProps) {
  // Initialize state for all timeframes
  const initialTimeframeData: Record<string, { candles: VolumeCandle[]; lastTimestamp: number | null }> = {}
  Object.keys(TIMEFRAMES).forEach((tf) => {
    initialTimeframeData[tf] = {
      candles: [],
      lastTimestamp: null,
    }
  })

  // Store data for all timeframes
  const [timeframeData, setTimeframeData] = useState(initialTimeframeData)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const isDraggingRef = useRef(false)
  const lastMouseXRef = useRef(0)

  // Volume candle interface
  interface VolumeCandle {
    time: string
    timestamp: number
    volume: number
    isComplete: boolean
  }

  // Update volume data for a specific timeframe
  function updateVolumeData(timeframe: TimeframeKey, timestamp: number, volume: number) {
    setTimeframeData((prevData) => {
      const newData = { ...prevData }
      const tfData = { ...newData[timeframe] }
      const tfMinutes = TIMEFRAMES[timeframe]
      const barTime = roundToUTCTimeframe(timestamp, tfMinutes)

      // Initialize if this is the first update
      if (tfData.lastTimestamp === null) {
        tfData.lastTimestamp = barTime
        tfData.candles = [
          {
            time: formatUTCTimeLabel(barTime, timeframe),
            timestamp: barTime,
            volume: volume,
            isComplete: false,
          },
        ]
      }
      // Check if we need to start a new candle
      else if (barTime > tfData.lastTimestamp) {
        // Mark the current candle as complete
        if (tfData.candles.length > 0) {
          tfData.candles[tfData.candles.length - 1].isComplete = true
        }

        // Create a new candle
        tfData.candles.push({
          time: formatUTCTimeLabel(barTime, timeframe),
          timestamp: barTime,
          volume: volume,
          isComplete: false,
        })

        // Update tracking for the new timeframe
        tfData.lastTimestamp = barTime

        // Limit the number of candles
        if (tfData.candles.length > maxBarsPerTimeframe[timeframe]) {
          tfData.candles = tfData.candles.slice(tfData.candles.length - maxBarsPerTimeframe[timeframe])
        }
      }
      // Update the current candle
      else {
        if (tfData.candles.length > 0) {
          const currentCandle = tfData.candles[tfData.candles.length - 1]
          currentCandle.volume += volume
        }
      }

      newData[timeframe] = tfData
      return newData
    })
  }

  // Connect to Binance WebSocket and process trade data
  useEffect(() => {
    wsRef.current = new WebSocket("wss://fstream.binance.com/ws/btcusdt@trade")

    wsRef.current.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data)
        const qty = Number.parseFloat(t.q)
        const price = Number.parseFloat(t.p)
        const volume = qty * price
        const now = Date.now()

        // Update all timeframes with this trade
        Object.keys(TIMEFRAMES).forEach((tf) => {
          updateVolumeData(tf as TimeframeKey, now, volume)
        })
      } catch (error) {
        console.error("Error processing trade data:", error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed")
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Set up mouse and touch events for scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMouseXRef.current = e.clientX
      container.style.cursor = "grabbing"
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - lastMouseXRef.current
      lastMouseXRef.current = e.clientX

      // Invert deltaX to make dragging left show older data (increasing scroll position)
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      container.style.cursor = "grab"
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const newPos = scrollPosition + (e.deltaY > 0 ? 5 : -5)
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        lastMouseXRef.current = e.clientX
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return

      const deltaX = e.touches[0].clientX - lastMouseXRef.current
      lastMouseXRef.current = e.touches[0].clientX

      // Invert deltaX to make dragging left show older data
      const newPos = scrollPosition - deltaX
      const maxScroll = Math.max(0, timeframeData[timeframe].candles.length - visibleBarsPerTimeframe[timeframe])
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll))

      if (clampedPos !== scrollPosition) {
        onScrollChange(clampedPos)
      }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    container.addEventListener("mousedown", handleMouseDown)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("mouseleave", handleMouseUp)
    container.addEventListener("wheel", handleWheel)

    // Add touch events
    container.addEventListener("touchstart", handleTouchStart as EventListener)
    container.addEventListener("touchmove", handleTouchMove as EventListener)
    container.addEventListener("touchend", handleTouchEnd as EventListener)

    return () => {
      container.removeEventListener("mousedown", handleMouseDown)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("mouseleave", handleMouseUp)
      container.removeEventListener("wheel", handleWheel)

      // Remove touch events
      container.removeEventListener("touchstart", handleTouchStart as EventListener)
      container.removeEventListener("touchmove", handleTouchMove as EventListener)
      container.removeEventListener("touchend", handleTouchEnd as EventListener)
    }
  }, [timeframeData, timeframe, scrollPosition, onScrollChange])

  // Draw the volume chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    // Set chart dimensions with increased right margin for labels and bottom margin for timestamps
    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Draw background
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(margin.left, margin.top, width, height)

    // Get candles for current timeframe
    const candles = timeframeData[timeframe]?.candles || []

    // Get visible data based on scroll position
    const visibleBars = visibleBarsPerTimeframe[timeframe]
    const start = Math.max(0, candles.length - visibleBars - scrollPosition)
    const end = Math.min(candles.length, start + visibleBars)
    const visibleData = candles.slice(start, end)

    if (visibleData.length === 0) {
      // Draw "Waiting for data" message
      ctx.fillStyle = "#555"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for volume data...", margin.left + width / 2, margin.top + height / 2)
      return
    }

    // Find max volume for scaling
    const maxVolume = Math.max(...visibleData.map((d) => d.volume))

    // Add padding to the max volume
    const paddedMaxVolume = maxVolume * 1.1

    // Scale functions
    const xScale = (i: number) => margin.left + (i * width) / (visibleData.length - 1 || 1)
    const yScale = (volume: number) => margin.top + height - (volume / paddedMaxVolume) * height

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Vertical grid lines only
    const verticalLines = Math.min(12, visibleData.length)
    for (let i = 0; i <= verticalLines; i++) {
      const x = margin.left + (i * width) / verticalLines
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + height)
      ctx.stroke()

      if (i < verticalLines) {
        const dataIndex = Math.floor((i * visibleData.length) / verticalLines)
        if (dataIndex < visibleData.length) {
          const timeLabel = visibleData[dataIndex].time

          // Draw timestamp horizontally
          ctx.fillStyle = "#aaa"
          ctx.textAlign = "center"
          ctx.font = "10px Arial"
          ctx.fillText(timeLabel, x, margin.top + height + 15)
        }
      }
    }

    // Draw volume bars
    const barWidth = Math.min((width / visibleData.length) * 0.8, 15)

    visibleData.forEach((d, i) => {
      const x = margin.left + (i * width) / (visibleData.length - 1 || 1)
      const y = yScale(d.volume)
      const barHeight = height + margin.top - y

      // Use a blue color for volume bars
      const color = d.isComplete ? "rgba(100, 149, 237, 0.7)" : "rgba(100, 149, 237, 0.9)"

      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight)

      // Add "LIVE" label to the current bar
      if (!d.isComplete) {
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.font = "bold 12px Arial"
        ctx.fillText("LIVE", x, y - 10)
      }
    })

    // Draw volume levels on right side
    const volumeLevels = 4
    for (let i = 0; i <= volumeLevels; i++) {
      const y = margin.top + (i * height) / volumeLevels
      const volumeValue = paddedMaxVolume - (i / volumeLevels) * paddedMaxVolume

      // Format volume value
      let formattedVolume: string
      if (volumeValue >= 1000000) {
        formattedVolume = `$${(volumeValue / 1000000).toFixed(1)}M`
      } else if (volumeValue >= 1000) {
        formattedVolume = `$${(volumeValue / 1000).toFixed(1)}K`
      } else {
        formattedVolume = `$${volumeValue.toFixed(1)}`
      }

      // Draw background for label
      ctx.fillStyle = "rgba(26, 26, 26, 0.8)"
      ctx.fillRect(margin.left + width + 2, y - 10, margin.right - 4, 20)

      // Draw label
      ctx.fillStyle = "#aaa"
      ctx.textAlign = "left"
      ctx.font = "12px Arial"
      ctx.fillText(formattedVolume, margin.left + width + 5, y + 4)
    }

    // Draw axes
    ctx.strokeStyle = "#555"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + height)
    ctx.lineTo(margin.left + width, margin.top + height)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + height)
    ctx.stroke()

    // Draw title
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left - 5, margin.top - 20, 300, 20)

    ctx.fillStyle = "#fff"
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Volume (${timeframe})`, margin.left, margin.top - 5)

    // Draw info
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left + width - 200, margin.top - 20, 200, 20)

    ctx.fillStyle = "#777"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`Showing ${visibleData.length} of ${candles.length} bars`, margin.left + width - 5, margin.top - 5)
  }, [timeframeData, timeframe, scrollPosition])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 cursor-grab">
      <canvas ref={canvasRef} className="w-full h-full" />
      {scrollPosition > 0 && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Historical Data
        </div>
      )}
    </div>
  )
}
