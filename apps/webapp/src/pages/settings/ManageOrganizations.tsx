export function ManageOrganizations() {
  return (
    <div>
       <h2 className="text-xl font-semibold text-gray-900 mb-8">Your Organizations</h2>

       <div className="space-y-8">
           <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
               <div>
                  <label className="block text-sm font-medium text-gray-900">Organizations</label>
                  <p className="text-xs text-gray-500 mt-1">You can switch between your organizations</p>
               </div>
               
               <div className="bg-gray-50 rounded-lg p-4 text-sm font-medium text-gray-900">
                   Current Organizations (0)
               </div>
           </div>
       </div>
    </div>
  );
}
