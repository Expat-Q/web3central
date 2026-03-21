import apiClient from '../lib/apiClient';

export const fetchToolsData = async () => {
  return apiClient.get('/tools', { requestKey: 'fetchTools' });
};

export const fetchToolsByCategory = async (category) => {
  return apiClient.get(`/tools/${category}`, { requestKey: `fetchTools-${category}` });
};

export const addTool = async (category, toolData) => {
  return apiClient.post(`/tools/${category}`, toolData);
};

export const updateTool = async (category, id, toolData) => {
  return apiClient.put(`/tools/${category}/${id}`, toolData, { auth: true });
};

export const deleteTool = async (category, toolId) => {
  return apiClient.delete(`/tools/${category}/${toolId}`, { auth: true });
};

export const reviewTool = async (category, toolId, actionData) => {
  return apiClient.put(`/tools/${category}/${toolId}/review`, actionData, { auth: true });
};

export const createTool = async (category, toolData) => {
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
  const response = await fetch(`${API_BASE_URL}/tools/${category}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': sessionStorage.getItem('admin_unlocked') === 'true' ? '213478' : ''
    },
    body: JSON.stringify(toolData)
  });
  if (!response.ok) throw new Error(`Failed to add tool. Error: HTTP error ${response.status}`);
  return await response.json();
};

export const fetchCommunitySpotlight = async () => {
  return apiClient.get('/community-spotlight', { requestKey: 'fetchSpotlight' });
};

export const updateCommunitySpotlight = async (spotlightData) => {
  return apiClient.put('/community-spotlight', spotlightData, { auth: true });
};

export const fetchLessons = async () => {
  const data = await apiClient.get('/academy/lessons', { requestKey: 'fetchLessons' });
  return data.data;
};

export const createAcademyLesson = async (lessonData) => {
  return apiClient.post('/academy', lessonData, { auth: true });
};

export const fetchCuratedCourses = async () => {
  const data = await apiClient.get('/academy/courses', { requestKey: 'fetchCourses' });
  return data.data || [];
};

export const createCuratedCourse = async (courseData) => {
  return apiClient.post('/academy/courses', courseData, { auth: true });
};

export const deleteCuratedCourse = async (courseId) => {
  return apiClient.delete(`/academy/courses/${courseId}`, { auth: true });
};

export const generateAiQuiz = async (content) => {
  return apiClient.post('/ai/generate-quiz', { content }, { auth: true });
};

export const fetchStatsOverview = async () => {
  return apiClient.get('/stats/overview', { requestKey: 'fetchStats' });
};

export const fetchLessonById = async (slug) => {
  const data = await apiClient.get(`/academy/lessons/${slug}`, { requestKey: `fetchLesson-${slug}` });
  return data.data;
};

export const submitLessonProgress = async (lessonId, score, token) => {
  return apiClient.post(`/academy/progress/${lessonId}`, { score }, { auth: true });
};

export const updateProfile = async (profileData) => {
  return apiClient.put('/auth/profile', profileData, { auth: true });
};

export const fetchMyTools = async () => {
  return apiClient.get('/tools/my-tools', { auth: true, requestKey: 'fetchMyTools' });
};

export const submitToolForReview = async (toolData) => {
  return apiClient.post('/tools/submit', toolData, { auth: true });
};

export const mockOAuthLogin = async (provider) => {
  return apiClient.post('/auth/oauth-mock', { provider });
};
