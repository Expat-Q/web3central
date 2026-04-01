import apiClient from '../lib/apiClient';

const CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map();
const inflightRequests = new Map();

const getSessionCache = (key) => {
  try {
    const raw = sessionStorage.getItem(`apiCache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(`apiCache:${key}`);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
};

const setSessionCache = (key, value, ttlMs = CACHE_TTL_MS) => {
  try {
    sessionStorage.setItem(`apiCache:${key}`, JSON.stringify({
      value,
      expiresAt: Date.now() + ttlMs
    }));
  } catch {
    // Ignore storage failures (quota/private mode)
  }
};

const getCached = (key) => {
  const mem = memoryCache.get(key);
  if (mem && Date.now() < mem.expiresAt) return mem.value;

  const sessionValue = getSessionCache(key);
  if (sessionValue !== null) {
    memoryCache.set(key, { value: sessionValue, expiresAt: Date.now() + 30 * 1000 });
    return sessionValue;
  }
  return null;
};

const setCached = (key, value, ttlMs = CACHE_TTL_MS) => {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  setSessionCache(key, value, ttlMs);
};

const cachedGet = async ({ cacheKey, endpoint, requestKey, ttlMs = CACHE_TTL_MS }) => {
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const promise = apiClient.get(endpoint, { requestKey })
    .then((data) => {
      setCached(cacheKey, data, ttlMs);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, promise);
  return promise;
};

export const fetchToolsData = async () => {
  return cachedGet({
    cacheKey: 'tools-all',
    endpoint: '/tools',
    requestKey: 'fetchTools'
  });
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
  return cachedGet({
    cacheKey: 'community-spotlight',
    endpoint: '/community-spotlight',
    requestKey: 'fetchSpotlight'
  });
};

export const updateCommunitySpotlight = async (spotlightData) => {
  return apiClient.put('/community-spotlight', spotlightData, { auth: true });
};

export const fetchLatestNews = async () => {
  const data = await cachedGet({
    cacheKey: 'latest-news',
    endpoint: '/news',
    requestKey: 'fetchNews'
  });
  return data.data || [];
};

export const fetchNewsBySlug = async (slug) => {
  const data = await apiClient.get(`/news/${slug}`, { requestKey: `fetchNews-${slug}` });
  return data.data;
};

export const publishNewsArticle = async (newsData) => {
  return apiClient.post('/news', newsData, { auth: true });
};

export const deleteNewsArticle = async (id) => {
  return apiClient.delete(`/news/${id}`, { auth: true });
};

export const fetchCuratedCourses = async () => {
  const data = await cachedGet({
    cacheKey: 'academy-courses',
    endpoint: '/academy/courses',
    requestKey: 'fetchCourses'
  });
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
  return cachedGet({
    cacheKey: 'stats-overview',
    endpoint: '/stats/overview',
    requestKey: 'fetchStats'
  });
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

export const fetchCommunityLessons = async () => {
  const data = await cachedGet({
    cacheKey: 'academy-community-lessons',
    endpoint: '/academy/community',
    requestKey: 'fetchCommunityLessons'
  });
  return data.data || [];
};

export const createCommunityLesson = async (lessonData) => {
  return apiClient.post('/academy/community', lessonData, { auth: true });
};

export const upvoteCommunityLesson = async (lessonId) => {
  return apiClient.post(`/academy/community/${lessonId}/upvote`, {}, { auth: true });
};

export const rateCommunityLesson = async (lessonId, rating) => {
  return apiClient.post(`/academy/community/${lessonId}/rate`, { rating }, { auth: true });
};
