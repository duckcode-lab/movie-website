import { useEffect, useState } from 'react';
import { getProfile, logout, refreshAccessToken } from '../api/api.js';
import { clearRefreshTokenCookie } from '../api/refreshTokenCookie.js';
import SplashScreen from '../layout/SplashScreen.jsx';

let authenticationCheck;

function saveProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Dữ liệu hồ sơ không hợp lệ.');
  }

  localStorage.setItem('user', JSON.stringify(profile));
}

function clearLocalSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  clearRefreshTokenCookie();
}

async function initializeAuthentication() {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    try {
      const response = await getProfile();
      saveProfile(response.data?.data);
      return;
    } catch (error) {
      if (error.response?.status !== 401) {
        throw error;
      }
    }
  }

  try {
    const refreshResponse = await refreshAccessToken();
    const refreshedAccessToken = refreshResponse.data?.accessToken;
    if (!refreshedAccessToken) {
      throw new Error('Backend không trả về access token mới.');
    }

    localStorage.setItem('accessToken', refreshedAccessToken);
    const profileResponse = await getProfile();
    saveProfile(profileResponse.data?.data);
  } catch (error) {
    clearLocalSession();
    if (error.response?.status === 400 || error.response?.status === 401) {
      try {
        await logout();
      } catch (logoutError) {
        console.error('Không thể xóa refresh token hết hạn:', logoutError);
      }
      return;
    }

    throw error;
  }
}

function getAuthenticationCheck() {
  if (!authenticationCheck) {
    authenticationCheck = initializeAuthentication().catch((error) => {
      clearLocalSession();
      console.error('Không thể khôi phục phiên đăng nhập:', error);
    });
  }
  return authenticationCheck;
}

export default function AuthBootstrap({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getAuthenticationCheck().finally(() => {
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) return <SplashScreen />;
  return children;
}
