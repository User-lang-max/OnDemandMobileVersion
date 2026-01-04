import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function ActiveJobTracking({ job, isProvider }) {
  const [providerPos, setProviderPos] = useState(null);
  const watcherRef = useRef(null);

  // Destination (client)
  const destPos = job?.lat && job?.lng
    ? { lat: job.lat, lng: job.lng }
    : job?.destinationLat && job?.destinationLng
      ? { lat: job.destinationLat, lng: job.destinationLng }
      : null;

  useEffect(() => {
    (async () => {
      // Permission GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "La localisation est requise");
        return;
      }

      // Position initiale
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setProviderPos({
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });

      // Tracking temps réel 
      if (isProvider) {
        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            setProviderPos({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        );
      }
    })();

    return () => {
      // Nettoyage GPS
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
    };
  }, []);

  if (!providerPos) {
    return <Text>Recherche GPS...</Text>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: providerPos.lat,
          longitude: providerPos.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Prestataire */}
        <Marker
          coordinate={{
            latitude: providerPos.lat,
            longitude: providerPos.lng,
          }}
          title="Prestataire"
        />

        {/* Destination */}
        {destPos && (
          <Marker
            coordinate={{
              latitude: destPos.lat,
              longitude: destPos.lng,
            }}
            title="Destination"
            pinColor="teal"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
