import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

/**
 * BNPL Eligibility Status Component
 * Displays detailed eligibility information based on backend validation
 */
const BNPLEligibilityStatus = ({ eligibility }) => {
  if (!eligibility) return null;

  const { is_eligible, credit_limit, reason, risk_score, kyc_status, has_overdue } = eligibility;

  // Determine status type
  const getStatusConfig = () => {
    if (is_eligible) {
      return {
        icon: CheckCircle2,
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        title: 'Eligible for BNPL',
        message: `You have been approved for a credit limit of UGX ${credit_limit?.toLocaleString() || 0}`
      };
    }

    // Determine specific ineligibility reason
    if (kyc_status !== 'approved') {
      return {
        icon: AlertCircle,
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600',
        title: 'KYC Verification Required',
        message: 'Please complete your KYC verification to access BNPL services'
      };
    }

    if (risk_score < 40) {
      return {
        icon: XCircle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        title: 'Credit Score Too Low',
        message: `Your current risk score (${risk_score}) is below the minimum requirement of 40`
      };
    }

    if (has_overdue) {
      return {
        icon: XCircle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        title: 'Outstanding Payment Required',
        message: 'You have overdue loans. Please clear them to access BNPL services'
      };
    }

    return {
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      title: 'Not Eligible',
      message: reason || 'You do not meet the eligibility criteria at this time'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${config.textColor} text-sm mb-1`}>
            {config.title}
          </h3>
          <p className={`${config.textColor} text-xs leading-relaxed`}>
            {config.message}
          </p>

          {/* Additional details for eligible users */}
          {is_eligible && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className={`${config.textColor} opacity-75`}>Risk Score</span>
                <span className={`font-bold ${config.textColor}`}>{risk_score}/100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={`${config.textColor} opacity-75`}>KYC Status</span>
                <span className={`font-bold ${config.textColor} capitalize`}>{kyc_status}</span>
              </div>
            </div>
          )}

          {/* Action items for ineligible users */}
          {!is_eligible && (
            <div className={`mt-3 ${config.bgColor} border ${config.borderColor} rounded-lg p-3`}>
              <div className="flex items-start gap-2">
                <Info className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="text-xs">
                  <p className={`font-semibold ${config.textColor} mb-1`}>Next Steps:</p>
                  <ul className={`${config.textColor} space-y-1 list-disc list-inside`}>
                    {kyc_status !== 'approved' && (
                      <li>Complete KYC verification in your profile</li>
                    )}
                    {risk_score < 40 && (
                      <>
                        <li>Make timely loan repayments to improve your score</li>
                        <li>Maintain a good payment history</li>
                      </>
                    )}
                    {has_overdue && (
                      <li>Clear all overdue loans to restore eligibility</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BNPLEligibilityStatus;
