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

export const deleteTool = async (arg1, arg2) => {
  const toolId = arg2 || arg1;
  return apiClient.delete(`/tools/${toolId}`, { auth: true });
};

export const reviewTool = async (category, toolId, actionData) => {
  return apiClient.put(`/tools/${category}/${toolId}/review`, actionData, { auth: true });
};

export const createTool = async (category, toolData) => {
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/tools/${category}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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

export const updateNewsArticle = async (id, newsData) => {
  return apiClient.put(`/news/${id}`, newsData, { auth: true });
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

export const updateCuratedCourse = async (id, courseData) => {
  return apiClient.put(`/academy/courses/${id}`, courseData, { auth: true });
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

// --- Quest API ---
export const fetchQuests = async (isAdmin = false) => {
  const endpoint = isAdmin ? '/quests/admin' : '/quests';
  return apiClient.get(endpoint, { auth: isAdmin });
};

export const createQuest = async (questData) => {
  return apiClient.post('/quests', questData, { auth: true });
};

export const updateQuest = async (id, questData) => {
  return apiClient.put(`/quests/${id}`, questData, { auth: true });
};

export const deleteQuest = async (id) => {
  return apiClient.delete(`/quests/${id}`, { auth: true });
};

export const fetchLeaderboard = async () => {
  const data = await apiClient.get('/auth/leaderboard');
  return data.leaderboard || [];
};

export const completeQuest = async (id) => {
  return apiClient.post(`/quests/${id}/complete`, {}, { auth: true });
};

// --- Admin API ---
export const fetchPendingTools = async () => {
  return apiClient.get('/tools/pending', { auth: true });
};

export const updateToolStatus = async (id, status) => {
  return apiClient.put(`/tools/review/${id}`, { status }, { auth: true });
};

export const fetchPendingClaims = async () => {
  return apiClient.get('/developer/pending-claims', { auth: true });
};

export const approveClaim = async (id, profileId) => {
  return apiClient.post(`/developer/pending-claims/${id}/approve`, { profileId }, { auth: true });
};

export const rejectClaim = async (id, profileId) => {
  return apiClient.post(`/developer/pending-claims/${id}/reject`, { profileId }, { auth: true });
};

export const generateCryptoNews = async (query, count) => {
  return apiClient.post('/news/generate', { query, count }, { auth: true });
};

export const createCourse = async (courseData) => {
  return apiClient.post('/academy/courses', courseData, { auth: true });
};

export const fetchAirdrops = async () => {
  return apiClient.get('/airdrops');
};

export const fetchAdminUserList = async () => {
  return apiClient.get('/stats/users', { auth: true });
};

export const fetchVisitorTrafficRates = async () => {
  return apiClient.get('/stats/traffic', { auth: true });
};

export const fetchProtocolInventory = async () => {
  return apiClient.get('/stats/inventory', { auth: true });
};
