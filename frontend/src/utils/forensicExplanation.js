// Forensic explanation layer for PratiDhwani.
//
// IMPORTANT: the underlying model only outputs prediction, confidence,
// bonafide probability, and spoof probability — it does not expose feature
// importance or any internal reasoning. Everything in this module is a
// heuristic, human-readable *supporting* layer derived only from those
// outputs plus client-extracted audio metadata (duration, sample rate,
// channels, bit depth, file size). None of it is a model output, and the
// UI must always present it as such.

const STANDARD_SAMPLE_RATES = [8000, 11025, 16000, 22050, 32000, 44100, 48000, 96000]

export function classifyConfidenceLevel(confidence) {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return 'Unknown'
  }
  const v = Number(confidence)
  if (v >= 90) return 'Very High'
  if (v >= 75) return 'High'
  if (v >= 60) return 'Medium'
  if (v >= 40) return 'Low'
  return 'Very Low'
}

export function predictionReliability(confidence) {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return 'Unknown'
  }
  const v = Number(confidence)
  if (v >= 75) return 'High'
  if (v >= 50) return 'Medium'
  return 'Low'
}

export function assessAudioQuality(metadata) {
  const sr = metadata?.sampleRate
  const bd = metadata?.bitDepth

  if (!sr) {
    return {
      label: 'Unknown',
      description:
        'Insufficient metadata was extracted from this file to estimate recording quality.',
    }
  }
  if (sr >= 44100 && bd && bd >= 24) {
    return {
      label: 'Excellent',
      description: 'High sample rate and bit depth indicate a studio-grade or lossless source.',
    }
  }
  if (sr >= 44100) {
    return {
      label: 'Good',
      description: 'Standard CD-quality sample rate, suitable for detailed acoustic analysis.',
    }
  }
  if (sr >= 16000) {
    return {
      label: 'Fair',
      description: 'Adequate for speech analysis but below typical high-fidelity standards.',
    }
  }
  return {
    label: 'Poor',
    description: 'Low sample rate may limit the amount of acoustic detail available.',
  }
}

export function generateConfidenceSummary(prediction, confidence) {
  const tier = classifyConfidenceLevel(confidence)
  const isSpoof = prediction?.toLowerCase() === 'spoof'
  const subject = isSpoof ? 'synthetic speech' : 'authentic human speech'

  if (tier === 'Unknown') {
    return 'Confidence could not be determined for this recording.'
  }
  if (tier === 'Very High' || tier === 'High') {
    return `${tier} confidence prediction. The model detected patterns strongly associated with ${subject}.`
  }
  if (tier === 'Medium') {
    return `${tier} confidence prediction. Some indicators suggest ${subject}, but certainty is lower.`
  }
  return `${tier} confidence prediction. Limited indicators suggest ${subject}; this result should be treated with caution.`
}

// Generic meanings shown in the "What do these indicators mean?" accordion —
// intentionally independent of any single result, describing what the
// indicator category means in general.
export const INDICATOR_MEANINGS = {
  'strong-confidence':
    'The model\u2019s output probability for the winning class was high relative to the alternative. This reflects statistical certainty in the model\u2019s internal scoring, not a direct measurement of authenticity.',
  'moderate-confidence':
    'The model favored one class over the other, but by a smaller margin. Results in this range are usable but benefit from corroborating evidence.',
  'low-confidence':
    'The model\u2019s probability estimates for the two classes were close together, meaning the prediction is less statistically decisive and more likely to be incorrect.',
  'consistent-sample-rate':
    'The file uses a sample rate commonly produced by standard recording or encoding software, which is typical of an unmodified capture pipeline.',
  'unusual-sample-rate':
    'A non-standard sample rate can sometimes result from resampling, format conversion, or non-typical recording equipment — none of which by itself implies manipulation.',
  'short-duration':
    'Very short clips give the model less acoustic context to work with, which can reduce the reliability of any prediction.',
  'clean-recording':
    'High sample rate and bit depth are generally associated with a high-fidelity source file rather than a heavily compressed or re-encoded one.',
  'compression-artifacts':
    'Lower sample rate or bit depth can be introduced by prior compression, transcoding, or downsampling, which may also affect model behavior.',
  'metadata-normal':
    'Duration, sample rate, and channel information were all successfully read from the file, giving a complete metadata picture to accompany the prediction.',
  'limited-evidence':
    'Some metadata could not be extracted (often due to an unusual or partially supported encoding), which narrows the context available for this explanation.',
}

function buildIndicators({ prediction, confidence, metadata }) {
  const indicators = []

  // --- Confidence-derived indicator -------------------------------------
  if (confidence >= 85) {
    indicators.push({
      id: 'strong-confidence',
      icon: 'shield-check',
      title: 'Strong neural confidence',
      description: `The model assigned a high confidence score (${Number(confidence).toFixed(1)}%) to this prediction.`,
      level: 'positive',
    })
  } else if (confidence >= 60) {
    indicators.push({
      id: 'moderate-confidence',
      icon: 'shield',
      title: 'Moderate neural confidence',
      description: `Confidence (${Number(confidence).toFixed(1)}%) suggests a reasonably reliable prediction, with some uncertainty remaining.`,
      level: 'neutral',
    })
  } else {
    indicators.push({
      id: 'low-confidence',
      icon: 'shield-alert',
      title: 'Low confidence result',
      description: `Confidence (${Number(confidence).toFixed(1)}%) is low — this prediction should be treated cautiously.`,
      level: 'warning',
    })
  }

  // --- Sample rate ---------------------------------------------------
  if (metadata?.sampleRate) {
    const isStandard = STANDARD_SAMPLE_RATES.includes(Math.round(metadata.sampleRate))
    if (isStandard) {
      indicators.push({
        id: 'consistent-sample-rate',
        icon: 'activity',
        title: 'Consistent sample rate',
        description: `${(metadata.sampleRate / 1000).toFixed(1)} kHz is a standard sample rate, consistent with a typical capture or encoding pipeline.`,
        level: 'positive',
      })
    } else {
      indicators.push({
        id: 'unusual-sample-rate',
        icon: 'alert-triangle',
        title: 'Unusual sample rate',
        description: `${(metadata.sampleRate / 1000).toFixed(1)} kHz is a non-standard sample rate, which can sometimes indicate resampling.`,
        level: 'warning',
      })
    }
  }

  // --- Duration --------------------------------------------------------
  if (metadata?.duration != null && metadata.duration < 2) {
    indicators.push({
      id: 'short-duration',
      icon: 'clock',
      title: 'Short duration warning',
      description: 'This recording is quite short, which can reduce the evidence available to the model.',
      level: 'warning',
    })
  }

  // --- Recording cleanliness -------------------------------------------
  if (metadata?.sampleRate && metadata?.bitDepth) {
    if (metadata.sampleRate >= 44100 && metadata.bitDepth >= 16) {
      indicators.push({
        id: 'clean-recording',
        icon: 'sparkles',
        title: 'Clean recording quality',
        description: 'High sample rate and bit depth suggest a clean, high-fidelity source recording.',
        level: 'positive',
      })
    } else if (metadata.sampleRate < 16000 || metadata.bitDepth < 16) {
      indicators.push({
        id: 'compression-artifacts',
        icon: 'file-warning',
        title: 'Possible compression artifacts',
        description: 'Lower sample rate or bit depth can be associated with prior compression or downsampling.',
        level: 'warning',
      })
    }
  }

  // --- Overall metadata completeness ------------------------------------
  const metadataComplete = metadata?.duration != null && metadata?.sampleRate && metadata?.channels
  if (metadataComplete) {
    indicators.push({
      id: 'metadata-normal',
      icon: 'check-circle',
      title: 'Metadata appears normal',
      description: 'Duration, sample rate, and channel data were all successfully extracted and fall within expected ranges.',
      level: 'positive',
    })
  } else {
    indicators.push({
      id: 'limited-evidence',
      icon: 'help-circle',
      title: 'Limited evidence available',
      description: 'Some metadata could not be extracted from this file, limiting the supporting context available.',
      level: 'warning',
    })
  }

  return indicators.slice(0, 6)
}

export function generateForensicNotes({ classification, audioQuality, prediction }) {
  const verdict = prediction ? prediction.toUpperCase() : 'the prediction'
  return `This assessment is based on the neural network's confidence score (classified as ${classification}) together with available recording metadata (estimated audio quality: ${audioQuality}). The supporting indicators presented above are heuristic, derived from confidence and metadata — they are not direct outputs of the neural network and do not reflect its internal reasoning. This explanation is intended to support interpretation of the ${verdict} prediction and should not be considered a definitive forensic conclusion.`
}

/**
 * Builds the complete forensic explanation object. Pure function of the
 * prediction result and previously-extracted metadata — never calls the
 * network and never invents data the model didn't provide.
 */
export function generateForensicExplanation({ prediction, confidence, metadata }) {
  const classification = classifyConfidenceLevel(confidence)
  const reliability = predictionReliability(confidence)
  const audioQuality = assessAudioQuality(metadata)
  const summary = generateConfidenceSummary(prediction, confidence)
  const indicators = buildIndicators({ prediction, confidence, metadata })
  const notes = generateForensicNotes({
    classification,
    audioQuality: audioQuality.label,
    prediction,
  })

  return {
    summary,
    classification,
    reliability,
    audioQuality,
    indicators,
    notes,
  }
}
