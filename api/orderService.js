import { ENDPOINTS } from '../constants/Config';
import apiClient from './client';

const orderService = {
  getOrderById: async (orderId) => {
    const response = await apiClient.get(ENDPOINTS.ORDER_GET_ADMIN(orderId));
    return response.data;
  },

  acceptOrder: async (orderId, restaurantId) => {
        console.log('Accepting Order ID:', orderId, 'Restaurant ID:', restaurantId);
    const response = await apiClient.put(ENDPOINTS.ORDER_ACCEPT(orderId), {
      restaurantId: restaurantId,
    });

    return response.data;
  },

  rejectOrder: async (orderId, restaurantId) => {
    const response = await apiClient.put(ENDPOINTS.ORDER_REJECT(orderId), {
      restaurantId: restaurantId,
    });
    return response.data;
  },

  getOrdersByStatus: async (restaurantId, status) => {
    const response = await apiClient.get(
      ENDPOINTS.RESTAURANT_GET_BY_STATUS(restaurantId, status)
    );

    return response.data;
  },
};

export default orderService;
