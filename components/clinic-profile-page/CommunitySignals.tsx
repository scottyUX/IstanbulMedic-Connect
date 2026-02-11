// CommunitySignals.tsx
// Community signals with tabs -- IstanbulMedic brand. Teal active tab, navy text.

"use client";

import { useState } from "react";
import { AlertCircle, MessageSquare, ExternalLink } from "lucide-react";
import { CommunityPost, CommunitySummary } from "./types";

interface CommunitySignalsProps {
  posts: CommunityPost[];
  summary: CommunitySummary;
}

const TABS = ["Reddit", "Instagram", "Other"] as const;

export function CommunitySignals({ posts, summary }: CommunitySignalsProps) {
  const [activeTab, setActiveTab] = useState<string>("Reddit");

  const filteredPosts = posts.filter((post) => post.platform === activeTab);

  return (
    <div className="p-6 font-body">
      {/* Disclaimer Banner -- copper/amber */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mb-5">
        <AlertCircle className="w-5 h-5 text-brand-copper flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Community posts are not verified medical evidence and are shown for additional context.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left: Tabs + Posts */}
        <div className="flex-1">
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-brand-teal text-brand-teal"
                    : "border-transparent text-brand-text-light hover:text-brand-text-secondary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-brand-text-light mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.platform}</span>
                    <span>&middot;</span>
                    <span>{post.timeAgo}</span>
                  </div>
                  <p className="text-sm text-brand-text-secondary mb-3">{post.content}</p>
                  <a
                    href={post.sourceUrl}
                    className="inline-flex items-center gap-1 text-sm text-brand-teal hover:text-teal-700 font-medium transition-colors"
                  >
                    View source
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-text-light text-center py-6">
                No posts found for {activeTab}.
              </p>
            )}
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-navy-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-brand-text font-heading mb-4">Summary</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-text-light">Total Mentions</p>
                <p className="text-2xl font-bold text-brand-navy">{summary.totalMentions}</p>
              </div>

              <div>
                <p className="text-xs text-brand-text-light">General Sentiment</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    summary.sentiment === "Positive"
                      ? "bg-teal-50 text-teal-700"
                      : summary.sentiment === "Mixed"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {summary.sentiment}
                </span>
              </div>

              <div>
                <p className="text-xs text-brand-text-light mb-2">Common Themes</p>
                <ul className="space-y-1.5">
                  {summary.themes.map((theme) => (
                    <li key={theme} className="flex items-center gap-2 text-sm text-brand-text-secondary">
                      <span className="w-2 h-2 bg-brand-teal rounded-full" />
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
