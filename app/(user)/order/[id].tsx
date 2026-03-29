import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrderProcessingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock initial state for demo
  const [status, setStatus] = useState('Accepted'); // 'Accepted', 'Preparing', 'Ready'

  const handleStartPreparing = () => {
    setStatus('Preparing');
    Alert.alert("Status Updated", "Order is now in Preparing state.");
  };

  const handleMarkReady = () => {
    setStatus('Ready');
    Alert.alert("Status Updated", "Order is marked as Ready!");
  };

  const getStatusColor = (currentStep: string) => {
    const sequence = ['Accepted', 'Preparing', 'Ready'];
    const currentIndex = sequence.indexOf(status);
    const stepIndex = sequence.indexOf(currentStep);

    if (stepIndex < currentIndex) return Colors.default.primary; // Completed
    if (stepIndex === currentIndex) return '#ff8c00'; // Active
    return '#ccc'; // Pending
  };

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumberTitle}>Order #{id}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{status}</Text>
            </View>
          </View>

          <Text style={styles.detailLabel}>Customer Name</Text>
          <Text style={styles.detailText}>John Doe</Text>

          <View style={styles.divider} />

          <Text style={styles.detailLabel}>Order Items</Text>
          <View style={styles.itemsList}>
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>• Chicken Rice</Text>
              <Text style={styles.itemQty}>x2</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>• Coke</Text>
              <Text style={styles.itemQty}>x1</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Status Tracker */}
          <Text style={styles.detailLabel}>Order Journey</Text>
          <View style={styles.trackerContainer}>
            <View style={[styles.trackerDot, { backgroundColor: getStatusColor('Accepted') }]} />
            <View style={[styles.trackerLine, { backgroundColor: getStatusColor('Preparing') }]} />
            <View style={[styles.trackerDot, { backgroundColor: getStatusColor('Preparing') }]} />
            <View style={[styles.trackerLine, { backgroundColor: getStatusColor('Ready') }]} />
            <View style={[styles.trackerDot, { backgroundColor: getStatusColor('Ready') }]} />
          </View>

          <View style={styles.trackerLabels}>
            <Text style={[styles.trackerLabel, { color: getStatusColor('Accepted') }]}>Accepted</Text>
            <Text style={[styles.trackerLabel, { color: getStatusColor('Preparing'), textAlign: 'center' }]}>Preparing</Text>
            <Text style={[styles.trackerLabel, { color: getStatusColor('Ready'), textAlign: 'right' }]}>Ready</Text>
          </View>

          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                status !== 'Accepted' && styles.actionBtnDisabled
              ]} 
              onPress={handleStartPreparing}
              disabled={status !== 'Accepted'}
            >
              <Text style={styles.actionBtnText}>Start Preparing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                styles.actionBtnSecondary,
                status !== 'Preparing' && styles.actionBtnDisabled
              ]} 
              onPress={handleMarkReady}
              disabled={status !== 'Preparing'}
            >
              <Text style={[styles.actionBtnText, { color: Colors.default.primary }]}>
                Mark as Ready
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderNumberTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.default.primary,
  },
  badge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#e65100',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  itemsList: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#444',
  },
  itemQty: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  trackerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 10,
  },
  trackerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  trackerLine: {
    flex: 1,
    height: 3,
  },
  trackerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  trackerLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: Colors.default.primary,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.default.primary,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
