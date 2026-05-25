import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { NexBadge } from "~/core/components/nex";
import {
  homeCaseData,
  homeCommitTrendData,
  homeDeveloperData,
} from "~/features/settings/lib/mockdata";

export function HomeAnalyticsCharts() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">{t("home.analytics.commitTrend")}</p>
          <NexBadge variant="success" size="sm">
            +18%
          </NexBadge>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={homeCommitTrendData}>
              <defs>
                <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B96F5" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#8B96F5" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8B96F5"
                fill="url(#colorCommit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">
            {t("home.analytics.developerActivity")}
          </p>
          <NexBadge variant="info" size="sm">
            4{t("common.people")}
          </NexBadge>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={homeDeveloperData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Bar
                dataKey="commits"
                fill="#8B96F5"
                radius={[0, 4, 4, 0]}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">{t("home.analytics.caseStatus")}</p>
          <NexBadge variant="warning" size="sm">
            34{t("common.count")}
          </NexBadge>
        </div>
        <div className="h-24 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={homeCaseData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                dataKey="value"
              >
                {homeCaseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function HomeAnalyticsChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[7.5rem] rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 animate-pulse"
        />
      ))}
    </div>
  );
}
