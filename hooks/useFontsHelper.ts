import { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export function useFontsHelper() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Skip actual font loading for now, just use system fonts
        setIsLoaded(true);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsLoaded(true);
      }
    }

    prepare();
  }, []);

  return isLoaded;
}
