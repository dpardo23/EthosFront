import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Eye,
  Users,
  Folder,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge, LoadingSpinner } from '@/shared/ui';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { cn } from '@/shared/lib/utils';

type TimeRange = '7d' | '30d' | '90d' | '1y';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { loading, fetchMetrics } = useAnalyticsStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, timeRange]);

  // Mock data for charts
  const viewsData = [
    { date: 'Mon', views: 120, unique: 89 },
    { date: 'Tue', views: 150, unique: 102 },
    { date: 'Wed', views: 180, unique: 134 },
    { date: 'Thu', views: 140, unique: 98 },
    { date: 'Fri', views: 200, unique: 156 },
    { date: 'Sat', views: 90, unique: 67 },
    { date: 'Sun', views: 80, unique: 54 },
  ];

  const projectViewsData = [
    { name: 'E-Commerce Platform', views: 450 },
    { name: 'AI Chat App', views: 320 },
    { name: 'Portfolio Builder', views: 280 },
    { name: 'Task Manager', views: 180 },
    { name: 'Weather App', views: 120 },
  ];

  const trafficSourcesData = [
    { name: 'Direct', value: 40 },
    { name: 'LinkedIn', value: 25 },
    { name: 'Google', value: 20 },
    { name: 'GitHub', value: 10 },
    { name: 'Other', value: 5 },
  ];

  const deviceData = [
    { name: 'Desktop', value: 65 },
    { name: 'Mobile', value: 30 },
    { name: 'Tablet', value: 5 },
  ];

  const geographyData = [
    { country: 'United States', views: 450, percentage: 35 },
    { country: 'Spain', views: 280, percentage: 22 },
    { country: 'United Kingdom', views: 180, percentage: 14 },
    { country: 'Germany', views: 120, percentage: 9 },
    { country: 'France', views: 100, percentage: 8 },
    { country: 'Other', views: 150, percentage: 12 },
  ];

  const topReferrers = [
    { source: 'linkedin.com', visits: 245, percentage: 28 },
    { source: 'google.com', visits: 189, percentage: 22 },
    { source: 'github.com', visits: 156, percentage: 18 },
    { source: 'twitter.com', visits: 98, percentage: 11 },
    { source: 'dribbble.com', visits: 67, percentage: 8 },
  ];

  const timeRanges = [
    { id: '7d' as TimeRange, label: t('analytics.last7Days') },
    { id: '30d' as TimeRange, label: t('analytics.last30Days') },
    { id: '90d' as TimeRange, label: t('analytics.last90Days') },
    { id: '1y' as TimeRange, label: t('analytics.lastYear') },
  ];

  const stats = [
    {
      label: t('analytics.totalViews'),
      value: '12,847',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Eye,
    },
    {
      label: t('analytics.uniqueVisitors'),
      value: '8,234',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Users,
    },
    {
      label: t('analytics.projectClicks'),
      value: '1,456',
      change: '-3.1%',
      trend: 'down' as const,
      icon: Folder,
    },
    {
      label: t('analytics.avgTimeOnSite'),
      value: '2m 34s',
      change: '+5.7%',
      trend: 'up' as const,
      icon: Clock,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === range.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.export')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge
                  variant={stat.trend === 'up' ? 'default' : 'destructive'}
                  className={cn(
                    stat.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Views Over Time */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">{t('analytics.viewsOverTime')}</h2>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  name={t('analytics.totalViews')}
                />
                <Area
                  type="monotone"
                  dataKey="unique"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorUnique)"
                  name={t('analytics.uniqueVisitors')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Project Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">{t('analytics.projectPerformance')}</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectViewsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="views" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Traffic Sources */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t('analytics.trafficSources')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSourcesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {trafficSourcesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {trafficSourcesData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Devices */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t('analytics.devices')}</h2>
          <div className="space-y-6">
            {deviceData.map((device) => (
              <div key={device.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device.name === 'Desktop' && <Monitor className="w-4 h-4 text-muted-foreground" />}
                    {device.name === 'Mobile' && <Smartphone className="w-4 h-4 text-muted-foreground" />}
                    {device.name === 'Tablet' && <Monitor className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm text-foreground">{device.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{device.value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${device.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Referrers */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t('analytics.topReferrers')}</h2>
          <div className="space-y-4">
            {topReferrers.map((referrer, index) => (
              <div key={referrer.source} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-5">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{referrer.source}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{referrer.visits}</p>
                  <p className="text-xs text-muted-foreground">{referrer.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Geography */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">{t('analytics.geographicDistribution')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t('analytics.country')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t('analytics.views')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  {t('analytics.percentage')}
                </th>
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground w-40" />
              </tr>
            </thead>
            <tbody>
              {geographyData.map((item) => (
                <tr key={item.country} className="border-b border-border last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{item.country}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {item.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
