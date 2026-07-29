import { ErrorState } from '../ui/Primitives';
import {
  clinicalLoadErrorBody,
  type ClinicalLoadErrorCode,
} from '../../lib/clinicalDisplay/loadResult';

export function ClinicalLoadError({ error }: { error: ClinicalLoadErrorCode }) {
  return <ErrorState title="Clinical result unavailable" body={clinicalLoadErrorBody(error)} />;
}
