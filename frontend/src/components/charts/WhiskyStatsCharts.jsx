import React, { useEffect, useState } from 'react';
import { whiskyAPI } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const WhiskyStatsCharts = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      const response = await whiskyAPI.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show error to user for optional charts
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Prepare chart data for regional distribution
  const regionalData = {
    labels: stats.regional_breakdown?.map(item => item.region || 'Unknown') || [],
    datasets: [
      {
        label: 'Number of Whiskies',
        data: stats.regional_breakdown?.map(item => item.count) || [],
        backgroundColor: [
          '#F59E0B', // Amber
          '#3B82F6', // Blue
          '#10B981', // Green
          '#8B5CF6', // Purple
          '#EF4444', // Red
          '#F97316', // Orange
        ],
        borderColor: [
          '#D97706',
          '#2563EB',
          '#059669',
          '#7C3AED',
          '#DC2626',
          '#EA580C',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Age distribution data (mock for now)
  const ageData = {
    labels: ['NAS', '8-12 years', '13-17 years', '18-25 years', '25+ years'],
    datasets: [
      {
        data: [12, 35, 25, 20, 8], // Mock data - would come from API
        backgroundColor: [
          '#FEF3C7', // Light amber
          '#FCD34D', // Medium amber
          '#F59E0B', // Amber
          '#D97706', // Dark amber
          '#92400E', // Very dark amber
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Collection by Region',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Age Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Collection Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Regional Bar Chart */}
        <div className="h-64">
          {stats.regional_breakdown && stats.regional_breakdown.length > 0 ? (
            <Bar data={regionalData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No regional data available</p>
            </div>
          )}
        </div>

        {/* Age Distribution Doughnut Chart */}
        <div className="h-64 flex items-center justify-center">
          <div className="w-56 h-56">
            <Doughnut data={ageData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{stats.total_whiskies || 0}</div>
          <div className="text-sm text-amber-800">Total Bottles</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.average_age || 'N/A'}</div>
          <div className="text-sm text-blue-800">Avg Age</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.average_abv || 'N/A'}%</div>
          <div className="text-sm text-green-800">Avg ABV</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.total_distilleries || 0}</div>
          <div className="text-sm text-purple-800">Distilleries</div>
        </div>
      </div>
    </div>
  );
};

export default WhiskyStatsCharts;