import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UXNode, UXAnalytics } from 'openux-js'

import './index.css'
import './xyd.css'

import { DashboardLayout } from './layouts/DashboardLayout'
import { SettingsLayout } from './layouts/SettingsLayout'
import { Dashboard } from './pages/Dashboard'
import { Editor as PlaceholderEditor } from './pages/Placeholder' // Temporary
import { McpServer } from './pages/McpServer'
import { Integrations } from './pages/Integrations'
import { Editor } from './pages/Editor'

// Settings Pages
import { GeneralSettings } from './pages/settings/GeneralSettings'
import { DomainSettings } from './pages/settings/DomainSettings'
import { RepositorySettings } from './pages/settings/RepositorySettings'
import { OrganizationSettings } from './pages/settings/OrganizationSettings'
import { MembersSettings } from './pages/settings/MembersSettings'
import { BillingSettings } from './pages/settings/BillingSettings'
import { GitHubAppSettings } from './pages/settings/GitHubAppSettings'
import { ManageOrganizations } from './pages/settings/ManageOrganizations'
import { MyAccount } from './pages/settings/MyAccount'

const analytics = {
  track() {}
}

createRoot(document.getElementById('root')!).render(
  <UXNode name="app" props={{}} >
    <UXAnalytics analytics={analytics}>
    <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/analytics" element={<PlaceholderEditor />} /> {/* Placeholder */}
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/mcp" element={<McpServer />} />
          
          <Route path="/settings" element={<SettingsLayout />}>
             <Route index element={<Navigate to="/settings/general" replace />} />
             <Route path="general" element={<GeneralSettings />} />
             <Route path="domains" element={<DomainSettings />} />
             <Route path="repository" element={<RepositorySettings />} />
             <Route path="organization" element={<OrganizationSettings />} />
             <Route path="members" element={<MembersSettings />} />
             <Route path="billing" element={<BillingSettings />} />
             <Route path="github-app" element={<GitHubAppSettings />} />
             <Route path="manage-organizations" element={<ManageOrganizations />} />
             <Route path="account" element={<MyAccount />} />
             <Route path="*" element={<div className="p-4 text-gray-500">Feature coming soon</div>} />
          </Route>

          <Route path="*" element={<div className="p-10 text-center text-gray-500">Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
    </UXAnalytics>
  </UXNode>,
)
