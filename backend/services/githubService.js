const axios = require('axios');
const Tool = require('../models/Tool');

const parseGitHubRepo = (repoStr) => {
    if (!repoStr) return null;
    let s = repoStr.trim();
    // Remove trailing slashes and .git suffix
    s = s.replace(/\/+$/, '').replace(/\.git$/, '');
    // If it's a full URL
    if (s.includes('github.com')) {
        const parts = s.split('github.com/');
        if (parts.length > 1) {
            const pathParts = parts[1].split('/');
            if (pathParts.length >= 2) {
                return `${pathParts[0]}/${pathParts[1]}`;
            }
        }
    }
    // If it's owner/repo format
    const slashParts = s.split('/');
    if (slashParts.length === 2) {
        return s;
    }
    return null;
};

const fetchGitHubCommits = async (repoHandle) => {
    const repo = parseGitHubRepo(repoHandle);
    if (!repo) {
        console.warn(`[GitHub Service] Invalid repository handle/URL: ${repoHandle}`);
        return 0;
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    const sinceISO = sinceDate.toISOString();

    const url = `https://api.github.com/repos/${repo}/commits?since=${sinceISO}&per_page=100`;

    const headers = {
        'User-Agent': 'Web3Central-Backend/1.0',
        'Accept': 'application/vnd.github.v3+json'
    };

    if (process.env.GITHUB_PAT || process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_PAT || process.env.GITHUB_TOKEN}`;
    }

    try {
        const response = await axios.get(url, { headers, timeout: 8000 });
        if (Array.isArray(response.data)) {
            return response.data.length;
        }
        return 0;
    } catch (error) {
        console.warn(`[GitHub Service] Error fetching commits for ${repo}:`, error.message);
        // If it returns 404 or 403, just return 0 to prevent crashes
        return 0;
    }
};

const syncGitHubCommits = async () => {
    console.log('[GitHub Service] Sync job started...');
    const tools = await Tool.find({ githubRepo: { $exists: true, $ne: '' } });
    let updatedCount = 0;

    for (const tool of tools) {
        try {
            console.log(`[GitHub Service] Syncing commits for ${tool.name} (${tool.githubRepo})...`);
            const commitCount = await fetchGitHubCommits(tool.githubRepo);
            
            const githubCommits = {
                count30d: commitCount,
                lastUpdated: new Date()
            };
            
            await Tool.updateOne(
                { id: tool.id },
                { $set: { githubCommits } }
            );
            
            updatedCount++;
            
            // Subtle sleep/delay to prevent hitting GitHub unauthenticated rate limits (60/hr)
            if (!process.env.GITHUB_PAT && !process.env.GITHUB_TOKEN) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (err) {
            console.error(`[GitHub Service] Sync failed for ${tool.name}:`, err.message);
        }
    }

    console.log(`[GitHub Service] Sync complete! Updated ${updatedCount} tools.`);
    return updatedCount;
};

module.exports = {
    parseGitHubRepo,
    fetchGitHubCommits,
    syncGitHubCommits
};
