import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, TrendingUp, TrendingDown, Minus, BarChart3, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Assessment } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssessmentComparisonProps {
  assessments: Assessment[];
  onExportComparison?: (data: ComparisonData) => void;
}

interface ComparisonData {
  assessments: Assessment[];
  metrics: {
    overall: ComparisonMetric;
    sections: Record<string, ComparisonMetric>;
    improvements: ImprovementArea[];
    trends: TrendData[];
  };
}

interface ComparisonMetric {
  name: string;
  values: number[];
  change?: number;
  trend: 'up' | 'down' | 'stable';
}

interface ImprovementArea {
  area: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  estimatedValue?: number;
}

interface TrendData {
  date: string;
  score: number;
  assessment: Assessment;
}

export const AssessmentComparison: React.FC<AssessmentComparisonProps> = ({
  assessments,
  onExportComparison
}) => {
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<Array<{id: string, name: string}>>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');

  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAvailableClients(clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const clientAssessments = selectedClient && selectedClient !== 'all'
    ? assessments.filter(a => a.client_id === selectedClient)
    : assessments;

  const generateComparison = async () => {
    if (selectedAssessments.length < 2) {
      toast({
        title: "Select Assessments",
        description: "Please select at least 2 assessments to compare.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const compareAssessments = assessments.filter(a => selectedAssessments.includes(a.id));
      
      // Load detailed data for each assessment
      const detailedData = await Promise.all(
        compareAssessments.map(async (assessment) => {
          const [responses, template, questions] = await Promise.all([
            supabase.from('assessment_responses').select('*').eq('assessment_id', assessment.id),
            supabase.from('assessment_templates').select('*').eq('id', assessment.template_id).single(),
            supabase.from('assessment_questions').select('*').eq('template_id', assessment.template_id)
          ]);

          return {
            assessment,
            responses: responses.data || [],
            template: template.data,
            questions: questions.data || []
          };
        })
      );

      // Calculate comparison metrics
      const metrics = calculateComparisonMetrics(detailedData);
      
      setComparisonData({
        assessments: compareAssessments,
        metrics
      });

    } catch (error) {
      console.error('Comparison generation failed:', error);
      toast({
        title: "Comparison Failed",
        description: "Failed to generate comparison. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateComparisonMetrics = (detailedData: any[]): ComparisonData['metrics'] => {
    const overallScores = detailedData.map(d => d.assessment.percentage_score || 0);
    
    // Calculate sections scores
    const allSections = new Set<string>();
    detailedData.forEach(d => {
      d.questions.forEach((q: any) => {
        if (q.section) allSections.add(q.section);
      });
    });

    const sections: Record<string, ComparisonMetric> = {};
    allSections.forEach(section => {
      const sectionScores = detailedData.map(d => {
        const sectionQuestions = d.questions.filter((q: any) => q.section === section);
        const sectionResponses = d.responses.filter((r: any) =>
          sectionQuestions.some((q: any) => q.id === r.question_id)
        );
        
        const totalScore = sectionResponses.reduce((sum: number, r: any) => sum + r.score, 0);
        const maxScore = sectionQuestions.reduce((sum: number, q: any) => sum + q.max_points, 0);
        
        return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      });

      sections[section] = {
        name: section,
        values: sectionScores,
        trend: calculateTrend(sectionScores)
      };
    });

    // Generate improvement areas
    const improvements: ImprovementArea[] = [];
    Object.entries(sections).forEach(([section, metric]) => {
      const avgScore = metric.values.reduce((sum, val) => sum + val, 0) / metric.values.length;
      
      if (avgScore < 70) {
        improvements.push({
          area: section,
          impact: avgScore < 40 ? 'high' : avgScore < 60 ? 'medium' : 'low',
          recommendation: `Improve ${section.toLowerCase()} to increase overall security posture`,
          estimatedValue: Math.round((100 - avgScore) * 1000) // Estimated value based on gap
        });
      }
    });

    // Generate trend data
    const trends: TrendData[] = detailedData
      .map(d => ({
        date: d.assessment.completed_at || d.assessment.created_at,
        score: d.assessment.percentage_score || 0,
        assessment: d.assessment
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      overall: {
        name: 'Overall Score',
        values: overallScores,
        change: overallScores.length > 1 ? overallScores[overallScores.length - 1] - overallScores[0] : 0,
        trend: calculateTrend(overallScores)
      },
      sections,
      improvements: improvements.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      }),
      trends
    };
  };

  const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Assessment Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Client (Optional)</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {availableClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Assessments ({selectedAssessments.length} selected)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {clientAssessments.map(assessment => (
                  <label key={assessment.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAssessments.includes(assessment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssessments([...selectedAssessments, assessment.id]);
                        } else {
                          setSelectedAssessments(selectedAssessments.filter(id => id !== assessment.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{assessment.title}</div>
                      <div className="text-muted-foreground">
                        {assessment.completed_at ? format(new Date(assessment.completed_at), 'MMM dd, yyyy') : 'In progress'}
                        {assessment.percentage_score && (
                          <span className="ml-2">• {assessment.percentage_score.toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateComparison}
              disabled={selectedAssessments.length < 2 || isLoading}
            >
              {isLoading ? 'Comparing...' : 'Compare Assessments'}
            </Button>
            {comparisonData && (
              <Button 
                variant="outline" 
                onClick={() => onExportComparison?.(comparisonData)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">
          {/* Overall Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Score Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Overall Trend</span>
                    {getTrendIcon(comparisonData.metrics.overall.trend)}
                    {comparisonData.metrics.overall.change !== undefined && (
                      <span className={`text-sm font-medium ${
                        comparisonData.metrics.overall.change > 0 ? 'text-green-600' : 
                        comparisonData.metrics.overall.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {comparisonData.metrics.overall.change > 0 ? '+' : ''}
                        {comparisonData.metrics.overall.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {comparisonData.assessments.map((assessment, index) => (
                    <div key={assessment.id} className="flex items-center gap-4">
                      <div className="w-32 text-sm">
                        <div className="font-medium">Assessment {index + 1}</div>
                        <div className="text-muted-foreground">
                          {assessment.completed_at ? format(new Date(assessment.completed_at), 'MMM dd') : 'In progress'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={comparisonData.metrics.overall.values[index]} 
                          className="h-3"
                        />
                      </div>
                      <div className="w-16 text-right font-medium">
                        {comparisonData.metrics.overall.values[index].toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Section Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(comparisonData.metrics.sections).map(([section, metric]) => (
                  <div key={section} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{section}</h4>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {(metric.values.reduce((sum, val) => sum + val, 0) / metric.values.length).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      {metric.values.map((value, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-24 text-xs text-muted-foreground">
                            Assessment {index + 1}
                          </div>
                          <div className="flex-1">
                            <Progress value={value} className="h-2" />
                          </div>
                          <div className="w-12 text-right text-xs">
                            {value.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.metrics.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge variant={getImpactColor(improvement.impact)}>
                      {improvement.impact.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{improvement.area}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {improvement.recommendation}
                      </p>
                      {improvement.estimatedValue && (
                        <div className="text-sm text-green-600 mt-2">
                          Est. Value: ${improvement.estimatedValue.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
                
                {comparisonData.metrics.improvements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                    <p>No major improvement areas identified</p>
                    <p className="text-sm">All assessment scores are performing well</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.metrics.trends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">
                      {format(new Date(trend.date), 'MMM dd')}
                    </div>
                    <div className="flex-1">
                      <Progress value={trend.score} className="h-2" />
                    </div>
                    <div className="w-12 text-right text-sm font-medium">
                      {trend.score.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};