import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1677ff',
      light: '#e6f4ff',
      dark: '#0958d9',
    },
    background: {
      default: '#fafafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#262626',
      secondary: '#687182',
    },
    divider: '#e6ebf1',
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: 'Public Sans, Arial, sans-serif',
    h1: { fontSize: '1.875rem', fontWeight: 600, lineHeight: 1.3 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #1677ff',
            outlineOffset: 2,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        outlined: { borderColor: '#e6ebf1' },
      },
    },
  },
})
