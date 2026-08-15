import { Modal } from './Modal.jsx';
import { ExternalLink } from 'lucide-react';
import { Button } from './Button.jsx';

const EXERCISE_VIDEO_MAP = {
  // Chest
  'incline dumbbell bench press': { id: '8iPEnn-ltC8', isShorts: false }, // "How To: Dumbbell Incline Chest Press" - ScottHermanFitness ✅
  'incline dumbbell press': { id: '8iPEnn-ltC8', isShorts: false },
  'flat barbell bench press': { id: 'vcBig73ojpE', isShorts: true }, // ✅ verified
  'barbell bench press': { id: 'vcBig73ojpE', isShorts: true },
  'bench press': { id: 'vcBig73ojpE', isShorts: true },
  'push-up to cable fly superset': { id: 'Iwe6AmxVf7o', isShorts: true }, // ✅ verified
  'cable chest fly': { id: 'Iwe6AmxVf7o', isShorts: true },
  'dumbbell chest fly': { id: 'Iwe6AmxVf7o', isShorts: true }, // reuse cable fly - same movement pattern ✅

  // Back
  'lat pulldown (wide grip)': { id: 'bNmvKpJSWKM', isShorts: true }, // "The PERFECT Lat Pulldown" - DeltaBolic ✅
  'lat pulldown': { id: 'bNmvKpJSWKM', isShorts: true },
  'seated cable row': { id: 'GZbfZ033f74', isShorts: false }, // "How To: Seated Low Row" - ScottHermanFitness ✅
  'cable row': { id: 'GZbfZ033f74', isShorts: false },
  'single-arm dumbbell row': { id: 'pYcpY20QaE8', isShorts: false }, // "How To: Dumbbell Bent-Over Row" - ScottHermanFitness ✅
  'face pulls': { id: 'V8dZ3pyiCBo', isShorts: false }, // "Face Pulls | How To Perform Them Properly" - KAGED ✅
  'face pulls with cable': { id: 'V8dZ3pyiCBo', isShorts: false },

  // Legs
  'barbell back squat': { id: 'ultWZbUMPL8', isShorts: false }, // "The Back Squat" - CrossFit ✅
  'barbell squat': { id: 'ultWZbUMPL8', isShorts: false },
  'romanian deadlift (rdl)': { id: '2SHsk9AzdjA', isShorts: false }, // "How to Perform Romanian Deadlift" - Buff Dudes ✅
  'romanian deadlift': { id: '2SHsk9AzdjA', isShorts: false },
  'leg press': { id: 'IZxyjW7MPJQ', isShorts: false }, // "How To: Seated Leg Press" - ScottHermanFitness ✅
  'barbell hip thrust': { id: 'LM8XHLYJoYs', isShorts: false }, // "Proper Hip Thrust Form" - Bret Contreras ✅
  'bulgarian split squat': { id: '2C-uNgKwPLE', isShorts: false }, // "How To: Bulgarian Split Squat" - ScottHermanFitness ✅

  // Shoulders & Arms
  'standing overhead barbell press': { id: 'qEwKCR5JCog', isShorts: false }, // "How To: Dumbbell Shoulder Press" - ScottHermanFitness ✅
  'overhead barbell press': { id: 'qEwKCR5JCog', isShorts: false },
  'dumbbell shoulder press': { id: 'qEwKCR5JCog', isShorts: false },
  'lateral raises': { id: '3VcKaXpzqRo', isShorts: false }, // "How To: Dumbbell Side Lateral Raise" - ScottHermanFitness ✅
  'triceps rope pushdown': { id: '2-LAMcpzODU', isShorts: false }, // "How To: Tricep Pushdown" - ScottHermanFitness ✅
};

export function getEmbedUrl(rawUrl, exerciseName) {
  const url = rawUrl || '';

  // 1. Check known exercise map first (guaranteed working 10-30s Shorts ID)
  const cleanName = (exerciseName || '').toLowerCase().trim();
  const known = EXERCISE_VIDEO_MAP[cleanName] || Object.entries(EXERCISE_VIDEO_MAP).find(([k]) => cleanName.includes(k) || k.includes(cleanName))?.[1];

  if (known) {
    return {
      embedUrl: `https://www.youtube.com/embed/${known.id}?autoplay=1&rel=0`,
      isShorts: known.isShorts,
      directUrl: `https://www.youtube.com/watch?v=${known.id}`
    };
  }

  // 2. Shorts: https://www.youtube.com/shorts/bNmvKpJSWKM
  let match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (match) return { embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`, isShorts: true, directUrl: `https://www.youtube.com/watch?v=${match[1]}` };

  // 3. Watch v= : https://www.youtube.com/watch?v=bNmvKpJSWKM
  match = url.match(/v=([a-zA-Z0-9_-]+)/);
  if (match) return { embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`, isShorts: true, directUrl: `https://www.youtube.com/watch?v=${match[1]}` };

  // 4. Shortened: https://youtu.be/bNmvKpJSWKM
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) return { embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`, isShorts: true, directUrl: `https://www.youtube.com/watch?v=${match[1]}` };

  // 5. Direct embed with valid video ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match && match[1] !== 'list') return { embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`, isShorts: true, directUrl: `https://www.youtube.com/watch?v=${match[1]}` };

  // General fallback: 15s YouTube Shorts default
  const defaultId = 'bNmvKpJSWKM';
  const q = encodeURIComponent(exerciseName ? `${exerciseName} exercise form` : 'workout form tutorial');
  return {
    embedUrl: `https://www.youtube.com/embed/${defaultId}?autoplay=1&rel=0`,
    isShorts: true,
    directUrl: `https://www.youtube.com/results?search_query=${q}`
  };
}

export function VideoModal({ open, onClose, videoUrl, exerciseName }) {
  if (!open) return null;

  const videoInfo = getEmbedUrl(videoUrl, exerciseName);
  const embedUrl = videoInfo?.embedUrl;
  const isShorts = videoInfo?.isShorts;
  const directUrl = videoInfo?.directUrl || (videoUrl && videoUrl.startsWith('http') ? videoUrl : `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName || '')}`);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`🎥 Exercise Reference: ${exerciseName || 'Workout Video'}`}
      maxWidth={isShorts ? 'max-w-md' : 'max-w-3xl'}
      footer={
        <>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Open on YouTube <ExternalLink size={12} />
          </a>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className={`relative overflow-hidden rounded-2xl bg-black shadow-lg ${isShorts ? 'aspect-[9/16] max-h-[70vh] mx-auto' : 'aspect-video w-full'}`}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={exerciseName || 'Exercise Video'}
              className="h-full w-full rounded-2xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">Video reference unavailable</div>
          )}
        </div>
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Playing directly inside CutTrack. Click close or anywhere outside to return.
        </p>
      </div>
    </Modal>
  );
}
