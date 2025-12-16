

export function MyAccount() {
     return (
          <div>
               <h2 className="text-xl font-semibold text-gray-900 mb-8">Profile details</h2>

               <div className="space-y-6 divide-y divide-gray-100">
                    <div className="grid grid-cols-[240px_1fr] gap-8 items-center py-6 first:pt-0">
                         <label className="block text-sm font-medium text-gray-900">Profile</label>
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium">
                                        J
                                   </div>
                                   <span className="text-sm font-medium text-gray-900">John Doe</span>
                              </div>
                              <button className="text-sm text-gray-500 hover:text-gray-900 font-medium">Update profile</button>
                         </div>
                    </div>

                    <div className="grid grid-cols-[240px_1fr] gap-8 items-start py-6">
                         <label className="block text-sm font-medium text-gray-900">Email addresses</label>
                         <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                   <span className="text-sm text-gray-600">johndoe@gmail.com</span>
                                   <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium border border-gray-200">Primary</span>
                              </div>
                              <button className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
                                   <span className="text-base leading-none mb-0.5">+</span> Add email address
                              </button>
                         </div>
                    </div>

                    <div className="grid grid-cols-[240px_1fr] gap-8 items-center py-6">
                         <label className="block text-sm font-medium text-gray-900">Connected accounts</label>
                         <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                              <span className="text-sm font-medium text-gray-900">Google</span>
                              <span className="text-sm text-gray-400">•</span>
                              <span className="text-sm text-gray-500">johndoe@gmail.com</span>
                         </div>
                    </div>
               </div>
          </div>
     );
}
