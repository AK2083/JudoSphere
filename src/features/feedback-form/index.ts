export { fetchKnownFingerprint } from './api/fetchKnownFingerprint'
export { sanitizeAttachedLogExtract } from './api/sanitizeAttachedLogExtract'
export { saveFeedbackDraft, type SaveFeedbackDraftInput } from './api/saveFeedbackDraft'
export {
  feedbackFormDe,
  feedbackFormEn,
  translationKeys as feedbackFormTranslationKeys
} from './i18n'
export {
  buildLogExcerptPayload,
  type BuildLogExcerptPayloadInput
} from './model/buildLogExcerptPayload'
export { clampFeedbackNotes, FEEDBACK_NOTES_MAX_LENGTH } from './model/notesLimits'
export { notifyFeedbackFailureRecovery } from './model/notifyFeedbackFailureRecovery'
export {
  type KnownStatusDisplay,
  knownStatusLabelKey,
  resolveKnownStatusDisplay
} from './model/resolveKnownStatusDisplay'
export {
  type AttachmentErrorReason,
  type AttachmentState,
  type DraftSaveFeedback,
  type LoadKnownFingerprint,
  type SanitizeLogExtractFn,
  type SaveFeedbackDraftFn,
  useFeedbackForm,
  type UseFeedbackFormOptions
} from './model/useFeedbackForm'
export {
  closeFeedbackForm,
  dismissFeedbackRecoveryOffer,
  type FeedbackFormOpenContext,
  type FeedbackFormOpenSource,
  offerFeedbackAfterFailure,
  openFeedbackForm,
  openFeedbackFormFromRecovery,
  resetFeedbackFormLauncher,
  useFeedbackFormLauncher
} from './model/useFeedbackFormLauncher'
export { default as FeedbackForm } from './ui/FeedbackForm.vue'
export { default as FeedbackFormPanel } from './ui/FeedbackFormPanel.vue'
export { default as FeedbackStatusBar } from './ui/FeedbackStatusBar.vue'
