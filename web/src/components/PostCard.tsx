
import Link from 'next/link';
import { format } from 'date-fns';
import { GeneratedPost } from '../types';
import { Calendar, Layers, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

interface PostCardProps {
    post: GeneratedPost;
}

export function PostCard({ post }: PostCardProps) {
    const statusColor = {
        draft: 'text-gray-500 bg-gray-100',
        rendered: 'text-blue-500 bg-blue-100',
        approved: 'text-green-500 bg-green-100',
        published: 'text-purple-500 bg-purple-100',
        rejected: 'text-red-500 bg-red-100',
    };

    const StatusIcon = {
        draft: FileText,
        rendered: Layers,
        approved: CheckCircle,
        published: CheckCircle,
        rejected: XCircle,
    }[post.status] || FileText;

    return (
        <Link href={`/posts/${post.id}`} className="block group h-full">
            <div className="border border-[#1e1e1e] rounded-[3px] p-4 bg-[#111111] h-full flex flex-col hover:border-[#8a00c4] transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded-[3px] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border ${post.status === 'published' ? 'bg-[#120026] text-[#c084fc] border-[#8a00c4]/30' :
                            post.status === 'approved' ? 'bg-[#071a0f] text-[#4ade80] border-[#1a4a1a]' :
                                post.status === 'rejected' ? 'bg-[#1a0707] text-[#f87171] border-[#4a1a1a]' :
                                    'bg-[#1c1c1c] text-[#808080] border-[#2a2a2a]'
                        }`}>
                        <StatusIcon size={10} />
                        {post.status}
                    </span>
                    <span className="text-xs text-[#4a4a4a] flex items-center gap-1 font-mono">
                        <Calendar size={12} />
                        {format(new Date(post.created_at), 'MMM d')}
                    </span>
                </div>

                <h3 className="font-['Sora'] font-semibold text-lg mb-2 text-[#d4d4d4] group-hover:text-white transition-colors line-clamp-2 leading-tight">
                    {post.theme}
                </h3>

                <div className="mt-auto pt-4 flex gap-4 text-xs font-mono text-[#4a4a4a] border-t border-[#1e1e1e]">
                    <div className="flex items-center gap-1.5">
                        <Layers size={12} />
                        <span>{post.slide_count} slides</span>
                    </div>
                    {post.posting_time && (
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>{post.posting_time}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
