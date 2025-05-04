"use client"

import { useEffect, useRef, useState } from "react"
import { CandlestickChart } from "./candlestick-chart"

interface DeltaCandle {
  time: string
  timestamp: number
  open: number
  close: number
  high: number
  low: number
  delta: number
  minDelta: number
  maxDelta: number
}

export default function TakerDeltaChart() {
  const [chartData, setChartData] = useState<DeltaCandle[]>([])
  const lastBarTimeRef = useRef<number | null>(null)
  const deltaUSDRef = useRef<number>(0)
  const minDeltaRef = useRef<number>(0)
  const maxDeltaRef = useRef<number>(0)
  const wsRef = useRef<WebSocket | null>(null)
  const maxBars = 288 // 24 hours of 5-min bars

  function roundTo5Min(timestamp: number) {
    const date = new Date(timestamp)
    date.setSeconds(0, 0)
    date.setMinutes(date.getMinutes() - (date.getMinutes() % 5))
    return date.getTime()
  }

  function formatTimeLabel(timestamp: number) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function addDeltaBar(timestamp: number, delta: number, minD: number, maxD: number) {
    const label = formatTimeLabel(timestamp)

    // For candlestick chart:
    // - We use delta as both open and close (for the body)
    // - high = max delta
    // - low = min delta
    const candleData = {
      time: label,
      timestamp: timestamp,
      open: delta,
      close: delta,
      high: maxD,
      low: minD,
      delta: delta,
      minDelta: minD,
      maxDelta: maxD,
    }

    setChartData((prevData) => {
      const newData = [...prevData, candleData]

      // Keep only the last maxBars
      if (newData.length > maxBars) {
        return newData.slice(newData.length - maxBars)
      }
      return newData
    })
  }

  useEffect(() => {
    // Connect to Binance WebSocket
    wsRef.current = new WebSocket("wss://fstream.binance.com/ws/btcusdt@trade")

    wsRef.current.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data)
        const qty = Number.parseFloat(t.q)
        const price = Number.parseFloat(t.p)
        const isSell = t.m
        const usd = qty * price

        const now = Date.now()
        const currentBar = roundTo5Min(now)

        if (!lastBarTimeRef.current) {
          lastBarTimeRef.current = currentBar
        }

        if (currentBar > lastBarTimeRef.current) {
          // Add the completed bar
          addDeltaBar(lastBarTimeRef.current, deltaUSDRef.current, minDeltaRef.current, maxDeltaRef.current)

          // Reset for new bar
          deltaUSDRef.current = 0
          minDeltaRef.current = 0
          maxDeltaRef.current = 0
          lastBarTimeRef.current = currentBar
        }

        const delta = isSell ? -usd : usd
        deltaUSDRef.current += delta
        minDeltaRef.current = Math.min(minDeltaRef.current, deltaUSDRef.current)
        maxDeltaRef.current = Math.max(maxDeltaRef.current, deltaUSDRef.current)
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

  return (
    <div className="w-full h-full">
      <CandlestickChart data={chartData} />
    </div>
  )
}
