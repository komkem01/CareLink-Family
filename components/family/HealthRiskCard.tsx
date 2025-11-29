"use client";

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Pill,
  Activity
} from "lucide-react";

interface HealthRiskData {
  score: number;
  level: 'good' | 'moderate' | 'high';
  color: 'green' | 'yellow' | 'red';
  factors: Array<{
    factor: string;
    score: number;
    details: string;
  }>;
  recommendations: string[];
}

interface HealthRiskCardProps {
  elderId: string;
  elderName: string;
}

const HealthRiskCard: React.FC<HealthRiskCardProps> = ({ elderId, elderName }) => {
  const [riskData, setRiskData] = useState<HealthRiskData | null>(null);
  const [compliance, setCompliance] = useState<number | null>(null);
  const [bpTrend, setBpTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchHealthRisk();
    fetchCompliance();
    fetchBPTrend();
  }, [elderId]);

  const fetchHealthRisk = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/health-risk/${elderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRiskData(data);
      }
    } catch (error) {
      console.error('Error fetching health risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/health-risk/${elderId}/compliance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompliance(data.compliance);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  const fetchBPTrend = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/health-risk/${elderId}/bp-trend`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBpTrend(data);
      }
    } catch (error) {
      console.error('Error fetching BP trend:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!riskData) {
    return null;
  }

  const getLevelIcon = () => {
    switch (riskData.level) {
      case 'good':
        return <CheckCircle className="text-green-600" size={32} />;
      case 'moderate':
        return <Info className="text-yellow-600" size={32} />;
      case 'high':
        return <AlertTriangle className="text-red-600" size={32} />;
    }
  };

  const getLevelText = () => {
    switch (riskData.level) {
      case 'good':
        return 'ดี - ต่ำ';
      case 'moderate':
        return 'ปานกลาง';
      case 'high':
        return 'สูง - ควรระวัง';
    }
  };

  const getLevelColor = () => {
    switch (riskData.color) {
      case 'green':
        return 'from-green-500 to-green-600';
      case 'yellow':
        return 'from-yellow-500 to-yellow-600';
      case 'red':
        return 'from-red-500 to-red-600';
    }
  };

  const getBorderColor = () => {
    switch (riskData.color) {
      case 'green':
        return 'border-green-200 bg-green-50';
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50';
      case 'red':
        return 'border-red-200 bg-red-50';
    }
  };

  const getTrendIcon = () => {
    if (!bpTrend) return null;
    
    switch (bpTrend.trend) {
      case 'improving':
        return <TrendingDown className="text-green-600" size={20} />;
      case 'worsening':
        return <TrendingUp className="text-red-600" size={20} />;
      case 'stable':
        return <Minus className="text-blue-600" size={20} />;
    }
  };

  return (
    <div className={`rounded-lg shadow-lg border-2 ${getBorderColor()}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getLevelColor()} text-white p-6 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getLevelIcon()}
            <div>
              <h3 className="text-xl font-bold">คะแนนความเสี่ยงด้านสุขภาพ</h3>
              <p className="text-sm opacity-90">{elderName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{riskData.score}</div>
            <div className="text-sm opacity-90">/ 100</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-semibold">
            ระดับ: {getLevelText()}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
          >
            {showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-white">
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <Pill className="mx-auto mb-2 text-purple-600" size={24} />
          <div className="text-2xl font-bold text-purple-800">
            {compliance !== null ? `${compliance}%` : 'N/A'}
          </div>
          <div className="text-sm text-purple-600">การทานยาตรงเวลา</div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Activity className="mx-auto mb-2 text-blue-600" size={24} />
          <div className="flex items-center justify-center space-x-2">
            {getTrendIcon()}
            <div className="text-2xl font-bold text-blue-800">
              {bpTrend?.average?.systolic || 'N/A'}/{bpTrend?.average?.diastolic || 'N/A'}
            </div>
          </div>
          <div className="text-sm text-blue-600">
            ความดันโลหิตเฉลี่ย ({bpTrend?.trend === 'improving' ? 'ดีขึ้น' : bpTrend?.trend === 'worsening' ? 'แย่ลง' : 'คงที่'})
          </div>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 p-6 bg-white rounded-b-lg space-y-6">
          {/* Risk Factors */}
          {riskData.factors.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <AlertTriangle className="mr-2 text-orange-600" size={20} />
                ปัจจัยเสี่ยง
              </h4>
              <div className="space-y-2">
                {riskData.factors.map((factor, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{factor.factor}</p>
                      <p className="text-sm text-gray-600">{factor.details}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        factor.score > 15 
                          ? 'bg-red-100 text-red-700' 
                          : factor.score > 5 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        +{factor.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {riskData.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Heart className="mr-2 text-pink-600" size={20} />
                คำแนะนำ
              </h4>
              <div className="space-y-2">
                {riskData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="mr-3 text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BP Trend Details */}
          {bpTrend && bpTrend.readings > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2">แนวโน้มความดันโลหิต (30 วัน)</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-800">
                    {bpTrend.average.systolic}
                  </div>
                  <div className="text-xs text-gray-600">Systolic เฉลี่ย</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-800">
                    {bpTrend.average.diastolic}
                  </div>
                  <div className="text-xs text-gray-600">Diastolic เฉลี่ย</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-800">
                    {bpTrend.readings}
                  </div>
                  <div className="text-xs text-gray-600">จำนวนครั้งที่วัด</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center space-x-2 text-sm">
                {getTrendIcon()}
                <span className="font-medium text-gray-700">
                  {bpTrend.trend === 'improving' 
                    ? 'แนวโน้มดีขึ้น' 
                    : bpTrend.trend === 'worsening' 
                    ? 'แนวโน้มแย่ลง' 
                    : 'แนวโน้มคงที่'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthRiskCard;
