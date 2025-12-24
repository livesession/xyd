import { Search, MoreHorizontal } from 'lucide-react';

export function MembersSettings() {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Members</h2>

            <div className="space-y-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <a href="#" className="border-b-2 border-gray-900 py-4 px-1 text-sm font-medium text-gray-900">
                            Members
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600">1</span>
                        </a>
                        <a href="#" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                            Invitations
                            <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600">0</span>
                        </a>
                    </nav>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            className="block w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <button className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Invite
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-medium">J</div>
                                        <div className="ml-3">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-gray-900">John Doe</div>
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">You</span>
                                            </div>
                                            <div className="text-xs text-gray-500">johndoe@gmail.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12/15/2025</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                                        Admin
                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
