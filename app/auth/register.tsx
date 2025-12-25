// app/auth/register.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Missing info', 'Please fill username, email and password');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Registration failed');
      }

      // 🔧 NEW: Save user data immediately after registration
      const userObject = {
        _id: data.userId,
        username: data.username || username,
        email: email,
        gameStats: {
          totalPoints: 0,
          level: 1,
          totalPredictions: 0,
          perfectPredictions: 0,
          correctWinners: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      };

      await AsyncStorage.setItem('user', JSON.stringify(userObject));
      await AsyncStorage.setItem('@userId', data.userId);
      await AsyncStorage.setItem('@username', data.username || username);

      // Auto-login and redirect to home
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/home' as any);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Register failed', e?.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Sport Events</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          placeholder="yourusername"
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          style={styles.input}
        />

        <Pressable style={styles.btn} onPress={onRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign up</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.muted}>Already have an account?</Text>
          <Link href="/auth/login">
            <Text style={styles.link}>Log in</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  brand: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16, color: '#2563eb' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  label: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  btn: { marginTop: 16, backgroundColor: '#2563eb', borderRadius: 10, height: 48, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  muted: { color: '#6b7280' },
  link: { color: '#2563eb', fontWeight: '700' },
});