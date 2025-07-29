import { mockTestRequestAPI } from './mockTestRequestAPI';

// Configuration - set to true to use mock API, false to use real API
const USE_MOCK_API = true; // Change this to false when backend is ready

// API utility that automatically falls back to mock when real API fails
export const apiRequest = async (url, options = {}) => {
  const method = options.method || 'GET';
  
  if (USE_MOCK_API) {
    console.log(`🔧 Using Mock API (${method}):`, url);
    
    switch (method.toLowerCase()) {
      case 'get':
        return mockTestRequestAPI.get(url, options);
      case 'post':
        return mockTestRequestAPI.post(url, options);
      case 'patch':
        return mockTestRequestAPI.patch(url, options);
      default:
        return mockTestRequestAPI.get(url, options);
    }
  }
  
  try {
    console.log(`🌐 Using Real API (${method}):`, url);
    const response = await fetch(url, options);
    
    // If real API fails with HTML response, fall back to mock
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.log('🔄 Real API returned HTML, falling back to Mock API');
        
        switch (method.toLowerCase()) {
          case 'get':
            return mockTestRequestAPI.get(url, options);
          case 'post':
            return mockTestRequestAPI.post(url, options);
          case 'patch':
            return mockTestRequestAPI.patch(url, options);
          default:
            return mockTestRequestAPI.get(url, options);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.log('🔄 Real API failed, falling back to Mock API:', error.message);
    
    switch (method.toLowerCase()) {
      case 'get':
        return mockTestRequestAPI.get(url, options);
      case 'post':
        return mockTestRequestAPI.post(url, options);
      case 'patch':
        return mockTestRequestAPI.patch(url, options);
      default:
        return mockTestRequestAPI.get(url, options);
    }
  }
};

export default apiRequest;
