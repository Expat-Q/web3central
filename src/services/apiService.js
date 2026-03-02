// API Service for Web3Central
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

// Fetch all tools data
export const fetchToolsData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tools`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tools data:', error);
    throw error;
  }
};

// Fetch tools by category
export const fetchToolsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching tools for category ${category}:`, error);
    throw error;
  }
};

// Add a new tool
export const addTool = async (category, toolData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toolData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding tool:', error);
    throw error;
  }
};

// Update an existing tool
export const updateTool = async (category, id, toolData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toolData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating tool:', error);
    throw error;
  }
};

// Delete a tool
export const deleteTool = async (category, toolId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}/${toolId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting tool:', error);
    throw error;
  }
};

// Review a tool (Admin)
export const reviewTool = async (category, toolId, actionData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}/${toolId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(actionData) // { action: 'accept' | 'reject', reason: string }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reviewing tool:', error);
    throw error;
  }
};

// Create a tool in a category (admin)
export const createTool = async (category, toolData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${category}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(toolData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating tool:', error);
    throw error;
  }
};

// Fetch community spotlight
export const fetchCommunitySpotlight = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/community-spotlight`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching community spotlight:', error);
    throw error;
  }
};

// Update community spotlight
export const updateCommunitySpotlight = async (spotlightData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/community-spotlight`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(spotlightData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating community spotlight:', error);
    throw error;
  }
};

// --- Academy Routes ---

// Fetch all available lessons
export const fetchLessons = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/academy/lessons`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data; // Backend returns { success, count, data }
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

export const createAcademyLesson = async (lessonData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/academy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(lessonData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const generateAiQuiz = async (content) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating AI quiz:', error);
    throw error;
  }
};

// --- Stats Routes ---

export const fetchStatsOverview = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats/overview`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    throw error;
  }
};

// Fetch a single lesson by ID/slug
export const fetchLessonById = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/academy/lessons/${slug}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    throw error;
  }
};

// Submit quiz progress
export const submitLessonProgress = async (lessonId, score, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/academy/progress/${lessonId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ score })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting progress:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const fetchMyTools = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/tools/my-tools`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch my tools');
    return await response.json();
  } catch (error) {
    console.error('Error fetching my tools:', error);
    throw error;
  }
};

export const mockOAuthLogin = async (provider) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/oauth-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error during mock OAuth login:', error);
    throw error;
  }
};
