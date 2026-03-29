import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '../redux/store';
import * as SecureStore from 'expo-secure-store';
import { authSuccess } from '../redux/slices/authSlice';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

function RootLayoutNav() {
  const { token, role } = useSelector((state: any) => state.auth);
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const colorScheme = useColorScheme();

  // 1. Check for existing session on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('userToken');
        const savedRole = await SecureStore.getItemAsync('userRole');

        if (savedToken && savedRole) {
          // If found, hydrate Redux state
          dispatch(authSuccess({ token: savedToken, role: savedRole }));
        }
      } catch (e) {
        console.error("Failed to load token", e);
      } finally {
        setIsReady(true);
      }
    };

    bootstrapAsync();
  }, [dispatch]);

  // 2. Role-Based Navigation Logic
  useEffect(() => {
    if (!isReady) return; // Don't navigate until we've checked SecureStore

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inUserGroup = (segments[0] as string) === '(user)';

    if (!token) {
      // If no token, force user to Register by default
      if (!inAuthGroup) {
        router.replace('/(auth)/signup' as any);
      }
    } else {
      // If token exists, keep users out of the auth screens.
      if (role === 'User' && !inUserGroup) {
        router.replace('/(user)' as any);
      }
    }
  }, [token, role, isReady, segments, router]);

  // 3. Show a loading spinner while checking SecureStore
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
      </Stack>
    </ThemeProvider>
  );
}

// Wrap the whole thing in the Redux Provider
export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
