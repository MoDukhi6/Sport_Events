import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const sports = [
  { id: 'football', name: 'Football', icon: require('../../assets/icons/football.png') },
  { id: 'basketball', name: 'Basketball', icon: require('../../assets/icons/basketball.png') },
  { id: 'tennis', name: 'Tennis', icon: require('../../assets/icons/tennis.png') },
  { id: 'baseball', name: 'Baseball', icon: require('../../assets/icons/baseball.png') },
  { id: 'f1', name: 'Formula 1', icon: require('../../assets/icons/f1.png') },
  { id: 'hockey', name: 'Hockey', icon: require('../../assets/icons/hockey.png') },
];

export default function SportPage() {
  const handlePress = (id: string) => {
    router.push(`/leagues/${id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Select a Sport</Text>

        <FlatList
          data={sports}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handlePress(item.id)}>
              <Image source={item.icon} style={styles.icon} resizeMode="contain" />
              <Text style={styles.label}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,  // 🔽 Adjust this (20–40) to control distance from notch
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '48%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});