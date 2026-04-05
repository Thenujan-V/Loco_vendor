import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import restaurantService from '../../api/restaurantService';
import { BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/theme';
import { logout } from '../../redux/slices/authSlice';
import { useRouter } from 'expo-router';

type RestaurantProfile = {
  id?: string | number;
  name?: string;
  image?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  status?: string;
  createdAt?: string;
};

const extractRestaurant = (payload: any): RestaurantProfile | null => {
  if (!payload) {
    return null;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.restaurant && !Array.isArray(payload.restaurant)) {
    return payload.restaurant;
  }

  if (payload?.result && !Array.isArray(payload.result)) {
    return payload.result;
  }

  if (payload?.id !== undefined) {
    return payload;
  }

  return null;
};

const getImageUri = (value?: string) => {
  if (!value) {
    return null;
  }

  return value.startsWith('http') ? value : `${BASE_URL}/${value}`;
};

const formatCreatedAt = (value?: string) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const restaurantId = useSelector((state: any) => state.auth.id);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const profileImageUri = useMemo(() => getImageUri(profile?.image), [profile?.image]);

  const fetchProfile = useCallback(async () => {
    if (!restaurantId) {
      setProfile(null);
      setError('Restaurant session not found.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await restaurantService.getRestaurantDetails(restaurantId);
      setProfile(extractRestaurant(response));
      setError('');
    } catch (fetchError: any) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          'Unable to load vendor details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('restaurantId');
    await SecureStore.deleteItemAsync('userRole');
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <LinearGradient colors={['#FEEDE6', '#FFFFFF']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.default.primary} />
              <Text style={styles.infoText}>Loading vendor details...</Text>
            </View>
          ) : (
            <>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="restaurant" size={40} color={Colors.default.primary} />
                </View>
              )}

              <Text style={styles.restaurantName}>{profile?.name || 'Restaurant'}</Text>
              <Text style={styles.detailText}>{profile?.address || 'Address not available'}</Text>
              <Text style={styles.detailText}>{profile?.phoneNumber || 'Phone not available'}</Text>
              <Text style={styles.detailText}>{profile?.email || 'Email not available'}</Text>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, profile?.isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
                  <Text
                    style={[
                      styles.badgeText,
                      profile?.isVerified ? styles.verifiedBadgeText : styles.pendingBadgeText,
                    ]}
                  >
                    {profile?.isVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{profile?.status || 'Unknown'}</Text>
                </View>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Restaurant ID</Text>
                <Text style={styles.metaValue}>{profile?.id ?? restaurantId ?? 'Not available'}</Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Joined On</Text>
                <Text style={styles.metaValue}>{formatCreatedAt(profile?.createdAt)}</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.menuBtn} onPress={fetchProfile}>
            <Ionicons name="refresh-outline" size={20} color="#333" />
            <Text style={styles.menuBtnText}>Refresh Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.btnIconRight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={[styles.menuBtnText, { color: '#F44336' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingTop: 50, paddingBottom: 30 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  infoText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FEEDE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 16,
    backgroundColor: '#F3F3F3',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B211C',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  verifiedBadge: {
    backgroundColor: '#E8F7EE',
  },
  pendingBadge: {
    backgroundColor: '#FFF1E8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBadgeText: {
    color: '#1F8B4C',
  },
  pendingBadgeText: {
    color: '#C56A1D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F6368',
  },
  metaBlock: {
    width: '100%',
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#8A7C74',
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 15,
    color: '#2E2A28',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 14,
    fontSize: 13,
    color: '#C62828',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 15,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  menuBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  btnIconRight: {
    marginLeft: 'auto',
  },
  logoutBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ffebee',
    backgroundColor: '#fff',
  },
});
