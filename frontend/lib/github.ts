import "server-only";

import { Locale, translations } from "./i18n";

export interface GitHubProfileData {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubRepoData {
  id: number;
  name: string;
  html_url: string;
  stargazers_count: number;
  description: string | null;
  language: string | null;
  fork: boolean;
}

export type GitHubProfilePayload =
  | {
      profile: GitHubProfileData;
      repos: GitHubRepoData[];
      contributions: any[];
      error: null;
    }
  | {
      profile: null;
      repos: [];
      contributions: [];
      error: string;
    };

export async function getGitHubProfilePayload(
  username: string,
  locale: Locale,
): Promise<GitHubProfilePayload> {
  const t = translations[locale].github;

  try {
    const requestInit = {
      next: { revalidate: 600 },
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "mark-yarovikov-portfolio",
      },
    } as const;

    const [profileRes, reposRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, requestInit),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
        requestInit,
      ),
      fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, requestInit),
    ]);

    if (!profileRes.ok) {
      return {
        profile: null,
        repos: [],
        contributions: [],
        error: profileRes.status === 404 ? t.errors.notFound : t.errors.api,
      };
    }

    const profileData = (await profileRes.json()) as GitHubProfileData;
    const reposData = reposRes.ok ? ((await reposRes.json()) as GitHubRepoData[]) : [];
    const contribData = contribRes.ok ? await contribRes.json() : { contributions: [] };

    if (!profileData?.login) {
      return {
        profile: null,
        repos: [],
        contributions: [],
        error: t.errors.profileDataFailed,
      };
    }

    const topRepos = Array.isArray(reposData)
      ? reposData
          .filter((repo) => !repo.fork)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 3)
      : [];

    return {
      profile: profileData,
      repos: topRepos,
      contributions: contribData.contributions || [],
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch GitHub data:", error);

    return {
      profile: null,
      repos: [],
      contributions: [],
      error: t.errors.fetchFailed,
    };
  }
}
