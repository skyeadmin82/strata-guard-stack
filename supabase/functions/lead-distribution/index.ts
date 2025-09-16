import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Lead {
  id?: string;
  company_name: string;
  source?: string;
  industry?: string;
  company_size?: string;
  territory?: string;
  score?: number;
  estimated_value?: number;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  tier: string;
  total_sales: number;
  deals_closed: number;
  conversion_rate: number;
  territory?: string;
  specializations?: string[];
  max_active_leads: number;
  status: string;
}

interface DistributionRule {
  id: string;
  rule_name: string;
  rule_type: string;
  is_active: boolean;
  priority: number;
  conditions: {
    lead_source?: string[];
    industry?: string[];
    company_size?: string[];
    territory?: string[];
    lead_score_min?: number;
    lead_score_max?: number;
  };
  assignment_settings: {
    eligible_agents?: string[];
    weight_factors?: {
      performance: number;
      capacity: number;
      specialization: number;
    };
    max_leads_per_agent: number;
    reassign_after_days: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, leadData, leadId } = await req.json();

    console.log('Lead distribution request:', { action, leadData, leadId });

    if (action === 'assign') {
      const assignedAgent = await assignLeadToAgent(supabase, leadData);
      
      return new Response(
        JSON.stringify({ success: true, assignedAgent }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'test') {
      const testLead: Lead = {
        company_name: 'Test Company',
        source: 'Website',
        industry: 'Technology',
        company_size: 'Medium',
        territory: 'Northeast',
        score: 75,
        estimated_value: 50000
      };

      const assignedAgent = await assignLeadToAgent(supabase, testLead);
      
      return new Response(
        JSON.stringify({ success: true, assignedAgent, testLead }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'reassign_stale') {
      const reassignedCount = await reassignStaleLeads(supabase);
      
      return new Response(
        JSON.stringify({ success: true, reassignedCount }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('Lead distribution error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function assignLeadToAgent(supabase: any, lead: Lead): Promise<Agent | null> {
  console.log('Assigning lead:', lead);

  // Get active distribution rules ordered by priority
  const { data: rules, error: rulesError } = await supabase
    .from('lead_distribution_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority');

  if (rulesError || !rules?.length) {
    console.log('No active distribution rules found');
    return await fallbackAssignment(supabase);
  }

  // Find first matching rule
  for (const rule of rules) {
    if (await matchesRuleConditions(rule, lead)) {
      console.log('Matched rule:', rule.rule_name);
      
      const agent = await assignByRule(supabase, rule, lead);
      if (agent) {
        console.log('Assigned to agent:', agent.first_name, agent.last_name);
        return agent;
      }
    }
  }

  console.log('No rules matched, using fallback');
  return await fallbackAssignment(supabase);
}

async function matchesRuleConditions(rule: DistributionRule, lead: Lead): Promise<boolean> {
  const conditions = rule.conditions;

  // Check lead source
  if (conditions.lead_source?.length && lead.source) {
    if (!conditions.lead_source.includes(lead.source)) {
      return false;
    }
  }

  // Check industry
  if (conditions.industry?.length && lead.industry) {
    if (!conditions.industry.includes(lead.industry)) {
      return false;
    }
  }

  // Check company size
  if (conditions.company_size?.length && lead.company_size) {
    if (!conditions.company_size.includes(lead.company_size)) {
      return false;
    }
  }

  // Check territory
  if (conditions.territory?.length && lead.territory) {
    if (!conditions.territory.includes(lead.territory)) {
      return false;
    }
  }

  // Check lead score range
  if (conditions.lead_score_min && lead.score) {
    if (lead.score < conditions.lead_score_min) {
      return false;
    }
  }

  if (conditions.lead_score_max && lead.score) {
    if (lead.score > conditions.lead_score_max) {
      return false;
    }
  }

  return true;
}

async function assignByRule(supabase: any, rule: DistributionRule, lead: Lead): Promise<Agent | null> {
  // Get eligible agents
  let eligibleAgents: Agent[] = [];
  
  if (rule.assignment_settings.eligible_agents?.length) {
    const { data: agents } = await supabase
      .from('sales_agents')
      .select('*')
      .in('id', rule.assignment_settings.eligible_agents)
      .eq('status', 'active');
    
    eligibleAgents = agents || [];
  } else {
    // Get all active agents if no specific eligibility
    const { data: agents } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('status', 'active');
    
    eligibleAgents = agents || [];
  }

  if (!eligibleAgents.length) {
    return null;
  }

  // Filter by capacity
  const agentsWithCapacity = await filterByCapacity(
    supabase, 
    eligibleAgents, 
    rule.assignment_settings.max_leads_per_agent
  );

  if (!agentsWithCapacity.length) {
    console.log('No agents with available capacity');
    return null;
  }

  // Apply assignment strategy
  switch (rule.rule_type) {
    case 'round_robin':
      return await roundRobinAssignment(supabase, agentsWithCapacity);
    
    case 'top_performer':
      return topPerformerAssignment(agentsWithCapacity);
    
    case 'territory':
      return territoryBasedAssignment(agentsWithCapacity, lead);
    
    case 'specialization':
      return specializationAssignment(agentsWithCapacity, lead);
    
    case 'capacity':
      return capacityBasedAssignment(agentsWithCapacity);
    
    case 'weighted':
      return weightedAssignment(agentsWithCapacity, rule.assignment_settings.weight_factors, lead);
    
    default:
      return agentsWithCapacity[0];
  }
}

async function filterByCapacity(supabase: any, agents: Agent[], maxLeads: number): Promise<Agent[]> {
  const agentIds = agents.map(a => a.id);
  
  // Get current lead counts for each agent
  const { data: leadCounts } = await supabase
    .from('sales_leads')
    .select('assigned_agent_id')
    .in('assigned_agent_id', agentIds)
    .in('status', ['new', 'contacted', 'qualified', 'proposal', 'negotiation']);

  const countMap = leadCounts?.reduce((acc: any, lead: any) => {
    acc[lead.assigned_agent_id] = (acc[lead.assigned_agent_id] || 0) + 1;
    return acc;
  }, {}) || {};

  return agents.filter(agent => {
    const currentCount = countMap[agent.id] || 0;
    return currentCount < Math.min(maxLeads, agent.max_active_leads);
  });
}

async function roundRobinAssignment(supabase: any, agents: Agent[]): Promise<Agent> {
  // Get the agent who was assigned a lead least recently
  const { data: recentAssignments } = await supabase
    .from('sales_leads')
    .select('assigned_agent_id, assigned_at')
    .in('assigned_agent_id', agents.map(a => a.id))
    .not('assigned_at', 'is', null)
    .order('assigned_at', { ascending: false });

  if (!recentAssignments?.length) {
    return agents[0];
  }

  // Find agent with oldest last assignment
  const assignmentMap = recentAssignments.reduce((acc: any, assignment: any) => {
    if (!acc[assignment.assigned_agent_id]) {
      acc[assignment.assigned_agent_id] = assignment.assigned_at;
    }
    return acc;
  }, {});

  let oldestAgent = agents[0];
  let oldestTime = assignmentMap[oldestAgent.id] || '1970-01-01';

  for (const agent of agents) {
    const lastAssigned = assignmentMap[agent.id] || '1970-01-01';
    if (lastAssigned < oldestTime) {
      oldestTime = lastAssigned;
      oldestAgent = agent;
    }
  }

  return oldestAgent;
}

function topPerformerAssignment(agents: Agent[]): Agent {
  // Sort by performance metrics (total sales, conversion rate, deals closed)
  return agents.sort((a, b) => {
    const scoreA = (a.total_sales * 0.4) + (a.conversion_rate * 0.3) + (a.deals_closed * 0.3);
    const scoreB = (b.total_sales * 0.4) + (b.conversion_rate * 0.3) + (b.deals_closed * 0.3);
    return scoreB - scoreA;
  })[0];
}

function territoryBasedAssignment(agents: Agent[], lead: Lead): Agent {
  // Find agents in the same territory
  const territoryAgents = agents.filter(agent => 
    agent.territory === lead.territory
  );

  if (territoryAgents.length) {
    return topPerformerAssignment(territoryAgents);
  }

  // Fallback to top performer if no territory match
  return topPerformerAssignment(agents);
}

function specializationAssignment(agents: Agent[], lead: Lead): Agent {
  // Find agents with relevant specializations
  const specializedAgents = agents.filter(agent => 
    agent.specializations?.some(spec => 
      lead.industry?.toLowerCase().includes(spec.toLowerCase())
    )
  );

  if (specializedAgents.length) {
    return topPerformerAssignment(specializedAgents);
  }

  return topPerformerAssignment(agents);
}

function capacityBasedAssignment(agents: Agent[]): Agent {
  // Assign to agent with most available capacity
  // (This would need current lead count, simplified for now)
  return agents[0];
}

function weightedAssignment(agents: Agent[], weightFactors: any, lead: Lead): Agent {
  if (!weightFactors) {
    return topPerformerAssignment(agents);
  }

  const scoredAgents = agents.map(agent => {
    let score = 0;
    
    // Performance score (normalized)
    const maxSales = Math.max(...agents.map(a => a.total_sales));
    const performanceScore = maxSales > 0 ? (agent.total_sales / maxSales) : 0;
    score += performanceScore * weightFactors.performance;
    
    // Capacity score (simplified - higher is better for now)
    const capacityScore = 1; // Would calculate based on current workload
    score += capacityScore * weightFactors.capacity;
    
    // Specialization score
    const hasSpecialization = agent.specializations?.some(spec => 
      lead.industry?.toLowerCase().includes(spec.toLowerCase())
    );
    const specializationScore = hasSpecialization ? 1 : 0.5;
    score += specializationScore * weightFactors.specialization;
    
    return { agent, score };
  });

  return scoredAgents.sort((a, b) => b.score - a.score)[0].agent;
}

async function fallbackAssignment(supabase: any): Promise<Agent | null> {
  // Simple fallback: assign to agent with least current leads
  const { data: agents } = await supabase
    .from('sales_agents')
    .select('*')
    .eq('status', 'active');

  if (!agents?.length) {
    return null;
  }

  return agents[0]; // Simplified fallback
}

async function reassignStaleLeads(supabase: any): Promise<number> {
  // Get leads that haven't been contacted within reassign timeframe
  const { data: staleLeads } = await supabase
    .from('sales_leads')
    .select('*')
    .in('status', ['new', 'contacted'])
    .lt('assigned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!staleLeads?.length) {
    return 0;
  }

  let reassignedCount = 0;

  for (const lead of staleLeads) {
    const newAgent = await assignLeadToAgent(supabase, lead);
    
    if (newAgent && newAgent.id !== lead.assigned_agent_id) {
      await supabase
        .from('sales_leads')
        .update({
          assigned_agent_id: newAgent.id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      reassignedCount++;
    }
  }

  console.log(`Reassigned ${reassignedCount} stale leads`);
  return reassignedCount;
}