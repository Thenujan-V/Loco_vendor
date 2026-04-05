import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import restaurantService from '../api/restaurantService';
import { playOrderAlertSound } from '../utils/orderAlertSound';

const POLL_INTERVAL_MS = 4000;
const PENDING_STATUS = 'PENDING';

export type OrderItem = {
  id?: string | number;
  name?: string;
  title?: string;
  quantity?: number;
  qty?: number;
};

export type VendorOrder = {
  id: string | number;
  createdAt?: string;
  status?: string;
  totalAmount?: number | string;
  grandTotal?: number | string;
  total?: number | string;
  user?: {
    name?: string;
    fullName?: string;
    username?: string;
  };
  customer?: {
    name?: string;
    fullName?: string;
  };
  items?: OrderItem[];
};

const extractOrders = (payload: any): VendorOrder[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  return [];
};

const getOrderTimestamp = (order: VendorOrder) => {
  const time = order?.createdAt ? new Date(order.createdAt).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortOrdersNewestFirst = (orders: VendorOrder[]) =>
  [...orders].sort((left, right) => getOrderTimestamp(right) - getOrderTimestamp(left));

export const formatOrderAge = (createdAt?: string) => {
  if (!createdAt) {
    return 'Just now';
  }

  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return 'Just now';
  }

  const diffInMinutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

  if (diffInMinutes < 1) {
    return 'Just now';
  }

  if (diffInMinutes === 1) {
    return '1 min ago';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} mins ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours === 1) {
    return '1 hour ago';
  }

  return `${diffInHours} hours ago`;
};

export const formatOrderItems = (items?: OrderItem[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Items not available';
  }

  return items
    .slice(0, 3)
    .map((item) => {
      const itemName = item?.name || item?.title || 'Item';
      const quantity = item?.quantity ?? item?.qty ?? 1;
      return `${itemName} x${quantity}`;
    })
    .join(', ');
};

export const formatOrderTotal = (order: VendorOrder) => {
  const value = order?.grandTotal ?? order?.totalAmount ?? order?.total;

  if (typeof value === 'number') {
    return `Rs. ${value.toFixed(2)}`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'Rs. --';
};

export const getCustomerName = (order: VendorOrder) =>
  order?.user?.name ||
  order?.user?.fullName ||
  order?.user?.username ||
  order?.customer?.name ||
  order?.customer?.fullName ||
  'Customer';

export const usePendingOrders = (restaurantId: string | number | null | undefined) => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const appStateRef = useRef(AppState.currentState);
  const isScreenFocusedRef = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRequestRef = useRef(false);
  const seenOrderIdsRef = useRef(new Set<string>());
  const hasCompletedInitialFetchRef = useRef(false);

  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const syncIncomingOrders = useCallback((incomingOrders: VendorOrder[]) => {
    const normalizedOrders = sortOrdersNewestFirst(
      incomingOrders.filter((order) => order?.id !== undefined && order?.id !== null)
    );

    const latestOrderIds = new Set(normalizedOrders.map((order) => String(order.id)));
    const newOrders = normalizedOrders.filter((order) => {
      const orderId = String(order.id);

      if (seenOrderIdsRef.current.has(orderId)) {
        return false;
      }

      seenOrderIdsRef.current.add(orderId);
      return true;
    });

    setOrders(normalizedOrders);
    seenOrderIdsRef.current = latestOrderIds;

    return {
      newOrders,
      shouldPlaySound: hasCompletedInitialFetchRef.current,
    };
  }, []);

  const scheduleNextPoll = useCallback(
    (pollFn: (options?: { isManual?: boolean }) => Promise<void>) => {
      clearPollTimeout();

      if (!isScreenFocusedRef.current || appStateRef.current !== 'active' || !restaurantId) {
        return;
      }

      pollTimeoutRef.current = setTimeout(() => {
        pollFn();
      }, POLL_INTERVAL_MS);
    },
    [clearPollTimeout, restaurantId]
  );

  const fetchPendingOrders = useCallback(
    async ({ isManual = false }: { isManual?: boolean } = {}) => {
      if (!restaurantId || inFlightRequestRef.current) {
        return;
      }

      inFlightRequestRef.current = true;

      if (isManual) {
        setIsRefreshing(true);
      } else if (orders.length === 0) {
        setIsLoading(true);
      }

      try {
        console.log('[pending-orders] fetching', {
          restaurantId,
          status: PENDING_STATUS,
        });

        const response = await restaurantService.getOrdersByStatus(restaurantId, PENDING_STATUS);
        const incomingOrders = extractOrders(response);
        const { newOrders, shouldPlaySound } = syncIncomingOrders(incomingOrders);

        console.log('[pending-orders] received', incomingOrders.length);
        setError('');
        if (shouldPlaySound && newOrders.length > 0) {
          playOrderAlertSound();
        }
        hasCompletedInitialFetchRef.current = true;
      } catch (fetchError: any) {
        console.log('[pending-orders] failed', fetchError?.response?.data || fetchError?.message);
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            'Unable to load pending orders right now.'
        );
      } finally {
        inFlightRequestRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        scheduleNextPoll(fetchPendingOrders);
      }
    },
    [orders.length, restaurantId, scheduleNextPoll, syncIncomingOrders]
  );

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      fetchPendingOrders();

      return () => {
        isScreenFocusedRef.current = false;
        clearPollTimeout();
      };
    }, [clearPollTimeout, fetchPendingOrders])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appStateRef.current === 'active';
      appStateRef.current = nextState;

      if (nextState !== 'active') {
        clearPollTimeout();
        return;
      }

      if (!wasActive && isScreenFocusedRef.current) {
        fetchPendingOrders();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [clearPollTimeout, fetchPendingOrders]);

  useEffect(() => {
    setOrders([]);
    setError('');
    setIsLoading(true);
    seenOrderIdsRef.current = new Set<string>();
    hasCompletedInitialFetchRef.current = false;
    clearPollTimeout();
  }, [clearPollTimeout, restaurantId]);

  useEffect(() => {
    return () => {
      clearPollTimeout();
    };
  }, [clearPollTimeout]);

  const pendingCount = orders.length;
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return {
    error,
    fetchPendingOrders,
    isLoading,
    isRefreshing,
    orders,
    pendingCount,
    recentOrders,
  };
};
