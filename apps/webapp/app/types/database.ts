import { ObjectId } from 'mongodb';

export interface GitHubSettings {
  repoOrg?: string; // Selected GitHub organization
  repo?: string; // Selected repository
  repoBranch?: string; // Selected branch
}

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  picture?: string;
  organizations: ObjectId[]; // Array of organization IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  _id?: ObjectId;
  name: string;
  description?: string;
  owner: ObjectId; // User ID of the owner
  users: ObjectId[]; // Array of user IDs
  githubToken?: string; // GitHub access token
  githubInstallationId?: string; // GitHub app installation ID
  githubSettings?: GitHubSettings;
  createdAt: Date;
  updatedAt: Date;
}

// For creating new documents (without _id and timestamps)
export interface CreateUser {
  email: string;
  name: string;
  picture?: string;
  organizations?: ObjectId[];
}

export interface CreateOrganization {
  name: string;
  description?: string;
  owner: ObjectId;
  users?: ObjectId[];
  githubToken?: string;
  githubInstallationId?: string;
  githubSettings?: GitHubSettings;
}
