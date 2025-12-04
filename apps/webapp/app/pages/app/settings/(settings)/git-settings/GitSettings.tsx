import { useContext } from "react";

import * as Icons from "@livesession/design-system-icons";

import { IconGitMerge, IconGithub } from "~/icons"
import { Button, Select } from "~/components"
import { Templates } from "~/components/templates";

import { GitSettingsContext, useGitSettings, withGitSettingsProvider } from "./context";

export { loader } from "./loader";

function GitSettings() {
    const { githubOrgs } = useGitSettings();

    return <Templates.SettingsSurface
        id="git-settings"
        title="Git Settings"
        description={<>Configure GitHub to create deployments for any commits pushed to your repository</>}
        icon={IconGitMerge}
        heading={<>{githubOrgs.length} GitHub organizations</>}
        headingDescription={<>You can have <b>unlimited</b> organizations in your current plan.</>}
        navigationAction={<_ConnectGitHub />}
    >
        <>
            <_SelectOrganization />

            <_SelectRepository />

            <_SelectBranch />

            <_Save />
        </>
    </Templates.SettingsSurface>
}

export default withGitSettingsProvider(GitSettings);

function _ConnectGitHub() {
    const handleClick = () => {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = '/api/github/auth';
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
    };

    return (
        <Button icon={Icons.PlusIcon} size="small" onClick={handleClick}>
            Connect GitHub
        </Button>
    );
}

function _SelectOrganization() {
    const { githubOrgs, currentGithubOrg, setCurrentGithubOrg, loading, fetcher } = useContext(GitSettingsContext);

    async function onChange(orgLogin: string) {
        const org = githubOrgs.find(org => org.login === orgLogin);
        if (!org) {
            return;
        }

        setCurrentGithubOrg(org);
        await fetcher.repositories(orgLogin);
    }

    const value = currentGithubOrg?.login || "";

    return (
        <Select
            label="GitHub organization"
            value={value}
            type="text"
            icon={IconGithub}
            onChange={(e) => onChange(e.target.value)}
            items={githubOrgs.map(org => ({ name: org.name || org.login, value: org.login }))}
            disabled={loading || !githubOrgs.length}
        />
    );
}

function _SelectRepository() {
    const { repositories, currentRepository, setCurrentRepository, currentGithubOrg, loading, fetcher } = useContext(GitSettingsContext);

    async function onChange(repoName: string) {
        const repo = repositories.find(repo => repo.name === repoName);
        if (!repo || !currentGithubOrg) {
            return;
        }

        setCurrentRepository(repo);
        await fetcher.branches(currentGithubOrg.login, repoName);
    }

    const value = currentRepository?.name || "";

    return (
        <Select
            label="Repository"
            value={value}
            type="text"
            icon={IconGithub}
            onChange={(e) => onChange(e.target.value)}
            items={repositories.map(repo => ({ name: repo.name, value: repo.name }))}
            disabled={loading || !repositories.length}
        />
    );
}

function _SelectBranch() {
    const { branches, currentBranch, setCurrentBranch, loading } = useContext(GitSettingsContext);

    function onChange(branchName: string) {
        const branch = branches.find(branch => branch.name === branchName);
        if (!branch) {
            return;
        }
        setCurrentBranch(branch);
    }

    const value = currentBranch?.name || "";

    return (
        <Select
            label="Branch"
            value={value}
            type="text"
            icon={IconGitMerge}
            onChange={(e) => onChange(e.target.value)}
            items={branches.map(branch => ({ name: branch.name, value: branch.name }))}
            disabled={loading || !branches.length}
        />
    );
}

function _Save() {
    const { currentGithubOrg, currentRepository, currentBranch, loading, fetcher } = useContext(GitSettingsContext);

    const canSave = currentGithubOrg && currentRepository && currentBranch && !loading;

    return (
        <Button
            onClick={fetcher.saveSettings}
            disabled={!canSave || loading}
        >
            {loading ? 'Saving...' : 'Save'}
        </Button>
    );
}