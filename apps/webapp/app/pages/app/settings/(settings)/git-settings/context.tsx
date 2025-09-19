import { createContext, useContext, useState, useEffect } from "react";
import { useLoaderData } from "react-router";

import type { GitHubBranch, GitHubOrganization, GitHubRepository } from "~/services/github";

import type { LoaderData } from "./loader";

export const GitSettingsContext = createContext<{
    githubOrgs: GitHubOrganization[];
    setGithubOrgs: (githubOrgs: GitHubOrganization[]) => void;
    currentGithubOrg: GitHubOrganization | null;
    setCurrentGithubOrg: (githubOrg: GitHubOrganization) => void;

    repositories: GitHubRepository[];
    setRepositories: (repositories: GitHubRepository[]) => void;
    currentRepository: GitHubRepository | null;
    setCurrentRepository: (repository: GitHubRepository) => void;

    branches: GitHubBranch[];
    setBranches: (branches: GitHubBranch[]) => void;
    currentBranch: GitHubBranch | null;
    setCurrentBranch: (branch: GitHubBranch) => void;

    loading: boolean;
    setLoading: (loading: boolean) => void;
    organizationId: string;

    fetcher: {
        repositories: (orgLogin: string) => Promise<void>;
        branches: (owner: string, repo: string) => Promise<void>;
        saveSettings: () => Promise<void>;
    };
}>({
    githubOrgs: [],
    setGithubOrgs: () => { },
    currentGithubOrg: null,
    setCurrentGithubOrg: () => { },

    repositories: [],
    setRepositories: () => { },
    currentRepository: null,
    setCurrentRepository: () => { },

    branches: [],
    setBranches: () => { },
    currentBranch: null,
    setCurrentBranch: () => { },

    loading: false,
    setLoading: () => { },
    organizationId: "",

    fetcher: {
        repositories: async () => { },
        branches: async () => { },
        saveSettings: async () => { },
    },
});

export const useGitSettings = () => useContext(GitSettingsContext);

export function withGitSettingsProvider(Component: React.ComponentType<any>) {
    return function GitSettingsProvider(props: { children: React.ReactNode }) {
        const {
            githubOrgs: serverGithubOrgs,
            repositories: serverRepositories,
            branches: serverBranches,
            organizationId,
            savedSettings,
        } = useLoaderData<LoaderData>();

        const [githubOrgs, setGithubOrgs] = useState<GitHubOrganization[]>(serverGithubOrgs || []);

        // Use saved organization or default to first one
        const savedOrg = savedSettings?.repoOrg ?
            serverGithubOrgs.find(org => org.login === savedSettings.repoOrg) :
            serverGithubOrgs[0];
        const [currentGithubOrg, setCurrentGithubOrg] = useState<GitHubOrganization | null>(savedOrg || null);

        const [repositories, setRepositories] = useState<GitHubRepository[]>(serverRepositories || []);

        // Use saved repository or default to first one
        const savedRepo = savedSettings?.repo ?
            serverRepositories.find(repo => repo.name === savedSettings.repo) :
            serverRepositories[0];
        const [currentRepository, setCurrentRepository] = useState<GitHubRepository | null>(savedRepo || null);

        const [branches, setBranches] = useState<GitHubBranch[]>(serverBranches || []);

        // Use saved branch or default to first one
        const savedBranch = savedSettings?.repoBranch ?
            serverBranches.find(branch => branch.name === savedSettings.repoBranch) :
            serverBranches[0];
        const [currentBranch, setCurrentBranch] = useState<GitHubBranch | null>(savedBranch || null);


        const [loading, setLoading] = useState(false);

        // Update currentBranch when branches change
        useEffect(() => {
            if (branches.length > 0 && !currentBranch) {
                setCurrentBranch(branches[0]);
            } else if (branches.length > 0 && currentBranch) {
                // If we have branches and a current branch, make sure it still exists
                const branchExists = branches.find(branch => branch.name === currentBranch.name);
                if (!branchExists) {
                    // Current branch no longer exists, set to first available
                    setCurrentBranch(branches[0]);
                }
            } else if (branches.length === 0) {
                // No branches available, clear current branch
                setCurrentBranch(null);
            }
        }, [branches, currentBranch]);

        async function fetchRepositories(orgLogin: string) {
            setLoading(true);
            try {
                const response = await fetch(`/api/github/repositories?organizationId=${encodeURIComponent(organizationId)}&orgLogin=${encodeURIComponent(orgLogin)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch repositories');
                }
                const repos = await response.json();
                setRepositories(repos);
                // Reset current repository and branches when organization changes
                setCurrentRepository(null);
                setBranches([]);
                setCurrentBranch(null);
            } catch (error) {
                console.error('Error fetching repositories:', error);
                setRepositories([]);
                setCurrentRepository(null);
                setBranches([]);
                setCurrentBranch(null);
            } finally {
                setLoading(false);
            }
        }

        async function fetchBranches(owner: string, repo: string) {
            setLoading(true);
            try {
                const response = await fetch(`/api/github/branches?organizationId=${encodeURIComponent(organizationId)}&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch branches');
                }
                const branchData = await response.json();
                setBranches(branchData);
                // Reset current branch when repository changes
                setCurrentBranch(null);
            } catch (error) {
                console.error('Error fetching branches:', error);
                setBranches([]);
                setCurrentBranch(null);
            } finally {
                setLoading(false);
            }
        }

        async function saveSettings() {
            if (!currentGithubOrg || !currentRepository || !currentBranch) {
                alert('Please select an organization, repository, and branch before saving.');
                return;
            }

            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('organizationId', organizationId);
                formData.append('repoOrg', currentGithubOrg.login);
                formData.append('repo', currentRepository.name);
                formData.append('repoBranch', currentBranch.name);

                const response = await fetch('/api/github/settings', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to save settings');
                }

                alert('GitHub settings saved successfully!');
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('Failed to save settings. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        return <GitSettingsContext.Provider value={{
            githubOrgs,
            setGithubOrgs,
            currentGithubOrg,
            setCurrentGithubOrg,

            repositories,
            setRepositories,
            currentRepository,
            setCurrentRepository,

            branches,
            setBranches,
            currentBranch,
            setCurrentBranch,

            loading,
            setLoading,
            organizationId,

            fetcher: {
                repositories: fetchRepositories,
                branches: fetchBranches,
                saveSettings,
            }
        }}>
            <Component {...props} />
        </GitSettingsContext.Provider>
    }
}
