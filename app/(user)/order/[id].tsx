import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import orderService from '../../../api/orderService';
import StatusBadge from '../../../components/orders/StatusBadge';
import { BASE_URL } from '../../../constants/Config';
import { Colors } from '../../../constants/theme';
import {
  extractOrderDetail,
  formatCurrency,
  formatOrderDateTime,
  formatOrderTotal,
  getCustomerEmail,
  getCustomerName,
  getCustomerPhone,
  getItemImage,
  getOrderStatus,
  getRestaurantAddress,
  getRestaurantName,
  type VendorOrder,
} from '../../../utils/orderHelpers';

const getImageUri = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return value.startsWith('http') ? value : `${BASE_URL}/${value}`;
};

export default function OrderProcessingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const restaurantId = useSelector((state: any) => state.auth.id);
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError('Order id not found.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await orderService.getOrderById(id);
      setOrder(extractOrderDetail(response));
      setError('');
    } catch (fetchError: any) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          'Unable to load the order details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const status = useMemo(() => getOrderStatus(order), [order]);
  const isPending = status === 'PENDING';

  const handleStatusAction = useCallback(
    async (action: 'accept' | 'reject') => {
      if (!id) {
        return;
      }

      try {
        setIsSubmitting(true);

        if (action === 'accept') {
          await orderService.acceptOrder(id, restaurantId);
          setOrder((current) => (current ? { ...current, status: 'ACCEPTED' } : current));
          Alert.alert('Order Accepted', `Order #${id} has been accepted.`);
        } else {
          await orderService.rejectOrder(id, restaurantId);
          setOrder((current) => (current ? { ...current, status: 'REJECTED' } : current));
          Alert.alert('Order Rejected', `Order #${id} has been rejected.`);
        }

        await fetchOrder();
      } catch (actionError: any) {
        Alert.alert(
          'Action Failed',
          actionError?.response?.data?.message ||
            actionError?.message ||
            'Unable to update the order status.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchOrder, id, restaurantId]
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.default.primary} />
          <Text style={styles.stateText}>Loading order details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
        <View style={styles.centeredState}>
          <Ionicons name="alert-circle-outline" size={54} color="#D8B6A5" />
          <Text style={styles.stateText}>{error || 'Order not found.'}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.inlineErrorText}>{error}</Text> : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderNumberTitle}>Order #{order.id}</Text>
              <Text style={styles.orderDate}>
                Ordered {formatOrderDateTime(order.createdAt || order.orderedAt)}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Seat Number</Text>
              <Text style={styles.metaValue}>{order.seatNumber ?? 'Not available'}</Text>
            </View>
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Total</Text>
              <Text style={[styles.metaValue, styles.metaValueAccent]}>{formatOrderTotal(order)}</Text>
            </View>
          </View>
        </View>

        

        {/* <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Restaurant Details</Text>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{getRestaurantName(order)}</Text>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>{getRestaurantAddress(order)}</Text>
        </View> */}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.length ? (
            order.items.map((item, index) => {
              const imageUri = getImageUri(getItemImage(item));

              return (
                <View
                  key={String(item.id ?? `${item.name || item.title}-${index}`)}
                  style={[
                    styles.itemRow,
                    index === order.items!.length - 1 && styles.itemRowLast,
                  ]}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="fast-food-outline" size={24} color="#A68C80" />
                    </View>
                  )}

                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name || item.title || 'Item'}</Text>
                    <Text style={styles.itemMeta}>Quantity: {item.quantity ?? item.qty ?? 1}</Text>
                  </View>

                  <Text style={styles.itemPrice}>{formatCurrency(item.price ?? null)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyItemsText}>No items available for this order.</Text>
          )}
        </View>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{getCustomerName(order)}</Text>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{getCustomerPhone(order)}</Text>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{getCustomerEmail(order)}</Text>
        </View>
        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleStatusAction('accept')}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Updating...' : 'Accept'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleStatusAction('reject')}
              disabled={isSubmitting}
            >
              <Text style={styles.dangerButtonText}>
                {isSubmitting ? 'Updating...' : 'Reject'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusWrap}>
            <StatusBadge status={status} />
          </View>
        )}
        
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#251913',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  stateText: {
    marginTop: 14,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inlineErrorText: {
    color: '#C62828',
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  orderNumberTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#221813',
  },
  orderDate: {
    marginTop: 6,
    fontSize: 13,
    color: '#756963',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaTile: {
    flex: 1,
    backgroundColor: '#FFF7F3',
    borderRadius: 16,
    padding: 16,
  },
  metaLabel: {
    fontSize: 12,
    color: '#8A7C74',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B211C',
  },
  metaValueAccent: {
    color: Colors.default.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#251913',
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7C74',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#2E2A28',
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE9',
  },
  itemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B211C',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6E67',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.default.primary,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#777',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.default.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#FDECEC',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C8C8',
  },
  dangerButtonText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Colors.default.primary,
    fontWeight: '800',
  },
  statusWrap: {
    marginTop: 6,
    alignItems: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
