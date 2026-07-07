import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  gothicBack: '#0a0b0d',
  gothicDark: '#111216',
  gothicCard: '#181a20',
  gothicBorder: '#2e323e',
  gothicBorderGlow: '#42495b',
  gothicGold: '#c89e5c',
  gothicGoldDim: '#927341',
  gothicCrimson: '#a42c38',
  gothicBlood: '#dc2626',
  gothicBlue: '#3d5677',
  gothicSky: '#6e8fa8',
  gothicVoid: '#050505',
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
};

export const FONTS = {
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  cinzel: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Elegant serif fallback for gothic heading style
};

export const THEME_STYLES = StyleSheet.create({
  gothicBorder: {
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    backgroundColor: COLORS.gothicCard,
    padding: 12,
  },
  gothicBorderFancy: {
    borderWidth: 2,
    borderColor: COLORS.gothicGold,
    borderRadius: 8,
    backgroundColor: COLORS.gothicCard,
    padding: 12,
    shadowColor: COLORS.gothicGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filigreeCorner: {
    width: 8,
    height: 8,
    borderColor: COLORS.gothicGold,
    borderWidth: 1,
    position: 'absolute',
  }
});
