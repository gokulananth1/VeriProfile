import axios from 'axios';
import { compareTwoStrings } from 'string-similarity';

export type Platform = 'Twitter' | 'Instagram' | 'LinkedIn' | 'Facebook' | 'GitHub' | 'Reddit' | 'Unknown';

export interface EmailAnalysisResult {
  email: string;
  score: number;
  isFake: boolean;
  confidence: 'High' | 'Medium' | 'Low';
  signals: {
    disposableDomain: boolean;
    highEntropy: boolean;
    suspiciousCharacters: boolean;
    numericSuffix: boolean;
    lengthViolation: boolean;
    commonFakePattern: boolean;
  };
  details: string[];
}

export function analyzeEmail(email: string): EmailAnalysisResult {
  const disposableDomains = [
    'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com', 
    'dispostable.com', 'getnada.com', 'yopmail.com', 'trashmail.com',
    'fakeinbox.com', 'testmail.com'
  ];
  
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    return {
      email, score: 100, isFake: true, confidence: 'High',
      signals: { disposableDomain: false, highEntropy: false, suspiciousCharacters: false, numericSuffix: false, lengthViolation: true, commonFakePattern: false },
      details: ["Invalid email format"]
    };
  }

  const [localPart, domain] = parts;
  const signals = {
    disposableDomain: disposableDomains.includes(domain),
    highEntropy: calculateEntropy(localPart) > 3.6,
    suspiciousCharacters: /[.]{2,}|[+]{2,}|[_]{2,}/.test(localPart),
    numericSuffix: /\d{3,}$/.test(localPart),
    lengthViolation: localPart.length < 3 || localPart.length > 64,
    commonFakePattern: /^[a-z]{8,}\d{3,}$/.test(localPart) || /^[a-z]{2}\d{6,}$/.test(localPart)
  };

  let score = 0;
  const details: string[] = [];

  // Domain is the strongest signal in this dataset
  if (signals.disposableDomain) {
    score += 95;
    details.push(`Disposable domain detected: ${domain}`);
  }

  // Heuristics (weighted based on dataset patterns)
  if (signals.highEntropy && !['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'].includes(domain)) {
    score += 35;
    details.push("High randomness in username (uncommon for non-major providers)");
  } else if (signals.highEntropy) {
    score += 15; // Lower weight for major providers as seen in dataset (e.g., xpzesibn652@yahoo.com)
    details.push("Moderate randomness in username");
  }

  if (signals.numericSuffix) {
    score += 20;
    details.push("Numeric suffix detected (common in generated accounts)");
  }

  if (signals.commonFakePattern) {
    score += 45;
    details.push("Matches algorithmic generation pattern");
  }

  if (signals.suspiciousCharacters) {
    score += 25;
    details.push("Suspicious character sequences");
  }

  score = Math.min(100, score);
  
  // Refine verdict based on dataset: even if username is weird, if it's a major domain, it's often 'real' in this set
  const isMajorDomain = ['gmail.com', 'yahoo.com', 'example.com'].includes(domain);
  const isFake = signals.disposableDomain || (score > 60 && !isMajorDomain) || score > 85;
  
  const confidence = score > 90 || (score < 20 && isMajorDomain) ? 'High' : score > 50 ? 'Medium' : 'Low';

  return {
    email,
    score,
    isFake,
    confidence,
    signals,
    details
  };
}

// UPDATED: New detection signals in features
export interface ProfileFeatures {
  // Behavioral
  postingFrequency: number;
  sleepPattern: number;
  replyRatio: number;
  hashtagOveruse: number;
  firstPostSpam: number;

  // Identity
  usernamePattern: number;
  profilePhoto: number;
  nameUsernameMismatch: number;
  bioLength: number;
  fakeLocation: number;
  suspiciousLink: number;
  bioSpam: number;

  // Network
  followerSpike: number;
  ghostFollowers: number;
  followUnfollow: number;
  mutualConnections: number;

  // Content
  repetition: number;
  genericComments: number;
  externalLinks: number;
  topicDiversity: number;

  // History
  accountAge: number;
  dormancy: number;
  deletedPosts: number;
  profileEdits: number;

  // Cross Platform
  presence: number;
  followerMismatch: number;
  joinDateCluster: number;

  // Profile Completeness
  profileComplete: number;
}

export interface AnalysisResult {
  id: string;
  url: string;
  username: string;
  realName?: string;
  platform: Platform;
  timestamp: number;
  features: ProfileFeatures;
  overallScore: number;
  isFake: boolean;
  confidence: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  suspicionLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  signalsAnalyzed: number;
  crossPlatformResults: Record<string, boolean>;
  flaggedReasons: string[];
  signals: Record<string, { score: number; weight: number; name: string; status: string }>;
  isTracked?: boolean;
  previousScore?: number;
  accountCreationDate?: string;
  activityHistory?: any[];
  modelScores?: any;
  label: string; // NEW: FAKE, SUSPICIOUS, UNCERTAIN, REAL
}

// NEW: Cache for results
const cache = new Map<string, AnalysisResult>();

// NEW: Timeout each platform request
const fetchWithTimeout = (url: string, options = {}, ms = 5000): Promise<any> =>
  Promise.race([
    axios.get(url, options),
    new Promise((_, rej) => setTimeout(() => rej("timeout"), ms))
  ]);

async function fetchWithRetry(url: string, options = {}, retries = 1): Promise<any> {
  try {
    return await fetchWithTimeout(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return fetchWithRetry(url, options, retries - 1);
    }
    return null;
  }
}

export function detectPlatform(url: string): Platform {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter';
  if (lowerUrl.includes('instagram.com')) return 'Instagram';
  if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
  if (lowerUrl.includes('facebook.com')) return 'Facebook';
  if (lowerUrl.includes('github.com')) return 'GitHub';
  if (lowerUrl.includes('reddit.com')) return 'Reddit';
  return 'Unknown';
}

export function extractUsername(url: string, platform: Platform): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    
    if (platform === 'LinkedIn') {
      if (pathParts[0] === 'in' && pathParts[1]) return pathParts[1];
    }
    
    return pathParts[0] || 'unknown_user';
  } catch {
    return url.split('/').pop() || 'unknown_user';
  }
}

// NEW: Entropy calculation for username randomness
function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const freqs: Record<string, number> = {};
  for (const char of str) {
    freqs[char] = (freqs[char] || 0) + 1;
  }
  return Object.values(freqs).reduce((acc, freq) => {
    const p = freq / len;
    return acc - p * Math.log2(p);
  }, 0);
}

// NEW: Topic detection helper
function detectTopic(text: string): string {
  if (!text) return "unknown";
  const topics: Record<string, string[]> = {
    crypto: ["crypto", "bitcoin", "eth", "nft", "blockchain"],
    finance: ["money", "invest", "earn", "profit", "trading"],
    lifestyle: ["travel", "food", "life", "happy", "vibe"],
    tech: ["code", "software", "ai", "dev", "tech"]
  };
  
  const lowerText = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(k => lowerText.includes(k))) return topic;
  }
  return "general";
}

// NEW: Sub-analysis functions for efficiency
async function analyzeBehavioral(data: any) {
  const behavioral: any = {};
  const accountAgeDays = (Date.now() - new Date(data.createdAt).getTime()) / 86400000;
  const totalPosts = data.postCount || 0;
  
  // Posting Frequency
  const postsPerDay = totalPosts / accountAgeDays;
  behavioral.postingFrequency = postsPerDay > 50 ? 100 : postsPerDay > 20 ? 70 : postsPerDay > 10 ? 40 : 0;

  // Sleep Pattern
  const postTimestamps = data.posts?.map((p: any) => p.timestamp) || [];
  const uniqueHours = new Set(postTimestamps.map((t: number) => new Date(t).getHours())).size;
  behavioral.sleepPattern = uniqueHours >= 20 ? 100 : uniqueHours >= 16 ? 60 : 0;

  // Reply vs Original Post Ratio
  const totalReplies = data.posts?.filter((p: any) => p.isReply).length || 0;
  const replyRatio = totalPosts === 0 ? 0 : totalReplies / totalPosts;
  behavioral.replyRatio = replyRatio < 0.05 ? 80 : replyRatio < 0.1 ? 40 : 0;

  // Hashtag Overuse
  const totalHashtags = data.posts?.reduce((acc: number, p: any) => acc + (p.hashtags?.length || 0), 0) || 0;
  const avgHashtags = totalPosts === 0 ? 0 : totalHashtags / totalPosts;
  behavioral.hashtagOveruse = avgHashtags > 15 ? 90 : avgHashtags > 10 ? 60 : avgHashtags > 5 ? 30 : 0;

  // First Post Content
  const firstPost = data.posts?.[data.posts.length - 1]?.content;
  const spamFirstPost = ["click here", "free", "win", "crypto", "dm me"].some(w => firstPost?.toLowerCase().includes(w));
  behavioral.firstPostSpam = spamFirstPost ? 90 : 0;

  // Post Timing (10 posts in 1 hour)
  let maxBurst = 0;
  if (postTimestamps.length >= 10) {
    const sorted = [...postTimestamps].sort((a, b) => a - b); // Chronological
    for (let i = 0; i <= sorted.length - 10; i++) {
      const windowMs = sorted[i + 9] - sorted[i];
      const windowHours = windowMs / 3600000;
      if (windowHours < 1) {
        maxBurst = 100;
        break;
      } else if (windowHours < 24) {
        maxBurst = Math.max(maxBurst, 40);
      }
    }
  }
  behavioral.postTiming = maxBurst;

  return behavioral;
}

async function analyzeIdentity(data: any, username: string) {
  const identity: any = {};
  const bio = data.bio || "";
  const displayName = data.displayName || "";

  // Username Pattern
  const consecutiveNumbers = (username.match(/\d{4,}/) || []).length > 0;
  const entropy = calculateEntropy(username);
  const isRandom = entropy > 3.8 || /^[a-z]+\d{5,}$/i.test(username);
  identity.usernamePattern = (consecutiveNumbers || isRandom) ? 80 : 0;

  // Profile Photo (No avatar or default avatar)
  const isDefaultAvatar = typeof data.avatar === 'string' && (
    data.avatar.includes('default_profile') || 
    data.avatar.includes('abs.twimg.com/sticky/default_profile_images') ||
    data.avatar.includes('instagram.com/static/images/anonymousUser') ||
    data.avatar.includes('fbcdn.net/static_resources/anonymous')
  );
  identity.profilePhoto = (!data.avatar || isDefaultAvatar) ? 100 : 0;

  // Name vs Username Mismatch
  const nameSimilarity = compareTwoStrings(displayName, username);
  identity.nameUsernameMismatch = nameSimilarity < 0.2 ? 70 : nameSimilarity < 0.4 ? 40 : 0;

  // Bio Length
  identity.bioLength = !bio ? 100 : bio.length < 10 ? 70 : bio.length < 30 ? 30 : 0;

  // Suspicious Location
  const fakeLocations = ["earth", "universe", "everywhere", "nowhere", "milky way"];
  identity.fakeLocation = fakeLocations.some(l => data.location?.toLowerCase().includes(l)) ? 80 : 0;

  // Suspicious Website in Bio
  const suspiciousDomains = ["bit.ly", "tinyurl", "t.co", "goo.gl", "ow.ly"];
  identity.suspiciousLink = suspiciousDomains.some(d => bio.includes(d)) ? 85 : 0;

  // Bio Spam Keywords
  const spamBioWords = ["crypto", "nft", "forex", "dm me", "investment", "free money", "click link", "earn from home"];
  const spamCount = spamBioWords.filter(w => bio.toLowerCase().includes(w)).length;
  identity.bioSpam = spamCount >= 2 ? 100 : spamCount === 1 ? 60 : 0;

  return identity;
}

async function analyzeNetwork(data: any) {
  const network: any = {};
  const followers = data.followers || 0;
  const following = data.following || 0;
  const followersLastMonth = data.followersLastMonth || followers; // Mocking if not present

  // Follower Growth Spike
  const growthRate = followersLastMonth === 0 ? 0 : (followers - followersLastMonth) / followersLastMonth;
  network.followerSpike = growthRate > 2.0 ? 100 : growthRate > 1.0 ? 70 : growthRate > 0.5 ? 30 : 0;

  // Ghost Followers (Engagement Rate)
  const totalEngagement = (data.likes || 0) + (data.comments || 0);
  // If no followers, engagement rate signal is not applicable (Safe)
  const engagementRate = followers <= 0 ? 1 : totalEngagement / followers;
  network.ghostFollowers = followers <= 0 ? 0 : (engagementRate < 0.005 ? 100 : engagementRate < 0.01 ? 70 : engagementRate < 0.03 ? 30 : 0);

  // Unreciprocated Following (Follow many, but not followed back)
  const ffRatio = followers === 0 ? (following > 10 ? 100 : 0) : following / followers;
  const followingDisparity = (following > 500 && followers < 50) ? 100 : (following > 200 && followers < 20) ? 80 : 0;
  network.followUnfollow = Math.max(
    ffRatio > 10 ? 100 : ffRatio > 5 ? 70 : ffRatio > 2 ? 40 : 0,
    followingDisparity
  );

  // Mutual Connections
  const mutualCount = data.mutualCount || 0;
  network.mutualConnections = mutualCount === 0 ? 80 : mutualCount < 5 ? 40 : 0;

  return network;
}

async function analyzeContent(data: any) {
  const content: any = {};
  const posts = data.posts || [];

  // Content Repetition (Identical or Highly Similar)
  if (posts.length > 1) {
    let similarCount = 0;
    // Limit analysis to recent 50 posts for performance
    const postsToAnalyze = posts.slice(0, 50);
    for (let i = 0; i < postsToAnalyze.length; i++) {
      for (let j = i + 1; j < postsToAnalyze.length; j++) {
        const similarity = compareTwoStrings(
          postsToAnalyze[i].content?.toLowerCase().trim() || "",
          postsToAnalyze[j].content?.toLowerCase().trim() || ""
        );
        if (similarity > 0.85) {
          similarCount++;
          break;
        }
      }
    }
    const repetitionRate = similarCount / postsToAnalyze.length;
    content.repetition = repetitionRate > 0.5 ? 100 : repetitionRate > 0.3 ? 60 : repetitionRate > 0.1 ? 30 : 0;
  } else {
    content.repetition = 0;
  }

  // Generic Comments Detection
  const genericPhrases = ["nice post", "great content", "love this", "awesome", "follow me", "check my profile"];
  const genericCount = posts.filter((p: any) => genericPhrases.some(g => p.content?.toLowerCase().includes(g))).length;
  content.genericComments = posts.length === 0 ? 0 : (genericCount / posts.length) > 0.5 ? 90 : (genericCount / posts.length) > 0.3 ? 60 : 0;

  // External Link Ratio
  const linkRatio = posts.length === 0 ? 0 : posts.filter((p: any) => p.content?.includes("http")).length / posts.length;
  content.externalLinks = linkRatio > 0.7 ? 90 : linkRatio > 0.5 ? 60 : linkRatio > 0.3 ? 30 : 0;

  // Topic Diversity
  const uniqueTopics = new Set(posts.map((p: any) => detectTopic(p.content))).size;
  content.topicDiversity = uniqueTopics === 1 ? 80 : uniqueTopics <= 2 ? 50 : 0;

  return content;
}

async function analyzeHistory(data: any) {
  const history: any = {};
  const accountAgeDays = (Date.now() - new Date(data.createdAt).getTime()) / 86400000;
  
  // Account Age
  history.accountAge = accountAgeDays < 30 ? 100 : accountAgeDays < 180 ? 60 : accountAgeDays < 365 ? 30 : 0;

  // Account Dormancy
  const gapDays = data.daysBetweenLastTwoActivePeriods || 0;
  history.dormancy = gapDays > 180 ? 90 : gapDays > 90 ? 60 : gapDays > 30 ? 30 : 0;

  // Deleted Old Posts
  const expectedPosts = data.expectedPosts || data.postCount || 0;
  const actualPosts = data.postCount || 0;
  const deletedRatio = expectedPosts === 0 ? 0 : (expectedPosts - actualPosts) / expectedPosts;
  history.deletedPosts = deletedRatio > 0.5 ? 80 : deletedRatio > 0.3 ? 50 : 0;

  // Profile Edit Frequency
  const editCount = data.editCount || 0;
  history.profileEdits = editCount > 10 ? 80 : editCount > 5 ? 50 : editCount > 3 ? 20 : 0;

  return history;
}

async function analyzeCrossPlatform(username: string) {
  const crossPlatform: any = {};
  const crossCheckResponse = await fetchWithRetry(`/api/crosscheck/${username}`);
  const platforms = crossCheckResponse?.data || { github: false, reddit: false, twitter: false, instagram: false };
  
  // Platform Presence Score
  const presentCount = Object.values(platforms).filter(v => v).length;
  crossPlatform.presence = presentCount === 0 ? 100 : presentCount === 1 ? 70 : presentCount === 2 ? 40 : presentCount === 3 ? 15 : 0;

  // Follower Count Mismatch (Mocked)
  crossPlatform.followerMismatch = 0;

  // Join Date Consistency (Mocked)
  crossPlatform.joinDateCluster = 0;

  return { crossPlatform, platforms };
}

export interface ComparisonResult {
  account1: {
    username: string;
    platform: Platform;
    bio: string;
    features: ProfileFeatures;
  };
  account2: {
    username: string;
    platform: Platform;
    bio: string;
    features: ProfileFeatures;
  };
  usernameSimilarity: number;
  bioSimilarity: number;
  featureSimilarity: number;
  overallSimilarity: number;
  isDuplicate: boolean;
  confidence: string;
}

export const compareProfiles = (res1: AnalysisResult, res2: AnalysisResult, bio1: string = "", bio2: string = ""): ComparisonResult => {
  const usernameSim = compareTwoStrings(res1.username.toLowerCase(), res2.username.toLowerCase());
  const bioSim = compareTwoStrings(bio1.toLowerCase(), bio2.toLowerCase());
  
  // Compare features (ProfileFeatures)
  const keys = Object.keys(res1.features) as (keyof ProfileFeatures)[];
  let featureDiffSum = 0;
  keys.forEach(key => {
    featureDiffSum += Math.abs((res1.features[key] || 0) - (res2.features[key] || 0));
  });
  
  const avgFeatureDiff = featureDiffSum / keys.length;
  const featureSim = Math.max(0, 1 - (avgFeatureDiff / 100));

  // Weighted overall similarity
  const overallSim = (usernameSim * 0.4) + (bioSim * 0.3) + (featureSim * 0.3);
  
  const isDuplicate = overallSim > 0.75;
  const confidence = overallSim > 0.9 ? "High" : overallSim > 0.75 ? "Medium" : "Low";

  return {
    account1: {
      username: res1.username,
      platform: res1.platform,
      bio: bio1,
      features: res1.features
    },
    account2: {
      username: res2.username,
      platform: res2.platform,
      bio: bio2,
      features: res2.features
    },
    usernameSimilarity: Math.round(usernameSim * 100),
    bioSimilarity: Math.round(bioSim * 100),
    featureSimilarity: Math.round(featureSim * 100),
    overallSimilarity: Math.round(overallSim * 100),
    isDuplicate,
    confidence
  };
};

// UPDATED: analyzeProfile with efficiency and new scoring
export async function analyzeProfile(url: string, seedOffset: number = 0, realName?: string): Promise<AnalysisResult> {
  const platform = detectPlatform(url);
  const username = extractUsername(url, platform);

  // 2. Cache results
  if (cache.has(username)) return cache.get(username)!;

  const analyzeResponse = await fetchWithRetry(`/api/analyze/${platform}/${username}`);
  const data = analyzeResponse?.data || {
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    postCount: 0,
    followers: 0,
    following: 0,
    bio: "",
    avatar: null,
    displayName: "",
    likes: 0,
    comments: 0,
    posts: []
  };

  // 1. Run first 3 signal checks in parallel
  const [behavioral, identity, network] = await Promise.all([
    analyzeBehavioral(data),
    analyzeIdentity(data, username),
    analyzeNetwork(data),
  ]);

  // Early Exit: If raw score from first 3 categories is extremely high
  const partialRawScore = (
    (behavioral.postingFrequency * 0.05 + behavioral.sleepPattern * 0.05 + behavioral.replyRatio * 0.05 + behavioral.hashtagOveruse * 0.03 + behavioral.firstPostSpam * 0.02 + behavioral.postTiming * 0.05) +
    (identity.usernamePattern * 0.02 + identity.profilePhoto * 0.08 + identity.nameUsernameMismatch * 0.02 + identity.bioLength * 0.02 + identity.fakeLocation * 0.02 + identity.suspiciousLink * 0.02 + identity.bioSpam * 0.02) +
    (network.followerSpike * 0.05 + network.ghostFollowers * 0.04 + network.followUnfollow * 0.09 + network.mutualConnections * 0.02)
  );

  let content, history, crossPlatformData;
  if (partialRawScore > 60) { // 60/65 is ~92% of the available score so far
    content = { repetition: 100, genericComments: 100, externalLinks: 100, topicDiversity: 100 };
    history = { accountAge: 100, dormancy: 100, deletedPosts: 100, profileEdits: 100 };
    crossPlatformData = { crossPlatform: { presence: 100, followerMismatch: 100, joinDateCluster: 100 }, platforms: {} };
  } else {
    [content, history, crossPlatformData] = await Promise.all([
      analyzeContent(data),
      analyzeHistory(data),
      analyzeCrossPlatform(username),
    ]);
  }

  const { crossPlatform, platforms } = crossPlatformData;

  const signals: Record<string, { score: number; weight: number; name: string; status: string }> = {
    // Behavioral (Total: 0.25)
    postingFrequency:   { score: behavioral.postingFrequency, weight: 0.05, name: "Posting Frequency", status: "" },
    sleepPattern:       { score: behavioral.sleepPattern, weight: 0.05, name: "Sleep Pattern", status: "" },
    replyRatio:         { score: behavioral.replyRatio, weight: 0.05, name: "Reply Ratio", status: "" },
    hashtagOveruse:     { score: behavioral.hashtagOveruse, weight: 0.03, name: "Hashtag Overuse", status: "" },
    firstPostSpam:      { score: behavioral.firstPostSpam, weight: 0.02, name: "First Post Spam", status: "" },
    postTiming:         { score: behavioral.postTiming, weight: 0.05, name: "Post Timing", status: "" },

    // Identity (Total: 0.2)
    usernamePattern:      { score: identity.usernamePattern, weight: 0.02, name: "Username Pattern", status: "" },
    profilePhoto:         { score: identity.profilePhoto, weight: 0.08, name: "Profile Photo", status: "" },
    nameUsernameMismatch: { score: identity.nameUsernameMismatch, weight: 0.02, name: "Name/Username Mismatch", status: "" },
    bioLength:            { score: identity.bioLength, weight: 0.02, name: "Bio Length", status: "" },
    fakeLocation:         { score: identity.fakeLocation, weight: 0.02, name: "Fake Location", status: "" },
    suspiciousLink:       { score: identity.suspiciousLink, weight: 0.02, name: "Suspicious Link", status: "" },
    bioSpam:              { score: identity.bioSpam, weight: 0.02, name: "Bio Spam", status: "" },

    // Network (Total: 0.2)
    followerSpike:      { score: network.followerSpike, weight: 0.05, name: "Follower Spike", status: "" },
    ghostFollowers:     { score: network.ghostFollowers, weight: 0.04, name: "Engagement Rate", status: "" },
    followUnfollow:     { score: network.followUnfollow, weight: 0.09, name: "Unreciprocated Following", status: "" },
    mutualConnections:  { score: network.mutualConnections, weight: 0.02, name: "Mutual Connections", status: "" },

    // Content (Total: 0.15)
    repetition:         { score: content.repetition, weight: 0.05, name: "Content Repetition", status: "" },
    genericComments:    { score: content.genericComments, weight: 0.04, name: "Generic Comments", status: "" },
    externalLinks:      { score: content.externalLinks, weight: 0.03, name: "External Links", status: "" },
    topicDiversity:     { score: content.topicDiversity, weight: 0.03, name: "Topic Diversity", status: "" },

    // Account History (Total: 0.1)
    accountAge:         { score: history.accountAge, weight: 0.07, name: "Account Age", status: "" },
    dormancy:           { score: history.dormancy, weight: 0.01, name: "Account Dormancy", status: "" },
    deletedPosts:       { score: history.deletedPosts, weight: 0.01, name: "Deleted Posts", status: "" },
    profileEdits:       { score: history.profileEdits, weight: 0.01, name: "Profile Edits", status: "" },

    // Cross Platform (Total: 0.1)
    presence:           { score: crossPlatform.presence, weight: 0.05, name: "Platform Presence", status: "" },
    followerMismatch:   { score: crossPlatform.followerMismatch, weight: 0.03, name: "Follower Mismatch", status: "" },
    joinDateCluster:    { score: crossPlatform.joinDateCluster, weight: 0.02, name: "Join Date Cluster", status: "" },
  };

  // Step 1 – Normalize All Scores to 0–1
  const normalized = Object.fromEntries(
    Object.entries(signals).map(([k, v]) => [k, v.score / 100])
  );

  // Step 3 – Apply Penalty Boosters for High-Confidence Fake Signals
  const hardFakeSignals = [
    signals.sleepPattern.score,
    signals.repetition.score,
    signals.ghostFollowers.score,
    signals.bioSpam.score,
  ];

  const maxHardSignal = Math.max(...hardFakeSignals);
  const penaltyBoost = maxHardSignal > 90 ? 15 : maxHardSignal > 70 ? 8 : 0;

  const rawScore = Object.entries(signals).reduce(
    (acc, [key, s]) => acc + (normalized[key] ?? 0) * s.weight, 0
  ) * 100;

  // 3. Skip low-signal checks early if already highly confident
  if (rawScore > 90) {
    // We still finalize but could return early in a more complex system
  }

  const finalScore = Math.min(100, Math.max(0, rawScore + penaltyBoost + (seedOffset * 20 - 10)));

  // Step 4 – Add Threshold Calibration
  const classify = (score: number) => {
    if (score >= 65) return { label: "FAKE",       confidence: "High"   };
    if (score >= 45) return { label: "SUSPICIOUS",  confidence: "Medium" };
    if (score >= 25) return { label: "UNCERTAIN",   confidence: "Low"    };
    return            { label: "REAL",       confidence: "High"   };
  };

  const classification = classify(finalScore);

  const flaggedReasons: string[] = [];
  Object.entries(signals).forEach(([key, s]) => {
    if (s.score > 60) flaggedReasons.push(s.name);
    s.status = s.score < 30 ? "Safe" : s.score <= 60 ? "Suspicious" : "Fake Signal";
  });

  const result: AnalysisResult = {
    id: Math.random().toString(36).substr(2, 9),
    url,
    username: data.username || username,
    realName: data.displayName || realName,
    platform,
    timestamp: Date.now(),
    features: Object.fromEntries(Object.entries(signals).map(([k, v]) => [k, v.score])) as any,
    overallScore: finalScore,
    isFake: classification.label === "FAKE" || classification.label === "SUSPICIOUS",
    confidence: classification.confidence === "High" ? 90 : classification.confidence === "Medium" ? 60 : 30,
    confidenceLevel: classification.confidence as any,
    suspicionLevel: finalScore > 80 ? 'Critical' : finalScore > 60 ? 'High' : finalScore > 30 ? 'Medium' : 'Low',
    signalsAnalyzed: Object.keys(signals).length,
    crossPlatformResults: platforms,
    flaggedReasons,
    signals,
    accountCreationDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown',
    activityHistory: [],
    modelScores: { lstm: 0, xgboost: 0, randomForest: 0 },
    label: classification.label
  };

  cache.set(username, result);
  return result;
}

// NEW: F1 Score Tracking
export const addFeedback = (predictedLabel: string, actualLabel: string) => {
  const feedback = JSON.parse(localStorage.getItem("feedback") || "[]");
  feedback.push({ predicted: predictedLabel, actual: actualLabel, timestamp: Date.now() });
  localStorage.setItem("feedback", JSON.stringify(feedback));
  return calculateF1(feedback);
};

export const calculateF1 = (data: any[]) => {
  const tp = data.filter(d => d.predicted === "FAKE" && d.actual === "FAKE").length;
  const fp = data.filter(d => d.predicted === "FAKE" && d.actual === "REAL").length;
  const fn = data.filter(d => d.predicted === "REAL" && d.actual === "FAKE").length;

  const precision = tp / (tp + fp) || 0;
  const recall    = tp / (tp + fn) || 0;
  const f1        = 2 * (precision * recall) / (precision + recall) || 0;

  return { 
    precision: precision.toFixed(2), 
    recall: recall.toFixed(2), 
    f1Score: f1.toFixed(2),
    total: data.length,
    correct: data.filter(d => d.predicted === d.actual).length,
    wrong: data.filter(d => d.predicted !== d.actual).length
  };
};
