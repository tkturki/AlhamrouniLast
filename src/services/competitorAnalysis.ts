// Competitor Analysis Service for Alhamrouni Jewelry
// Tracks competitors in Libyan market via social listening

export interface Competitor {
  id: string;
  name: string;
  platform: 'facebook' | 'instagram' | 'website' | 'physical';
  location: string; // Tripoli area: Al-Sayyagin, Azmi Signal, Jaraba, etc.
  category: 'gold' | 'silver' | 'gemstones' | 'mixed';
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  phone?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorPost {
  id: string;
  competitorId: string;
  platform: 'facebook' | 'instagram';
  postUrl: string;
  content: string;
  mediaType: 'image' | 'video' | 'carousel' | 'text';
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  postedAt: string;
  scrapedAt: string;
  engagementRate: number;
  promotedItems?: string[]; // Items mentioned in post
}

export interface CompetitorAnalytics {
  competitorId: string;
  competitorName: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  followerGrowth: number;
  topPost?: CompetitorPost;
  mostActiveDay: string;
  mostActiveHour: number;
  promotedCategories: Record<string, number>; // category -> count
}

export interface MarketInsight {
  type: 'trend' | 'opportunity' | 'threat' | 'price_alert';
  title: string;
  description: string;
  competitorId?: string;
  competitorName?: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  data?: any;
}

// Predefined major competitors in Tripoli based on user input
export const TRIPOLI_COMPETITORS: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'مجوهرات الحمروني',
    platform: 'facebook',
    location: 'طرابلس',
    category: 'gold',
    facebookUrl: 'https://www.facebook.com/share/16NKRbnwPQ/',
    isActive: true,
    notes: 'محلنا - مرجع للمقارنة',
  },
  {
    name: 'مجوهرات العبدالله',
    platform: 'facebook',
    location: 'شارع الصائغين، طرابلس',
    category: 'gold',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61571067394497',
    isActive: true,
    notes: 'من أبرز المحلات في شارع الصائغين',
  },
  {
    name: 'مجوهرات مخرم',
    platform: 'facebook',
    location: 'فرع الجرابة، طرابلس',
    category: 'gold',
    facebookUrl: 'https://www.facebook.com/MukharramJewelry',
    websiteUrl: 'https://makhrram.com',
    isActive: true,
    notes: 'فرع في منطقة الجرابة - 6 فروع في طرابلس',
  },
  {
    name: 'مجوهرات الياقوت',
    platform: 'facebook',
    location: 'طرابلس، سوق الذهب',
    category: 'gold',
    facebookUrl: 'https://www.facebook.com/p/%D9%85%D8%AC%D9%88%D9%87%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%8A%D8%A7%D9%82%D9%88%D8%AA-100064760287171/',
    isActive: true,
    notes: 'في سوق الذهب الرئيسي',
  },
  {
    name: 'محلات الماسة للفضة',
    platform: 'facebook',
    location: 'طرابلس، شارع الرشيد',
    category: 'silver',
    facebookUrl: 'https://www.facebook.com/profile.php?id=100063591847023',
    isActive: true,
    notes: 'متخصص في الفضة',
  },
  {
    name: 'أحجار العقيق اليماني',
    platform: 'facebook',
    location: 'طرابلس، سوق المشير',
    category: 'gemstones',
    facebookUrl: 'https://www.facebook.com/people/%D8%A7%D9%84%D8%B9%D9%82%D9%8A%D9%82-%D9%84%D8%A8%D9%8A%D8%B9-%D9%88%D8%B4%D8%B1%D8%A7%D8%A1-%D9%88%D8%B5%D9%8A%D8%A7%D8%BA%D8%A9-%D8%A7%D9%84%D8%A3%D8%AD%D8%AC%D8%A7%D8%B1-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85%D8%A9-%D9%88%D8%A7%D9%84%D8%B1%D9%88%D8%AD%D8%A7%D9%86%D9%8A%D8%A9/100039733287057/',
    isActive: true,
    notes: 'متخصص في الأحجار الكريمة والعقيق',
  },
  {
    name: 'فضيات الأصالة',
    platform: 'facebook',
    location: 'طرابلس، شارع ميزران',
    category: 'silver',
    facebookUrl: 'https://www.facebook.com/profile.php?id=100057465214389',
    isActive: true,
    notes: 'متخصص في الفضيات',
  },
];

// Storage keys
const COMPETITORS_KEY = 'competitors_data';
const COMPETITOR_POSTS_KEY = 'competitor_posts_data';
const COMPETITOR_ANALYTICS_KEY = 'competitor_analytics_data';

// Initialize default competitors
export const initCompetitors = (): Competitor[] => {
  const stored = localStorage.getItem(COMPETITORS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Auto-update if any competitor has empty facebookUrl
    const hasEmptyUrls = parsed.some((c: Competitor) => !c.facebookUrl);
    if (hasEmptyUrls) {
      return forceReinitCompetitors();
    }
    return parsed;
  }
  
  const competitors: Competitor[] = TRIPOLI_COMPETITORS.map((c, i) => ({
    ...c,
    id: `comp_${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  return competitors;
};

// Force reinitialize competitors (updates URLs from code)
export const forceReinitCompetitors = (): Competitor[] => {
  const competitors: Competitor[] = TRIPOLI_COMPETITORS.map((c, i) => ({
    ...c,
    id: `comp_${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  return competitors;
};

// Reset all competitor posts
export const resetAllPosts = (): void => {
  localStorage.removeItem(COMPETITOR_POSTS_KEY);
};

// Get all competitors
export const getCompetitors = (): Competitor[] => {
  const stored = localStorage.getItem(COMPETITORS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Auto-update if any competitor has empty facebookUrl
    const hasEmptyUrls = parsed.some((c: Competitor) => !c.facebookUrl);
    if (hasEmptyUrls) {
      return forceReinitCompetitors();
    }
    return parsed;
  }
  return initCompetitors();
};

// Save competitors
export const saveCompetitors = (competitors: Competitor[]): void => {
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
};

// Add/Update competitor
export const upsertCompetitor = (competitor: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Competitor => {
  const competitors = getCompetitors();
  const now = new Date().toISOString();
  
  if (competitor.id) {
    const index = competitors.findIndex(c => c.id === competitor.id);
    if (index !== -1) {
      // Preserve original createdAt when updating
      const originalCreatedAt = competitors[index].createdAt;
      competitors[index] = { ...competitor, id: competitor.id, createdAt: originalCreatedAt, updatedAt: now };
      saveCompetitors(competitors);
      return competitors[index];
    }
  }
  
  const newCompetitor: Competitor = {
    ...competitor,
    id: `comp_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  competitors.push(newCompetitor);
  saveCompetitors(competitors);
  return newCompetitor;
};

// Delete competitor
export const deleteCompetitor = (id: string): boolean => {
  const competitors = getCompetitors().filter(c => c.id !== id);
  saveCompetitors(competitors);
  return true;
};

// Get competitor posts
export const getCompetitorPosts = (competitorId?: string): CompetitorPost[] => {
  const stored = localStorage.getItem(COMPETITOR_POSTS_KEY);
  if (!stored) return [];
  const posts = JSON.parse(stored);
  return competitorId ? posts.filter((p: CompetitorPost) => p.competitorId === competitorId) : posts;
};

// Save competitor post
export const saveCompetitorPost = (post: Omit<CompetitorPost, 'id' | 'scrapedAt' | 'engagementRate'>): CompetitorPost => {
  const posts = getCompetitorPosts();
  const engagementRate = post.likes + post.comments + post.shares > 0 
    ? ((post.likes + post.comments * 2 + post.shares * 3) / (post.likes + post.comments + post.shares)) * 100
    : 0;
  
  const newPost: CompetitorPost = {
    ...post,
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    scrapedAt: new Date().toISOString(),
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
  
  posts.unshift(newPost);
  localStorage.setItem(COMPETITOR_POSTS_KEY, JSON.stringify(posts.slice(0, 500)));
  return newPost;
};

// Bulk save posts (for scraping)
export const bulkSaveCompetitorPosts = (posts: Omit<CompetitorPost, 'id' | 'scrapedAt' | 'engagementRate'>[]): CompetitorPost[] => {
  const existingPosts = getCompetitorPosts();
  const newPosts: CompetitorPost[] = posts.map(post => {
    const engagementRate = post.likes + post.comments + post.shares > 0 
      ? ((post.likes + post.comments * 2 + post.shares * 3) / (post.likes + post.comments + post.shares)) * 100
      : 0;
    
    return {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scrapedAt: new Date().toISOString(),
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  });
  
  const allPosts = [...newPosts, ...existingPosts];
  localStorage.setItem(COMPETITOR_POSTS_KEY, JSON.stringify(allPosts.slice(0, 500)));
  return newPosts;
};

// Calculate analytics for a competitor
export const calculateCompetitorAnalytics = (
  competitorId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): CompetitorAnalytics => {
  const competitors = getCompetitors();
  const competitor = competitors.find(c => c.id === competitorId);
  if (!competitor) throw new Error('Competitor not found');
  
  const posts = getCompetitorPosts(competitorId);
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  const periodPosts = posts.filter(p => new Date(p.postedAt) >= startDate);
  
  const totalLikes = periodPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = periodPosts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = periodPosts.reduce((sum, p) => sum + p.shares, 0);
  const avgEngagement = periodPosts.length > 0
    ? periodPosts.reduce((sum, p) => sum + p.engagementRate, 0) / periodPosts.length
    : 0;
  
  // Find most active day
  const dayCounts: Record<string, number> = {};
  periodPosts.forEach(p => {
    const day = new Date(p.postedAt).toLocaleDateString('en-CA', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  
  // Find most active hour
  const hourCounts: Record<number, number> = {};
  periodPosts.forEach(p => {
    const hour = new Date(p.postedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]) : 12;
  
  // Promoted categories
  const categoryCounts: Record<string, number> = {};
  periodPosts.forEach(p => {
    p.promotedItems?.forEach(item => {
      categoryCounts[item] = (categoryCounts[item] || 0) + 1;
    });
  });
  
  const topPost = periodPosts.sort((a, b) => b.engagementRate - a.engagementRate)[0];
  
  return {
    competitorId,
    competitorName: competitor.name,
    period,
    date: now.toISOString().split('T')[0],
    totalPosts: periodPosts.length,
    totalLikes,
    totalComments,
    totalShares,
    avgEngagementRate: Math.round(avgEngagement * 100) / 100,
    followerGrowth: 0, // Would need historical follower data
    topPost,
    mostActiveDay,
    mostActiveHour,
    promotedCategories: categoryCounts,
  };
};

// Get all competitors analytics
export const getAllCompetitorsAnalytics = (period: 'daily' | 'weekly' | 'monthly' = 'weekly'): CompetitorAnalytics[] => {
  const competitors = getCompetitors();
  return competitors.map(c => {
    try {
      return calculateCompetitorAnalytics(c.id, period);
    } catch {
      return null;
    }
  }).filter(Boolean) as CompetitorAnalytics[];
};

// Generate market insights
export const generateMarketInsights = (): MarketInsight[] => {
  const insights: MarketInsight[] = [];
  const competitors = getCompetitors();
  const analytics = getAllCompetitorsAnalytics('weekly');
  
  // Insight 1: Most active competitor
  const mostActive = analytics.length > 0 ? analytics.reduce((max, a) => a.totalPosts > max.totalPosts ? a : max, analytics[0]) : null;
  if (mostActive && mostActive.totalPosts > 5) {
    insights.push({
      type: 'threat',
      title: 'منافس نشط جداً',
      description: `${mostActive.competitorName} نشر ${mostActive.totalPosts} منشور هذا الأسبوع`,
      competitorId: mostActive.competitorId,
      competitorName: mostActive.competitorName,
      severity: 'high',
      detectedAt: new Date().toISOString(),
    });
  }
  
  // Insight 2: High engagement competitor
  const highEngagement = analytics.length > 0 ? analytics.reduce((max, a) => a.avgEngagementRate > max.avgEngagementRate ? a : max, analytics[0]) : null;
  if (highEngagement && highEngagement.avgEngagementRate > 5) {
    insights.push({
      type: 'trend',
      title: 'محتوى يتفاعل معه الجمهور',
      description: `${highEngagement.competitorName} يحقق معدل تفاعل ${highEngagement.avgEngagementRate}%`,
      competitorId: highEngagement.competitorId,
      competitorName: highEngagement.competitorName,
      severity: 'medium',
      detectedAt: new Date().toISOString(),
    });
  }
  
  // Insight 3: Category trends
  const allCategories: Record<string, number> = {};
  analytics.forEach(a => {
    Object.entries(a.promotedCategories).forEach(([cat, count]) => {
      allCategories[cat] = (allCategories[cat] || 0) + count;
    });
  });
  
  const topCategory = Object.entries(allCategories).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      type: 'opportunity',
      title: 'فئة مطلوبة في السوق',
      description: `فئة "${topCategory[0]}" هي الأكثر ترويجاً هذا الأسبوع (${topCategory[1]} منشور)`,
      severity: 'medium',
      detectedAt: new Date().toISOString(),
      data: { category: topCategory[0], count: topCategory[1] },
    });
  }
  
  // Insight 4: Best posting times
  const hourCounts: Record<number, number> = {};
  competitors.forEach(c => {
    const posts = getCompetitorPosts(c.id);
    posts.forEach(p => {
      const hour = new Date(p.postedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
  });
  
  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (bestHour) {
    insights.push({
      type: 'trend',
      title: 'أفضل وقت للنشر',
      description: `معظم المنافسين ينشرون في الساعة ${bestHour[0]}:00 (${bestHour[1]} منشور)`,
      severity: 'low',
      detectedAt: new Date().toISOString(),
      data: { hour: parseInt(bestHour[0]), count: bestHour[1] },
    });
  }
  
  return insights;
};

// Open competitor page for manual data entry
export const openCompetitorPage = (competitor: Competitor): void => {
  const url = competitor.facebookUrl || competitor.instagramUrl || competitor.websiteUrl;
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Manual post entry - user inputs data from competitor page
export const addManualPost = (post: Omit<CompetitorPost, 'id' | 'scrapedAt' | 'engagementRate'>): CompetitorPost => {
  return saveCompetitorPost(post);
};

// Export data for backup
export const exportCompetitorData = (): string => {
  const data = {
    competitors: getCompetitors(),
    posts: getCompetitorPosts(),
    analytics: getAllCompetitorsAnalytics('monthly'),
    insights: generateMarketInsights(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

// Import data from backup
export const importCompetitorData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.competitors) localStorage.setItem(COMPETITORS_KEY, JSON.stringify(data.competitors));
    if (data.posts) localStorage.setItem(COMPETITOR_POSTS_KEY, JSON.stringify(data.posts));
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
};

// ===== Dashboard Summary =====
export interface CompetitorDashboardSummary {
  totalCompetitors: number;
  activeCompetitors: number;
  totalPostsThisWeek: number;
  avgEngagementRate: number;
  topCompetitor: { name: string; posts: number; engagement: number } | null;
  trendingCategory: string | null;
  bestPostingHour: number | null;
  lastScrapeTime: string | null;
}

export const getCompetitorDashboardSummary = (): CompetitorDashboardSummary => {
  const competitors = getCompetitors();
  const activeCompetitors = competitors.filter(c => c.isActive);
  const analytics = getAllCompetitorsAnalytics('weekly');
  
  const totalPostsThisWeek = analytics.reduce((sum, a) => sum + a.totalPosts, 0);
  const avgEngagementRate = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.avgEngagementRate, 0) / analytics.length
    : 0;
  
  const topCompetitorData = analytics.length > 0 ? analytics.reduce((max, a) => a.totalPosts > max.totalPosts ? a : max, analytics[0]) : null;
  const topCompetitor = topCompetitorData ? {
    name: topCompetitorData.competitorName,
    posts: topCompetitorData.totalPosts,
    engagement: topCompetitorData.avgEngagementRate,
  } : null;
  
  // Trending category
  const categoryCounts: Record<string, number> = {};
  analytics.forEach(a => {
    Object.entries(a.promotedCategories).forEach(([cat, count]) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
    });
  });
  const trendingCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Best posting hour
  const hourCounts: Record<number, number> = {};
  competitors.forEach(c => {
    const posts = getCompetitorPosts(c.id);
    posts.forEach(p => {
      const hour = new Date(p.postedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
  });
  const bestPostingHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] 
    ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]) 
    : null;
  
  // Last scrape time (most recent post scrapedAt)
  const allPosts = getCompetitorPosts();
  const lastScrapeTime = allPosts.length > 0 
    ? allPosts.reduce((latest, p) => new Date(p.scrapedAt) > new Date(latest.scrapedAt) ? p : latest).scrapedAt
    : null;
  
  return {
    totalCompetitors: competitors.length,
    activeCompetitors: activeCompetitors.length,
    totalPostsThisWeek,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    topCompetitor,
    trendingCategory,
    bestPostingHour,
    lastScrapeTime,
  };
};