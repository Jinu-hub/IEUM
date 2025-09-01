import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// 차트 색상 팔레트 (Linear 디자인 시스템 기반)
export const chartColors = {
  primary: ['#5E6AD2', '#7C89F9', '#9BA7FF', '#B8C1FF', '#D5DBFF'],
  success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
  error: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
  info: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
  secondary: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
  gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
};

// 차트 툴팁 컴포넌트
export const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// 기본 차트 컨테이너
export const ChartContainer = ({ children, className = "" }: { children: React.ReactElement; className?: string }) => (
  <div className={`w-full h-80 ${className}`}>
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

// 샘플 데이터
export const sampleChartData = {
  area: [
    { name: '1월', value: 400, value2: 240 },
    { name: '2월', value: 300, value2: 139 },
    { name: '3월', value: 200, value2: 980 },
    { name: '4월', value: 278, value2: 390 },
    { name: '5월', value: 189, value2: 480 },
    { name: '6월', value: 239, value2: 380 }
  ],
  // shadcn 예시에 맞춘 데이터
  bar: [
    { name: '1월', desktop: 420, mobile: 210 },
    { name: '2월', desktop: 380, mobile: 240 },
    { name: '3월', desktop: 460, mobile: 260 },
    { name: '4월', desktop: 520, mobile: 300 },
    { name: '5월', desktop: 480, mobile: 280 },
    { name: '6월', desktop: 530, mobile: 330 }
  ],
  // 수평 바 차트용 데이터
  horizontalBar: [
    { name: 'Chrome', value: 400 },
    { name: 'Safari', value: 300 },
    { name: 'Firefox', value: 200 },
    { name: 'Edge', value: 150 },
    { name: 'Other', value: 100 }
  ],
  line: [
    { name: '1월', users: 400, revenue: 240 },
    { name: '2월', users: 300, revenue: 139 },
    { name: '3월', users: 200, revenue: 980 },
    { name: '4월', users: 278, revenue: 390 },
    { name: '5월', users: 189, revenue: 480 },
    { name: '6월', users: 239, revenue: 380 }
  ],
  pie: [
    { name: 'React', value: 400, color: '#5E6AD2' },
    { name: 'Vue', value: 300, color: '#10B981' },
    { name: 'Angular', value: 300, color: '#6B7280' },
    { name: 'Svelte', value: 200, color: '#F59E0B' }
  ],
  radar: [
    { subject: '성능', A: 120, B: 110, fullMark: 150 },
    { subject: '접근성', A: 98, B: 130, fullMark: 150 },
    { subject: 'SEO', A: 86, B: 130, fullMark: 150 },
    { subject: '사용성', A: 99, B: 100, fullMark: 150 },
    { subject: '디자인', A: 85, B: 90, fullMark: 150 },
    { subject: '기능', A: 65, B: 85, fullMark: 150 }
  ],
  radial: [
    { name: 'React', value: 80, fill: '#5E6AD2' },
    { name: 'Vue', value: 65, fill: '#10B981' },
    { name: 'Angular', value: 45, fill: '#6B7280' },
    { name: 'Svelte', value: 30, fill: '#F59E0B' }
  ]
};

// Area Chart 컴포넌트들
export const LinearAreaChart = ({ data = sampleChartData.area, className = "" }) => (
  <ChartContainer className={className}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Area 
        type="monotone" 
        dataKey="value" 
        stackId="1" 
        stroke={chartColors.primary[0]} 
        fill={chartColors.primary[0]} 
        fillOpacity={0.3}
      />
      <Area 
        type="monotone" 
        dataKey="value2" 
        stackId="1" 
        stroke={chartColors.success[0]} 
        fill={chartColors.success[0]} 
        fillOpacity={0.3}
      />
    </AreaChart>
  </ChartContainer>
);

export const LinearAreaChartGradient = ({ data = sampleChartData.area, className = "" }) => (
  <ChartContainer className={className}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.primary[0]} stopOpacity={0.8}/>
          <stop offset="95%" stopColor={chartColors.primary[0]} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke={chartColors.primary[0]} 
        fill="url(#colorValue)"
      />
    </AreaChart>
  </ChartContainer>
);

export const LinearAreaChartStacked = ({ data = sampleChartData.area, className = "" }) => (
  <ChartContainer className={className}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Area 
        type="monotone" 
        dataKey="value" 
        stackId="1" 
        stroke={chartColors.primary[0]} 
        fill={chartColors.primary[0]} 
        fillOpacity={0.8}
      />
      <Area 
        type="monotone" 
        dataKey="value2" 
        stackId="1" 
        stroke={chartColors.success[0]} 
        fill={chartColors.success[0]} 
        fillOpacity={0.8}
      />
    </AreaChart>
  </ChartContainer>
);

// Line Chart 컴포넌트들
export const LinearLineChart = ({ data = sampleChartData.line, className = "" }) => (
  <ChartContainer className={className}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Line 
        type="monotone" 
        dataKey="users" 
        stroke={chartColors.primary[0]} 
        strokeWidth={2}
        dot={{ fill: chartColors.primary[0], strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: chartColors.primary[0], strokeWidth: 2 }}
      />
      <Line 
        type="monotone" 
        dataKey="revenue" 
        stroke={chartColors.success[0]} 
        strokeWidth={2}
        dot={{ fill: chartColors.success[0], strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: chartColors.success[0], strokeWidth: 2 }}
      />
    </LineChart>
  </ChartContainer>
);

export const LinearLineChartSmooth = ({ data = sampleChartData.line, className = "" }) => (
  <ChartContainer className={className}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Line 
        type="monotone" 
        dataKey="users" 
        stroke={chartColors.primary[0]} 
        strokeWidth={3}
        dot={false}
        activeDot={{ r: 6, stroke: chartColors.primary[0], strokeWidth: 2 }}
      />
    </LineChart>
  </ChartContainer>
);

export const LinearLineChartArea = ({ data = sampleChartData.line, className = "" }) => (
  <ChartContainer className={className}>
    <LineChart data={data}>
      <defs>
        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.primary[0]} stopOpacity={0.3}/>
          <stop offset="95%" stopColor={chartColors.primary[0]} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis 
        dataKey="name" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Tooltip content={<ChartTooltip />} />
      <Area 
        type="monotone" 
        dataKey="users" 
        stroke={chartColors.primary[0]} 
        fill="url(#colorUsers)"
        strokeWidth={2}
      />
      <Line 
        type="monotone" 
        dataKey="users" 
        stroke={chartColors.primary[0]} 
        strokeWidth={2}
        dot={{ fill: chartColors.primary[0], strokeWidth: 2, r: 4 }}
      />
    </LineChart>
  </ChartContainer>
);

// ===== shadcn Bar Variants =====
// Bar Chart (기본)
export const LinearBarChart = ({ data = sampleChartData.bar, className = "" }) => (
  <ChartContainer className={className}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <YAxis tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <Tooltip content={<ChartTooltip />} />
      <Bar dataKey="desktop" fill={chartColors.primary[0]} radius={[4,4,0,0]} />
    </BarChart>
  </ChartContainer>
);

// Bar Chart - Multiple
export const LinearBarChartMultiple = ({ data = sampleChartData.bar, className = "" }) => (
  <ChartContainer className={className}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <YAxis tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <Tooltip content={<ChartTooltip />} />
      <Legend />
      <Bar dataKey="desktop" fill={chartColors.primary[0]} radius={[4,4,0,0]} />
      <Bar dataKey="mobile" fill={chartColors.success[0]} radius={[4,4,0,0]} />
    </BarChart>
  </ChartContainer>
);

// Bar Chart - Stacked + Legend
export const LinearBarChartStackedLegend = ({ data = sampleChartData.bar, className = "" }) => (
  <ChartContainer className={className}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <YAxis tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <Tooltip content={<ChartTooltip />} />
      <Legend />
      <Bar dataKey="desktop" stackId="a" fill={chartColors.primary[0]} radius={[4,4,0,0]} />
      <Bar dataKey="mobile" stackId="a" fill={chartColors.success[0]} radius={[0,0,4,4]} />
    </BarChart>
  </ChartContainer>
);

// Bar Chart - Custom Label
export const LinearBarChartCustomLabel = ({ data = sampleChartData.bar, className = "" }) => (
  <ChartContainer className={className}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
      <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <YAxis tickLine={false} axisLine={false} className="text-xs text-gray-600 dark:text-gray-400" />
      <Tooltip content={<ChartTooltip />} />
      <Bar dataKey="desktop" fill={chartColors.primary[0]} radius={[4,4,0,0]}>
        <LabelList dataKey="desktop" position="top" className="fill-current text-gray-600 dark:text-gray-300" />
      </Bar>
    </BarChart>
  </ChartContainer>
);

// ===== shadcn Pie Variants =====
// Pie Chart - Label List
export const LinearPieChartLabelList = ({ data = sampleChartData.pie, className = "" }) => (
  <ChartContainer className={className}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
        <LabelList dataKey="name" position="outside" className="fill-current text-gray-600 dark:text-gray-300" />
      </Pie>
      <Tooltip content={<ChartTooltip />} />
      <Legend />
    </PieChart>
  </ChartContainer>
);

// Pie Chart - Donut with Text
export const LinearPieChartDonutText = ({ data = sampleChartData.pie, className = "" }) => (
  <ChartContainer className={className}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<ChartTooltip />} />
      <text 
        x="50%" 
        y="50%" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        className="text-base font-semibold"
        fill="currentColor"
      >
        총합 {data.reduce((s, i) => s + i.value, 0)}
      </text>
    </PieChart>
  </ChartContainer>
);

// ===== shadcn Radial Variants =====
// Radial Chart - Label
export const LinearRadialChartLabel = ({ data = sampleChartData.radial, className = "" }) => (
  <ChartContainer className={className}>
    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
      <RadialBar dataKey="value" background />
      <Legend />
      <Tooltip content={<ChartTooltip />} />
    </RadialBarChart>
  </ChartContainer>
);

// Radial Chart - Text
export const LinearRadialChartText = ({ data = sampleChartData.radial, className = "" }) => (
  <ChartContainer className={className}>
    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" data={data}>
      <RadialBar dataKey="value" background />
      <Tooltip content={<ChartTooltip />} />
      <text 
        x="50%" 
        y="50%" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        className="text-lg font-semibold"
        fill="currentColor"
      >
        {data.reduce((sum, item) => sum + item.value, 0)}
      </text>
    </RadialBarChart>
  </ChartContainer>
);
// Radar Chart 컴포넌트들
export const LinearRadarChart = ({ data = sampleChartData.radar, className = "" }) => (
  <ChartContainer className={className}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
      <PolarAngleAxis 
        dataKey="subject" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
      />
      <PolarRadiusAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Radar
        name="Team A"
        dataKey="A"
        stroke={chartColors.primary[0]}
        fill={chartColors.primary[0]}
        fillOpacity={0.3}
      />
      <Radar
        name="Team B"
        dataKey="B"
        stroke={chartColors.success[0]}
        fill={chartColors.success[0]}
        fillOpacity={0.3}
      />
      <Tooltip content={<ChartTooltip />} />
      <Legend 
        verticalAlign="bottom" 
        height={36}
        formatter={(value, entry: any) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {value}
          </span>
        )}
      />
    </RadarChart>
  </ChartContainer>
);

export const LinearRadarChartDots = ({ data = sampleChartData.radar, className = "" }) => (
  <ChartContainer className={className}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
      <PolarAngleAxis 
        dataKey="subject" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
      />
      <PolarRadiusAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Radar
        name="Team A"
        dataKey="A"
        stroke={chartColors.primary[0]}
        fill={chartColors.primary[0]}
        fillOpacity={0.3}
        dot={{ fill: chartColors.primary[0], strokeWidth: 2, r: 4 }}
      />
      <Tooltip content={<ChartTooltip />} />
    </RadarChart>
  </ChartContainer>
);

export const LinearRadarChartFilled = ({ data = sampleChartData.radar, className = "" }) => (
  <ChartContainer className={className}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
      <PolarAngleAxis 
        dataKey="subject" 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
      />
      <PolarRadiusAxis 
        className="text-xs text-gray-600 dark:text-gray-400"
        tickLine={false}
        axisLine={false}
      />
      <Radar
        name="Team A"
        dataKey="A"
        stroke={chartColors.primary[0]}
        fill={chartColors.primary[0]}
        fillOpacity={0.8}
      />
      <Tooltip content={<ChartTooltip />} />
    </RadarChart>
  </ChartContainer>
);
