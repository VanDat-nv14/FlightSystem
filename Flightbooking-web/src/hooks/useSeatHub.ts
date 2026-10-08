import { useEffect, useRef } from "react"
import * as signalR from "@microsoft/signalr"
import { API_BASE_URL } from "../services/config"

const HUB_URL = API_BASE_URL.replace(/\/api\/?$/, "") + "/hubs/seats"

export interface UseSeatHubProps {
  flightId: number
  onSeatHeld?: (flightId: number, seatNumbers: string[]) => void
  onSeatReleased?: (flightId: number, seatNumbers: string[]) => void
  onSeatBooked?: (flightId: number, seatNumbers: string[]) => void
}

export function useSeatHub({
  flightId,
  onSeatHeld,
  onSeatReleased,
  onSeatBooked,
}: UseSeatHubProps) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const onSeatHeldRef = useRef(onSeatHeld)
  const onSeatReleasedRef = useRef(onSeatReleased)
  const onSeatBookedRef = useRef(onSeatBooked)

  useEffect(() => {
    onSeatHeldRef.current = onSeatHeld
    onSeatReleasedRef.current = onSeatReleased
    onSeatBookedRef.current = onSeatBooked
  })

  useEffect(() => {
    if (!flightId || flightId <= 0) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connectionRef.current = connection

    connection.on("SeatHeld", (fId: number, seatNumbers: string[]) => {
      if (fId === flightId) {
        onSeatHeldRef.current?.(fId, seatNumbers)
      }
    })

    connection.on("SeatReleased", (fId: number, seatNumbers: string[]) => {
      if (fId === flightId) {
        onSeatReleasedRef.current?.(fId, seatNumbers)
      }
    })

    connection.on("SeatBooked", (fId: number, seatNumbers: string[]) => {
      if (fId === flightId) {
        onSeatBookedRef.current?.(fId, seatNumbers)
      }
    })

    let isMounted = true

    async function startConnection() {
      try {
        await connection.start()
        if (isMounted && connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke("JoinFlight", flightId)
        }
      } catch (err) {
        console.warn("SignalR SeatHub connection failed:", err)
      }
    }

    connection.onreconnected(async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke("JoinFlight", flightId)
        }
      } catch (err) {
        console.warn("SignalR Re-join flight failed:", err)
      }
    })

    startConnection()

    return () => {
      isMounted = false
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveFlight", flightId).catch(() => {})
      }
      connection.stop().catch(() => {})
      connectionRef.current = null
    }
  }, [flightId])

  return {
    connection: connectionRef.current,
  }
}
