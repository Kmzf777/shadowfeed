
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
        <Link href={`/posts/${post.id}`} className="block group">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusColor[post.status]}`}>
                        <StatusIcon size={12} />
                        {post.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </span>
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.theme}
                </h3>

                <div className="mt-auto pt-4 flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Layers size={14} />
                        <span>{post.slide_count} slides</span>
                    </div>
                    {post.posting_time && (
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{post.posting_time}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
