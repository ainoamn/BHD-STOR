import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DeliveryStep {
  key: string;
  label: string;
  completed: boolean;
}

interface DeliveryStepsProps {
  steps: DeliveryStep[];
  currentStep: number;
}

export const DeliverySteps: React.FC<DeliveryStepsProps> = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = step.completed;
        const isLast = index === steps.length - 1;

        return (
          <View key={step.key} style={styles.stepWrapper}>
            {/* Connector Line */}
            {!isLast && (
              <View style={styles.connectorContainer}>
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.connectorCompleted,
                  ]}
                />
              </View>
            )}

            {/* Step Circle */}
            <View style={styles.stepContent}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && !isCompleted && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Icon name="check" size={16} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isCompleted && styles.labelCompleted,
                  isActive && !isCompleted && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// Compact version for inline display
export const DeliveryStepsCompact: React.FC<DeliveryStepsProps> = ({
  steps,
  currentStep,
}) => {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = completedCount / steps.length;

  return (
    <View style={styles.compactContainer}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
        <View style={styles.stepsRow}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = step.completed;

            return (
              <View
                key={step.key}
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isActive && !isCompleted && styles.dotActive,
                ]}
              />
            );
          })}
        </View>
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {steps.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  connectorContainer: {
    position: 'absolute',
    top: 18,
    left: '50%',
    right: '-50%',
    height: 3,
    zIndex: 0,
  },
  connector: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  connectorCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  circleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  circleActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2.5,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#3B82F6',
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 70,
  },
  labelCompleted: {
    color: '#10B981',
    fontWeight: '600',
  },
  labelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Compact styles
  compactContainer: {
    paddingVertical: 8,
  },
  progressBarContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  stepsRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    right: 12,
    top: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    borderWidth: 2,
    borderColor: '#fff',
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.2 }],
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
