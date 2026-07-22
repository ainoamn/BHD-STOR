'use client';

import { ReturnPolicy as ReturnPolicyType } from '@/services/returns.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield, 
  Calendar, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Zap
} from 'lucide-react';

interface ReturnPolicyProps {
  policy: ReturnPolicyType;
}

export function ReturnPolicyDisplay({ policy }: ReturnPolicyProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Return Policy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Windows */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Return Window</span>
            </div>
            <p className="text-lg font-semibold">{policy.returnWindow} Days</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Exchange Window</span>
            </div>
            <p className="text-lg font-semibold">{policy.exchangeWindow} Days</p>
          </div>
        </div>

        {/* Restocking Fee */}
        {policy.restockingFee > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <DollarSign className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Restocking Fee</p>
              <p className="text-xs text-yellow-700">
                A {policy.restockingFee}% restocking fee applies to returns
              </p>
            </div>
          </div>
        )}

        {/* Auto Approve */}
        {policy.autoApprove && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <Zap className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Auto-Approval</p>
              <p className="text-xs text-green-700">
                Eligible returns are automatically approved
              </p>
            </div>
          </div>
        )}

        {/* Conditions */}
        {policy.conditions && policy.conditions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Return Conditions
            </h4>
            <ul className="space-y-1.5">
              {policy.conditions.map((condition, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Non-Returnable Categories */}
        {policy.nonReturnableCategories && policy.nonReturnableCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              Non-Returnable Items
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {policy.nonReturnableCategories.map((category, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
