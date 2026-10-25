import { extractText, isAvailable } from 'expo-pdf-text-extract';
import { parseSchedulePdfText } from './schedulePdfText';
export { parseSchedulePdfText } from './schedulePdfText';

export async function readSchedulePdf(uri: string, configuredName: string): Promise<ParsedSchedule> {
  if (!isAvailable()) {
    throw new Error('PDF_TEXT_UNAVAILABLE');
  }
  const text = await extractText(uri);
  if (!text?.trim()) {
    throw new Error('PDF_NO_TEXT');
  }
  return parseSchedulePdfText(text, configuredName);
}
