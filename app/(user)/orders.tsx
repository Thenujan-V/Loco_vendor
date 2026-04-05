import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../../constants/theme';
import {
  formatOrderAge,
  formatOrderItems,
  formatOrderTotal,
  getCustomerName,
  type VendorOrder,
  usePendingOrders,
} from '../../hooks/usePendingOrders';

const TABS = ['New', 'Ready', 'Completed'] as const;
const NEW_ORDER_HIGHLIGHT_MS = 8000;

export default function OrdersScreen() {
  const router = useRouter();
  const restaurantId = useSelector((state: any) => state.auth.id);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('New');
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<string[]>([]);
  const previousOrderIdsRef = useRef(new Set<string>());
  const highlightTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { error, fetchPendingOrders, isLoading, isRefreshing, orders } = usePendingOrders(
    restaurantId
  );

  const clearHighlightTimeout = useCallback((orderId: string) => {
    const timeout = highlightTimeoutsRef.current[orderId];

    if (timeout) {
      clearTimeout(timeout);
      delete highlightTimeoutsRef.current[orderId];
    }
  }, []);

  const clearAllHighlightTimeouts = useCallback(() => {
    Object.keys(highlightTimeoutsRef.current).forEach(clearHighlightTimeout);
  }, [clearHighlightTimeout]);

  const scheduleHighlightRemoval = useCallback(
    (orderId: string) => {
      clearHighlightTimeout(orderId);

      highlightTimeoutsRef.current[orderId] = setTimeout(() => {
        setHighlightedOrderIds((current) => current.filter((id) => id !== orderId));
        delete highlightTimeoutsRef.current[orderId];
      }, NEW_ORDER_HIGHLIGHT_MS);
    },
    [clearHighlightTimeout]
  );

  useEffect(() => {
    const previousIds = previousOrderIdsRef.current;
    const latestIds = new Set<string>();
    const newIds: string[] = [];

    orders.forEach((order) => {
      const orderId = String(order.id);
      latestIds.add(orderId);

      if (!previousIds.has(orderId)) {
        newIds.push(orderId);
      }
    });

    if (newIds.length > 0) {
      setHighlightedOrderIds((currentIds) => [...new Set([...newIds, ...currentIds])]);
      newIds.forEach(scheduleHighlightRemoval);
    }

    previousOrderIdsRef.current = latestIds;
  }, [orders, scheduleHighlightRemoval]);

  useEffect(() => {
    previousOrderIdsRef.current = new Set<string>();
    setHighlightedOrderIds([]);
    clearAllHighlightTimeouts();
  }, [clearAllHighlightTimeouts, restaurantId]);

  useEffect(() => {
    return () => {
      clearAllHighlightTimeouts();
    };
  }, [clearAllHighlightTimeouts]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'New') {
      return orders;
    }

    return [];
  }, [activeTab, orders]);

  const handleAccept = useCallback(
    (id: string | number) => {
      Alert.alert('Accepted', `Order #${id} accepted successfully.`);
      router.push(`/(user)/order/${id}` as any);
    },
    [router]
  );

  const handleReject = useCallback((id: string | number) => {
    Alert.alert('Rejected', `Order #${id} has been rejected.`);
  }, []);

  const navigateToOrder = useCallback(
    (id: string | number) => {
      router.push(`/(user)/order/${id}` as any);
    },
    [router]
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: VendorOrder }) => {
      const isHighlighted = highlightedOrderIds.includes(String(item.id));

      return (
        <View style={[styles.orderCard, isHighlighted && styles.orderCardHighlighted]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.85}
            onPress={() => navigateToOrder(item.id)}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderNumber}>Order #{item.id}</Text>
                <Text style={styles.customerName}>{getCustomerName(item)}</Text>
              </View>
              <View style={styles.headerMeta}>
                {isHighlighted ? (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>New</Text>
                  </View>
                ) : null}
                <Text style={styles.orderTime}>{formatOrderAge(item.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.orderItems}>Items: {formatOrderItems(item.items)}</Text>
              <Text style={styles.orderTotal}>Total: {formatOrderTotal(item)}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.acceptBtn]}
                onPress={() => handleAccept(item.id)}
              >
                <Ionicons name="checkmark" size={18} color="#fff" style={styles.btnIcon} />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => handleReject(item.id)}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={Colors.default.primary}
                  style={styles.btnIcon}
                />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleAccept, handleReject, highlightedOrderIds, navigateToOrder]
  );

  const renderContent = () => {
    if (!restaurantId) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Restaurant session not found.</Text>
        </View>
      );
    }

    if (isLoading && orders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.default.primary} />
          <Text style={styles.emptyText}>Checking for new pending orders...</Text>
        </View>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>
            {activeTab === 'New'
              ? 'No pending orders right now.'
              : `${activeTab} orders are not available from the current API.`}
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPendingOrders({ isManual: true })}
            tintColor={Colors.default.primary}
          />
        }
      />
    );
  };

  return (
    <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && orders.length > 0 ? <Text style={styles.inlineErrorText}>{error}</Text> : null}

        {renderContent()}
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
    paddingTop: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: Colors.default.primary,
    borderColor: Colors.default.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  inlineErrorText: {
    marginHorizontal: 20,
    marginBottom: 10,
    color: '#c62828',
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: Colors.default.white,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  orderCardHighlighted: {
    borderColor: '#FFC9B3',
    backgroundColor: '#FFF8F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  newBadge: {
    backgroundColor: '#FFE7DC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  newBadgeText: {
    color: Colors.default.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  orderTime: {
    fontSize: 12,
    color: '#888',
  },
  cardBody: {
    marginBottom: 15,
  },
  orderItems: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  btn: {
    flexDirection: 'row',
    flex: 0.48,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 5,
  },
  acceptBtn: {
    backgroundColor: Colors.default.primary,
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#ffcccb',
  },
  rejectText: {
    color: Colors.default.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: '#c62828',
    textAlign: 'center',
  },
});
