"use client"

import type React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface MapViewProps {
  onItemSelect: (item: any) => void
  items: any[]
}

const MapView: React.FC<MapViewProps> = ({ onItemSelect, items }) => {
  const handleMarkerClick = (item: any) => {
    onItemSelect(item)
  }

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lng]} onClick={() => handleMarkerClick(item)}>
          <Popup>{item.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapView
