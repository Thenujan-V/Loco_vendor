import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import orderService from '../../api/orderService';
import OrderCard from '../../components/orders/OrderCard';
import { Colors } from '../../constants/theme';
import {
  extractOrderList,
  ORDER_STATUSES,
  sortOrdersNewestFirst,
  type OrderStatus,
  type VendorOrder,
} from '../../utils/orderHelpers';

const ORDER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
] as const;

type OrderTabKey = (typeof ORDER_TABS)[number]['key'];

const dedupeOrders = (orders: VendorOrder[]) => {
  const seenIds = new Set<string>();

  return orders.filter((order) => {
    const orderId = String(order.id);

    if (seenIds.has(orderId)) {
      return false;
    }

    seenIds.add(orderId);
    return true;
  });
};

export default function OrdersScreen() {
  const router = useRouter();
  const restaurantId = useSelector((state: any) => state.auth.id);
  const [activeTab, setActiveTab] = useState<OrderTabKey>('ALL');
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(
    async ({ isManual = false }: { isManual?: boolean } = {}) => {
      if (!restaurantId) {
        setOrders([]);
        setIsLoading(false);
        setIsRefreshing(false);
        setError('Restaurant session not found.');
        return;
      }

      if (isManual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        let nextOrders: VendorOrder[] = [];

        if (activeTab === 'ALL') {
          const responses = await Promise.all(
            ORDER_STATUSES.map((status) => orderService.getOrdersByStatus(restaurantId, status))
          );

          nextOrders = responses.flatMap((response) => extractOrderList(response));
        } else {
          const response = await orderService.getOrdersByStatus(
            restaurantId,
            activeTab as OrderStatus
          );
          nextOrders = extractOrderList(response);
        }

        setOrders(sortOrdersNewestFirst(dedupeOrders(nextOrders)));
        setError('');
      } catch (fetchError: any) {
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            'Unable to load orders right now.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, restaurantId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const visibleOrders = useMemo(() => {
    if (activeTab === 'ALL') {
      return orders;
    }

    return orders.filter((order) => String(order.status || '').toUpperCase() === activeTab);
  }, [activeTab, orders]);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.default.primary} />
          <Text style={styles.emptyText}>Loading orders...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={52} color="#CFCFCF" />
        <Text style={styles.emptyText}>No orders found for this tab.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Track, review, and process vendor orders.</Text>

        <View style={styles.tabsWrap}>
          <FlatList
            data={ORDER_TABS}
            horizontal
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tabChip, activeTab === item.key && styles.tabChipActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={[styles.tabChipText, activeTab === item.key && styles.tabChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {error && visibleOrders.length > 0 ? <Text style={styles.inlineErrorText}>{error}</Text> : null}

        <FlatList
          data={visibleOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={(order) => router.push(`/(user)/order/${order.id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchOrders({ isManual: true })}
              tintColor={Colors.default.primary}
            />
          }
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#221813',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6E625B',
    marginTop: 6,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  tabsWrap: {
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED8',
    marginHorizontal: 4,
  },
  tabChipActive: {
    backgroundColor: Colors.default.primary,
    borderColor: Colors.default.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E625B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  inlineErrorText: {
    color: '#C62828',
    fontSize: 13,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 360,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 14,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: '#C62828',
    textAlign: 'center',
  },
});
