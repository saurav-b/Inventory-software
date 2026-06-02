import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    before: { type: Object },
    after: { type: Object },
    reason: { type: String }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

