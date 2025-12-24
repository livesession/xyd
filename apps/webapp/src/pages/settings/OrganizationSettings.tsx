import { Building2 } from 'lucide-react';

export function OrganizationSettings() {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-8">General</h2>

            <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-[240px_1fr] gap-8 items-center py-6 first:pt-0">
                    <label className="block text-sm font-medium text-gray-900">Organization Profile</label>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">John Doe</span>
                        </div>
                        <button className="text-sm text-gray-500 hover:text-gray-900 font-medium">Update profile</button>
                    </div>
                </div>

                <div className="grid grid-cols-[240px_1fr] gap-8 items-center py-6">
                    <label className="block text-sm font-medium text-gray-900">Leave organization</label>
                    <div>
                        <button className="text-sm text-red-500 hover:text-red-700 font-medium">Leave organization</button>
                    </div>
                </div>

                <div className="grid grid-cols-[240px_1fr] gap-8 items-center py-6">
                    <label className="block text-sm font-medium text-gray-900">Delete organization</label>
                    <div>
                        <button className="text-sm text-red-500 hover:text-red-700 font-medium">Delete organization</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
