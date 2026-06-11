import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'lycheetah_onboarded';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboarded(val === 'true');
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
