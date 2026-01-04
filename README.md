# OnDemandMobileVersion

OnDemandAPP est une application mobile développée avec **React Native (Expo)**, permettant de mettre en relation des **clients** et des **prestataires de services** via une plateforme centralisée.
L’application communique avec un **backend .NET sécurisé**, offrant une expérience fluide, moderne et sécurisée.

---

## Fonctionnalités principales

* Authentification sécurisée (JWT)
* Gestion des rôles : Client / Prestataire / Admin
* Consultation et commande de services
* Localisation et suivi des prestations
* Notifications (Firebase Cloud Messaging)
* Paiement sécurisé (backend)
* Gestion du profil et déconnexion
* Tableaux de bord adaptés selon le rôle

---

## Technologies utilisées

### Frontend (Mobile)

* React Native
* Expo
* JavaScript
* React Navigation
* Axios
* AsyncStorage
* Firebase (Auth & Notifications)

### Backend (séparé)

* .NET / ASP.NET Core
* SQL Server
* JWT
* Firebase Admin SDK


---

## Prérequis

Avant de lancer le projet, assure-toi d’avoir installé :

* Node.js (v18 ou plus recommandé)
* npm ou yarn
* Expo CLI
* Git
* Un émulateur Android / iOS ou l’application Expo Go

---

## Installation des dépendances

### 1. Cloner le dépôt

```bash
git clone https://github.com/User-lang-max/OnDemandAPP_MobileVersion.git
cd OnDemandAPP_MobileVersion
```

---

### 2. Installer les dépendances

```bash
npm install
```

ou avec yarn :

```bash
yarn install
```

---

### 3. Dépendances principales utilisées

```bash
npm install axios
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install @react-native-async-storage/async-storage
npm install firebase
npm install react-native-safe-area-context
npm install react-native-screens
```

### Dépendances Expo (si non installées automatiquement)

```bash
npx expo install react-native-gesture-handler
npx expo install react-native-reanimated
npx expo install expo-notifications
npx expo install expo-location
```

---

## Configuration des variables d’environnement

Les fichiers sensibles (Firebase, clés API) ne sont pas versionnés.

Créer un fichier `.env` à la racine du projet :

```env
API_BASE_URL=http://localhost:5000/api
FIREBASE_API_KEY=xxxxxxxx
FIREBASE_AUTH_DOMAIN=xxxxxxxx
FIREBASE_PROJECT_ID=xxxxxxxx
FIREBASE_STORAGE_BUCKET=xxxxxxxx
FIREBASE_MESSAGING_SENDER_ID=xxxxxxxx
FIREBASE_APP_ID=xxxxxxxx
```

Le fichier `.env` est ignoré via `.gitignore`.

---

## Lancer l’application

```bash
npx expo start
```

Puis :

* Scanner le QR code avec Expo Go
* Lancer sur Android Emulator
* Lancer sur iOS Simulator (macOS)

---

## Structure du projet (simplifiée)

```text
OnDemandAPP_MobileVersion/
│
├── assets/
├── src/
│   ├── api/
│   ├── components/
│   ├── navigation/
│   ├── screens/
│   ├── context/
│   └── services/
│
├── App.js
├── app.json
├── package.json
├── .gitignore
└── README.md
```

---

## Sécurité

* Aucune clé sensible versionnée
* Authentification JWT
* Firebase Admin utilisé uniquement côté backend
* Variables sensibles stockées via `.env`

---

## Auteur

Projet réalisé dans un cadre académique et professionnel
Développé par **ALAOUI DRAI Zineb**

---

## Licence

Ce projet est destiné à un usage éducatif et démonstratif.
Toute utilisation commerciale nécessite une autorisation préalable.


* aligner le nom du repo, du projet et de l’app
* créer un README séparé pour le backend


