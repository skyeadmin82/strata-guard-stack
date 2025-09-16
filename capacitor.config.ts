import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7319794c26144e1c880082fbebedcd80',
  appName: 'strata-guard-stack',
  webDir: 'dist',
  server: {
    url: 'https://7319794c-2614-4e1c-8800-82fbebedcd80.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    Camera: {
      permissions: {
        camera: 'This app uses the camera to capture photos for work orders.'
      }
    },
    Geolocation: {
      permissions: {
        location: 'This app uses location services to track field service activities.'
      }
    }
  }
};

export default config;