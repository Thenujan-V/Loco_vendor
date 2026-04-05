import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import {
  formatOrderAge,
  formatOrderTotal,
  getCustomerName,
  getItemCount,
  getOrderStatus,
  type VendorOrder,
} from '../../utils/orderHelpers';
import StatusBadge from './StatusBadge';

type OrderCardProps = {
  order: VendorOrder;
  onPress: (order: VendorOrder) => void;
};

export default function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => onPress(order)}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.customer}>{getCustomerName(order)}</Text>
        </View>
        <StatusBadge status={getOrderStatus(order)} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="receipt-outline" size={16} color={Colors.default.primary} />
          <Text style={styles.metaLabel}>{getItemCount(order)} items</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={Colors.default.primary} />
          <Text style={styles.metaLabel}>{formatOrderAge(order.createdAt || order.orderedAt)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>{formatOrderTotal(order)}</Text>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.default.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
  },
  customer: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.default.primary,
  },
});
