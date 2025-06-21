import { StyleSheet, Platform, StatusBar } from 'react-native';

// Global constants for consistent styling
export const GlobalStyles = {
  colors: {
    primary: '#2196F3',
    secondary: '#FFC107',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    text: '#1A1A1A',
    textSecondary: '#8B9CB5',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E8E8E8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      allowFontScaling: false,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      allowFontScaling: false,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      allowFontScaling: false,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      allowFontScaling: false,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      allowFontScaling: false,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      allowFontScaling: false,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      allowFontScaling: false,
    },
  },
  layout: {
    topPadding: 30, // Consistent top padding for all screens
  },
};

// Safe area padding for different platforms
export const getSafeAreaPadding = () => {
  if (Platform.OS === 'ios') {
    return {
      paddingTop: 44, // Standard iOS safe area
    };
  } else {
    return {
      paddingTop: StatusBar.currentHeight || 24,
    };
  }
};

// Container style with safe area
export const safeAreaContainer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.background,
    ...getSafeAreaPadding(),
  },
});

export default GlobalStyles;
