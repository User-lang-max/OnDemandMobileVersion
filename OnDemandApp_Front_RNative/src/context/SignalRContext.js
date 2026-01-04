import React, { createContext, useContext, useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignalRContext = createContext(null);

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const connect = async () => {
      const token = await AsyncStorage.getItem('userToken'); 
      if (!token) return;

      
      const newConnection = new HubConnectionBuilder()
        .withUrl("http://192.168.1.103:5234/notification", { 
          accessTokenFactory: () => token 
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);
    };

    connect();
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => console.log(' SignalR Mobile Connecté !'))
        .catch(err => console.error(' Erreur SignalR Mobile:', err));
    }
  }, [connection]);

  return (
    <SignalRContext.Provider value={{ connection }}>
      {children}
    </SignalRContext.Provider>
  );
};