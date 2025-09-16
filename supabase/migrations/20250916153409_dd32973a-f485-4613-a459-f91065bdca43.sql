-- Add comprehensive IT assessment questions
INSERT INTO public.assessment_questions (
  tenant_id, template_id, question_number, section, question_text, question_type, 
  options, max_points, required, scoring_weight, help_text
) VALUES 
-- Network Security Questions
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 2, 'Network Security', 'Do you have a firewall configured and actively monitored?', 'multiple_choice', 
 '[{"label": "Yes, enterprise-grade with 24/7 monitoring", "value": 5}, {"label": "Yes, basic firewall with regular monitoring", "value": 4}, {"label": "Yes, but minimal monitoring", "value": 2}, {"label": "No firewall protection", "value": 0}]', 5, true, 1, 'Firewalls are essential for network security'),

('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 3, 'Network Security', 'How often do you update network security patches?', 'multiple_choice',
 '[{"label": "Automatically within 24 hours", "value": 5}, {"label": "Weekly scheduled updates", "value": 4}, {"label": "Monthly updates", "value": 3}, {"label": "Quarterly or less frequent", "value": 1}, {"label": "No regular update schedule", "value": 0}]', 5, true, 1, 'Regular security updates are critical for protection'),

-- Hardware Infrastructure
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 4, 'Hardware', 'What is the age of your primary server infrastructure?', 'multiple_choice',
 '[{"label": "Less than 2 years", "value": 5}, {"label": "2-3 years", "value": 4}, {"label": "3-5 years", "value": 3}, {"label": "5-7 years", "value": 2}, {"label": "Over 7 years", "value": 1}]', 5, true, 1, 'Newer hardware provides better performance and security'),

('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 5, 'Hardware', 'Do you have redundant power systems (UPS/generators)?', 'multiple_choice',
 '[{"label": "Full redundancy with generators", "value": 5}, {"label": "UPS systems for all critical equipment", "value": 4}, {"label": "Basic UPS for servers only", "value": 2}, {"label": "No backup power systems", "value": 0}]', 5, true, 1, 'Power redundancy prevents downtime'),

-- Data Backup & Recovery
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 6, 'Backup & Recovery', 'How frequently do you perform data backups?', 'multiple_choice',
 '[{"label": "Real-time/continuous backup", "value": 5}, {"label": "Daily automated backups", "value": 4}, {"label": "Weekly backups", "value": 3}, {"label": "Monthly backups", "value": 2}, {"label": "No regular backup schedule", "value": 0}]', 5, true, 1, 'Regular backups are essential for data protection'),

('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 7, 'Backup & Recovery', 'How often do you test backup restoration procedures?', 'multiple_choice',
 '[{"label": "Monthly testing", "value": 5}, {"label": "Quarterly testing", "value": 4}, {"label": "Bi-annually", "value": 3}, {"label": "Annually", "value": 2}, {"label": "Never tested", "value": 0}]', 5, true, 1, 'Testing ensures backups work when needed'),

-- Cybersecurity Policies
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 8, 'Security Policies', 'Do you have documented cybersecurity policies?', 'multiple_choice',
 '[{"label": "Comprehensive, regularly updated policies", "value": 5}, {"label": "Basic documented policies", "value": 3}, {"label": "Informal policies only", "value": 1}, {"label": "No documented policies", "value": 0}]', 5, true, 1, 'Documented policies ensure consistent security practices'),

('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 9, 'Security Policies', 'Do you provide cybersecurity training to employees?', 'multiple_choice',
 '[{"label": "Regular ongoing training programs", "value": 5}, {"label": "Annual training sessions", "value": 4}, {"label": "New employee training only", "value": 2}, {"label": "No formal training", "value": 0}]', 5, true, 1, 'Employee training is crucial for security'),

-- System Monitoring
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 10, 'Monitoring', 'Do you have system monitoring and alerting in place?', 'multiple_choice',
 '[{"label": "24/7 automated monitoring with alerts", "value": 5}, {"label": "Business hours monitoring", "value": 3}, {"label": "Basic logging only", "value": 2}, {"label": "No monitoring systems", "value": 0}]', 5, true, 1, 'Monitoring helps detect issues quickly'),

-- Access Control
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 11, 'Access Control', 'Do you use multi-factor authentication (MFA)?', 'multiple_choice',
 '[{"label": "MFA required for all accounts", "value": 5}, {"label": "MFA for administrative accounts", "value": 4}, {"label": "MFA for some accounts", "value": 2}, {"label": "No MFA implemented", "value": 0}]', 5, true, 1, 'MFA significantly improves security'),

('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 12, 'Access Control', 'How do you manage user access rights?', 'multiple_choice',
 '[{"label": "Role-based access with regular reviews", "value": 5}, {"label": "Basic role-based access", "value": 3}, {"label": "Manual access management", "value": 2}, {"label": "No formal access management", "value": 0}]', 5, true, 1, 'Proper access management prevents unauthorized access'),

-- Compliance & Documentation
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 13, 'Compliance', 'Do you maintain IT asset inventory and documentation?', 'multiple_choice',
 '[{"label": "Complete automated inventory system", "value": 5}, {"label": "Regular manual inventory updates", "value": 4}, {"label": "Basic inventory tracking", "value": 2}, {"label": "No formal inventory", "value": 0}]', 5, true, 1, 'Asset tracking is essential for security and compliance'),

-- Incident Response
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 14, 'Incident Response', 'Do you have an incident response plan?', 'multiple_choice',
 '[{"label": "Documented plan with regular drills", "value": 5}, {"label": "Documented plan", "value": 4}, {"label": "Informal response procedures", "value": 2}, {"label": "No incident response plan", "value": 0}]', 5, true, 1, 'Incident response plans minimize damage and recovery time'),

-- Software Management
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 15, 'Software', 'How do you manage software licensing and updates?', 'multiple_choice',
 '[{"label": "Centralized management with automated updates", "value": 5}, {"label": "Regular manual updates and license tracking", "value": 4}, {"label": "Basic update procedures", "value": 2}, {"label": "No formal software management", "value": 0}]', 5, true, 1, 'Proper software management ensures security and compliance'),

-- Disaster Recovery
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 16, 'Disaster Recovery', 'Do you have a disaster recovery plan?', 'multiple_choice', 
 '[{"label": "Comprehensive tested DR plan", "value": 5}, {"label": "Basic DR plan", "value": 3}, {"label": "Informal recovery procedures", "value": 2}, {"label": "No disaster recovery plan", "value": 0}]', 5, true, 1, 'DR plans ensure business continuity'),

-- Performance Monitoring
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 17, 'Performance', 'How do you monitor system performance?', 'multiple_choice',
 '[{"label": "Real-time performance monitoring", "value": 5}, {"label": "Regular performance reviews", "value": 4}, {"label": "Basic monitoring tools", "value": 2}, {"label": "No performance monitoring", "value": 0}]', 5, true, 1, 'Performance monitoring helps prevent issues'),

-- Email Security
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 18, 'Email Security', 'What email security measures do you have?', 'multiple_choice',
 '[{"label": "Advanced threat protection and encryption", "value": 5}, {"label": "Spam filtering and basic protection", "value": 3}, {"label": "Basic spam filtering only", "value": 2}, {"label": "No email security measures", "value": 0}]', 5, true, 1, 'Email is a common attack vector'),

-- Remote Access
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 19, 'Remote Access', 'How do you secure remote access to your systems?', 'multiple_choice',
 '[{"label": "VPN with MFA and monitoring", "value": 5}, {"label": "VPN with basic authentication", "value": 3}, {"label": "Direct access with passwords", "value": 1}, {"label": "No secure remote access", "value": 0}]', 5, true, 1, 'Secure remote access is critical for modern work'),

-- Budget and Planning
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 20, 'Planning', 'Do you have a budget allocated for IT security improvements?', 'multiple_choice',
 '[{"label": "Dedicated annual security budget", "value": 5}, {"label": "IT budget includes security", "value": 3}, {"label": "Ad-hoc security spending", "value": 2}, {"label": "No security budget", "value": 0}]', 5, true, 1, 'Budgeting ensures ongoing security improvements');

-- Update the assessment template with proper scoring rules
UPDATE public.assessment_templates 
SET 
  max_score = 100,
  passing_score = 70,
  scoring_rules = '{
    "sections": {
      "Network Security": 15,
      "Hardware": 10, 
      "Backup & Recovery": 15,
      "Security Policies": 10,
      "Monitoring": 5,
      "Access Control": 15,
      "Compliance": 5,
      "Incident Response": 5,
      "Software": 5,
      "Disaster Recovery": 5,
      "Performance": 5,
      "Email Security": 5,
      "Remote Access": 5,
      "Planning": 5
    },
    "total_possible": 100
  }',
  threshold_rules = '{
    "opportunities": {
      "network_security_upgrade": {
        "section": "Network Security",
        "threshold": 12,
        "priority": "high", 
        "title": "Network Security Enhancement",
        "description": "Implement advanced network security measures including next-generation firewalls and intrusion detection systems"
      },
      "backup_improvement": {
        "section": "Backup & Recovery", 
        "threshold": 12,
        "priority": "high",
        "title": "Backup & Recovery Enhancement", 
        "description": "Improve backup frequency and implement automated testing procedures"
      },
      "access_control_upgrade": {
        "section": "Access Control",
        "threshold": 12, 
        "priority": "medium",
        "title": "Access Control Improvement",
        "description": "Implement comprehensive multi-factor authentication and role-based access controls"
      }
    }
  }'
WHERE id = 'd59009a1-5d23-44fb-9980-e3d4fb73facc';