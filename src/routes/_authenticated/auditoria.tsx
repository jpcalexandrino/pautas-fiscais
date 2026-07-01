import { createFileRoute } from '@tanstack/react-router';
import AuditPage from '@/features/audit/pages/AuditPage';

export const Route = createFileRoute('/_authenticated/auditoria')({
  component: AuditPage,
});
