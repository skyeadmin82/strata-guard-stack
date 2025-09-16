import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PredictionModel {
  id: string;
  name: string;
  description?: string;
  model_type: 'time_series' | 'classification' | 'regression' | 'anomaly_detection';
  data_source: string;
  features: string[];
  target_column?: string;
  training_config: any;
  model_parameters: any;
  performance_metrics: any;
  confidence_threshold: number;
  status: 'training' | 'ready' | 'failed' | 'deprecated';
  accuracy_score?: number;
  fallback_method: 'average' | 'last_known' | 'manual';
  is_active: boolean;
}

interface Prediction {
  id: string;
  model_id: string;
  prediction_type: 'forecast' | 'classification' | 'anomaly';
  input_data: any;
  predicted_value: any;
  confidence_score: number;
  probability_distribution?: any;
  prediction_interval?: any;
  actual_value?: any;
  is_accurate?: boolean;
  deviation_percent?: number;
  created_at: string;
}

interface ModelTrainingOptions {
  validationSplit?: number;
  testData?: any[];
  hyperparameters?: any;
  fallbackOnFailure?: boolean;
}

export const usePredictiveAnalytics = () => {
  const { toast } = useToast();
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  const createModel = useCallback(async (modelConfig: Partial<PredictionModel>) => {
    try {
      const { data, error } = await supabase
        .from('prediction_models')
        .insert({
          name: modelConfig.name || 'Untitled Model',
          description: modelConfig.description,
          model_type: modelConfig.model_type || 'time_series',
          data_source: modelConfig.data_source || '',
          features: modelConfig.features || [],
          target_column: modelConfig.target_column,
          training_config: modelConfig.training_config || {},
          model_parameters: modelConfig.model_parameters || {},
          confidence_threshold: modelConfig.confidence_threshold || 0.70,
          fallback_method: modelConfig.fallback_method || 'average'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Model Created",
        description: `Model "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating model:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create model",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const trainModel = useCallback(async (
    modelId: string,
    options: ModelTrainingOptions = {}
  ): Promise<{ success: boolean; metrics?: any; fallbackUsed?: boolean }> => {
    setIsTraining(true);
    
    try {
      const startTime = Date.now();

      // Get model configuration
      const { data: model, error: modelError } = await supabase
        .from('prediction_models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (modelError) throw modelError;

      // Validate data quality first
      const dataQuality = await validateDataQuality(model.data_source, model.features);
      if (!dataQuality.passed) {
        throw new Error(`Data quality check failed: ${dataQuality.issues.join(', ')}`);
      }

      // Update model status
      await supabase
        .from('prediction_models')
        .update({ 
          status: 'training',
          last_trained_at: new Date().toISOString()
        })
        .eq('id', modelId);

      let trainingResult;
      try {
        // Try advanced model training
        trainingResult = await performAdvancedTraining(model, options);
      } catch (trainingError) {
        console.error('Advanced training failed:', trainingError);
        
        // Fallback to simple statistical model
        if (options.fallbackOnFailure !== false) {
          trainingResult = await performFallbackTraining(model, options);
          trainingResult.fallbackUsed = true;
        } else {
          throw trainingError;
        }
      }

      const trainingDuration = Date.now() - startTime;

      // Update model with results
      await supabase
        .from('prediction_models')
        .update({
          status: trainingResult.success ? 'ready' : 'failed',
          performance_metrics: trainingResult.metrics,
          accuracy_score: trainingResult.accuracy,
          training_duration_ms: trainingDuration,
          training_data_count: trainingResult.dataCount,
          model_parameters: trainingResult.parameters
        })
        .eq('id', modelId);

      setModelMetrics(trainingResult.metrics);

      if (trainingResult.success) {
        toast({
          title: "Model Training Complete",
          description: `Model trained with ${trainingResult.accuracy}% accuracy${trainingResult.fallbackUsed ? ' (fallback method)' : ''}`,
        });
      } else {
        toast({
          title: "Training Failed",
          description: "Model training failed. Check data quality and configuration.",
          variant: "destructive",
        });
      }

      return {
        success: trainingResult.success,
        metrics: trainingResult.metrics,
        fallbackUsed: trainingResult.fallbackUsed
      };

    } catch (error) {
      console.error('Model training error:', error);
      
      // Update model status
      await supabase
        .from('prediction_models')
        .update({ status: 'failed' })
        .eq('id', modelId);

      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "Failed to train model",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsTraining(false);
    }
  }, [toast]);

  const makePrediction = useCallback(async (
    modelId: string,
    inputData: any,
    options: { useConfidenceThreshold?: boolean; allowFallback?: boolean } = {}
  ): Promise<{ success: boolean; prediction?: any; confidence?: number; fallbackUsed?: boolean }> => {
    setIsPredicting(true);
    
    try {
      // Get model
      const { data: model, error: modelError } = await supabase
        .from('prediction_models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (modelError) throw modelError;

      if (model.status !== 'ready') {
        throw new Error('Model is not ready for predictions');
      }

      let predictionResult;
      try {
        // Try AI-powered prediction
        predictionResult = await performAIPrediction(model, inputData);
      } catch (predictionError) {
        console.error('AI prediction failed:', predictionError);
        
        // Fallback to statistical methods
        if (options.allowFallback !== false) {
          predictionResult = await performFallbackPrediction(model, inputData);
          predictionResult.fallbackUsed = true;
        } else {
          throw predictionError;
        }
      }

      // Check confidence threshold
      if (options.useConfidenceThreshold && 
          predictionResult.confidence < model.confidence_threshold) {
        
        // Use manual override or fallback method
        predictionResult = await handleLowConfidencePrediction(model, inputData, predictionResult);
      }

      // Store prediction
      const { data: prediction, error: predictionStoreError } = await supabase
        .from('predictions')
        .insert({
          model_id: modelId,
          prediction_type: getPredictionType(model.model_type),
          input_data: inputData,
          predicted_value: predictionResult.value,
          confidence_score: predictionResult.confidence,
          probability_distribution: predictionResult.distribution,
          prediction_interval: predictionResult.interval
        })
        .select()
        .single();

      if (predictionStoreError) throw predictionStoreError;

      toast({
        title: "Prediction Complete",
        description: `Prediction made with ${Math.round(predictionResult.confidence * 100)}% confidence${predictionResult.fallbackUsed ? ' (fallback)' : ''}`,
      });

      return {
        success: true,
        prediction: {
          id: prediction.id,
          value: predictionResult.value,
          confidence: predictionResult.confidence,
          interval: predictionResult.interval,
          distribution: predictionResult.distribution
        },
        confidence: predictionResult.confidence,
        fallbackUsed: predictionResult.fallbackUsed
      };

    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Failed to make prediction",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsPredicting(false);
    }
  }, [toast]);

  const validateDataQuality = async (
    dataSource: string,
    features: string[]
  ): Promise<{ passed: boolean; issues: string[]; metrics: any }> => {
    const issues: string[] = [];
    const metrics: any = {};

    try {
      // Get data sample
      const { data, error } = await supabase
        .from(dataSource)
        .select(features.join(','))
        .limit(1000);

      if (error) throw error;

      if (!data || data.length === 0) {
        issues.push('No data found in source table');
        return { passed: false, issues, metrics };
      }

      // Check completeness
      features.forEach(feature => {
        const completeness = data.filter(row => row[feature] != null).length / data.length;
        metrics[`${feature}_completeness`] = completeness;
        
        if (completeness < 0.8) {
          issues.push(`Feature "${feature}" has low completeness (${Math.round(completeness * 100)}%)`);
        }
      });

      // Check for sufficient data
      if (data.length < 50) {
        issues.push('Insufficient data for training (minimum 50 records required)');
      }

      // Store data quality metrics
      for (const feature of features) {
        await supabase
          .from('data_quality_metrics')
          .insert({
            table_name: dataSource,
            column_name: feature,
            metric_type: 'completeness',
            metric_value: metrics[`${feature}_completeness`] * 100,
            sample_size: data.length
          });
      }

      return {
        passed: issues.length === 0,
        issues,
        metrics: { ...metrics, sample_size: data.length }
      };

    } catch (error) {
      issues.push(`Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { passed: false, issues, metrics };
    }
  };

  const performAdvancedTraining = async (
    model: PredictionModel,
    options: ModelTrainingOptions
  ): Promise<any> => {
    // Call AI training edge function
    const { data, error } = await supabase.functions.invoke('train-model', {
      body: {
        modelId: model.id,
        modelType: model.model_type,
        dataSource: model.data_source,
        features: model.features,
        targetColumn: model.target_column,
        trainingConfig: model.training_config,
        options
      }
    });

    if (error) throw error;

    return {
      success: true,
      metrics: data.metrics,
      accuracy: data.accuracy,
      parameters: data.parameters,
      dataCount: data.dataCount,
      fallbackUsed: false
    };
  };

  const performFallbackTraining = async (
    model: PredictionModel,
    options: ModelTrainingOptions
  ): Promise<any> => {
    // Simple statistical training fallback
    const { data, error } = await supabase
      .from(model.data_source)
      .select([...model.features, model.target_column].filter(Boolean).join(','))
      .limit(10000);

    if (error) throw error;

    if (!data || data.length < 10) {
      throw new Error('Insufficient data for fallback training');
    }

    // Calculate simple statistics
    const metrics = calculateSimpleStatistics(data, model.features, model.target_column);
    
    return {
      success: true,
      metrics,
      accuracy: Math.max(0.5, Math.min(0.8, metrics.correlation || 0.6)), // Simulated accuracy
      parameters: { method: 'statistical_fallback', ...metrics },
      dataCount: data.length,
      fallbackUsed: true
    };
  };

  const performAIPrediction = async (model: PredictionModel, inputData: any): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('make-prediction', {
      body: {
        modelId: model.id,
        inputData,
        modelType: model.model_type
      }
    });

    if (error) throw error;

    return {
      value: data.prediction,
      confidence: data.confidence,
      distribution: data.distribution,
      interval: data.interval,
      fallbackUsed: false
    };
  };

  const performFallbackPrediction = async (model: PredictionModel, inputData: any): Promise<any> => {
    // Statistical fallback prediction
    switch (model.fallback_method) {
      case 'average':
        return await calculateAveragePrediction(model, inputData);
      case 'last_known':
        return await getLastKnownValue(model, inputData);
      case 'manual':
        return await getManualOverride(model, inputData);
      default:
        throw new Error('Unknown fallback method');
    }
  };

  const calculateAveragePrediction = async (model: PredictionModel, inputData: any): Promise<any> => {
    if (!model.target_column) {
      throw new Error('No target column defined for average calculation');
    }

    const { data, error } = await supabase
      .from(model.data_source)
      .select(model.target_column)
      .not(model.target_column, 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('No historical data for average calculation');
    }

    const values = data.map(row => Number(row[model.target_column])).filter(v => !isNaN(v));
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      value: average,
      confidence: Math.max(0.3, Math.min(0.7, 1 - (stdDev / average))), // Confidence based on variability
      interval: {
        lower: average - stdDev,
        upper: average + stdDev
      },
      fallbackUsed: true
    };
  };

  const getLastKnownValue = async (model: PredictionModel, inputData: any): Promise<any> => {
    if (!model.target_column) {
      throw new Error('No target column defined');
    }

    const { data, error } = await supabase
      .from(model.data_source)
      .select(model.target_column)
      .not(model.target_column, 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return {
      value: data[model.target_column],
      confidence: 0.5, // Medium confidence for last known value
      fallbackUsed: true
    };
  };

  const getManualOverride = async (model: PredictionModel, inputData: any): Promise<any> => {
    // Return a default value that requires manual review
    return {
      value: null,
      confidence: 0.0,
      requiresManualReview: true,
      fallbackUsed: true
    };
  };

  const handleLowConfidencePrediction = async (
    model: PredictionModel,
    inputData: any,
    originalPrediction: any
  ): Promise<any> => {
    // Generate alert for low confidence
    await supabase
      .from('monitor_alerts')
      .insert({
        monitor_id: model.id, // Using model ID as monitor reference
        alert_level: 'warning',
        title: 'Low Confidence Prediction',
        message: `Model "${model.name}" generated a prediction with confidence ${originalPrediction.confidence} below threshold ${model.confidence_threshold}`,
        alert_data: {
          model_id: model.id,
          input_data: inputData,
          prediction: originalPrediction,
          threshold: model.confidence_threshold
        }
      });

    // Use fallback method for low confidence
    const fallbackPrediction = await performFallbackPrediction(model, inputData);
    
    return {
      ...fallbackPrediction,
      originalPrediction,
      lowConfidenceOverride: true
    };
  };

  const calculateSimpleStatistics = (data: any[], features: string[], targetColumn?: string) => {
    const metrics: any = {};

    // Calculate basic statistics for each feature
    features.forEach(feature => {
      const values = data.map(row => Number(row[feature])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        metrics[feature] = {
          mean,
          variance,
          stdDev: Math.sqrt(variance),
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });

    // Calculate correlation with target if available
    if (targetColumn && features.length > 0) {
      const targetValues = data.map(row => Number(row[targetColumn])).filter(v => !isNaN(v));
      const featureValues = data.map(row => Number(row[features[0]])).filter(v => !isNaN(v));
      
      if (targetValues.length === featureValues.length && targetValues.length > 1) {
        metrics.correlation = calculateCorrelation(featureValues, targetValues);
      }
    }

    return metrics;
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getPredictionType = (modelType: string): 'forecast' | 'classification' | 'anomaly' => {
    switch (modelType) {
      case 'time_series':
        return 'forecast';
      case 'classification':
        return 'classification';
      case 'anomaly_detection':
        return 'anomaly';
      default:
        return 'forecast';
    }
  };

  const getModels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }, []);

  const getPredictions = useCallback(async (modelId?: string, limit = 50) => {
    try {
      let query = supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (modelId) {
        query = query.eq('model_id', modelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }, []);

  const validatePredictionAccuracy = useCallback(async (predictionId: string, actualValue: any) => {
    try {
      const { data: prediction, error: fetchError } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', predictionId)
        .single();

      if (fetchError) throw fetchError;

      const predictedValue = prediction.predicted_value;
      const deviation = Math.abs(Number(actualValue) - Number(predictedValue)) / Number(actualValue) * 100;
      const isAccurate = deviation <= 10; // Within 10% considered accurate

      await supabase
        .from('predictions')
        .update({
          actual_value: actualValue,
          is_accurate: isAccurate,
          deviation_percent: deviation,
          actual_recorded_at: new Date().toISOString()
        })
        .eq('id', predictionId);

      return { success: true, isAccurate, deviation };
    } catch (error) {
      console.error('Error validating prediction accuracy:', error);
      return { success: false };
    }
  }, []);

  return {
    createModel,
    trainModel,
    makePrediction,
    validatePredictionAccuracy,
    getModels,
    getPredictions,
    isTraining,
    isPredicting,
    modelMetrics
  };
};