# FitTrack - React Native Fitness App

A modern fitness tracking application built with React Native, Expo, TypeScript, and Firebase.

## Features

- 🔐 **Authentication**: Secure user registration and login with Firebase Auth
- 📱 **Modern UI**: Beautiful, responsive design matching fitness app standards
- 🔧 **Type Safety**: Full TypeScript implementation for better development experience
- 🏗️ **Clean Architecture**: Well-structured codebase with reusable components
- 🔄 **State Management**: Zustand for efficient state management
- 🧭 **Navigation**: React Navigation for smooth app navigation

## Screenshots

The app includes two main authentication screens:
- **Login Screen**: Clean design with email/password fields and forgot password option
- **Sign Up Screen**: User registration with full name, email, and password fields

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Firebase** for authentication and backend services
- **React Navigation** for navigation
- **Zustand** for state management
- **React Native Safe Area Context** for safe area handling

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project setup

## Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <repository-url>
cd FitTrack
npm install
\`\`\`

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Get your Firebase configuration from Project Settings

### 3. Environment Configuration

1. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Update `.env` with your Firebase credentials:
   \`\`\`
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   FIREBASE_APP_ID=your_app_id_here
   \`\`\`

### 4. Run the Application

\`\`\`bash
npm start
\`\`\`

This will start the Expo development server. You can then:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with Expo Go app on your phone

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── AuthHeader.tsx   # Authentication screen header
│   ├── CustomButton.tsx # Styled button component
│   ├── CustomInput.tsx  # Styled input component
│   └── FitnessIcon.tsx  # Fitness-themed icons
├── lib/
│   └── firebase.ts      # Firebase configuration
├── navigation/
│   └── AppNavigator.tsx # Main navigation setup
├── screens/             # Application screens
│   ├── HomeScreen.tsx   # Main app screen
│   ├── LoginScreen.tsx  # User login
│   └── SignUpScreen.tsx # User registration
├── services/
│   └── authService.ts   # Authentication service layer
└── store/
    └── authStore.ts     # Authentication state management
\`\`\`

## Components

### Reusable Components

- **CustomInput**: Styled text input with consistent design
- **CustomButton**: Primary and secondary button variants with loading states
- **AuthHeader**: Header component with fitness-themed icons and titles
- **FitnessIcon**: Custom icon component for different screen types

### Services

- **AuthService**: Handles all Firebase authentication operations
  - User registration with email/password
  - User login
  - User logout
  - Error handling and user-friendly messages

### State Management

- **authStore**: Zustand store for authentication state
  - User information storage
  - Login/logout actions
  - Persistent authentication state

## Authentication Flow

1. **App Initialization**: Auth state listener checks for existing user session
2. **Login/Signup**: Users can authenticate using email and password
3. **Navigation**: Automatic navigation based on authentication state
4. **Logout**: Clean logout with state reset

## Error Handling

The app includes comprehensive error handling:
- Firebase authentication errors are translated to user-friendly messages
- Form validation for required fields
- Network error handling
- Loading states for better UX

## Security Features

- Password validation (minimum 6 characters)
- Email format validation
- Firebase security rules (to be configured)
- Secure token storage with React Native AsyncStorage

## Development

### Code Quality

- **ESLint**: Code linting with React Native specific rules
- **TypeScript**: Full type safety
- **Prettier**: Code formatting (configure in your IDE)

### Scripts

- `npm start`: Start Expo development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS
- `npm run web`: Run on web (if supported)

## Future Enhancements

- [ ] Password reset functionality
- [ ] Social media authentication (Google, Facebook)
- [ ] User profile management
- [ ] Workout tracking features
- [ ] Progress analytics
- [ ] Push notifications
- [ ] Offline support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
