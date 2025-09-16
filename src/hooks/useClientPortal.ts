import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Enhanced Authentication Hook
export const useEnhancedAuth = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<any>(null);

  const checkAccountStatus = useCallback(async () => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('user_auth_security')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setLockoutInfo(data);
      return data;
    } catch (error) {
      console.error('Failed to check account status:', error);
      return null;
    }
  }, [profile?.id]);

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    try {
      // Track the password reset request
      await supabase.from('auth_events').insert({
        tenant_id: profile?.tenant_id,
        user_id: profile?.id,
        event_type: 'password_reset_requested',
        success: true,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        additional_data: { email }
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const enable2FA = useCallback(async () => {
    // Implementation for 2FA setup
    setLoading(true);
    try {
      // Generate 2FA secret and backup codes
      const secret = generateTOTPSecret();
      const backupCodes = generateBackupCodes();

      const { error } = await supabase
        .from('user_auth_security')
        .upsert({
          tenant_id: profile?.tenant_id,
          user_id: profile?.id,
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: backupCodes
        });

      if (error) throw error;

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });

      return { success: true, secret, backupCodes };
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast({
        title: "2FA Setup Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return {
    loading,
    lockoutInfo,
    checkAccountStatus,
    requestPasswordReset,
    enable2FA,
  };
};

// Support Ticket Management Hook
export const useSupportTickets = () => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateTicketData = useCallback((ticketData: any) => {
    const errors: Record<string, string> = {};

    if (!ticketData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!ticketData.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (ticketData.description && ticketData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!ticketData.category) {
      errors.category = 'Category is required';
    }

    if (!ticketData.priority) {
      errors.priority = 'Priority is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const createTicket = useCallback(async (ticketData: any, attachments: File[] = []) => {
    setLoading(true);
    try {
      if (!validateTicketData(ticketData)) {
        return { success: false, errors: validationErrors };
      }

      // Upload attachments first (would be implemented with file upload hook)
      const uploadedFiles = [];
      // File upload implementation would go here

      const ticketNumber = `TKT-${Date.now()}`;
      
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          tenant_id: profile?.tenant_id,
          client_id: ticketData.client_id,
          contact_id: ticketData.contact_id,
          ticket_number: ticketNumber,
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          category: ticketData.category,
          subcategory: ticketData.subcategory,
          tags: ticketData.tags || [],
          custom_fields: ticketData.custom_fields || {},
          required_fields_completed: true,
          created_by: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit trail
      await logAuditEvent('create', 'ticket', ticket.id, ticket.title);

      toast({
        title: "Ticket Created",
        description: `Ticket ${ticketNumber} has been created successfully.`,
      });

      setTickets(prev => [ticket, ...prev]);
      return { success: true, ticket };

    } catch (error: any) {
      console.error('Ticket creation error:', error);
      toast({
        title: "Ticket Creation Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile, validateTicketData, validationErrors]);

  const fetchTickets = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          client:clients(name),
          contact:contacts(first_name, last_name, email),
          assigned_user:users(first_name, last_name)
        `)
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
      return { success: true, tickets: data };

    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      toast({
        title: "Failed to Load Tickets",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  return {
    tickets,
    loading,
    validationErrors,
    createTicket,
    fetchTickets,
    validateTicketData,
  };
};

// File Upload with Virus Scanning Hook
export const useFileUpload = () => {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [scanStatus, setScanStatus] = useState<any>({});

  const uploadFile = useCallback(async (
    file: File, 
    entityType: string, 
    entityId: string,
    virusScanRequired: boolean = true
  ) => {
    setUploading(true);
    try {
      // Validate file
      const validationResult = validateFile(file);
      if (!validationResult.isValid) {
        toast({
          title: "File Upload Failed",
          description: validationResult.error,
          variant: "destructive",
        });
        return { success: false, error: validationResult.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `uploads/${profile?.tenant_id}/${fileName}`;

      // Calculate file hash for deduplication
      const fileHash = await calculateFileHash(file);

      // Create file upload record
      const { data: fileRecord, error: uploadError } = await supabase
        .from('file_uploads')
        .insert({
          tenant_id: profile?.tenant_id,
          uploaded_by: profile?.id,
          filename: fileName,
          original_filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          file_hash: fileHash,
          scan_status: virusScanRequired ? 'pending' : 'clean',
          related_entity_type: entityType,
          related_entity_id: entityId,
          is_public: false
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Simulate virus scanning
      if (virusScanRequired) {
        setScanStatus(prev => ({ ...prev, [fileRecord.id]: 'scanning' }));
        
        // Simulate scanning delay
        setTimeout(async () => {
          try {
            const scanResult = await simulateVirusScan(file);
            
            await supabase
              .from('file_uploads')
              .update({
                scan_status: scanResult.isClean ? 'clean' : 'infected',
                scan_result: scanResult,
                scan_completed_at: new Date().toISOString()
              })
              .eq('id', fileRecord.id);

            setScanStatus(prev => ({ 
              ...prev, 
              [fileRecord.id]: scanResult.isClean ? 'clean' : 'infected' 
            }));

            if (!scanResult.isClean) {
              toast({
                title: "File Scan Failed",
                description: "File failed virus scan and has been quarantined.",
                variant: "destructive",
              });
            }
          } catch (scanError) {
            console.error('Virus scan error:', scanError);
            setScanStatus(prev => ({ ...prev, [fileRecord.id]: 'error' }));
          }
        }, 2000);
      }

      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

      return { success: true, fileId: fileRecord.id, filePath };

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "File Upload Failed", 
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  }, [profile]);

  return {
    uploading,
    scanStatus,
    uploadFile,
  };
};

// Service Catalog and Booking Hook
export const useServiceBooking = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  const fetchServiceCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;

      setServices(data || []);
      return { success: true, services: data };

    } catch (error: any) {
      console.error('Failed to fetch service catalog:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  const checkBookingConflicts = useCallback(async (
    technicianId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => {
    try {
      let query = supabase
        .from('service_bookings')
        .select('*')
        .eq('assigned_technician', technicianId)
        .not('status', 'in', '(cancelled,completed)')
        .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const conflictingBookings = data || [];
      setConflicts(conflictingBookings);

      return {
        hasConflicts: conflictingBookings.length > 0,
        conflicts: conflictingBookings
      };

    } catch (error: any) {
      console.error('Conflict check error:', error);
      return { hasConflicts: false, conflicts: [], error: error.message };
    }
  }, []);

  const createBooking = useCallback(async (bookingData: any) => {
    setLoading(true);
    try {
      // Check for conflicts first
      if (bookingData.assigned_technician) {
        const conflictCheck = await checkBookingConflicts(
          bookingData.assigned_technician,
          bookingData.start_time,
          bookingData.end_time
        );

        if (conflictCheck.hasConflicts) {
          return { 
            success: false, 
            error: 'Time slot conflicts with existing booking',
            conflicts: conflictCheck.conflicts
          };
        }
      }

      const bookingNumber = `BKG-${Date.now()}`;

      const { data: booking, error } = await supabase
        .from('service_bookings')
        .insert({
          tenant_id: profile?.tenant_id,
          client_id: bookingData.client_id,
          contact_id: bookingData.contact_id,
          service_id: bookingData.service_id,
          booking_number: bookingNumber,
          title: bookingData.title,
          description: bookingData.description,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          timezone: bookingData.timezone,
          assigned_technician: bookingData.assigned_technician,
          location_type: bookingData.location_type,
          location_details: bookingData.location_details,
          conflicts_checked_at: new Date().toISOString(),
          has_conflicts: false,
          created_by: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Created",
        description: `Booking ${bookingNumber} has been scheduled successfully.`,
      });

      setBookings(prev => [booking, ...prev]);
      return { success: true, booking };

    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile, checkBookingConflicts]);

  return {
    services,
    bookings,
    loading,
    conflicts,
    fetchServiceCatalog,
    checkBookingConflicts,
    createBooking,
  };
};

// Utility functions
const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
};

const generateTOTPSecret = (): string => {
  // Simple base32 secret generation for demo
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateBackupCodes = (): string[] => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
};

const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  return { isValid: true };
};

const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const simulateVirusScan = async (file: File) => {
  // Simulate virus scanning logic
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Demo: 95% of files are clean
  const isClean = Math.random() > 0.05;
  
  return {
    isClean,
    scanEngine: 'Demo Scanner v1.0',
    scanTime: new Date().toISOString(),
    threats: isClean ? [] : ['Demo.Virus.Test']
  };
};

const logAuditEvent = async (
  action: string,
  resourceType: string,
  resourceId: string,
  resourceName: string,
  tenantId?: string
) => {
  try {
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId || 'demo-tenant-id',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      risk_level: 'low'
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};