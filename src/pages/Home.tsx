import { useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';
import { Search, Filter, Briefcase, Loader2 } from 'lucide-react';

const categories = ['All', 'Development', 'Design', 'Writing', 'Marketing', 'Other'];

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const { data: jobs, isLoading, error } = useJobs({
    category: category === 'All' ? undefined : category,
  });

  const filteredJobs = (jobs || []).filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Error loading jobs"
          description="Please try again later"
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="No jobs found"
          description={search ? 'Try different search terms' : 'Be the first to post a job!'}
        />
      ) : (
        <div className="space-y-3">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
