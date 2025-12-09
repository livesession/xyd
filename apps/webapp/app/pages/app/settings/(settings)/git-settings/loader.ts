import type { GitHubSettings } from "~/types/database";
import type { GitHubOrganization, GitHubRepository, GitHubBranch } from "~/services/github";
import { authServerService } from "~/services/auth.server";
import { githubService } from "~/services/github";
import { organizationModel } from "~/models/organization";

export type LoaderData = {
    githubOrgs: GitHubOrganization[];
    repositories: GitHubRepository[];
    branches: GitHubBranch[];
    organizationId: string;
    savedSettings: GitHubSettings;
};

export async function loader({ request }: { request: Request }) {
    let githubOrgs: GitHubOrganization[] = [];
    let repositories: GitHubRepository[] = [];
    let branches: GitHubBranch[] = [];
    let organizationId = "";
    let savedSettings: GitHubSettings = {};

    try {
        const user = await authServerService.getCurentUserFromRequest(request);
        if (!user) { return; }

        const firstOrg = user.organizations?.[0];
        if (!firstOrg) { return; }

        organizationId = firstOrg.toString();
        const org = await organizationModel.findById(firstOrg);
        if (!org || !org.githubToken) { return; }

        // Get saved settings
        savedSettings = org.githubSettings || {};

        githubOrgs = await githubService.getUserOrganizations(org.githubToken);

        // Use saved settings or defaults
        const selectedOrgLogin = savedSettings.repoOrg || (githubOrgs[0]?.login);
        let selectedRepo = "";

        if (githubOrgs && githubOrgs.length > 0 && selectedOrgLogin) {
            repositories = await githubService.getOrganizationRepositories(org.githubToken, selectedOrgLogin);

            selectedRepo = savedSettings.repo || (repositories[0]?.name);
            if (repositories && repositories.length > 0 && selectedRepo) {
                branches = await githubService.getRepositoryBranches(org.githubToken, selectedOrgLogin, selectedRepo);
            }
        }

        return;
    } catch (error) {
        console.error('git-settings.loader:', error);
        throw error;
    } finally {
        return {
            githubOrgs: githubOrgs || [],
            repositories: repositories || [],
            branches: branches || [],
            organizationId: organizationId || "",
            savedSettings: savedSettings || {}
        } as LoaderData;

    }
}