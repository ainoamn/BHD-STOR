/**
 * Canonical User entity lives in database/entities.
 * This module re-exports it so app imports (`@users/entities/user.entity`) stay stable
 * and TypeORM only registers one `users` entity class.
 */
export {
  User,
  UserRole,
  UserStatus,
  CommissionType,
  SubscriptionPlan,
  Language,
} from '../../database/entities/user.entity';
