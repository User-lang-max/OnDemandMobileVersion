import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function AdminLiveMap({ providers = [] }) {
  const first = providers?.[0];
  const initialRegion = {
    latitude: first?.lat ?? 33.5731,
    longitude: first?.lng ?? -7.5898,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        {providers.map((p) => (
          <Marker
            key={p.id || `${p.lat}-${p.lng}`}
            coordinate={{
              latitude: p.lat ?? 33.5731,
              longitude: p.lng ?? -7.5898,
            }}
            title={p.fullName || p.name || "Prestataire"}
            description={p.service || p.category || ""}
          />
        ))}
      </MapView>
    </View>
  );
}
