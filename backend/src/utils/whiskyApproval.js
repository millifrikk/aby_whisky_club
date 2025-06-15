const { SystemSetting } = require('../models');

/**
 * Whisky submission approval and guidelines system
 * Manages automatic approval and submission guidelines
 */

/**
 * Check if auto-approval is enabled
 */
async function isAutoApprovalEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'auto_approve_whiskies' }
    });
    return setting ? setting.value === 'true' : false; // Default disabled
  } catch (error) {
    console.error('Error checking auto-approval setting:', error);
    return false;
  }
}

/**
 * Get submission guidelines
 */
async function getSubmissionGuidelines() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'whisky_submission_guidelines' }
    });
    return setting ? setting.value : 'Please ensure all whisky information is accurate and complete.';
  } catch (error) {
    console.error('Error getting submission guidelines:', error);
    return 'Please ensure all whisky information is accurate and complete.';
  }
}

/**
 * Validation rules for whisky submissions
 */
const VALIDATION_RULES = {
  required_fields: [
    'name',
    'distillery',
    'region',
    'country',
    'type'
  ],
  optional_fields: [
    'age',
    'abv',
    'description',
    'tasting_notes',
    'finish',
    'color',
    'nose',
    'palate',
    'bottle_size',
    'purchase_price',
    'current_price',
    'purchase_date',
    'purchase_location',
    'image_url'
  ],
  validation_criteria: {
    name: {
      min_length: 2,
      max_length: 200,
      pattern: /^[a-zA-Z0-9\s\-'\.&]+$/
    },
    distillery: {
      min_length: 2,
      max_length: 100,
      pattern: /^[a-zA-Z0-9\s\-'\.&]+$/
    },
    region: {
      min_length: 2,
      max_length: 100
    },
    country: {
      min_length: 2,
      max_length: 100
    },
    type: {
      allowed_values: ['Single Malt', 'Blended', 'Grain', 'Bourbon', 'Rye', 'Irish', 'Japanese', 'Other']
    },
    age: {
      min: 0,
      max: 100
    },
    abv: {
      min: 0,
      max: 100
    },
    bottle_size: {
      min: 50,
      max: 5000
    }
  }
};

/**
 * Quality scoring criteria
 */
const QUALITY_CRITERIA = {
  completeness: {
    weight: 0.4,
    factors: {
      required_fields: 0.6,
      optional_fields: 0.4
    }
  },
  accuracy: {
    weight: 0.3,
    factors: {
      field_validation: 0.5,
      distillery_match: 0.3,
      region_consistency: 0.2
    }
  },
  richness: {
    weight: 0.3,
    factors: {
      description_length: 0.4,
      tasting_notes_detail: 0.4,
      image_quality: 0.2
    }
  }
};

/**
 * Validate whisky submission
 */
function validateWhiskySubmission(whiskyData) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  VALIDATION_RULES.required_fields.forEach(field => {
    if (!whiskyData[field] || whiskyData[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate field content
  Object.entries(VALIDATION_RULES.validation_criteria).forEach(([field, rules]) => {
    const value = whiskyData[field];
    
    if (value !== undefined && value !== null && value !== '') {
      // String length validation
      if (rules.min_length && value.toString().length < rules.min_length) {
        errors.push(`${field} must be at least ${rules.min_length} characters`);
      }
      
      if (rules.max_length && value.toString().length > rules.max_length) {
        errors.push(`${field} cannot exceed ${rules.max_length} characters`);
      }
      
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value.toString())) {
        errors.push(`${field} contains invalid characters`);
      }
      
      // Numeric range validation
      if (rules.min !== undefined && parseFloat(value) < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && parseFloat(value) > rules.max) {
        errors.push(`${field} cannot exceed ${rules.max}`);
      }
      
      // Allowed values validation
      if (rules.allowed_values && !rules.allowed_values.includes(value)) {
        errors.push(`${field} must be one of: ${rules.allowed_values.join(', ')}`);
      }
    }
  });
  
  // Additional validation logic
  if (whiskyData.age && whiskyData.age > 0 && whiskyData.name && !whiskyData.name.includes(whiskyData.age.toString())) {
    warnings.push('Age statement not found in whisky name');
  }
  
  if (whiskyData.abv && (whiskyData.abv < 35 || whiskyData.abv > 70)) {
    warnings.push('ABV seems unusual for whisky');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate quality score for submission
 */
function calculateQualityScore(whiskyData) {
  let totalScore = 0;
  
  // Completeness score
  const requiredFieldsComplete = VALIDATION_RULES.required_fields.filter(
    field => whiskyData[field] && whiskyData[field].toString().trim() !== ''
  ).length;
  
  const optionalFieldsComplete = VALIDATION_RULES.optional_fields.filter(
    field => whiskyData[field] && whiskyData[field].toString().trim() !== ''
  ).length;
  
  const completenessScore = (
    (requiredFieldsComplete / VALIDATION_RULES.required_fields.length) * QUALITY_CRITERIA.completeness.factors.required_fields +
    (optionalFieldsComplete / VALIDATION_RULES.optional_fields.length) * QUALITY_CRITERIA.completeness.factors.optional_fields
  ) * QUALITY_CRITERIA.completeness.weight;
  
  // Accuracy score (simplified)
  const validation = validateWhiskySubmission(whiskyData);
  const accuracyScore = validation.isValid ? 
    QUALITY_CRITERIA.accuracy.weight : 
    QUALITY_CRITERIA.accuracy.weight * 0.5;
  
  // Richness score
  let richnessScore = 0;
  
  if (whiskyData.description) {
    const descScore = Math.min(whiskyData.description.length / 200, 1) * 
                     QUALITY_CRITERIA.richness.factors.description_length;
    richnessScore += descScore;
  }
  
  if (whiskyData.tasting_notes) {
    const tastingScore = Math.min(whiskyData.tasting_notes.length / 300, 1) * 
                        QUALITY_CRITERIA.richness.factors.tasting_notes_detail;
    richnessScore += tastingScore;
  }
  
  if (whiskyData.image_url) {
    richnessScore += QUALITY_CRITERIA.richness.factors.image_quality;
  }
  
  richnessScore *= QUALITY_CRITERIA.richness.weight;
  
  totalScore = completenessScore + accuracyScore + richnessScore;
  
  return {
    total: Math.round(totalScore * 100),
    breakdown: {
      completeness: Math.round(completenessScore * 100),
      accuracy: Math.round(accuracyScore * 100),
      richness: Math.round(richnessScore * 100)
    }
  };
}

/**
 * Determine if submission should be auto-approved
 */
async function shouldAutoApprove(whiskyData, userId = null) {
  try {
    const autoApprovalEnabled = await isAutoApprovalEnabled();
    
    if (!autoApprovalEnabled) {
      return {
        approved: false,
        reason: 'Auto-approval is disabled',
        action: 'manual_review'
      };
    }
    
    // Validate submission
    const validation = validateWhiskySubmission(whiskyData);
    
    if (!validation.isValid) {
      return {
        approved: false,
        reason: 'Validation errors present',
        errors: validation.errors,
        action: 'reject'
      };
    }
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(whiskyData);
    
    // Auto-approval criteria
    const AUTO_APPROVAL_THRESHOLD = 70; // Minimum quality score
    const MAX_WARNINGS = 2; // Maximum acceptable warnings
    
    if (qualityScore.total >= AUTO_APPROVAL_THRESHOLD && validation.warnings.length <= MAX_WARNINGS) {
      return {
        approved: true,
        reason: `Quality score: ${qualityScore.total}%`,
        quality_score: qualityScore,
        action: 'auto_approve'
      };
    } else {
      return {
        approved: false,
        reason: `Quality score too low: ${qualityScore.total}% (minimum: ${AUTO_APPROVAL_THRESHOLD}%)`,
        quality_score: qualityScore,
        warnings: validation.warnings,
        action: 'manual_review'
      };
    }
  } catch (error) {
    console.error('Error determining auto-approval:', error);
    return {
      approved: false,
      reason: 'Error during approval check',
      action: 'manual_review'
    };
  }
}

/**
 * Process whisky submission with approval logic
 */
async function processWhiskySubmission(whiskyData, userId) {
  try {
    const { Whisky, User, WhiskySubmission } = require('../models');
    
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get approval decision
    const approvalDecision = await shouldAutoApprove(whiskyData, userId);
    
    // Create submission record
    const submission = await WhiskySubmission.create({
      user_id: userId,
      whisky_data: whiskyData,
      validation_result: validateWhiskySubmission(whiskyData),
      quality_score: approvalDecision.quality_score,
      approval_status: approvalDecision.approved ? 'approved' : 'pending',
      approval_reason: approvalDecision.reason,
      submitted_at: new Date()
    });
    
    let whisky = null;
    
    if (approvalDecision.approved) {
      // Create whisky record
      whisky = await Whisky.create({
        ...whiskyData,
        created_by: userId,
        is_published: true,
        is_featured: false,
        approval_status: 'approved',
        approved_by: 'system',
        approved_at: new Date()
      });
      
      // Update submission with whisky ID
      await submission.update({ whisky_id: whisky.id });
    }
    
    return {
      success: true,
      submission_id: submission.id,
      whisky_id: whisky ? whisky.id : null,
      approval_decision: approvalDecision,
      message: approvalDecision.approved ? 
        'Whisky automatically approved and published' : 
        'Submission received and pending review'
    };
  } catch (error) {
    console.error('Error processing whisky submission:', error);
    throw error;
  }
}

/**
 * Get pending submissions for admin review
 */
async function getPendingSubmissions(page = 1, limit = 20) {
  try {
    const { WhiskySubmission, User } = require('../models');
    const offset = (page - 1) * limit;
    
    const submissions = await WhiskySubmission.findAndCountAll({
      where: { approval_status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['submitted_at', 'ASC']],
      limit: limit,
      offset: offset
    });
    
    return {
      submissions: submissions.rows.map(submission => ({
        id: submission.id,
        user: submission.user,
        whisky_data: submission.whisky_data,
        quality_score: submission.quality_score,
        validation_result: submission.validation_result,
        submitted_at: submission.submitted_at,
        approval_reason: submission.approval_reason
      })),
      pagination: {
        page: page,
        limit: limit,
        total: submissions.count,
        pages: Math.ceil(submissions.count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    throw error;
  }
}

/**
 * Get submission statistics
 */
async function getSubmissionStatistics(days = 30) {
  try {
    const { WhiskySubmission } = require('../models');
    const { Op, Sequelize } = require('sequelize');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [statusStats, dailyStats, autoApprovalRate] = await Promise.all([
      // Status breakdown
      WhiskySubmission.findAll({
        attributes: [
          'approval_status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: { submitted_at: { [Op.gte]: startDate } },
        group: ['approval_status']
      }),
      
      // Daily submission counts
      WhiskySubmission.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('submitted_at')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'submissions']
        ],
        where: { submitted_at: { [Op.gte]: startDate } },
        group: [Sequelize.fn('DATE', Sequelize.col('submitted_at'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('submitted_at')), 'ASC']]
      }),
      
      // Auto-approval rate
      WhiskySubmission.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN approval_status = \'approved\' THEN 1 ELSE 0 END')), 'auto_approved']
        ],
        where: { submitted_at: { [Op.gte]: startDate } }
      })
    ]);
    
    const total = autoApprovalRate[0] ? parseInt(autoApprovalRate[0].get('total')) : 0;
    const approved = autoApprovalRate[0] ? parseInt(autoApprovalRate[0].get('auto_approved')) : 0;
    
    return {
      period_days: days,
      status_breakdown: statusStats.map(stat => ({
        status: stat.approval_status,
        count: parseInt(stat.get('count'))
      })),
      daily_submissions: dailyStats.map(stat => ({
        date: stat.get('date'),
        submissions: parseInt(stat.get('submissions'))
      })),
      auto_approval_rate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      total_submissions: total
    };
  } catch (error) {
    console.error('Error getting submission statistics:', error);
    return {};
  }
}

module.exports = {
  isAutoApprovalEnabled,
  getSubmissionGuidelines,
  VALIDATION_RULES,
  QUALITY_CRITERIA,
  validateWhiskySubmission,
  calculateQualityScore,
  shouldAutoApprove,
  processWhiskySubmission,
  getPendingSubmissions,
  getSubmissionStatistics
};