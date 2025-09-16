import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle, 
  HelpCircle,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'number' | 'boolean' | 'scale';
  section: string;
  options?: Array<{ label: string; value: number; description?: string }>;
  max_points: number;
  required: boolean;
  help_text?: string;
  validation_rules?: any;
}

interface AssessmentExecutionInterfaceProps {
  questions: Question[];
  responses: Record<string, any>;
  currentQuestionIndex: number;
  onResponseChange: (questionId: string, value: any, score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
  onComplete: () => void;
  saving: boolean;
  completing: boolean;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  isLastQuestion: boolean;
  allQuestionsAnswered: boolean;
}

export const AssessmentExecutionInterface: React.FC<AssessmentExecutionInterfaceProps> = ({
  questions,
  responses,
  currentQuestionIndex,
  onResponseChange,
  onNavigate,
  onComplete,
  saving,
  completing,
  canNavigateNext,
  canNavigatePrevious,
  isLastQuestion,
  allQuestionsAnswered
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const currentQuestion = questions[currentQuestionIndex];
  const completedQuestions = Object.keys(responses).length;
  const progress = (completedQuestions / questions.length) * 100;

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  const calculateScore = (questionType: string, value: any, options?: Array<{ value: number; label: string }>) => {
    switch (questionType) {
      case 'multiple_choice':
        return typeof value === 'number' ? value : 0;
      case 'scale':
        return typeof value === 'number' ? value : 0;
      case 'boolean':
        return value === true ? currentQuestion.max_points : 0;
      case 'text':
      case 'number':
        // For text/number questions, award full points if answered
        return value && value.toString().trim() ? currentQuestion.max_points : 0;
      default:
        return 0;
    }
  };

  const handleResponseChange = (value: any) => {
    const score = calculateScore(currentQuestion.question_type, value, currentQuestion.options);
    onResponseChange(currentQuestion.id, value, score);
  };

  const renderQuestionInput = () => {
    const currentResponse = responses[currentQuestion.id]?.value;

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={currentResponse?.toString() || ''}
              onValueChange={(value) => handleResponseChange(parseInt(value))}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.value.toString()} id={`option-${index}`} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={`option-${index}`} className="cursor-pointer font-medium">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Points: {option.value}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Poor (0)</span>
              <span>Excellent ({currentQuestion.max_points})</span>
            </div>
            <RadioGroup
              value={currentResponse?.toString() || ''}
              onValueChange={(value) => handleResponseChange(parseInt(value))}
            >
              <div className="flex justify-between">
                {Array.from({ length: currentQuestion.max_points + 1 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value={i.toString()} id={`scale-${i}`} />
                    <Label htmlFor={`scale-${i}`} className="text-xs">{i}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 'boolean':
        return (
          <RadioGroup
            value={currentResponse?.toString() || ''}
            onValueChange={(value) => handleResponseChange(value === 'true')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>
        );

      case 'text':
        return (
          <Textarea
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter a number..."
          />
        );

      default:
        return <div>Unsupported question type: {currentQuestion.question_type}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Assessment Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedQuestions} of {questions.length} questions
            </span>
          </div>
          <Progress value={progress} className="mb-2" />
          <div className="text-xs text-muted-foreground">
            {progress.toFixed(0)}% Complete
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Question {currentQuestion.question_number}
                {currentQuestion.required && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.section}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.question_type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Max points: {currentQuestion.max_points}
                </span>
              </div>
            </div>
            {currentQuestion.help_text && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-muted-foreground"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-4 text-lg">{currentQuestion.question_text}</h3>
            
            {showHelp && currentQuestion.help_text && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Help & Guidance</h4>
                    <p className="text-sm text-blue-700">{currentQuestion.help_text}</p>
                  </div>
                </div>
              </div>
            )}

            {renderQuestionInput()}

            {/* Response Status */}
            {responses[currentQuestion.id] && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      Answer saved
                    </p>
                    <p className="text-xs text-green-700">
                      Score: {responses[currentQuestion.id].score} / {currentQuestion.max_points} points
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warning */}
            {currentQuestion.required && !responses[currentQuestion.id] && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This question is required to proceed
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => onNavigate('previous')}
          disabled={!canNavigatePrevious}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2 items-center">
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Saving...
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button 
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              disabled={!allQuestionsAnswered || completing}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {questions.map((question, index) => {
              const isAnswered = responses[question.id];
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <div
                  key={question.id}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors
                    ${isCurrent 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/20' 
                      : isAnswered 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                  onClick={() => {
                    // Allow navigation to any question
                    const event = new CustomEvent('navigate-to-question', { detail: index });
                    window.dispatchEvent(event);
                  }}
                  title={`Question ${question.question_number}${isAnswered ? ' (Answered)' : ''}`}
                >
                  {question.question_number}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              Current
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100"></div>
              Answered
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted"></div>
              Unanswered
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};