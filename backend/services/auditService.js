const { supabase } = require('../config/supabase');

const AUDIT_EVENTS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  RESUME_UPLOAD: 'resume_upload',
  RESUME_DELETE: 'resume_delete',
  RESUME_TAILOR: 'resume_tailor',
  JOB_SEARCH: 'job_search',
  JOB_SCRAPE: 'job_scrape',
  APPLICATION_SUBMIT: 'application_submit',
  APPLICATION_UPDATE: 'application_update',
  API_REQUEST: 'api_request',
  AUTH_FAILURE: 'auth_failure',
  SECURITY_VIOLATION: 'security_violation'
};

const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  FAILED: 'failed'
};

class AuditLogger {
  constructor() {
    this.buffer = [];
    this.flushInterval = 5000;
    this.batchSize = 10;
    
    setInterval(() => this.flush(), this.flushInterval);
  }

  async log(event, action, details = {}) {
    const entry = {
      event,
      action,
      user_id: details.userId || null,
      resource_type: details.resourceType || null,
      resource_id: details.resourceId || null,
      ip_address: details.ip || null,
      user_agent: details.userAgent || null,
      metadata: details.metadata || {},
      timestamp: new Date().toISOString()
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries);

      if (error) {
        console.error('Failed to write audit logs:', error);
        this.buffer.unshift(...entries);
      }
    } catch (err) {
      console.error('Audit log write error:', err);
      this.buffer.unshift(...entries);
    }
  }

  async logAuth(userId, action, ip, userAgent) {
    await this.log(
      AUDIT_EVENTS.USER_LOGIN,
      action,
      { userId, ip, userAgent }
    );
  }

  async logApiRequest(userId, endpoint, method, ip, userAgent) {
    await this.log(
      AUDIT_EVENTS.API_REQUEST,
      AUDIT_ACTIONS.READ,
      {
        userId,
        resourceType: 'api',
        metadata: { endpoint, method },
        ip,
        userAgent
      }
    );
  }

  async logSecurityViolation(userId, type, details) {
    await this.log(
      AUDIT_EVENTS.SECURITY_VIOLATION,
      AUDIT_ACTIONS.FAILED,
      {
        userId,
        metadata: { violationType: type, ...details }
      }
    );
  }

  async logResumeAction(userId, action, resumeId) {
    await this.log(
      AUDIT_EVENTS.RESUME_UPLOAD,
      action,
      { userId, resourceType: 'resume', resourceId: resumeId }
    );
  }

  async logApplicationAction(userId, action, applicationId, metadata = {}) {
    await this.log(
      AUDIT_EVENTS.APPLICATION_SUBMIT,
      action,
      { userId, resourceType: 'application', resourceId: applicationId, metadata }
    );
  }
}

const auditLogger = new AuditLogger();

const auditMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || null;
    
    if (res.statusCode >= 400) {
      await auditLogger.log(
        AUDIT_EVENTS.API_REQUEST,
        AUDIT_ACTIONS.FAILED,
        {
          userId,
          resourceType: 'api',
          metadata: {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            duration
          },
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      );
    }
  });

  next();
};

module.exports = {
  auditLogger,
  auditMiddleware,
  AUDIT_EVENTS,
  AUDIT_ACTIONS
};