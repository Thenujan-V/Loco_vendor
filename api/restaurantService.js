import apiClient from './client';
import { ENDPOINTS } from '../constants/Config';
import {
  registrationFailure,
  registrationStart,
  registrationSuccess,
} from '../redux/slices/restaurantRegistrationSlice';

const getMimeType = (filename, mimeType) => {
  if (mimeType) {
    return mimeType;
  }

  const extension = filename?.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return 'application/pdf';
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'heic') {
    return 'image/heic';
  }

  return 'image/jpeg';
};

const normalizeAsset = (asset, fallbackName) => {
  if (!asset?.uri) {
    return null;
  }

  const name = asset.name || asset.fileName || fallbackName;
  const type = getMimeType(name, asset.mimeType || asset.type);
  const uri = asset.fileCopyUri || asset.uri;

  return {
    uri,
    name,
    type,
  };
};

const buildRestaurantRegistrationFormData = (payload) => {
  const formData = new FormData();

  formData.append('name', payload.name.trim());
  formData.append('address', payload.address.trim());
  formData.append('email', payload.email.trim().toLowerCase());
  formData.append('phoneNumber', payload.phoneNumber.trim());
  formData.append('password', payload.password);
  formData.append('locationLatitude', String(payload.locationLatitude));
  formData.append('locationLongitude', String(payload.locationLongitude));
  formData.append('image', normalizeAsset(payload.image, 'restaurant-image.jpg'));
  formData.append('userPicture', normalizeAsset(payload.userPicture, 'user-picture.jpg'));
  formData.append('userDocument', normalizeAsset(payload.userDocument, 'user-document.pdf'));
  formData.append(
    'restaurantDocument',
    normalizeAsset(payload.restaurantDocument, 'restaurant-document.pdf'),
  );

  return formData;
};

const restaurantService = {
  registerRestaurant: (payload) => async (dispatch) => {
    dispatch(registrationStart());

    try {
      const formData = buildRestaurantRegistrationFormData(payload);
      const response = await apiClient.post(
        ENDPOINTS.RESTAURANT_REGISTER,
        formData,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      dispatch(registrationSuccess(response.data));
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Unable to register restaurant. Please try again.';

      dispatch(registrationFailure(errorMessage));
      throw error;
    }
  },
};

export default restaurantService;
