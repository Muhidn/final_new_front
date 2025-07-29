// Mock API service for test requests
// This is a temporary solution until the Django backend is properly configured

class MockTestRequestAPI {
  constructor() {
    // Initialize with some mock data
    this.testRequests = [
      {
        id: 1,
        student: {
          id: 1,
          user: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@email.com'
          }
        },
        school: {
          id: 1,
          name: 'ABC Driving School'
        },
        status: 'pending',
        requested_at: new Date().toISOString(),
        scheduled_date: null,
        approved_by: null
      },
      {
        id: 2,
        student: {
          id: 2,
          user: {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@email.com'
          }
        },
        school: {
          id: 1,
          name: 'ABC Driving School'
        },
        status: 'approved',
        requested_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        scheduled_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
        approved_by: {
          first_name: 'Admin',
          last_name: 'User'
        }
      }
    ];
    
    this.nextId = 3;
  }

  // Simulate API delay
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET /api/test-requests/
  async getTestRequests(filters = {}) {
    await this.delay();
    
    let results = [...this.testRequests];
    
    if (filters.student) {
      results = results.filter(req => req.student.id === parseInt(filters.student));
    }
    
    if (filters.status) {
      results = results.filter(req => req.status === filters.status);
    }
    
    return results;
  }

  // POST /api/test-requests/
  async createTestRequest(data) {
    await this.delay();
    
    const newRequest = {
      id: this.nextId++,
      student: {
        id: data.student,
        user: {
          first_name: 'Student',
          last_name: `#${data.student}`,
          email: `student${data.student}@email.com`
        }
      },
      school: {
        id: data.school,
        name: 'Test School'
      },
      status: 'pending',
      requested_at: new Date().toISOString(),
      scheduled_date: null,
      approved_by: null
    };
    
    this.testRequests.push(newRequest);
    return newRequest;
  }

  // PATCH /api/test-requests/{id}/
  async updateTestRequest(id, data) {
    await this.delay();
    
    const index = this.testRequests.findIndex(req => req.id === parseInt(id));
    if (index === -1) {
      throw new Error('Test request not found');
    }
    
    this.testRequests[index] = {
      ...this.testRequests[index],
      ...data,
      approved_by: data.status === 'approved' ? {
        first_name: 'Admin',
        last_name: 'User'
      } : this.testRequests[index].approved_by
    };
    
    return this.testRequests[index];
  }
}

// Create singleton instance
const mockAPI = new MockTestRequestAPI();

// Export functions that can be used to replace real API calls
export const mockTestRequestAPI = {
  async get(url, options = {}) {
    console.log('🔧 Using Mock API for GET:', url);
    
    if (url.includes('/api/test-requests/')) {
      // Parse query parameters
      const urlObj = new URL(url, 'http://localhost');
      const filters = {};
      
      if (urlObj.searchParams.get('student')) {
        filters.student = urlObj.searchParams.get('student');
      }
      if (urlObj.searchParams.get('status')) {
        filters.status = urlObj.searchParams.get('status');
      }
      
      const data = await mockAPI.getTestRequests(filters);
      
      return {
        ok: true,
        status: 200,
        headers: {
          get: () => 'application/json'
        },
        json: async () => data,
        text: async () => JSON.stringify(data)
      };
    }
    
    // Default error for unknown endpoints
    return {
      ok: false,
      status: 404,
      headers: {
        get: () => 'text/html'
      },
      text: async () => '<!DOCTYPE html><html><body>404 Not Found</body></html>'
    };
  },

  async post(url, options = {}) {
    console.log('🔧 Using Mock API for POST:', url, options.body);
    
    if (url.includes('/api/test-requests/')) {
      const data = JSON.parse(options.body);
      const result = await mockAPI.createTestRequest(data);
      
      return {
        ok: true,
        status: 201,
        headers: {
          get: () => 'application/json'
        },
        json: async () => result,
        text: async () => JSON.stringify(result)
      };
    }
    
    return {
      ok: false,
      status: 404,
      headers: {
        get: () => 'text/html'
      },
      text: async () => '<!DOCTYPE html><html><body>404 Not Found</body></html>'
    };
  },

  async patch(url, options = {}) {
    console.log('🔧 Using Mock API for PATCH:', url, options.body);
    
    if (url.includes('/api/test-requests/')) {
      const id = url.split('/').slice(-2, -1)[0]; // Extract ID from URL
      const data = JSON.parse(options.body);
      const result = await mockAPI.updateTestRequest(id, data);
      
      return {
        ok: true,
        status: 200,
        headers: {
          get: () => 'application/json'
        },
        json: async () => result,
        text: async () => JSON.stringify(result)
      };
    }
    
    return {
      ok: false,
      status: 404,
      headers: {
        get: () => 'text/html'
      },
      text: async () => '<!DOCTYPE html><html><body>404 Not Found</body></html>'
    };
  }
};

export default mockAPI;
